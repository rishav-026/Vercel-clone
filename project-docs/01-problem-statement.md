# Problem Statement

You wanted to build your own Vercel-like platform where:

1. Anyone can submit a frontend project repository.
2. The platform automatically builds and deploys that project.
3. The deployed app gets a unique live URL.
4. Users can see deployment logs in real time.
5. Both framework projects (React, Vite, CRA, etc.) and static projects (HTML/CSS/JS) should be supported.

## Core Challenges

1. Triggering build jobs safely and reliably.
2. Running untrusted project builds in isolated environments.
3. Handling multiple project types and output folders.
4. Storing deployment artifacts for fast serving.
5. Routing wildcard subdomains to the correct project output.
6. Providing a good developer UX with live logs and deployment status.
