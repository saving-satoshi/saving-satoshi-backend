# CloudWatch Log Group for application logs
# This is the only resource retained from the original single-instance configuration
# All other resources (EC2 instance, EIP, security groups, IAM roles) have been
# moved to asg.tf and alb.tf for the autoscaling architecture

resource "aws_cloudwatch_log_group" "app" {
  name              = "${local.namespace}-app"
  retention_in_days = 1

  tags = {
    Name = "${local.namespace}-app"
  }
}

# =============================================================================
# REMOVED RESOURCES (now in asg.tf and alb.tf):
# =============================================================================
# - aws_security_group.app -> moved to asg.tf
# - aws_security_group_rule.app_* -> moved to asg.tf
# - aws_iam_role.app_instance -> moved to asg.tf
# - aws_iam_role_policy_attachment.cloudwatch_agent -> moved to asg.tf
# - aws_iam_policy.certbot_dns_route53 -> REMOVED (ALB handles SSL)
# - aws_iam_role_policy_attachment.certbot_dns_route53 -> REMOVED (ALB handles SSL)
# - aws_iam_instance_profile.app_instance -> moved to asg.tf
# - aws_instance.app -> replaced by ASG in asg.tf
# - aws_eip.app -> REMOVED (ALB provides stable endpoint)
# - aws_eip_association.app_instance -> REMOVED
# - aws_route53_record.api -> moved to alb.tf (now points to ALB)
# =============================================================================
