# PoC — Gestión de la Demanda

Prueba de concepto que reproduce la arquitectura Lambda → ECS/Fargate → PostgreSQL usando AWS, Terraform y GitHub Actions.

## Arquitectura
```
JIRA (Mock Lambda) → Backend (Node.js/ECS) → PostgreSQL (RDS)
                              ↑
                         React Frontend
```

## Stack
- **Lambda**: Mock de webhook JIRA (Node.js 20)
- **Backend**: Express API en contenedor ECS/Fargate
- **Base de datos**: PostgreSQL en RDS (db.t3.micro)
- **IaC**: Terraform
- **CI/CD**: GitHub Actions → ECR → ECS

## Correr localmente
```bash
docker-compose up --build
```

- Backend: http://localhost:3001
- Lambda mock: http://localhost:3002

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /health | Health check |
| GET | /api/demandas | Listar demandas |
| POST | /api/demandas/sync | Sincronizar desde Lambda |
| GET | /api/stats | Estadísticas generales |

## Deploy en AWS
```bash
cd terraform
terraform init
terraform apply -var="db_password=TU_PASSWORD"
```

## Secrets requeridos en GitHub

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `DB_PASSWORD`
# Deploy Sun Mar 29 12:02:46 AM UTC 2026
