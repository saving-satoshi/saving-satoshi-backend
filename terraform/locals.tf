locals {
  application = "saving-satoshi"
  environment = var.environment
  namespace   = "${local.application}-${local.environment}"
  default_tags = {
    Application = "saving-satoshi"
    Environment = local.environment
  }
}
