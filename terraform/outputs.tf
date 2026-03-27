output "ec2_public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.app.public_ip
}

output "cloudfront_url" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.s3_distribution.domain_name
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for frontend"
  value       = aws_s3_bucket.frontend.id
}

output "app_public_ip" {
  description = "Public IP (EIP) of the application server"
  value       = aws_eip.app_ip.public_ip
}