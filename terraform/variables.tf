variable "ami" {
  type        = string
  default     = "ami-0786adace1541ca80" // Ubuntu 24.04 in us-west-2
  description = "ID of the Amazon Machine Image used to create the instance"
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
  default     = "t3.large"
  description = "Type of the EC2 instance"
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
