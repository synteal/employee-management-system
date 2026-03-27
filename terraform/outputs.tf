output "instance_public_ip" {
  description = "Public IP — use this in GitHub Secrets as EC2_HOST"
  value       = aws_instance.app.public_ip
}

output "instance_public_dns" {
  description = "Public DNS of the EC2 instance"
  value       = aws_instance.app.public_dns
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i ssh-keys/${var.project_name}-key.pem ubuntu@${aws_instance.app.public_ip}"
}

output "app_url" {
  description = "Direct backend URL for FastAPI"
  value       = "https://${aws_instance.app.public_ip}:8000"
}

output "private_key_path" {
  description = "Path to the saved private key"
  value       = "ssh-keys/${var.project_name}-key.pem"
}

# ─────────────────────────────────────────────
# Frontend Outputs
# ─────────────────────────────────────────────

output "frontend_s3_bucket" {
  description = "S3 bucket name for the frontend"
  value       = aws_s3_bucket.frontend.bucket
}

output "cloudfront_url" {
  description = "CloudFront URL for the frontend"
  value       = "https://${aws_cloudfront_distribution.s3_distribution.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.s3_distribution.id
}
