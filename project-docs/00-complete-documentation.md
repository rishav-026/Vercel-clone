# Complete Project Documentation

## 1. Project Overview

This project is a custom Vercel-like deployment platform built to let users deploy frontend repositories from GitHub and access them via subdomain-based live URLs.

The core product experience is:

1. User submits a repository URL.
2. Platform builds the project in an isolated environment.
3. Build output is uploaded to object storage.
4. User gets a live deployment URL.
5. User can watch real-time build logs in the dashboard.

---

## 2. Problem Statement

You wanted to build a platform where anyone can deploy frontend projects through your website.

### Functional Goals

1. Accept user GitHub repo URLs from a dashboard.
2. Deploy both framework-based and static projects.
3. Generate per-project live links.
4. Show real-time logs to users.
5. Serve deployments from your own domain.

### Technical Challenges

1. Build isolation for safety and scalability.
2. Project type detection for multiple frameworks.
3. Artifact storage and reliable hosting.
4. Wildcard subdomain routing.
5. Real-time status/log visibility.
6. Production deployment and domain management.

---

## 3. Solution Design

You implemented a multi-service architecture so each responsibility is separated and easier to scale.

### Major Services

1. Client Dashboard
2. API Server
3. BuildServer Worker
4. S3 Reverse Proxy
5. Redis-based log bus
6. AWS cloud services (ECS, ECR, S3)

### Why This Design Is Good

1. Build tasks do not block API responsiveness.
2. Containers keep build execution isolated.
3. Storage and serving are separated from build compute.
4. Logs are streamed asynchronously for better UX.
5. Each service can be independently improved.

---

## 4. Architecture Breakdown

### 4.1 Client Dashboard (React)

Role:

1. Collect deployment input (repo URL and optional slug).
2. Trigger deployment requests.
3. Display deployment stage, logs, and final URL.

Location:

- client

### 4.2 API Server (Node + Express + Socket.IO)

Role:

1. Expose deployment endpoint.
2. Start ECS task per deployment request.
3. Read build logs from Redis channels.
4. Broadcast logs to browser through Socket.IO.

Location:

- api-server

### 4.3 BuildServer Worker (Node in Docker)

Role:

1. Clone repository from GitHub.
2. Detect project type and build strategy.
3. Execute build only when required.
4. Upload output files to S3.
5. Publish status logs to Redis.

Location:

- BuildServer

### 4.4 Reverse Proxy (Node + http-proxy)

Role:

1. Read request hostname/subdomain.
2. Resolve project slug from subdomain.
3. Route request to the correct S3 output path.

Location:

- s3-reverse-proxy

### 4.5 Redis and Socket.IO

Role:

1. Redis Pub/Sub carries logs from worker to API server.
2. Socket.IO pushes logs to connected clients in real time.

---

## 5. Tech Stack and Responsibilities

## Frontend Layer

1. React
- Dashboard UI and interaction logic.

2. Vite
- Fast dev server and build pipeline for dashboard.

3. Tailwind CSS
- Utility-first styling for UI screens.

4. Socket.IO Client
- Realtime log subscription in browser.

## Backend Layer

1. Node.js
- Runtime for API server, BuildServer scripts, and reverse proxy.

2. Express
- API routing and HTTP middleware.

3. Socket.IO Server
- Live event bridge from backend to frontend.

4. ioredis
- Redis integration for Pub/Sub log channels.

## Cloud and Deployment Layer

1. Docker
- BuildServer container packaging.

2. AWS ECR
- Image registry for BuildServer versions.

3. AWS ECS Fargate
- On-demand isolated build execution.

4. AWS S3
- Deployment artifact storage.

5. http-proxy
- Dynamic routing for wildcard deployment domains.

## Dev Tooling

1. npm
- Package installation and scripts.

2. Git + GitHub
- Source control and collaboration.

---

## 6. End-to-End Workflow

This is the full runtime flow from user action to live site.

1. User enters GitHub URL and slug in dashboard.
2. Client sends POST request to API deployment endpoint.
3. API server validates payload and starts ECS task.
4. ECS launches BuildServer container.
5. BuildServer clones the repository.
6. BuildServer detects project type:
- Static root index
- Static public index
- Static single HTML fallback mapping
- Framework projects (Vite, CRA, Next, generic build)
7. BuildServer runs install/build only when required.
8. Build output files are uploaded to S3 path:
- __outputs/<project-slug>/...
9. BuildServer publishes logs to Redis channel:
- logs:<project-slug>
10. API server subscribes and receives logs.
11. API server sends logs to dashboard through Socket.IO.
12. User opens deployment URL:
- https://<project-slug>.<base-domain>
13. Reverse proxy resolves subdomain and serves files from matching S3 output path.

---

## 7. Keywords and Their Roles in Your Project

## ECS

Meaning:
- Elastic Container Service.

Role:
- Runs build tasks for each deployment request.

## Fargate

Meaning:
- Serverless compute mode for ECS.

Role:
- Executes containers without managing EC2 hosts.

## ECR

Meaning:
- Elastic Container Registry.

Role:
- Stores BuildServer Docker images.

## S3

Meaning:
- Object storage service.

Role:
- Stores built artifacts per project slug.

## Docker

Meaning:
- Container packaging system.

Role:
- Makes BuildServer reproducible across environments.

## Redis

Meaning:
- In-memory data store with Pub/Sub support.

Role:
- Carries live build log messages.

## Socket.IO

Meaning:
- Realtime communication framework.

Role:
- Streams logs from backend to frontend.

## Wildcard Domain

Meaning:
- DNS pattern like *.rishavapp.xyz.

Role:
- Enables automatic per-slug URLs.

## Reverse Proxy

Meaning:
- Request router in front of target resources.

Role:
- Maps slug subdomains to S3 output path.

## CI/CD (conceptual mapping)

Meaning:
- Automation of build/deploy lifecycle.

Role in this project:
- Your app behaves as a mini deployment platform where each request triggers build + publish pipeline.

---

## 8. What You Have Implemented So Far

## Delivered Features

1. Dashboard deployment form with slug preview.
2. Deployment queue through ECS RunTask.
3. Live build logs in dashboard.
4. S3 upload pipeline for build outputs.
5. Wildcard subdomain routing layer.
6. Static site support for:
- index.html in root
- public/index.html
- single non-index HTML file mapped to index.html

## Improvements Added During Development

1. Better static detection.
2. Better failure messages for missing entry files.
3. Domain-based URL generation.
4. Repository hygiene improvements.

---

## 9. Production Readiness Checklist

1. Security
- Add authentication and authorization for deployment API.
- Rotate exposed credentials and move to secret manager.
- Add input validation and deployment rate limits.

2. Reliability
- Add monitoring, health checks, and alerting.
- Add retry handling for transient cloud failures.

3. Scalability
- Add queue controls and per-user quotas.
- Track task states and deployment history in database.

4. Compatibility
- Improve legacy framework handling for older react-scripts/webpack projects.

5. Operations
- Version BuildServer images in ECR.
- Use explicit ECS task definition revisions.

---

## 10. Folder Map

- api-server: deployment API, ECS trigger, logs fan-out
- BuildServer: clone/build/upload worker logic
- client: deployment dashboard and log viewer
- s3-reverse-proxy: wildcard subdomain router
- project-docs: documentation set

---

## 11. Suggested Next Milestones

1. Add user accounts and project ownership.
2. Add deployment history dashboard.
3. Add rollback to previous successful deployment.
4. Add custom domains per user project.
5. Add CI automation for platform deployment.

---

## 12. One-Line Summary

You built a working Vercel-style deployment platform that accepts frontend repos, builds them in isolated cloud tasks, stores outputs in S3, and serves them on wildcard subdomains with real-time logs.
