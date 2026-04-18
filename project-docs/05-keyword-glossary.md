# Keyword Glossary and Roles in Your Project

## ECS (Elastic Container Service)

What it is:
- AWS service to run containers at scale.

Role in your project:
- Runs each deployment build as an isolated Fargate task.
- Prevents your API server from doing heavy build work directly.

## Fargate

What it is:
- Serverless compute engine for ECS containers.

Role in your project:
- Executes BuildServer tasks without managing EC2 instances.

## ECR (Elastic Container Registry)

What it is:
- AWS Docker image registry.

Role in your project:
- Stores BuildServer image versions.
- ECS pulls BuildServer image from ECR.

## S3 (Simple Storage Service)

What it is:
- Object storage service.

Role in your project:
- Stores deployed static files for each project slug.
- Source of truth for hosted deployment assets.

## Docker

What it is:
- Containerization technology.

Role in your project:
- Packages BuildServer runtime, dependencies, and scripts into one reproducible image.

## Redis

What it is:
- In-memory data store with Pub/Sub.

Role in your project:
- Carries live build logs from BuildServer to API server.

## Socket.IO

What it is:
- Real-time bidirectional communication library.

Role in your project:
- Pushes live logs to browser clients.

## Reverse Proxy

What it is:
- A server that forwards incoming requests to target backends.

Role in your project:
- Maps project subdomain requests to correct S3 output path.

## Wildcard Domain

What it is:
- DNS record like *.rishavapp.xyz.

Role in your project:
- Enables each deployed slug to be accessible via its own subdomain.

## CI/CD (Conceptual)

What it is:
- Continuous integration and deployment automation.

Role in your project:
- Your platform behaves like mini-CD by automatically building and publishing user projects.
