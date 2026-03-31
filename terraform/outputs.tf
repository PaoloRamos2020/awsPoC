output "lambda_url" {
  description = "Lambda function URL"
  value       = aws_lambda_function_url.jira_mock_url.function_url
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

output "rds_endpoint" {
  description = "RDS endpoint (solo en dev, compartido entre ambientes)"
  value       = var.environment == "dev" ? aws_db_instance.postgres[0].endpoint : "uses demanda-shared-db (see dev output)"
}

output "rds_database_name" {
  description = "Nombre de la base de datos para este ambiente"
  value       = "demanda_${var.environment}"
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "frontend_url" {
  description = "CloudFront URL del frontend"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "s3_bucket_name" {
  description = "Nombre del bucket S3 del frontend"
  value       = aws_s3_bucket.frontend.bucket
}

output "environment" {
  description = "Ambiente desplegado"
  value       = var.environment
}
