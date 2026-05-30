#!/bin/bash
# Instance initialization script for Auto Scaling Group instances
# This script runs at boot time to deploy the application
set -euo pipefail

# Log all output to file and console
exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/console) 2>&1

echo "=== Starting instance initialization ==="
echo "Timestamp: $(date -Iseconds)"

# Get instance metadata
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 300")
REGION=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/region)
INSTANCE_ID=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id)

echo "Region: $REGION"
echo "Instance ID: $INSTANCE_ID"

# Always signal the lifecycle hook on exit, CONTINUE on success, ABANDON on failure
LIFECYCLE_RESULT="ABANDON"
complete_lifecycle_hook() {
  if [ -n "${lifecycle_hook_name}" ] && [ -n "${asg_name}" ]; then
    echo "Signaling lifecycle hook: $LIFECYCLE_RESULT"
    aws autoscaling complete-lifecycle-action \
      --lifecycle-action-result "$LIFECYCLE_RESULT" \
      --lifecycle-hook-name "${lifecycle_hook_name}" \
      --auto-scaling-group-name "${asg_name}" \
      --instance-id "$INSTANCE_ID" \
      --region "$REGION" || echo "Lifecycle hook signal failed"
  fi
}
trap complete_lifecycle_hook EXIT

# Retrieve secrets from SSM Parameter Store
echo "Fetching secrets from SSM Parameter Store..."
SSM_PREFIX="${ssm_prefix}"

DATABASE_URL=$(aws ssm get-parameter --name "$SSM_PREFIX/database-url" --with-decryption --region "$REGION" --query 'Parameter.Value' --output text)
SECRET=$(aws ssm get-parameter --name "$SSM_PREFIX/secret" --with-decryption --region "$REGION" --query 'Parameter.Value' --output text)

# Build environment file content
export APP_ENV_CONTENT="DATABASE_URL=$DATABASE_URL
MAX_SCRIPT_EXECUTION_TIME=${max_script_execution_time}
PORT=${app_port}
SECRET=$SECRET
WHITELIST=${whitelist}"

export DATABASE_URL
export APP_VERSION="${app_version}"
export APP_REPO="${app_repo}"

echo "Application version: $APP_VERSION"

# Run the runtime Ansible playbook
echo "Running Ansible runtime playbook..."
cd /opt/ansible

# Install Ansible Galaxy requirements if not already installed
if [ ! -d "/root/.ansible/collections/ansible_collections/community/docker" ]; then
  ansible-galaxy collection install community.docker community.general
fi

ansible-playbook playbook-runtime.yaml \
  --connection=local \
  -i localhost, \
  -e "ansible_python_interpreter=/usr/bin/python3"

echo "Ansible playbook completed successfully"

# All steps succeeded — signal CONTINUE
LIFECYCLE_RESULT="CONTINUE"

echo "=== Instance initialization complete ==="
echo "Timestamp: $(date -Iseconds)"
