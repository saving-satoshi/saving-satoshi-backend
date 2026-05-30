# SSM Parameter Store for application secrets
# Parameter values are written exclusively by the CI deploy job from GitHub secrets
# (aws ssm put-parameter --overwrite) before Terraform runs. Terraform manages only
# the IAM policy granting instances read access — not the parameter values themselves.

# Parameter path prefix for this environment
locals {
  ssm_prefix = "/${local.application}/${local.environment}"
}

# IAM policy allowing instances to read SSM parameters
resource "aws_iam_policy" "ssm_read" {
  name        = "${local.namespace}-ssm-read"
  description = "Allow reading SSM parameters for application secrets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          "arn:aws:ssm:${var.region}:*:parameter${local.ssm_prefix}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = "arn:aws:kms:${var.region}:*:key/*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "ssm.${var.region}.amazonaws.com"
          }
        }
      }
    ]
  })
}

# Outputs for reference
output "ssm_parameter_prefix" {
  value       = local.ssm_prefix
  description = "SSM parameter path prefix for this environment"
}
