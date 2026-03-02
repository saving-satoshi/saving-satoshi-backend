# This is a "base" Terraform implementation to provision the necessary "global"
# infrastructure required to support the application infrastructure definition
# in the parent directory. It is intended as an aid to preparing for GitHub Actions
# deployments.
#
# CAUTION: This uses a `local` terraform state file and should be run by administrators, who
#   will be responsible for removing the resources if needed by running `terraform destroy`
#   from their local environments, or manually through the AWS console.

terraform {
  backend "local" {
    path = "saving-satoshi-backend-base.tfstate"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  required_version = ">= 1.14"
}

provider "aws" {
  default_tags {
    tags = local.default_tags
  }

  region = var.region
}

locals {
  application = "saving-satoshi"
  environment = "production"
  namespace   = "${local.application}-${local.environment}"
  default_tags = {
    Application = "saving-satoshi"
    Environment = "base"
  }
}

variable "dns_zone" {
  type        = string
  default     = "api.savingsatoshi.com"
  description = "The DNS zone for the API managed by AWS Route53"
}

variable "github_repository_name" {
  type        = string
  default     = "saving-satoshi/saving-satoshi-backend"
  description = "The name of the GitHub repository managing the deployment via OIDC"
}

variable "region" {
  type        = string
  default     = "us-west-2"
  description = "The AWS region into which to deploy"
}

# S3 bucket for Terraform remote state
variable "terraform_state_bucket_name" {
  type        = string
  default     = "saving-satoshi-terraform-state"
  description = "Name of the S3 bucket provisioned for the Terraform remote state"
}

resource "aws_s3_bucket" "terraform_state" {
  bucket = var.terraform_state_bucket_name
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

# OIDC connection to GitHub.
module "github-oidc-provider" {
  source  = "terraform-module/github-oidc-provider/aws"
  version = "2.2.1"

  repositories = [var.github_repository_name]
  role_name    = "${local.namespace}-github-oidc"

  # TODO: Define least-privilege access for role policies.
  oidc_role_attach_policies = ["arn:aws:iam::aws:policy/AdministratorAccess"]
}

# Route53 hosted zone
resource "aws_route53_zone" "primary" {
  name = var.dns_zone
}

# Outputs
output "dns_name_servers" {
  value = aws_route53_zone.primary.name_servers
}

output "dns_zone_id" {
  value = aws_route53_zone.primary.zone_id
}

output "assumed_role_arn" {
  value = module.github-oidc-provider.oidc_role
}

output "region" {
  value = var.region
}

output "terraform_state_bucket_name" {
  value = aws_s3_bucket.terraform_state.bucket
}
