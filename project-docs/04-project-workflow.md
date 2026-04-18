# Project Workflow

This is what happens when a user deploys a project:

## Step-by-Step Runtime Flow

1. User opens dashboard and submits:
- GitHub repository URL
- Optional deployment slug/name

2. Client sends request to API:
- POST /project

3. API server queues build in ECS:
- Calls RunTask with environment variables:
  - GIT_REPOSITORY__URL
  - PROJECT_ID (slug)

4. ECS starts BuildServer container.

5. BuildServer does:
1. Clone repository into output directory.
2. Detect project type:
   - Static (index.html or public/index.html)
   - Single HTML fallback mapping
   - Vite/CRA/Next/other build-based projects
3. Run build command if needed.
4. Upload output files to S3 path:
   - __outputs/<project-slug>/...
5. Publish logs to Redis channel:
   - logs:<project-slug>

6. API server receives logs from Redis Pub/Sub.

7. API server emits logs via Socket.IO to client dashboard.

8. User can access deployed project URL:
- https://<project-slug>.<base-domain>

9. Reverse proxy receives wildcard request and:
1. Extracts subdomain (project slug).
2. Maps it to S3 output path.
3. Proxies asset/html requests.

## Operational Flow for Platform Owner

1. Update BuildServer code.
2. Build and push Docker image to ECR.
3. Update ECS task definition revision.
4. API triggers new revision for next deployments.
