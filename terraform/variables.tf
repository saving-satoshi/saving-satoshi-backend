variable "ami" {
  type        = string
  default     = "ami-0786adace1541ca80" // Ubuntu 24.04 in us-west-2
  description = "ID of the Amazon Machine Image used to create instances (updated by Packer builds)"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "The name of the environment for namespacing purposes"
}

variable "hosted_zone_id" {
  type        = string
  description = "The ID of the Route53 hosted zone in which to manage DNS records"
}

variable "hostname" {
  type        = string
  default     = "api.savingsatoshi.com"
  description = "The hostname at which the application will be reached"
}

variable "instance_type" {
  type        = string
  default     = "t3.small"
  description = "Primary instance type for the Auto Scaling Group (set via AWS_EC2_INSTANCE_TYPE in CI)"
}

variable "key_pair_name" {
  type        = string
  description = "Name of the Key Pair already provisioned in the AWS console to use for SSH access"
}

variable "region" {
  type        = string
  default     = "us-west-2"
  description = "The AWS region into which to deploy"
}

# =============================================================================
# Auto Scaling Configuration
# =============================================================================

variable "min_capacity" {
  type        = number
  default     = 1
  description = "Minimum number of instances in the Auto Scaling Group"
}

variable "max_capacity" {
  type        = number
  default     = 10
  description = "Maximum number of instances in the Auto Scaling Group"
}

variable "desired_capacity" {
  type        = number
  default     = 1
  description = "Desired number of instances in the Auto Scaling Group (scale-to-1 baseline)"
}

variable "fallback_instance_types" {
  type        = list(string)
  default     = ["t3.small", "t3.medium", "t2.medium"]
  description = "Fallback instance types for Spot diversity (var.instance_type is always the first override)"
}

variable "on_demand_base_capacity" {
  type        = number
  default     = 1
  description = "Minimum number of On-Demand instances (always running baseline)"
}

variable "on_demand_percentage_above_base" {
  type        = number
  default     = 0
  description = "Percentage of On-Demand instances above base capacity (0 = all scale-out is Spot)"
}

variable "health_check_grace_period" {
  type        = number
  default     = 10
  description = "Seconds before health checks start after instance launch (lifecycle hook handles init, so minimal grace period needed)"
}

# =============================================================================
# Application Configuration
# =============================================================================

variable "app_port" {
  type        = number
  default     = 8000
  description = "Port the application listens on"
}

variable "app_version" {
  type        = string
  default     = "master"
  description = "Git branch/tag to deploy (master for production, develop for staging)"
}

variable "whitelist" {
  type        = string
  default     = "https://savingsatoshi.com"
  description = "CORS whitelist for the application"
}

variable "max_script_execution_time" {
  type        = number
  default     = 10000
  description = "Maximum REPL script execution time in milliseconds"
}
