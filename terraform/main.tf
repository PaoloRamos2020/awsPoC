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

data "aws_security_group" "default" {
  id = "sg-0a9c7c850ff4e7796"
}

resource "aws_lambda_function" "jira_mock" {
  filename         = "../lambda/lambda.zip"
  function_name    = "${var.project_name}-jira-mock"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  source_code_hash = filebase64sha256("../lambda/lambda.zip")
  timeout          = 10

  environment {
    variables = {
      ENVIRONMENT  = "dev"
      PROJECT_NAME = var.project_name
    }
  }
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

resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"

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
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

resource "aws_ecr_repository" "backend" {
  name                 = "${var.project_name}-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"
}

resource "aws_db_instance" "postgres" {
  identifier        = "${var.project_name}-db"
  engine            = "postgres"
  engine_version    = "15.14"
  instance_class    = "db.t3.micro"
  allocated_storage = 20

  db_name  = "demanda"
  username = "postgres"
  password = var.db_password

  skip_final_snapshot    = true
  publicly_accessible    = true
  vpc_security_group_ids = [data.aws_security_group.default.id]
}
