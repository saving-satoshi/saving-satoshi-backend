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

# Grant the instance role the minimum permissions required for the
# certbot-dns-route53 plugin to complete the ACME DNS-01 challenge.
# LetsEncrypt only modifies TXT records.
resource "aws_iam_policy" "certbot_dns_route53" {
  name        = "${local.namespace}-certbot-dns-route53"
  description = "Allow Certbot DNS-01 challenge to manage ACME TXT records in Route53"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["route53:ListHostedZones", "route53:GetChange"]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["route53:ChangeResourceRecordSets"]
        Resource = "arn:aws:route53:::hostedzone/${var.hosted_zone_id}"
        Condition = {
          "ForAllValues:StringEquals" = {
            "route53:ChangeResourceRecordSetsRecordTypes" = ["TXT"]
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "certbot_dns_route53" {
  role       = aws_iam_role.app_instance.name
  policy_arn = aws_iam_policy.certbot_dns_route53.arn
}

resource "aws_iam_instance_profile" "app_instance" {
  name = "${local.namespace}-app-instance-profile"
  role = aws_iam_role.app_instance.name
}

resource "aws_instance" "app" {
  ami                  = var.ami
  instance_type        = var.instance_type
  key_name             = var.key_pair_name
  security_groups      = [aws_security_group.app.name]
  iam_instance_profile = aws_iam_instance_profile.app_instance.name

  tags = {
    Name = local.namespace
  }
}

# Add an Elastic IP (EIP) so replacing instances will maintain the
# same IP address.
#
# Create an A record with the DNS provider to point to the EIP.
resource "aws_eip" "app" {
  domain = "vpc"

  tags = {
    Name = local.namespace
  }
}

resource "aws_eip_association" "app_instance" {
  instance_id   = aws_instance.app.id
  allocation_id = aws_eip.app.id
}

resource "aws_route53_record" "api" {
  name    = var.hostname
  records = [aws_eip.app.public_ip]
  ttl     = 300
  type    = "A"
  zone_id = var.hosted_zone_id
}

output "public_dns" {
  value = aws_instance.app.public_dns
}

output "ip_address" {
  value = aws_eip.app.public_ip
}
