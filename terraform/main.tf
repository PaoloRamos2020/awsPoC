terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  tags = {
    Project     = "demanda-poc"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ECR Repository para el backend
resource "aws_ecr_repository" "backend" {
  name                 = "demanda-poc-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
  tags                 = local.tags
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "demanda-poc-cluster"
  tags = local.tags
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier           = "demanda-poc-db"
  engine               = "postgres"
  engine_version       = "15"
  instance_class       = "db.t3.micro"
  allocated_storage    = 20
  db_name              = "demanda"
  username             = "postgres"
  password             = var.db_password
  skip_final_snapshot  = true
  publicly_accessible  = true
  tags                 = local.tags
}

# Lambda Mock JIRA
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda"
  output_path = "${path.module}/lambda.zip"
}

resource "aws_lambda_function" "jira_mock" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "demanda-poc-jira-mock"
  role             = aws_iam_role.lambda_exec.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  timeout          = 10
  environment {
    variables = { ENVIRONMENT = var.environment }
  }
  tags = local.tags
}

resource "aws_iam_role" "lambda_exec" {
  name = "demanda-poc-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function_url" "jira_mock" {
  function_name      = aws_lambda_function.jira_mock.function_name
  authorization_type = "NONE"
  cors {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST"]
  }
}
