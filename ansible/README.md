# Ansible

The EC2 instance provisioned by Terraform is configured using [Ansible](https://docs.ansible.com) via the GitHub Actions CI/CD pipeline. Ansible takes care of things like:
- Installs dependencies
- Deploys and builds the application (and base images)
- Configures Nginx and the SSL certificate
- Configures logging and sends logs to CloudWatch.

For specifics, review the steps in `playbook.yaml`.

It is also possible to run Ansible locally. To do so, create an `ansible/inventory.yaml` that looks something like the following:
```
app:
  hosts:
    # This IP should be the output `ip_address from `terraform-apply`. It should be the EIP
    # of your provisioned EC2 instance.
    54.187.242.73:
      ansible_user: ubuntu
      # This file path should be to the SSH key that has access to the instance.
      ansible_ssh_private_key_file: /home/satoshi/saving-satoshi/saving-satoshi-test.pem
      aws_region: us-west-2
      # This `hostname` should be that which has a DNS A record pointed to the instance EIP.
      hostname: api.savingsatoshi.com
      cert_email: admin@savingsatoshi.com
      env_config: ../.env
```

Then, from the `ansible` directory, run:
```
ansible-playbook -i inventory.yaml playbook.yaml
```

You can override variables using the `--extra-vars` parameter:
```
ansible-playbook -i inventory.yaml playbook.yaml --extra-vars hostname=test.api.savingsatoshi.com
```

See the Ansible documentation for more information.
