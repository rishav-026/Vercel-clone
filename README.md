
# Vercel Clone Platform

Deploy frontend repositories from GitHub to live subdomain URLs using an ECS-based build pipeline, S3 artifact hosting, and real-time dashboard logs.

---

## Table of Contents

1. [What This Project Is](#what-this-project-is)
2. [Core Features](#core-features)
3. [Architecture at a Glance](#architecture-at-a-glance)
4. [Repository Structure](#repository-structure)
5. [How Deployment Works (Runtime Flow)](#how-deployment-works-runtime-flow)
6. [Tech Stack](#tech-stack)
7. [Project Type Support](#project-type-support)
8. [Environment Configuration](#environment-configuration)
9. [Local Setup and Run](#local-setup-and-run)
10. [Production Deployment Blueprint](#production-deployment-blueprint)
11. [Troubleshooting Guide](#troubleshooting-guide)
12. [Security Notes](#security-notes)
13. [Documentation Index](#documentation-index)

---

## What This Project Is

This project is your own Vercel-style deployment platform where users can:

1. Submit frontend GitHub repositories.
2. Trigger cloud builds from a web dashboard.
3. View real-time build logs.
4. Access deployed apps through wildcard subdomains.

The platform separates frontend, orchestration, build execution, and hosting concerns into dedicated services for better scalability and maintainability.

---

## Core Features

1. Dashboard-based deployment trigger using repo URL and slug.
2. ECS Fargate task launch per deployment.
3. Automatic project type detection in BuildServer.
4. Real-time build logs through Redis Pub/Sub and Socket.IO.
5. S3-based static artifact storage.
6. Wildcard subdomain routing through reverse proxy.
7. Static website support including single-HTML fallback mapping.

---

## Architecture at a Glance

1. client
- Frontend dashboard to submit deployment requests and watch logs.

2. api-server
- Receives deployment request and starts ECS task.
- Subscribes to log channels and streams logs to browser.

3. BuildServer
- Clones repository, builds if needed, uploads output to S3.
- Publishes build logs to Redis channels.

4. s3-reverse-proxy
- Handles wildcard subdomain traffic.
- Resolves slug and serves matching S3 output path.

5. AWS services
- ECS Fargate for build task runtime.
- ECR for BuildServer image versions.
- S3 for deployed artifact storage.

![image](https://github.com/rishav-026/Vercel-clone/blob/main/Screenshot%202026-04-18%20105746.png)


---


![image](https://github.com/rishav-026/Vercel-clone/blob/main/Screenshot%202026-04-18%20105334.png)

---

## How Deployment Works (Runtime Flow)

1. User enters GitHub URL and optional slug in dashboard.
2. Frontend sends deployment request to API.
3. API invokes ECS RunTask with repository URL and project ID.
4. BuildServer task starts in Fargate container.
5. BuildServer clones repository to output directory.
6. BuildServer detects project type and build strategy.
7. BuildServer runs build when required.
8. Build output uploads to S3 under project slug path.
9. Build logs publish to Redis channel logs:<slug>.
10. API receives logs and emits to dashboard via Socket.IO.
11. User accesses deployment at slug.base-domain.
12. Reverse proxy routes request to proper S3 output path.

---

## Tech Stack

## Frontend

1. React
2. Vite
3. Tailwind CSS
4. Socket.IO Client

## Backend and Runtime

1. Node.js
2. Express
3. Socket.IO
4. ioredis
5. http-proxy

## Cloud and DevOps

1. Docker
2. AWS ECR
3. AWS ECS Fargate
4. AWS S3

---

![image](https://github.com/rishav-026/Vercel-clone/blob/main/_-%20visual%20selection%20(2).png)


---
## Project Type Support

Supported project styles include:

1. Static root index
- index.html at repository root

2. Static public index
- public/index.html

3. Static single HTML fallback
- Exactly one HTML file in root/public can be mapped to index.html automatically

4. Framework builds
- Vite
- CRA (react-scripts)
- Next static export pattern
- Generic package.json build script pattern

---

## Environment Configuration

## API and Build Orchestration

Important variables include:

1. REDIS_URL
2. AWS_ACCESS_KEY_ID
3. AWS_SECRET_ACCESS_KEY
4. AWS_REGION
5. ECS_CLUSTER_ARN
6. ECS_TASK_DEFINITION
7. BUILDER_CONTAINER_NAME
8. PROJECT_PROTOCOL
9. PROJECT_BASE_DOMAIN

## Client

Typical variables include:

1. VITE_API_URL
2. VITE_SOCKET_URL
3. VITE_PROJECT_PROTOCOL
4. VITE_PROJECT_BASE_DOMAIN

---

## Local Setup and Run

1. Install dependencies for each service.
2. Configure environment variables.
3. Start API server.
4. Start reverse proxy.
5. Start client app.
6. Ensure cloud and Redis access are valid.

---

## Production Deployment Blueprint

1. Provision DNS with wildcard subdomain support.
2. Place services behind Nginx or Caddy.
3. Enable HTTPS for root, API, WS, and wildcard domains.
4. Push BuildServer image to ECR.
5. Update ECS task definition revision.
6. Ensure API uses latest task definition.
7. Add monitoring, logging, and restart strategy.

---

## Troubleshooting Guide

1. Failed to fetch in dashboard
- API server not reachable, crashed, or wrong URL.

2. Build fails with missing script: build
- Project has no build script and was detected as build-based.
- Use static entry or add proper package build script.

3. ERR_OSSL_EVP_UNSUPPORTED for old CRA projects
- Legacy webpack/react-scripts with modern Node OpenSSL behavior.

4. Deployment URL not opening publicly
- DNS wildcard or HTTPS reverse-proxy routing not correctly configured.

---

## Security Notes

1. Never commit cloud or Redis secrets.
2. Rotate credentials if exposed.
3. Add authentication and authorization for deployment endpoint.
4. Add rate limiting and input validation.
5. Use role-based cloud credentials where possible.

---

## Documentation Index

Detailed docs are available in project-docs:

1. [Complete Documentation](project-docs/00-complete-documentation.md)
2. [Problem Statement](project-docs/01-problem-statement.md)
3. [Solution and Architecture](project-docs/02-solution-architecture.md)
4. [Tech Stack and Roles](project-docs/03-tech-stack-and-roles.md)
5. [Project Workflow](project-docs/04-project-workflow.md)
6. [Keyword Glossary](project-docs/05-keyword-glossary.md)
7. [Implementation Summary](project-docs/06-implementation-summary.md)


