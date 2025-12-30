variable "project_name" {
  type        = string
  description = "Project name used for resource naming"
}

variable "aws_region" {
  type        = string
  description = "AWS region"
  default     = "eu-west-1"
}

variable "availability_zone" {
  type        = string
  description = "Availability zone for the public subnet"
  default     = "eu-west-1a"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC"
  default     = "10.10.0.0/16"
}

variable "public_subnet_cidr" {
  type        = string
  description = "CIDR block for the public subnet"
  default     = "10.10.1.0/24"
}

variable "ssh_cidr_blocks" {
  type        = list(string)
  description = "CIDR blocks allowed to SSH"
  default     = ["0.0.0.0/0"]
}

variable "instance_type" {
  type        = string
  description = "EC2 instance type"
  default     = "t3.micro"
}

variable "root_volume_size_gb" {
  type        = number
  description = "Root EBS volume size"
  default     = 20
}

variable "key_name" {
  type        = string
  description = "Existing EC2 key pair name for SSH"
}

variable "repo_url" {
  type        = string
  description = "Git repository URL (https://...git)"
}

variable "repo_branch" {
  type        = string
  description = "Git branch to deploy"
  default     = "main"
}

variable "app_dir" {
  type        = string
  description = "Directory inside repo where the node app lives"
  default     = "duka-replica"
}

variable "app_port" {
  type        = number
  description = "Express app port"
  default     = 3000
}

variable "node_version" {
  type        = string
  description = "Node.js major version to install (via NodeSource)"
  default     = "20"
}

variable "enable_ssm" {
  type        = bool
  description = "Attach SSM managed policy to allow Session Manager"
  default     = true
}
