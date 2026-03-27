#!/bin/bash

# Configuration
PROJECT_ROOT=$(pwd)
FRONTEND_DIR="$PROJECT_ROOT/frontend"
TERRAFORM_DIR="$PROJECT_ROOT/terraform"

# Get Terraform Outputs
cd $TERRAFORM_DIR
S3_BUCKET=$(terraform output -raw frontend_s3_bucket)
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null)
EC2_IP=$(terraform output -raw instance_public_ip)

if [ -z "$S3_BUCKET" ] || [ -z "$EC2_IP" ]; then
  echo "Error: Could not retrieve Terraform outputs. Have you run 'terraform apply'?"
  exit 1
fi

echo "--- Deploying Frontend ---"
cd $FRONTEND_DIR
bun install
bun run build
aws s3 sync dist/ s3://$S3_BUCKET --delete

# Invalidate CloudFront Cache (Optional but recommended)
if [ ! -z "$CLOUDFRONT_ID" ]; then
  echo "Invalidating CloudFront cache..."
  aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*"
fi

echo "--- Deploying Backend ---"
# Trigger the deploy-backend script on EC2
ssh -i "$TERRAFORM_DIR/ssh-keys/$(basename "$(terraform output -raw private_key_path)")" ubuntu@$EC2_IP "sudo /usr/local/bin/deploy-backend"

echo "Deployment Complete!"
echo "Frontend URL: https://$(terraform output -raw cloudfront_url)"
echo "Backend API: http://$EC2_IP:8000"
