terraform {
  backend "s3" {}

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
