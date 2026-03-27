# ─────────────────────────────────────────────
# S3 Bucket for Frontend Hosting
# ─────────────────────────────────────────────

resource "aws_s3_bucket" "frontend" {
  bucket        = "${var.project_name}-frontend-bucket"
  force_destroy = true

  tags = {
    Name    = "${var.project_name}-frontend-bucket"
    Project = var.project_name
  }
}

# Block all public access — CloudFront will use OAC
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ─────────────────────────────────────────────
# S3 Bucket Policy for CloudFront OAC
# ─────────────────────────────────────────────

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  policy = data.aws_iam_policy_document.s3_policy.json
}

data "aws_iam_policy_document" "s3_policy" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.frontend.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.s3_distribution.arn]
    }
  }
}
# ─────────────────────────────────────────────
# S3 Content Upload
# ─────────────────────────────────────────────

locals {
  content_types = {
    ".html" = "text/html"
    ".css"  = "text/css"
    ".js"   = "application/javascript"
    ".json" = "application/json"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".txt"  = "text/plain"
  }
}

# ─────────────────────────────────────────────
# S3 Content Upload (Workaround for IAM permissions)
# ─────────────────────────────────────────────

resource "null_resource" "frontend_upload" {
  # Trigger re-upload when any file in the dist directory changes
  triggers = {
    dist_hash = sha1(join("", [for f in fileset("${path.module}/../frontend/dist", "**/*") : filemd5("${path.module}/../frontend/dist/${f}")]))
  }

  provisioner "local-exec" {
    command = "aws s3 sync ${path.module}/../frontend/dist s3://${aws_s3_bucket.frontend.id} --delete"
  }

  depends_on = [aws_s3_bucket.frontend]
}
