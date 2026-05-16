# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Gestión de la Demanda** — A cloud-native PoC for demand/project management with JIRA integration, deployed on AWS.

## Development Commands

### Local Development (full stack)
```bash
docker-compose up --build
```
- Backend runs on `:3001`
- Lambda mock (JIRA simulator) runs on `:3002`
- PostgreSQL starts automatically

### Backend (Node.js/Express)
```bash
cd backend
npm run dev      # development with nodemon auto-reload
npm start        # production
```

### Frontend (React)
```bash
cd frontend
npm start        # dev server
npm run build    # production build
npm test -- --watchAll=false  # run tests once (no watch mode)
```

### Infrastructure (Terraform)
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## Architecture

Three-tier architecture: **React SPA → Express API → PostgreSQL**, deployed fully on AWS.

```
React (S3 + CloudFront)
        ↓
Express Backend (ECS/Fargate, Port 3001)
        ↓                   ↓
PostgreSQL (RDS)     Lambda Mock (JIRA simulator)
```

### Components

**`frontend/`** — React 18 SPA with inline styles (no CSS files/Tailwind). Uses `useState`/`useEffect`. Reads two env vars at build time: `REACT_APP_LAMBDA_URL` and `REACT_APP_API_URL`. The 4 tabs are Dashboard (KPIs/charts via Recharts), Demandas (table + sync button), Sync Log, and Arquitectura.

**`backend/src/index.js`** — Single-file Express server. Auto-initializes DB schema on startup. Key endpoints:
- `GET /api/demandas` — reads from PostgreSQL
- `POST /api/demandas/sync` — calls Lambda → upserts results into PostgreSQL
- `GET /api/stats` — aggregated counts/totals
- `GET /health`

Uses `pg` connection pool. `LAMBDA_URL` defaults to `http://lambda-mock:3002` (Docker service name).

**`lambda/index.js`** — Simulates a JIRA webhook. Returns hardcoded project list. Deployed as AWS Lambda with public HTTP endpoint.

**`terraform/main.tf`** — Single file managing all AWS resources: Lambda, ECR, ECS cluster, RDS (PostgreSQL), S3 bucket, CloudFront distribution. Uses `local.prefix = "demanda-${var.environment}"` as naming convention throughout.

### Data Sync Flow

1. Frontend calls `POST /api/demandas/sync`
2. Backend fetches `GET ${LAMBDA_URL}?action=list`
3. Lambda returns `{ issues: [...] }`
4. Backend upserts via `INSERT ... ON CONFLICT (jira_key) DO UPDATE`

### Database

Single RDS instance with per-environment databases (`demanda_dev`, `demanda_qa`, `demanda_prod`). Table: `demandas` with `jira_key` as unique key (used for idempotent upserts).

## CI/CD (GitHub Actions — `.github/workflows/ci-cd.yml`)

Branch → environment mapping:
- `main` → **prod** (requires manual approval)
- `release/**` → **qa**
- `develop` / other → **dev**

Pipeline: Terraform validate/plan/apply → Docker build → push to ECR → ECS deploy → S3 sync → CloudFront invalidation.

Uses OIDC for AWS auth (no static credentials stored). Required GitHub secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `DB_PASSWORD`, and per-environment `REACT_APP_API_URL`.

Backend images are tagged by commit SHA; the pipeline checks if an image already exists in ECR before rebuilding (redeploy optimization). Frontend is deployed with `aws s3 sync --delete` (full replacement).

## Environment Variables

| Variable | Component | Description |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Backend | PostgreSQL connection |
| `LAMBDA_URL` | Backend | JIRA Lambda endpoint (default: `http://lambda-mock:3002`) |
| `REACT_APP_LAMBDA_URL` | Frontend (build-time) | Lambda endpoint for direct calls |
| `REACT_APP_API_URL` | Frontend (build-time) | Backend API URL |
| `REACT_APP_ENV` | Frontend (build-time) | Environment label (dev/qa/prod) |
