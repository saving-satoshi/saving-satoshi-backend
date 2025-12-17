locals {
  application = "saving-satoshi"
  environment = "production"
  namespace   = "${local.application}-${local.environment}"
  default_tags = {
    Application = "saving-satoshi"
    Environment = "production"
  }
}
