packer {
  required_plugins {
    amazon = {
      version = ">= 1.3.0"
      source  = "github.com/hashicorp/amazon"
    }
    ansible = {
      version = ">= 1.1.0"
      source  = "github.com/hashicorp/ansible"
    }
  }
}

variable "aws_region" {
  type        = string
  default     = "us-west-2"
  description = "AWS region to build the AMI in"
}

variable "base_ami" {
  type        = string
  default     = "ami-0786adace1541ca80"
  description = "Base Ubuntu 24.04 AMI to build from"
}

variable "instance_type" {
  type        = string
  default     = "t2.small"
  description = "Instance type for building the AMI"
}

variable "ami_name_prefix" {
  type        = string
  default     = "saving-satoshi-backend"
  description = "Prefix for the AMI name"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Deployment environment (e.g. production, staging)"
}

variable "ssh_username" {
  type        = string
  default     = "ubuntu"
  description = "SSH username for the base AMI"
}

locals {
  timestamp = regex_replace(timestamp(), "[- TZ:]", "")
}

source "amazon-ebs" "ubuntu" {
  ami_name        = "${var.ami_name_prefix}-${local.timestamp}"
  ami_description = "Saving Satoshi Backend base AMI with Docker, Node.js, Nginx, CloudWatch Agent"
  instance_type   = var.instance_type
  region          = var.aws_region
  source_ami      = var.base_ami
  ssh_username    = var.ssh_username

  # Use IMDSv2
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  run_tags = {
    Name        = "saving-satoshi-backend-${var.environment}-packer-build-${var.ami_name_prefix}"
    Application = "saving-satoshi"
  }

  tags = {
    Name        = "${var.ami_name_prefix}-${local.timestamp}"
    Application = "saving-satoshi"
    Environment = var.environment
    BuildTime   = timestamp()
    BaseAMI     = var.base_ami
  }

  # Tag the snapshot as well
  snapshot_tags = {
    Name        = "${var.ami_name_prefix}-packer-build"
    Application = "saving-satoshi"
  }
}

build {
  sources = ["source.amazon-ebs.ubuntu"]

  # Install Ansible on the instance
  provisioner "shell" {
    inline = [
      "sudo apt-get update",
      "sudo apt-get install -y software-properties-common",
      "sudo add-apt-repository --yes --update ppa:ansible/ansible",
      "sudo apt-get install -y ansible"
    ]
  }

  # Create destination directories before copying (SCP requires them to exist)
  provisioner "shell" {
    inline = [
      "mkdir -p /tmp/ansible",
      "mkdir -p /tmp/base_images",
    ]
  }

  # Copy Ansible files to the instance
  provisioner "file" {
    source      = "../ansible/"
    destination = "/tmp/ansible/"
  }

  # Copy REPL Dockerfile contexts so the base playbook can bake them into the AMI
  provisioner "file" {
    source      = "../src/base_images/"
    destination = "/tmp/base_images/"
  }

  # Install Ansible Galaxy requirements as root so they survive the /home cleanup
  # and are found by both the Packer playbook (root) and the runtime playbook (root).
  # Separate commands are required: ansible-galaxy install only handles roles, not
  # collections, since Ansible 2.10.
  provisioner "shell" {
    inline = [
      "sudo ansible-galaxy role install -r /tmp/ansible/requirements.yaml",
      "sudo ansible-galaxy collection install -r /tmp/ansible/requirements.yaml",
    ]
  }

  # Run the base Ansible playbook
  provisioner "shell" {
    inline = [
      "cd /tmp/ansible",
      "sudo ansible-playbook playbook-base.yaml --connection=local -i localhost, -e 'ansible_python_interpreter=/usr/bin/python3' -e 'aws_region=${var.aws_region}' -e 'env=${var.environment}'"
    ]
  }

  # Clean up for smaller AMI
  provisioner "shell" {
    inline = [
      "sudo apt-get clean",
      "sudo apt-get autoremove -y",
      "sudo rm -rf /var/lib/apt/lists/*",
      "sudo rm -rf /tmp/*",
      "sudo rm -rf /var/tmp/*",
      "sudo rm -f /var/log/*.log",
      "sudo rm -rf /home/ubuntu/.ansible"
    ]
  }

  # Output AMI ID to manifest for CI/CD
  post-processor "manifest" {
    output     = "manifest.json"
    strip_path = true
  }
}
