terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "demanda-poc-tfstate-145292398795"
    region = "us-east-1"
    # key se pasa dinámicamente desde el pipeline:
    # -backend-config="key=dev/terraform.tfstate"
    # -backend-config="key=qa/terraform.tfstate"
    # -backend-config="key=prod/terraform.tfstate"
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  prefix = "${var.project_name}-${var.environment}"
  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ─── LAMBDA MOCK JIRA ────────────────────────────────────────────────────────

resource "aws_iam_role" "lambda_role" {
  name = "${local.prefix}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

resource "aws_lambda_function" "jira_mock" {
  filename         = "../lambda/lambda.zip"
  function_name    = "${local.prefix}-jira-mock"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  source_code_hash = filebase64sha256("../lambda/lambda.zip")
  timeout          = 10

  environment {
    variables = {
      ENVIRONMENT  = var.environment
      PROJECT_NAME = var.project_name
    }
  }

  tags = local.tags
}

resource "aws_lambda_function_url" "jira_mock_url" {
  function_name      = aws_lambda_function.jira_mock.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = false
    allow_headers     = []
    allow_methods     = ["GET", "POST"]
    allow_origins     = ["*"]
    expose_headers    = []
    max_age           = 0
  }
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.jira_mock.function_name}"
  retention_in_days = var.environment == "prod" ? 30 : 7
  tags              = local.tags
}

# ─── ECR ─────────────────────────────────────────────────────────────────────

resource "aws_ecr_repository" "backend" {
  name                 = "${local.prefix}-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
  tags                 = local.tags
}

# ─── ECS ─────────────────────────────────────────────────────────────────────

resource "aws_ecs_cluster" "main" {
  name = "${local.prefix}-cluster"
  tags = local.tags
}

# ─── RDS POSTGRESQL ──────────────────────────────────────────────────────────

data "aws_security_group" "default" {
  id = "sg-0a9c7c850ff4e7796"
}

resource "aws_db_instance" "postgres" {
  identifier        = "${local.prefix}-db"
  engine            = "postgres"
  engine_version    = "15.14"
  instance_class    = "db.t3.micro"
  allocated_storage = 20

  db_name  = "demanda"
  username = "postgres"
  password = var.db_password

  skip_final_snapshot    = var.environment != "prod"
  deletion_protection    = var.environment == "prod"
  publicly_accessible    = true
  vpc_security_group_ids = [data.aws_security_group.default.id]

  tags = local.tags
}

# ─── S3 FRONTEND ─────────────────────────────────────────────────────────────

resource "aws_s3_bucket" "frontend" {
  bucket        = "${local.prefix}-frontend-145292398795"
  force_destroy = var.environment != "prod"
  tags          = local.tags
}

resource "aws_s3_bucket_website_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  index_document { suffix = "index.html" }
  error_document { key = "index.html" }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket     = aws_s3_bucket.frontend.id
  depends_on = [aws_s3_bucket_public_access_block.frontend]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "PublicReadGetObject"
      Effect    = "Allow"
      Principal = "*"
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.frontend.arn}/*"
    }]
  })
}

# ─── CLOUDFRONT ──────────────────────────────────────────────────────────────

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  default_root_object = "index.html"
  comment             = "Demanda ${var.environment} Frontend"
  price_class         = "PriceClass_100"

  origin {
    domain_name = aws_s3_bucket_website_configuration.frontend.website_endpoint
    origin_id   = "S3-${local.prefix}-frontend"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = "S3-${local.prefix}-frontend"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = local.tags
}


