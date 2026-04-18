# Project Documentation Hub

This folder contains complete documentation for your Vercel Clone project.

## Contents

1. [Complete Documentation (All-in-One)](00-complete-documentation.md)
2. [Problem Statement](01-problem-statement.md)
3. [Solution and Architecture](02-solution-architecture.md)
4. [Tech Stack and Roles](03-tech-stack-and-roles.md)
5. [Project Workflow](04-project-workflow.md)
6. [Keyword Glossary (ECS, ECR, S3, Docker, etc.)](05-keyword-glossary.md)
7. [Implementation Summary (What You Built So Far)](06-implementation-summary.md)

## Quick Understanding

- Users submit a GitHub repository URL from your dashboard.
- API server queues a build job in AWS ECS Fargate.
- BuildServer container clones, builds, and uploads output to S3.
- Reverse proxy serves projects on wildcard subdomains.
- Logs stream in real time using Redis + Socket.IO.

## Related Main README

For complete project setup and run instructions, see the root [README](../README.md).
