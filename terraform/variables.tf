variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Used for naming all resources"
  type        = string
  default     = "student-employee-app-jl"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

locals {
  common_tags = {
    Project   = var.project_name
    ManagedBy = "Terraform"
  }
}

variable "repo_url" {
  description = "The URL of the Git repository for the backend code."
  type        = string
  default     = "https://github.com/your-repo/your-project.git"
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed to SSH into the EC2 instance"
  type        = string
  default     = "0.0.0.0/0"
}

variable "allowed_api_cidr" {
  description = "CIDR block allowed to access the FastAPI backend"
  type        = string
  default     = "0.0.0.0/0"
}

variable "mongodb_version" {
  description = "The version of MongoDB to install (e.g., 7.0, 6.0)"
  type        = string
  default     = "7.0"
}

variable "app_install_path" {
  description = "The directory on the EC2 instance where the app will be cloned"
  type        = string
  default     = "/home/ubuntu/app"
}