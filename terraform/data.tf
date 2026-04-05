# Data sources for default VPC and subnets
# Using the default VPC simplifies setup and avoids additional networking costs

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }

  filter {
    name   = "default-for-az"
    values = ["true"]
  }
}

# Get availability zones for the region
data "aws_availability_zones" "available" {
  state = "available"
}
