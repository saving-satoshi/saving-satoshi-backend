# Packer variables for AMI builds
# Override defaults for production/staging builds

aws_region      = "us-west-2"
instance_type   = "t3.small"
ami_name_prefix = "saving-satoshi-backend"

# Base AMI: Ubuntu 24.04 LTS in us-west-2
# Find latest with: aws ec2 describe-images --owners 099720109477 \
#   --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-*-24.04-amd64-server-*" \
#   --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId'
base_ami = "ami-0786adace1541ca80"
