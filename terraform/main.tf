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
    cidr_blocks = [var.allowed_ssh_cidr]
  }

  # FastAPI — direct access for the frontend (via CloudFront/Direct)
  ingress {
    description = "FastAPI"
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = [var.allowed_api_cidr] # In production, restrict to CloudFront IPs or use a Load Balancer
  }

  # MongoDB — direct access for debugging (Optional/Risky)
  ingress {
    description = "MongoDB"
    from_port   = 27017
    to_port     = 27017
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Restricted to 0.0.0.0/0 for now as per sample; recommend SSH tunnel
  }

  tags = local.common_tags
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

  # Install base dependencies on first boot
  user_data = <<-EOF
    #!/bin/bash
    apt-get update -y
    apt-get upgrade -y

    # Install MongoDB ${var.mongodb_version}
    apt-get install -y gnupg curl
    curl -fsSL https://www.mongodb.org/static/pgp/server-${var.mongodb_version}.asc | \
       gpg -o /usr/share/keyrings/mongodb-server-${var.mongodb_version}.gpg \
       --dearmor
    echo "deb [ [arch=amd64,arm64] signed-by=/usr/share/keyrings/mongodb-server-${var.mongodb_version}.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/${var.mongodb_version} multiverse" | tee /etc/apt/sources.list.d/mongodb-org-${var.mongodb_version}.list
    apt-get update
    apt-get install -y mongodb-org
    systemctl start mongod
    systemctl enable mongod

    # Python and Git
    apt-get install -y python3 python3-pip python3-venv git

    # Setup deploy script
    cat <<'INNER_EOF' > /usr/local/bin/deploy-backend
    #!/bin/bash
    PROJECT_DIR="${var.app_install_path}"
    REPO_URL="${var.repo_url}"

    if [ ! -d "$PROJECT_DIR" ]; then
      git clone $REPO_URL $PROJECT_DIR
    else
      cd $PROJECT_DIR && git pull
    fi

    cd $PROJECT_DIR/backend
    python3 -m venv venv
    ./venv/bin/pip install -r requirements.txt
    
    # Simple systemd service setup for FastAPI
    cat <<'SERVICE_EOF' > /etc/systemd/system/fastapi.service
    [Unit]
    Description=FastAPI System
    After=network.target

    [Service]
    User=ubuntu
    WorkingDirectory=$PROJECT_DIR/backend
    ExecStart=$PROJECT_DIR/backend/venv/bin/python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
    Restart=always

    [Install]
    WantedBy=multi-user.target
    SERVICE_EOF

    systemctl daemon-reload
    systemctl enable fastapi
    systemctl restart fastapi
    INNER_EOF

    chmod +x /usr/local/bin/deploy-backend
    
    # Allow ubuntu user to run the deploy script
    echo "ubuntu ALL=(ALL) NOPASSWD: /usr/local/bin/deploy-backend" >> /etc/sudoers
  EOF

  tags = {
    Name    = "${var.project_name}-server"
    Project = var.project_name
  }
}