variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "demanda"
}

variable "environment" {
  description = "Ambiente de despliegue: dev | qa | prod"
  type        = string
  validation {
    condition     = contains(["dev", "qa", "prod"], var.environment)
    error_message = "El ambiente debe ser dev, qa o prod."
  }
}

variable "db_password" {
  description = "RDS PostgreSQL password (solo requerido en dev)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "rds_host" {
  description = "RDS endpoint para qa y prod (referencia la instancia compartida de dev)"
  type        = string
  default     = ""
}
