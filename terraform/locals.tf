locals {
  application = "saving-satoshi"
  environment = var.environment
  namespace   = "${local.application}-${local.environment}"

  autoscaling_estimated_instance_warm_up = 150

  default_tags = {
    Application = "saving-satoshi"
    Environment = local.environment
  }
}
