variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Used for naming all resources"
  type        = string
  default     = "student-employee-app"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

# ─────────────────────────────────────────────
# Backend Configuration
# ─────────────────────────────────────────────

variable "backend_github_repo" {
  description = "Public GitHub repository URL for the backend"
  type        = string
}

variable "mongo_db_name" {
  description = "MongoDB database name"
  type        = string
  default     = "employee_db"
}

variable "secret_key" {
  description = "Secret key for JWT"
  type        = string
  sensitive   = true
}

variable "algorithm" {
  description = "JWT algorithm"
  type        = string
  default     = "HS256"
}

variable "access_token_expire_minutes" {
  description = "JWT token expiration in minutes"
  type        = number
  default     = 30
}

variable "cors_allow_origins" {
  description = "CORS allowed origins (comma-separated)"
  type        = string
  default     = "*"
}