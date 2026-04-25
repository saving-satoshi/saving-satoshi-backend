# Deployment

The backend runs on AWS. Pushing to `master` or `develop` automatically deploys the app — no manual steps needed after initial setup. A load balancer distributes incoming requests across one or more servers, and the server count scales up automatically under heavy traffic and back down when things are quiet.

## Environments

| Branch | Environment | Notes |
|--------|-------------|-------|
| `master` | Production | Persistent — never torn down |
| `develop` | Staging | Infrastructure is destroyed nightly and rebuilt on the next push |

Staging auto-destruction runs nightly at 4am UTC. This keeps costs near zero when staging is idle.

## How a Deploy Works

1. Push to `master` or `develop`
2. CI runs the test suite
3. If server infrastructure config changed, a new server image is built (~10 min)
4. The infrastructure is updated
5. Running servers are replaced one-by-one with no downtime (~3 min per server)

You don't need to do anything — the pipeline handles it.

To force a full infrastructure rebuild without changing any files, go to **Actions → CI → Run workflow** and enable "Force AMI rebuild".

## GitHub Configuration

These must be set before the pipeline can deploy. Go to **Settings → Secrets and Variables → Actions**.

### Variables

| Name | Description |
|------|-------------|
| `ENVIRONMENT` | `production` or `staging` |
| `HOSTNAME` | Public API hostname (e.g. `api.savingsatoshi.com`) |
| `AWS_REGION` | AWS region to deploy into (e.g. `us-west-2`) |
| `AWS_ROLE_ARN_TO_ASSUME` | The AWS identity that CI uses to deploy — output from `terraform/base` |
| `AWS_ROUTE53_HOSTED_ZONE_ID` | Controls the domain name — output from `terraform/base` |
| `AWS_S3_TERRAFORM_STATE_BUCKET_NAME` | Where infrastructure state is stored — output from `terraform/base` |
| `AWS_S3_TERRAFORM_STATE_OBJECT_KEY` | Path within that bucket (e.g. `production/terraform.tfstate`) |
| `AWS_EC2_KEY_PAIR_NAME` | Name of an EC2 key pair for emergency SSH access |

### Secrets

| Name | Description |
|------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (e.g. `postgresql://user:pass@host/db?connection_limit=8`) |
| `SECRET` | JWT signing secret |

## Monitoring

After every deploy, the pipeline prints a **CloudWatch dashboard URL** in the deploy step summary. That dashboard shows server count, CPU, request rate, error counts, memory, and disk — check here first when something looks wrong.

Application logs are collected automatically. Find them in **AWS CloudWatch → Log groups → `saving-satoshi-{environment}-app`**. Each server has its own log stream named by its instance ID.

If a server stops responding, the load balancer stops sending it traffic and it is automatically replaced. This happens without any intervention.

## Auto-Scaling

The app normally runs on a single server. Under load, additional servers spin up automatically — usually within 3–4 minutes of sustained high traffic — and scale back down when things quiet down. Extra servers use AWS Spot pricing, which is roughly 70% cheaper than standard pricing; they can occasionally be reclaimed by AWS, but the system handles this transparently.

At baseline (one server), infrastructure costs are approximately $15/mo for the server and $20/mo for the load balancer. Additional servers during traffic spikes are billed by the hour.

## Initial Setup (First Deploy Only)

1. Run `terraform/base` once in the target AWS account — this creates the IAM role and the S3 bucket used for infrastructure state, and outputs the values needed for GitHub variables above
2. Configure all GitHub variables and secrets from the tables above
3. Push to `master` or `develop` — the first deploy provisions everything

The `DATABASE_URL` and `SECRET` secrets must be set before the first deploy or the app will fail to start.
