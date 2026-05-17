# Auto Scaling Group configuration
# Manages EC2 instances with mixed On-Demand and Spot pricing

# =============================================================================
# Security Group for App Instances
# =============================================================================

resource "aws_security_group" "app" {
  name        = "${local.namespace}-app"
  description = "Security group for application instances"
  vpc_id      = data.aws_vpc.default.id

  tags = {
    Name = "${local.namespace}-app"
  }
}

resource "aws_security_group_rule" "app_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.app.id
  description       = "Allow all outbound traffic"
}

resource "aws_security_group_rule" "app_from_alb" {
  type                     = "ingress"
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  security_group_id        = aws_security_group.app.id
  description              = "Allow HTTP from ALB"
}

resource "aws_security_group_rule" "app_ssh" {
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.app.id
  description       = "Allow SSH access (consider restricting in production)"
}

# =============================================================================
# IAM Role for App Instances
# =============================================================================

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

  tags = {
    Name = "${local.namespace}-app-instance-role"
  }
}

# CloudWatch Agent policy
resource "aws_iam_role_policy_attachment" "cloudwatch_agent" {
  role       = aws_iam_role.app_instance.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# SSM Parameter Store read access
resource "aws_iam_role_policy_attachment" "ssm_read" {
  role       = aws_iam_role.app_instance.name
  policy_arn = aws_iam_policy.ssm_read.arn
}

# ASG lifecycle hook policy
resource "aws_iam_policy" "asg_lifecycle" {
  name        = "${local.namespace}-asg-lifecycle"
  description = "Allow completing ASG lifecycle hooks"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "autoscaling:CompleteLifecycleAction",
          "autoscaling:RecordLifecycleActionHeartbeat"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "asg_lifecycle" {
  role       = aws_iam_role.app_instance.name
  policy_arn = aws_iam_policy.asg_lifecycle.arn
}

resource "aws_iam_instance_profile" "app_instance" {
  name = "${local.namespace}-app-instance-profile"
  role = aws_iam_role.app_instance.name
}

# =============================================================================
# Launch Template
# =============================================================================

resource "aws_launch_template" "app" {
  name_prefix   = "${local.namespace}-"
  image_id      = var.ami
  instance_type = var.instance_type
  key_name      = var.key_pair_name

  iam_instance_profile {
    name = aws_iam_instance_profile.app_instance.name
  }

  vpc_security_group_ids = [aws_security_group.app.id]

  # User data script for runtime initialization
  user_data = base64encode(templatefile("${path.module}/templates/user-data.sh", {
    ssm_prefix                = local.ssm_prefix
    app_version               = var.app_version
    app_repo                  = "https://github.com/saving-satoshi/saving-satoshi-backend.git"
    app_port                  = var.app_port
    whitelist                 = var.whitelist
    max_script_execution_time = var.max_script_execution_time
    asg_name                  = "${local.namespace}-asg"
    lifecycle_hook_name       = "launch-hook"
  }))

  # IMDSv2 required for security
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  # Enable detailed monitoring for better scaling decisions
  monitoring {
    enabled = true
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${local.namespace}-app"
    }
  }

  tag_specifications {
    resource_type = "volume"
    tags = {
      Name = "${local.namespace}-app"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# =============================================================================
# Auto Scaling Group with Mixed Instances Policy
# =============================================================================

resource "aws_autoscaling_group" "app" {
  name                = "${local.namespace}-asg"
  vpc_zone_identifier = data.aws_subnets.default.ids
  target_group_arns   = [aws_lb_target_group.app.arn]

  min_size         = var.min_capacity
  max_size         = var.max_capacity
  desired_capacity = var.desired_capacity

  health_check_type         = "ELB"
  health_check_grace_period = var.health_check_grace_period

  # Capacity rebalancing for Spot instance interruption handling
  capacity_rebalance = true

  # Mixed instances policy: On-Demand base + Spot for scaling
  mixed_instances_policy {
    launch_template {
      launch_template_specification {
        launch_template_id = aws_launch_template.app.id
        version            = "$Latest"
      }

      # Primary instance type comes first; fallback_instance_types provides
      # fallback diversity for Spot availability. Explicit first override
      # ensures var.instance_type (set via AWS_EC2_INSTANCE_TYPE) is honoured —
      # the launch template instance_type is ignored when overrides are present.
      override {
        instance_type = var.instance_type
      }

      dynamic "override" {
        for_each = [for t in var.fallback_instance_types : t if t != var.instance_type]
        content {
          instance_type = override.value
        }
      }
    }

    instances_distribution {
      # Always keep at least this many On-Demand instances
      on_demand_base_capacity = var.on_demand_base_capacity

      # Percentage of On-Demand above base (0 = all Spot)
      on_demand_percentage_above_base_capacity = var.on_demand_percentage_above_base

      # Use capacity-optimized allocation for Spot (least likely to be interrupted)
      spot_allocation_strategy = "capacity-optimized"
    }
  }

  # Instance refresh for rolling deployments
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 100
      instance_warmup        = 180
    }
  }

  # Tags propagated to instances
  tag {
    key                 = "Name"
    value               = "${local.namespace}-instance"
    propagate_at_launch = true
  }

  tag {
    key                 = "Application"
    value               = local.application
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = local.environment
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

# =============================================================================
# Lifecycle Hooks
# =============================================================================

# Launch hook: Allow time for instance initialization before receiving traffic
resource "aws_autoscaling_lifecycle_hook" "launch" {
  name                   = "launch-hook"
  autoscaling_group_name = aws_autoscaling_group.app.name
  lifecycle_transition   = "autoscaling:EC2_INSTANCE_LAUNCHING"
  default_result         = "CONTINUE"
  heartbeat_timeout      = 300 # 5 minutes (EC2 boot ~1 min + user-data ~2 min + buffer)
}

# Terminate hook: Allow time for graceful shutdown
resource "aws_autoscaling_lifecycle_hook" "terminate" {
  name                   = "terminate-hook"
  autoscaling_group_name = aws_autoscaling_group.app.name
  lifecycle_transition   = "autoscaling:EC2_INSTANCE_TERMINATING"
  default_result         = "CONTINUE"
  heartbeat_timeout      = 120 # 2 minutes for graceful shutdown
}

# =============================================================================
# Outputs
# =============================================================================

output "asg_name" {
  value       = aws_autoscaling_group.app.name
  description = "Name of the Auto Scaling Group"
}

output "asg_arn" {
  value       = aws_autoscaling_group.app.arn
  description = "ARN of the Auto Scaling Group"
}

output "launch_template_id" {
  value       = aws_launch_template.app.id
  description = "ID of the launch template"
}
