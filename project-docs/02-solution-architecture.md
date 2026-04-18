# Solution and Architecture

## High-Level Solution

You designed a distributed deployment platform with separate services for:

1. User interface
2. Build orchestration
3. Build execution
4. Artifact hosting
5. Wildcard request routing
6. Real-time logs

This separation makes the platform scalable and easier to maintain.

## Architecture Components

### 1. Client Dashboard

- Location: client folder
- Role: Lets users enter GitHub URL + deployment name and trigger deployments.
- Shows build logs and live deployment URL.

### 2. API Server

- Location: api-server folder
- Role:
  1. Exposes deployment endpoint.
  2. Starts ECS task for each deployment.
  3. Subscribes to Redis log channels.
  4. Streams logs to browser through Socket.IO.

### 3. BuildServer Worker

- Location: BuildServer folder
- Role:
  1. Clones target repository.
  2. Detects project type.
  3. Runs build if required.
  4. Uploads generated output to S3.
  5. Publishes logs to Redis.

### 4. S3 Reverse Proxy

- Location: s3-reverse-proxy folder
- Role:
  1. Reads incoming subdomain.
  2. Maps subdomain to matching S3 output path.
  3. Serves project files through proxy.

### 5. AWS Services

- ECS Fargate runs isolated build containers.
- ECR stores BuildServer Docker images.
- S3 stores deployed static outputs.

### 6. Redis + Socket.IO

- Redis carries log events from BuildServer to API server.
- Socket.IO pushes those logs to the user dashboard in real time.

## Why This Works

1. Build execution is isolated from your main app.
2. Deployment artifacts are centralized in object storage.
3. Wildcard subdomain routing creates per-project URLs.
4. Real-time logs improve transparency and debugging.
