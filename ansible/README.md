# Ansible

This directory contains Ansible playbooks that handle server provisioning and application deployment.

## Playbooks

There are three playbooks with distinct roles:

### `playbook-base.yaml` — AMI build (automated)

Run by Packer during a CI AMI build. Installs all system dependencies (Node.js, Docker, Nginx,
AWS CLI), bakes the REPL Docker base images, warms the Yarn package cache, and installs the
CloudWatch agent. The resulting snapshot becomes the base image for all production and staging
servers. **Not intended for manual use.**

### `playbook-runtime.yaml` — Instance boot (automated)

Run automatically on each server at first boot via the instance's startup script. Checks out
the correct application version from Git, installs packages, writes the environment config
(fetched from AWS SSM), builds the app, runs database migrations, and starts the service.
**Not intended for manual use.**

### `playbook.yaml` — Direct VPS deployment

The original single-server playbook. Retained as an escape hatch if the AWS auto-scaling
setup ever becomes too costly or operationally complex to justify — for example, when
migrating to a VPS provider like Hetzner or DigitalOcean. It handles the full setup in one
pass: system packages, SSL certificate via Let's Encrypt, application deployment, Nginx, and
the systemd service.

To use it, create an `ansible/inventory.yaml`:

```yaml
app:
  hosts:
    XXX.XXX.XXX.XX:           # Public IP of your VPS
      ansible_user: ubuntu
      ansible_ssh_private_key_file: /path/to/your.pem
      aws_region: us-west-2   # Needed for CloudWatch log streaming
      hostname: api.savingsatoshi.com
      cert_email: admin@savingsatoshi.com
      env_config: ../.env
```

Then from the `ansible` directory:

```
ansible-playbook -i inventory.yaml playbook.yaml
```

You can override variables with `--extra-vars`:

```
ansible-playbook -i inventory.yaml playbook.yaml --extra-vars hostname=staging.api.savingsatoshi.com
```

See the [Ansible documentation](https://docs.ansible.com) for more.
