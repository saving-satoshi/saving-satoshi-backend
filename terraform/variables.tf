variable "ami" {
  type        = string
  default     = "ami-0786adace1541ca80" // Ubuntu 24.04 in us-west-2
  description = "ID of the Amazon Machine Image used to create the instance"
}

variable "instance_size" {
  type        = string
  default     = "t3.large"
  description = "Size of the EC2 instance"
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
