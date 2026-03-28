variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Ambiente de despliegue"
  type        = string
  default     = "dev"
}

variable "db_password" {
  description = "Password de la instancia RDS PostgreSQL"
  type        = string
  sensitive   = true
}
