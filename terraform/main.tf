terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ─────────────────────────────────────────────
# SSH Key Pair
# ─────────────────────────────────────────────

# Generate RSA private key
resource "tls_private_key" "ec2_key" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

# Register public key with AWS
resource "aws_key_pair" "ec2_key" {
  key_name   = "${var.project_name}-key"
  public_key = tls_private_key.ec2_key.public_key_openssh
}

# Save private key to ssh-keys/ folder with correct permissions
resource "local_sensitive_file" "private_key" {
  content         = tls_private_key.ec2_key.private_key_pem
  filename        = "${path.module}/ssh-keys/${var.project_name}-key.pem"
  file_permission = "0400"
}

# ─────────────────────────────────────────────
# Security Group
# ─────────────────────────────────────────────

resource "aws_security_group" "ec2" {
  name        = "${var.project_name}-sg"
  description = "Security group for ${var.project_name} EC2 instance"

  # SSH — for deployment and management
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP — nginx serves the React app
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS — for future SSL setup
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # FastAPI — direct access for testing/debugging
  ingress {
    description = "FastAPI"
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # MongoDB — direct access for Lambda and testing
  ingress {
    description = "MongoDB"
    from_port   = 27017
    to_port     = 27017
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project_name}-sg"
    Project = var.project_name
  }
}

# Egress as a separate resource — avoids ec2:RevokeSecurityGroupEgress on the default rule
resource "aws_vpc_security_group_egress_rule" "allow_all" {
  security_group_id = aws_security_group.ec2.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

# ─────────────────────────────────────────────
# AMI — Latest Ubuntu 22.04 LTS
# ─────────────────────────────────────────────

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical (Ubuntu)

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# ─────────────────────────────────────────────
# EC2 Instance
# ─────────────────────────────────────────────

resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.ec2_key.key_name
  vpc_security_group_ids = [aws_security_group.ec2.id]
  user_data_replace_on_change = true

  # Automate backend deployment and systemd management
  user_data = <<-EOF
#!/bin/bash
set -e

# Log user_data output
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "=== Starting deployment sequence ==="

apt-get update -y
apt-get upgrade -y

# --- Dependencies ---
# Ubuntu 22.04 comes with Python 3.10
apt-get install -y python3 python3-pip python3-venv git curl gnupg nginx

# --- Install MongoDB 7.0 ---
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt-get update -y
apt-get install -y mongodb-org
systemctl enable mongod
systemctl start mongod

# --- Install uv (Preferred Python package manager) ---
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="/root/.local/bin:/root/.cargo/bin:$PATH"
[ -f /root/.local/bin/env ] && . /root/.local/bin/env

# Make uv available to all users regardless of installer target.
UV_BIN="$(command -v uv)"
UVX_BIN="$(command -v uvx)"
install -m 0755 "$UV_BIN" /usr/local/bin/uv
install -m 0755 "$UVX_BIN" /usr/local/bin/uvx

# --- Codebase Setup ---
cd /home/ubuntu
# Use -E for sudo to pass environment variables if needed
sudo -u ubuntu git clone ${var.backend_github_repo} repo

# --- Environment Configuration ---
cat <<EOT > /home/ubuntu/repo/backend/.env
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=${var.mongo_db_name}
SECRET_KEY=${var.secret_key}
ALGORITHM=${var.algorithm}
ACCESS_TOKEN_EXPIRE_MINUTES=${var.access_token_expire_minutes}
CORS_ALLOW_ORIGINS=${var.cors_allow_origins}
EOT
chown ubuntu:ubuntu /home/ubuntu/repo/backend/.env

# --- Backend Initialization ---
cd /home/ubuntu/repo/backend
# Rely on system python (3.10) since 3.12 is not strictly required
sudo -u ubuntu /usr/local/bin/uv sync

# --- Deploy Script (Convenience for scripts/deploy.sh) ---
cat <<EOT > /usr/local/bin/deploy-backend
#!/bin/bash
set -e
echo "Updating backend from repo..."
cd /home/ubuntu/repo
sudo -u ubuntu git pull
cd backend
sudo -u ubuntu /usr/local/bin/uv sync
systemctl restart fastapi
echo "Backend deployment complete!"
EOT
chmod +x /usr/local/bin/deploy-backend
cat <<EOT > /etc/sudoers.d/deploy-backend
ubuntu ALL=(root) NOPASSWD: /usr/local/bin/deploy-backend
EOT
chmod 440 /etc/sudoers.d/deploy-backend

# --- Systemd Service ---
cat <<EOT > /etc/systemd/system/fastapi.service
[Unit]
Description=FastAPI Systemd Service
After=network.target mongod.service

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/home/ubuntu/repo/backend
Environment=PYTHONPATH=/home/ubuntu/repo
ExecStart=/usr/local/bin/uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips='*'
Restart=always

[Install]
WantedBy=multi-user.target
EOT

systemctl daemon-reload
systemctl enable fastapi
systemctl start fastapi

# --- Nginx Setup (Optional: Reverse Proxy to FastAPI) ---
cat <<EOT > /etc/nginx/sites-available/default
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOT
systemctl restart nginx

echo "=== Deployment sequence complete ==="
  EOF

  tags = {
    Name    = "${var.project_name}-server"
    Project = var.project_name
  }
}
