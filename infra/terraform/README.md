# Terraform - KejaYaCapo Duka (EC2)

This folder provisions AWS infrastructure to run the Express app on an EC2 instance.

## What it creates

- VPC + public subnet
- Internet Gateway + route table
- Security Group (SSH + HTTP + HTTPS)
- EC2 instance
- Elastic IP (static IPv4)
- IAM role/instance profile (optional SSM)
- User-data that installs Node.js, clones repo, installs deps, and runs a systemd service

## Prereqs

- AWS account
- AWS CLI configured (`aws configure`) or environment credentials
- Terraform >= 1.5
- A key pair name that exists in the target region (for SSH)

## Usage

```bash
terraform init
terraform plan -var="project_name=kejayacapo-duka" -var="aws_region=us-east-1" -var="key_name=kyc-ec2" -var="repo_url=https://github.com/DarynOngera/kyc-.git"
terraform apply -var="project_name=kejayacapo-duka" -var="aws_region=eu-west-1" -var="key_name=kyc-ec2" -var="repo_url=https://github.com/DarynOngera/kyc-.git"
```

## Outputs

- `public_ip` - The Elastic IP
- `instance_id`

After apply, visit:

- `http://<public_ip>:3000`
- Or put nginx in front and terminate TLS on 80/443

## Notes

- Put your `.env` on the server at `/etc/kejayacapo-duka/duka-replica.env` (see `user_data.sh`).
- For production, prefer:
  - SSM Session Manager instead of SSH
  - Nginx reverse proxy for TLS
  - Private subnet + ALB (future)
