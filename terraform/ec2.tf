resource "aws_cloudwatch_log_group" "app" {
  name              = "${local.namespace}-app"
  retention_in_days = 1
}

resource "aws_security_group" "app" {
  name = "${local.namespace}-app"
}

resource "aws_security_group_rule" "app_allow_outbound" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.app.id
}

resource "aws_security_group_rule" "app_allow_ssh" {
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.app.id
}

resource "aws_security_group_rule" "app_allow_http" {
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.app.id
}

resource "aws_security_group_rule" "app_allow_https" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.app.id
}

resource "aws_iam_role" "app_instance" {
  name = "${local.namespace}-app-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "cloudwatch_agent" {
  role       = aws_iam_role.app_instance.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "app_instance" {
  name = "${local.namespace}-app-instance-profile"
  role = aws_iam_role.app_instance.name
}

resource "aws_instance" "app" {
  ami                  = var.ami
  instance_type        = var.instance_size
  key_name             = var.key_pair_name
  security_groups      = [aws_security_group.app.name]
  iam_instance_profile = aws_iam_instance_profile.app_instance.name
}

# Add an Elastic IP (EIP) so replacing instances will maintain the
# same IP address. This reduces the need to maintain DNS records
# when an instance size is change.
#
# Create an A record with the DNS provider to point to the EIP.
resource "aws_eip" "app" {
  domain = "vpc"
}

resource "aws_eip_association" "app_instance" {
  instance_id   = aws_instance.app.id
  allocation_id = aws_eip.app.id
}

output "public_dns" {
  value = aws_instance.app.public_dns
}

output "ip_address" {
  value = aws_eip.app.public_ip
}
