<!-- © 2024 | Ironhack -->

---

# Multi-Stack Voting Application

**Welcome to your DevOps practice project!** This repository hosts a multi-stack voting application composed of several services, each implemented in a different language and technology stack. The goal is to help you gain experience with containerization, orchestration, and running a distributed set of services—both individually and as part of a unified system.

This application, while simple, uses multiple components commonly found in modern distributed architectures, giving you hands-on practice in connecting services, handling containers, and working with basic infrastructure automation.

## Application Overview

The voting application includes:

- **Vote (Python)**: A Python Flask-based web application where users can vote between two options.
- **Redis (in-memory queue)**: Collects incoming votes and temporarily stores them.
- **Worker (.NET)**: A .NET 7.0-based service that consumes votes from Redis and persists them into a database.
- **Postgres (Database)**: Stores votes for long-term persistence.
- **Result (Node.js)**: A Node.js/Express web application that displays the vote counts in real time.

### Why This Setup?

The goal is to introduce you to a variety of languages, tools, and frameworks in one place. This is **not** a perfect production design. Instead, it’s intentionally diverse to help you:

- Work with multiple runtimes and languages (Python, Node.js, .NET).
- Interact with services like Redis and Postgres.
- Containerize applications using Docker.
- Use Docker Compose to orchestrate and manage multiple services together.

By dealing with this “messy” environment, you’ll build real-world problem-solving skills. After this project, you should feel more confident tackling more complex deployments and troubleshooting issues in containerized, multi-service setups.

---

## How to Run Each Component
### Prerequisites: 
You must have Python, Node.js, and .NET SDK installed locally.

### Running the Vote Service (Python/Flask) Locally (No Docker)

1. Ensure you have Python 3.10+ installed.
2. Navigate to the `vote` directory:
   ```bash
   cd vote
   pip install -r requirements.txt
   python app.py
   ```
   Access the vote interface at [http://localhost:5000](http://localhost:5000). Check app.py for the port

### Running Redis Locally (No Docker)

1. Install Redis on your system ([https://redis.io/docs/getting-started/](https://redis.io/docs/getting-started/)) or use Docker: redis-server (if installed locally).
2. Start Redis:
   ```bash
   redis-server
   ```
   By default, Redis runs on `localhost:6379`.

### Running the Worker (C#/.NET) Locally (No Docker)

1. Ensure .NET 7.0 SDK is installed.
2. Navigate to `worker` directory. Run `dotnet build` and then `dotnet run` to start the worker service.
   ```bash
   cd worker
   dotnet restore
   dotnet run
   ```
   The worker expects a running Redis and PostgreSQL instance to function correctly. Without them, it will likely fail to connect or idle while waiting.

### Running Postgres Locally (No Docker)

1. Install Postgres (via package manager or GUI tools) and ensure it’s running on default port 5432.
   See [https://www.postgresql.org/download/](https://www.postgresql.org/download/).
2. Connect to Postgres and and configure credentials as needed,note the username and password (default `postgres`/`postgres`):
  ```bash
    psql -U postgres
    \l
  ```

3. Create database names "votes".
  ```bash
   CREATE DATABASE votes
   \l
  \q 
  ```

   ```bash
   # On many systems, Postgres runs as a service once installed.
   ```
   Postgres will be available at `localhost:5432`.

### Running the Result Service (Node.js/Express) Locally (No Docker)

1. Ensure Node.js 18+ is installed.
2. Install dependencies: npm ci (uses package-lock.json)
3. Navigate to `result` directory:
   ```bash
   cd result
   npm install
   node server.js
   ```
   Run the application: node server.js
   By default, it may run on http://localhost:80 (check server.js for port or environment variable).

**Note:** To get the entire system working end-to-end (i.e., votes flowing through Redis, processed by the worker, stored in Postgres, and displayed by the result app), you’ll need to ensure each component is running and that connection strings or environment variables point to the correct services.

---

## Running the Entire Stack in Docker

### Building and Running Individual Services

You can build each service with Docker and run them individually:

- **Vote (Python)**:
  ```bash
  docker build -t myorg/vote:latest ./vote
  docker run --name vote -p 8080:80 myorg/vote:latest
  ```
  Visit [http://localhost:8080](http://localhost:8080).

- **Redis** (official image, no build needed):
  ```bash
  docker run --name redis -p 6379:6379 redis:alpine
  ```

- **Worker (.NET)**:
  ```bash
  docker build -t myorg/worker:latest ./worker
  docker run --name worker myorg/worker:latest
  ```
  
- **Postgres**:
  ```bash
  docker run --name db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:15-alpine
  ```

- **Result (Node.js)**:
  ```bash
  docker build -t myorg/result:latest ./result
  docker run --name result -p 8081:80 myorg/result:latest
  ```
  Visit [http://localhost:8081](http://localhost:8081).

### Using Docker Compose

The easiest way to run the entire stack is via Docker Compose. From the project root directory:

```bash
docker compose up
```

This will:

- Build and run the vote, worker, and result services.
- Run Redis and Postgres from their official images.
- Set up networks, volumes, and environment variables so all services can communicate.

Visit [http://localhost:8080](http://localhost:8080) to vote and [http://localhost:8081](http://localhost:8081) to see results.

---

## Notes on Platforms (arm64 vs amd64)

If you’re on an arm64 machine (e.g., Apple Silicon M1/M2) and encounter issues with images or dependencies that assume amd64, you can use Docker `buildx`:

```bash
docker buildx build --platform linux/amd64 -t myorg/worker:latest ./worker
```

This ensures the image is built for the desired platform.

---
