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

variable "db_host" {
  description = "RDS host — requerido en qa y prod (referencian el RDS compartido de dev)"
  type        = string
  default     = ""
}
