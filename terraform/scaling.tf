# Auto Scaling policies and CloudWatch alarms
# Configures reactive scaling based on CPU and request count metrics

# =============================================================================
# Target Tracking Scaling Policies
# =============================================================================

# CPU Utilization Target Tracking
# Scales to maintain average CPU at 50%
resource "aws_autoscaling_policy" "cpu_target_tracking" {
  name                   = "${local.namespace}-cpu-target-tracking"
  autoscaling_group_name = aws_autoscaling_group.app.name
  policy_type            = "TargetTrackingScaling"

  estimated_instance_warmup = local.autoscaling_estimated_instance_warm_up

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value     = 50.0
    disable_scale_in = false
  }
}

# Request Count Target Tracking
# Scales based on requests per target
resource "aws_autoscaling_policy" "request_count_target_tracking" {
  name                   = "${local.namespace}-request-count-target-tracking"
  autoscaling_group_name = aws_autoscaling_group.app.name
  policy_type            = "TargetTrackingScaling"

  estimated_instance_warmup = local.autoscaling_estimated_instance_warm_up

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label         = "${aws_lb.app.arn_suffix}/${aws_lb_target_group.app.arn_suffix}"
    }
    target_value     = 400.0 # Requests per target per minute; tuned for REPL-heavy workload
    disable_scale_in = false
  }

  depends_on = [aws_lb_listener.https]
}

# =============================================================================
# Step Scaling for Rapid Scale-Out
# =============================================================================
# Complements target tracking (CPU @ 50%) for sudden traffic spikes.
# Target tracking reacts proportionally but slowly (one scale-out round at a
# time). If CPU hits 75% the traffic spike is severe enough to warrant an
# aggressive multi-instance jump while target tracking catches up.
# Threshold of 75% keeps this alarm well above the 50% target tracking band
# so both policies are not firing simultaneously under normal load.

resource "aws_autoscaling_policy" "scale_out_rapid" {
  name                   = "${local.namespace}-scale-out-rapid"
  autoscaling_group_name = aws_autoscaling_group.app.name
  adjustment_type        = "ChangeInCapacity"
  policy_type            = "StepScaling"

  estimated_instance_warmup = local.autoscaling_estimated_instance_warm_up

  # 75–95% CPU: add 2 instances (0–20 above threshold)
  step_adjustment {
    scaling_adjustment          = 2
    metric_interval_lower_bound = 0
    metric_interval_upper_bound = 20
  }

  # 95%+ CPU: add 4 instances (20+ above threshold)
  step_adjustment {
    scaling_adjustment          = 4
    metric_interval_lower_bound = 20
  }
}

resource "aws_cloudwatch_metric_alarm" "high_cpu_rapid" {
  alarm_name          = "${local.namespace}-high-cpu-rapid"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Average"
  threshold           = 75
  alarm_description   = "Rapid scale-out when CPU exceeds 75% — target tracking handles 50-75%"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.app.name
  }

  alarm_actions = [aws_autoscaling_policy.scale_out_rapid.arn]

  tags = {
    Name = "${local.namespace}-high-cpu-rapid"
  }
}

# =============================================================================
# CloudWatch Dashboard
# =============================================================================

resource "aws_cloudwatch_dashboard" "app" {
  dashboard_name = "${local.namespace}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      # ASG Instance Count
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "ASG Instance Count"
          region = var.region
          metrics = [
            ["AWS/AutoScaling", "GroupInServiceInstances", "AutoScalingGroupName", aws_autoscaling_group.app.name, { label = "In Service" }],
            [".", "GroupDesiredCapacity", ".", ".", { label = "Desired" }],
            [".", "GroupMinSize", ".", ".", { label = "Min" }],
            [".", "GroupMaxSize", ".", ".", { label = "Max" }]
          ]
          stat   = "Average"
          period = 60
        }
      },
      # CPU Utilization
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "CPU Utilization"
          region = var.region
          metrics = [
            ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", aws_autoscaling_group.app.name, { stat = "Average", label = "Average" }],
            ["...", { stat = "Maximum", label = "Maximum" }]
          ]
          period = 60
        }
      },
      # ALB Request Count
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "ALB Request Count"
          region = var.region
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", aws_lb.app.arn_suffix, { stat = "Sum", label = "Requests" }],
            [".", "ActiveConnectionCount", ".", ".", { stat = "Sum", label = "Active Connections" }]
          ]
          period = 60
        }
      },
      # Target Response Time
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "Target Response Time"
          region = var.region
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", aws_lb.app.arn_suffix, { stat = "Average", label = "Average" }],
            ["...", { stat = "p99", label = "p99" }]
          ]
          period = 60
        }
      },
      # Healthy/Unhealthy Hosts
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          title  = "Target Health"
          region = var.region
          metrics = [
            ["AWS/ApplicationELB", "HealthyHostCount", "TargetGroup", aws_lb_target_group.app.arn_suffix, "LoadBalancer", aws_lb.app.arn_suffix, { label = "Healthy" }],
            [".", "UnHealthyHostCount", ".", ".", ".", ".", { label = "Unhealthy" }]
          ]
          period = 60
        }
      },
      # HTTP Error Codes
      {
        type   = "metric"
        x      = 12
        y      = 12
        width  = 12
        height = 6
        properties = {
          title  = "HTTP Error Codes"
          region = var.region
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_Target_4XX_Count", "LoadBalancer", aws_lb.app.arn_suffix, { stat = "Sum", label = "4XX" }],
            [".", "HTTPCode_Target_5XX_Count", ".", ".", { stat = "Sum", label = "5XX" }],
            [".", "HTTPCode_ELB_5XX_Count", ".", ".", { stat = "Sum", label = "ELB 5XX" }]
          ]
          period = 60
        }
      },
      # Memory Usage (from CloudWatch agent — SavingSatoshi/Instance namespace)
      {
        type   = "metric"
        x      = 0
        y      = 18
        width  = 12
        height = 6
        properties = {
          title  = "Memory Usage"
          region = var.region
          metrics = [
            [{ expression = "AVG(SEARCH('{SavingSatoshi/Instance,host} MetricName=\"mem_used_percent\"', 'Average', 60))", label = "Avg Used %", id = "e1" }]
          ]
          yAxis = {
            left = { min = 0, max = 100 }
          }
          period = 60
        }
      },
      # Disk Usage (from CloudWatch agent — SavingSatoshi/Instance namespace)
      {
        type   = "metric"
        x      = 12
        y      = 18
        width  = 12
        height = 6
        properties = {
          title  = "Disk Usage (/)"
          region = var.region
          metrics = [
            [{ expression = "AVG(SEARCH('{SavingSatoshi/Instance,host} MetricName=\"disk_used_percent\"', 'Average', 60))", label = "Avg Used %", id = "e1" }]
          ]
          yAxis = {
            left = { min = 0, max = 100 }
          }
          period = 60
        }
      }
    ]
  })
}

# =============================================================================
# Outputs
# =============================================================================

output "cloudwatch_dashboard_url" {
  value       = "https://${var.region}.console.aws.amazon.com/cloudwatch/home?region=${var.region}#dashboards:name=${aws_cloudwatch_dashboard.app.dashboard_name}"
  description = "URL to the CloudWatch dashboard"
}
