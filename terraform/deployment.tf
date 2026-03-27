# ─────────────────────────────────────────────
# CloudFront Invalidation
# ─────────────────────────────────────────────

resource "null_resource" "invalidate_cloudfront" {
  # Trigger when S3 upload completes or distribution changes
  triggers = {
    upload_id       = null_resource.frontend_upload.id
    distribution_id = aws_cloudfront_distribution.s3_distribution.id
  }

  provisioner "local-exec" {
    command = "aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.s3_distribution.id} --paths '/*'"
  }

  depends_on = [null_resource.frontend_upload]
}
