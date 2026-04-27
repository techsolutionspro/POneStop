# Pharmacy One Stop - AWS Setup Guide

Step-by-step manual AWS setup for deploying Pharmacy One Stop to production.

**Region:** eu-west-2 (London)
**Domain:** pharmacyonestop.co.uk

---

## 1. EC2 Instance

### Launch Instance
- AMI: Ubuntu 22.04 LTS (HVM, SSD)
- Instance type: t3.medium (2 vCPU, 4 GB RAM)
- Region: eu-west-2
- Key pair: Create or select existing SSH key pair
- Storage: 30 GB gp3

### Security Group (p1s-ec2-sg)
| Type  | Port | Source         | Description          |
|-------|------|----------------|----------------------|
| SSH   | 22   | Your IP only   | SSH access           |
| HTTP  | 80   | 0.0.0.0/0     | HTTP (redirects)     |
| HTTPS | 443  | 0.0.0.0/0     | HTTPS                |

### Elastic IP
- Allocate an Elastic IP and associate it with the EC2 instance
- Note the IP for DNS configuration

### Server Setup (SSH in)
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt install docker-compose-plugin -y

# Log out and back in for group changes
exit

# Verify
docker --version
docker compose version

# Create app directory
mkdir -p ~/pharmacy-one-stop/infrastructure

# Install certbot for SSL
sudo apt install certbot -y
```

---

## 2. RDS PostgreSQL

### Create Database
- Engine: PostgreSQL 16
- Instance class: db.t3.micro (free tier eligible)
- Region: eu-west-2
- Storage: 20 GB gp3, auto-scaling up to 100 GB
- DB instance identifier: `p1s-production`
- Master username: `p1s_admin`
- Master password: Generate and store securely
- DB name: `pharmacy_one_stop`

### Network & Security
- VPC: Same VPC as EC2
- Subnet group: Private subnets only
- Public access: No
- Security group (p1s-rds-sg):

| Type       | Port | Source      | Description          |
|------------|------|-------------|----------------------|
| PostgreSQL | 5432 | p1s-ec2-sg  | EC2 access only      |

### Configuration
- Backup retention: 7 days
- Backup window: 03:00-04:00 UTC
- Maintenance window: Sun 04:00-05:00 UTC
- Encryption: Enabled (AWS managed key)
- Multi-AZ: No (enable later for HA)
- Performance Insights: Enabled

### Connection String
```
postgresql://p1s_admin:YOUR_PASSWORD@p1s-production.xxxxx.eu-west-2.rds.amazonaws.com:5432/pharmacy_one_stop?schema=public&sslmode=require
```

---

## 3. S3 Bucket

### Create Bucket
- Name: `pharmacy-one-stop-uploads`
- Region: eu-west-2
- Block all public access: Yes
- Versioning: Enabled
- Encryption: SSE-S3

### CORS Configuration
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://pharmacyonestop.co.uk"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### Bucket Policy (if using CloudFront OAC)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::pharmacy-one-stop-uploads/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

### Lifecycle Rules
- Transition to Glacier after 90 days for old uploads (optional)
- Delete incomplete multipart uploads after 7 days

---

## 4. CloudFront CDN

### Create Distribution
- Origin: `pharmacy-one-stop-uploads.s3.eu-west-2.amazonaws.com`
- Origin access: Origin Access Control (OAC)
- Viewer protocol policy: Redirect HTTP to HTTPS
- Allowed HTTP methods: GET, HEAD
- Cache policy: CachingOptimized
- Price class: Use only Europe and North America
- Alternate domain names (CNAMEs): `cdn.pharmacyonestop.co.uk`
- SSL certificate: Use ACM certificate (see step 6)
- Default root object: (leave empty)

### Note the distribution domain
Example: `dxxxxxxxxx.cloudfront.net`

---

## 5. Route 53 DNS

### Create Hosted Zone
- Domain: pharmacyonestop.co.uk
- Update nameservers at your registrar to match Route 53 NS records

### DNS Records
| Type  | Name                        | Value                              | TTL  |
|-------|-----------------------------|------------------------------------|------|
| A     | pharmacyonestop.co.uk       | EC2 Elastic IP                     | 300  |
| A     | www.pharmacyonestop.co.uk   | EC2 Elastic IP                     | 300  |
| CNAME | cdn.pharmacyonestop.co.uk   | dxxxxxxxxx.cloudfront.net          | 300  |

---

## 6. ACM SSL Certificate

### Request Certificate
- Certificate Manager (must use us-east-1 for CloudFront, eu-west-2 for ALB)
- Domain names:
  - `pharmacyonestop.co.uk`
  - `*.pharmacyonestop.co.uk`
- Validation method: DNS validation
- Add the CNAME records provided by ACM to Route 53

### For EC2 (Certbot/Let's Encrypt)
```bash
# On the EC2 instance, before first deploy:
sudo certbot certonly --standalone \
  -d pharmacyonestop.co.uk \
  -d www.pharmacyonestop.co.uk \
  --email admin@pharmacyonestop.co.uk \
  --agree-tos \
  --no-eff-email

# Auto-renewal (already set up by certbot, verify with):
sudo certbot renew --dry-run

# Reload nginx after renewal (add to cron):
echo "0 3 * * * certbot renew --quiet --post-hook 'docker exec p1s-nginx-prod nginx -s reload'" | sudo tee /etc/cron.d/certbot-renewal
```

---

## 7. IAM Roles & Policies

### EC2 Instance Role (p1s-ec2-role)
Create an IAM role with the following policy for S3 access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::pharmacy-one-stop-uploads",
        "arn:aws:s3:::pharmacy-one-stop-uploads/*"
      ]
    }
  ]
}
```

- Attach this role to the EC2 instance (Actions > Security > Modify IAM Role)
- This eliminates the need for AWS access keys in .env

### IAM User for CI/CD (optional, if not using instance roles)
- Create IAM user: `p1s-ci-deploy`
- Attach policy: AmazonEC2ContainerRegistryPowerUser (if using ECR)
- Generate access keys for GitHub secrets

---

## 8. Security Best Practices

- Enable AWS CloudTrail for audit logging
- Enable VPC Flow Logs
- Use AWS Secrets Manager for sensitive values (optional, improves rotation)
- Enable GuardDuty for threat detection
- Regularly update EC2 instance: `sudo apt update && sudo apt upgrade -y`
- Set up CloudWatch alarms for:
  - CPU utilization > 80%
  - RDS storage > 80%
  - Disk usage > 80%

---

## 9. First Deployment Checklist

```bash
# 1. SSH into EC2
ssh -i your-key.pem ubuntu@YOUR_ELASTIC_IP

# 2. Clone/copy infrastructure files
cd ~/pharmacy-one-stop/infrastructure

# 3. Create .env.production from template
cp .env.production.example .env.production
nano .env.production  # Fill in all values

# 4. Get SSL certificate (stop any process on port 80 first)
sudo certbot certonly --standalone \
  -d pharmacyonestop.co.uk \
  -d www.pharmacyonestop.co.uk

# 5. Log in to container registry
echo "YOUR_GITHUB_PAT" | docker login ghcr.io -u YOUR_GITHUB_USER --password-stdin

# 6. Start services
docker compose -f docker-compose.prod.yml up -d

# 7. Check logs
docker compose -f docker-compose.prod.yml logs -f

# 8. Verify all services are healthy
docker compose -f docker-compose.prod.yml ps

# 9. Run database migrations (if not auto-run by server)
docker exec p1s-server-prod npx prisma migrate deploy

# 10. Seed initial data (if needed)
docker exec p1s-server-prod npx prisma db seed
```

---

## 10. GitHub Actions Secrets Required

Add these in GitHub repo > Settings > Secrets and variables > Actions:

| Secret                | Description                              |
|-----------------------|------------------------------------------|
| `EC2_HOST`            | EC2 Elastic IP or domain                 |
| `EC2_USERNAME`        | `ubuntu` (default for Ubuntu AMI)        |
| `EC2_SSH_KEY`         | Private SSH key (full PEM content)       |
| `NEXT_PUBLIC_API_URL` | `https://pharmacyonestop.co.uk/api`      |
| `GITHUB_TOKEN`        | Auto-provided by GitHub Actions          |

---

## Estimated Monthly Costs (eu-west-2)

| Service               | Spec              | Est. Cost/month |
|-----------------------|-------------------|-----------------|
| EC2 t3.medium         | On-demand         | ~$35            |
| RDS db.t3.micro       | Single-AZ         | ~$15            |
| S3                    | < 10 GB           | ~$1             |
| CloudFront            | < 100 GB transfer | ~$10            |
| Route 53              | 1 hosted zone     | ~$0.50          |
| Elastic IP            | 1 address         | ~$3.65          |
| **Total**             |                   | **~$65/month**  |

Consider Reserved Instances for EC2 and RDS after validating the setup to save ~40%.
