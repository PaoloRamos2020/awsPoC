output "lambda_url" {
  description = "URL pública de la Lambda JIRA Mock"
  value       = aws_lambda_function_url.jira_mock.function_url
}

output "ecr_backend_url" {
  description = "URL del repositorio ECR del backend"
  value       = aws_ecr_repository.backend.repository_url
}

output "rds_endpoint" {
  description = "Endpoint de la instancia PostgreSQL"
  value       = aws_db_instance.postgres.address
  sensitive   = true
}

output "ecs_cluster_name" {
  description = "Nombre del ECS Cluster"
  value       = aws_ecs_cluster.main.name
}
