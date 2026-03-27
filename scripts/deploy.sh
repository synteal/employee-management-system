#!/bin/bash
set -e

# Configuration
PROJECT_ROOT=$(pwd)
FRONTEND_DIR="$PROJECT_ROOT/frontend"
TERRAFORM_DIR="$PROJECT_ROOT/terraform"

echo "--- Fetching Infrastructure State ---"

# Helper to get terraform output safely
get_tf_output() {
    local key=$1
    local value
    value=$(cd "$TERRAFORM_DIR" && terraform output -raw "$key" 2>/dev/null)
    if [ $? -ne 0 ] || [ -z "$value" ]; then
        echo "Error: Could not retrieve Terraform output '$key'."
        echo "Make sure you have run 'terraform apply' successfully."
        exit 1
    fi
    echo "$value"
}

# Get Terraform Outputs
S3_BUCKET=$(get_tf_output "frontend_s3_bucket")
EC2_IP=$(get_tf_output "instance_public_ip")
PRIVATE_KEY_PATH=$(get_tf_output "private_key_path")
CLOUDFRONT_ID=$(cd "$TERRAFORM_DIR" && terraform output -raw cloudfront_distribution_id 2>/dev/null || echo "")

# Resolve private key path correctly
# if private_key_path is "ssh-keys/name.pem", we want "$TERRAFORM_DIR/ssh-keys/name.pem"
FULL_KEY_PATH="$TERRAFORM_DIR/$(basename "$(dirname "$PRIVATE_KEY_PATH")")/$(basename "$PRIVATE_KEY_PATH")"
# Simpler: if it's always in ssh-keys/ relative to terraform dir
KEY_FILE=$(basename "$PRIVATE_KEY_PATH")
SSH_KEY="$TERRAFORM_DIR/ssh-keys/$KEY_FILE"

if [ ! -f "$SSH_KEY" ]; then
    echo "Error: Private key not found at $SSH_KEY"
    exit 1
fi

echo "--- Deploying Frontend ---"
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    bun install
fi
bun run build
aws s3 sync dist/ "s3://$S3_BUCKET" --delete

# Invalidate CloudFront Cache
if [ -n "$CLOUDFRONT_ID" ]; then
    echo "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_ID" --paths "/*"
fi

echo "--- Deploying Backend ---"
# Trigger the deploy-backend script on EC2
ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "ubuntu@$EC2_IP" "sudo -n /usr/local/bin/deploy-backend"

echo "Deployment Complete!"
echo "Frontend URL: https://$(cd "$TERRAFORM_DIR" && terraform output -raw cloudfront_url 2>/dev/null || echo "N/A")"
echo "Backend API: http://$EC2_IP"
