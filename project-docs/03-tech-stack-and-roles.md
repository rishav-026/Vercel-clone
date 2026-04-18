# Tech Stack and Roles

## Frontend

1. React (client)
- Builds dashboard UI.
- Handles deployment form and status display.

2. Vite
- Fast frontend build/dev tooling for dashboard app.

3. Tailwind CSS
- Used for styling dashboard pages and components.

4. Socket.IO Client
- Receives real-time logs from API server.

## Backend

1. Node.js
- Runtime for API server, BuildServer scripts, and reverse proxy.

2. Express
- HTTP APIs for deployment trigger and log retrieval.

3. Socket.IO (Server)
- Real-time communication from API server to dashboard.

4. Redis (ioredis)
- Pub/Sub for cross-service log streaming.

## Build and Deployment

1. Docker
- Packages BuildServer in a consistent container image.

2. AWS ECR
- Stores versioned BuildServer container images.

3. AWS ECS Fargate
- Runs each deployment build task in an isolated container.

4. AWS S3
- Stores built output files for deployed projects.

5. http-proxy
- Reverse proxy layer to map wildcard domains to S3 outputs.

## Developer Tooling

1. npm
- Dependency management and build scripts.

2. Git/GitHub
- Source control, collaboration, and remote repository hosting.
