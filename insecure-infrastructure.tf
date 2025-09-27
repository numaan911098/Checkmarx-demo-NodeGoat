# File 2: insecure-infrastructure.tf (triggers KICS)
terraform {
  required_version = ">= 0.12"
}

# Insecure S3 bucket - public read/write access
resource "aws_s3_bucket" "travel_data" {
  bucket = "amadeus-customer-data-public"
  
  # Dangerous: Public read/write access
  acl = "public-read-write"
  
  versioning {
    enabled = false  # No versioning for data protection
  }
  
  # No encryption at rest
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"  # Weaker than KMS
      }
    }
  }
  
  # Public access - CRITICAL vulnerability
  public_access_block {
    block_public_acls       = false
    block_public_policy     = false
    ignore_public_acls      = false
    restrict_public_buckets = false
  }
}

# Insecure RDS instance
resource "aws_rds_instance" "booking_database" {
  identifier = "amadeus-booking-db"
  
  # Publicly accessible database
  publicly_accessible = true
  
  # No encryption
  storage_encrypted = false
  
  # Weak password
  password = "password123"
  
  # No backup retention
  backup_retention_period = 0
  
  # Skip final snapshot
  skip_final_snapshot = true
  
  # Default security group (insecure)
  vpc_security_group_ids = []
}

# Security group allowing all traffic
resource "aws_security_group" "allow_all" {
  name_prefix = "allow_all"
  
  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Allow from anywhere
  }
  
  egress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Allow to anywhere
  }
}

# EC2 instance with insecure configuration
resource "aws_instance" "web_server" {
  ami           = "ami-0abcdef1234567890"
  instance_type = "t2.micro"
  
  # No encryption for EBS volumes
  root_block_device {
    encrypted = false
  }
  
  # Associate public IP
  associate_public_ip_address = true
  
  # User data with secrets
  user_data = <<-EOF
    #!/bin/bash
    export DATABASE_PASSWORD="super-secret-password"
    export API_KEY="sk-1234567890abcdefghijklmnopqrstuvwx"
    echo "Starting web server..."
  EOF
  
  # No monitoring
  monitoring = false
  
  tags = {
    Name = "amadeus-web-server"
  }
}

---

# File 3: Dockerfile (triggers KICS)
FROM ubuntu:latest

# Running as root (security risk)
USER root

# Installing packages without specific versions
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    nodejs \
    npm

# Hard-coded secrets in environment
ENV DATABASE_PASSWORD=admin123
ENV API_KEY=sk-1234567890abcdefghijklmnopqrstuvwx
ENV JWT_SECRET=super-secret-jwt-key

# Copying everything (including secrets)
COPY . /app

# Setting insecure permissions
RUN chmod 777 -R /app

# Exposing privileged port
EXPOSE 22
EXPOSE 80
EXPOSE 443

# Working directory as root
WORKDIR /app

# Installing dependencies as root
RUN npm install

# No health check defined

# Running application as root user
CMD ["node", "server.js"]

---

# File 4: kubernetes-deployment.yaml (triggers KICS)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: amadeus-booking-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: booking-app
  template:
    metadata:
      labels:
        app: booking-app
    spec:
      containers:
      - name: booking-app
        image: amadeus/booking:latest
        ports:
        - containerPort: 3000
        
        # Running as root (dangerous)
        securityContext:
          runAsUser: 0
          privileged: true
          allowPrivilegeEscalation: true
        
        # Hard-coded secrets
        env:
        - name: DATABASE_PASSWORD
          value: "admin123"
        - name: API_KEY
          value: "sk-1234567890abcdefghijklmnopqrstuvwx"
        - name: JWT_SECRET
          value: "super-secret-jwt-key"
        
        # No resource limits
        resources: {}
        
        # No health checks
        # livenessProbe: {}
        # readinessProbe: {}
        
      # No security context at pod level
      securityContext: {}
      
      # Running on host network
      hostNetwork: true
      hostPID: true