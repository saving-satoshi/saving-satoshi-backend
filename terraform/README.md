# Terraform

Infrastructure for the Saving Satoshi Backend is hosted with AWS and deployed using Terraform via CI/CD over GitHub Actions. GitHub authenticates with AWS automatically using an OpenID Connect (OIDC) provider and then assumes an IAM role to provision infrastructure.

## Baseline Infrastructure

To function via the pipeline, a few boilerplate resources are required in the AWS account, namely:
- An OIDC provider for GitHub actions. See the documentation [here](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws).
- A S3 bucket to hold the Terraform remote state. See the documentation [here](https://developer.hashicorp.com/terraform/language/backend/s3).

To illustrate these resources and simplify things for AWS admins, a "base" Terraform configuration is provided in `terraform/base`. Admins should provision these resources by navigating to that directory on their local machine and running the following with their credentials available:
```shell
terraform init
terraform plan
terraform apply
```

The exact name of the remote Terraform state bucket and AWS region can be customized using the `terraform_state_bucket_name` and `region` variables:
```shell
terraform plan -var terraform_state_bucket_name=saving-satoshi-production-terraform-state -region=us-west-2

terraform apply -var terraform_state_bucket_name=saving-satoshi-production-terraform-state -region=us-west-2
```

These values need to be configured into GitHub actions as variables and secrets. Please see the comment documentation in `.github/workflows/deploy.yml` to complete the setup.

IMPORTANT: The baseline infrastructure is not stored in a remote Terraform state. Admins are responsible for deleting or cleaning up these resources by running `terraform destroy` from their local machines, or removing the resources through the AWS console.

## Application Infrastructure

Infrastructure should generally be provisioned under the CI/CD pipeline. But it is also common to run Terraform locally. From the `terraform` directory under a shell environment with AWS credential access, run:
```shell
terraform init
```

The application infrastructure currently *expects* an existing EC2 key pair to be already provisioined in the AWS account. The name of this key pair should be used in the following step.

Set the value of the remote state bucket to the that which was selected and output from the "baseline" infrastructure process.
```shell
terraform plan -var key_pair_name=${key-pair-name}
terraform apply -var key_pair_name=${key-pair-name}
```

The key pair may be added to the baseline infrastucture later.
