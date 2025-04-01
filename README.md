# CI/CD for a Multistack Voting Application with Amazon EKS
Deploy the [multi-stack Voting App](https://github.com/Pokfinner/ironhack-project-1) (Python vote, Node.js result, .NET worker, Redis, and PostgreSQL microservices) to Amazon EKS (Kubernetes) cluster.  Set up a CI/CD pipeline using GitHub Actions to build and deploy the microservices automatically.

## Overview

- **Goal #1:** Provision an EKS Cluster (using `eksctl` or Terraform if you prefer). Ensure your environment is secure and scalable.
- **Goal #2:** Containerize and deploy the microservices (vote, result, worker, Redis, Postgres) onto EKS with Kubernetes manifests.
- **Goal #3:** Use **NGINX Ingress** (deployed via Helm) to route external HTTP(S) traffic to the right microservice paths.
- **Goal #4:** Create a **GitHub Actions CI/CD pipeline** that:
    - Builds Docker images for each microservice.
    - Pushes them to your container registry (e.g., Docker Hub).
    - Deploys (or updates) the Kubernetes manifests on EKS automatically.

By the end, you'll have a fully containerized, Kubernetes-based architecture with an automated build and deploy pipeline.


## Prerequisites
Before starting, make sure you have these in place:

1. **AWS CLI** installed and configured with credentials that allow creating EKS clusters, ECR repositories (if you use ECR), and other resources in AWS.
2. **eksctl** installed to create and manage EKS clusters. ([https://eksctl.io/](https://eksctl.io/))
3. **kubectl** installed to interact with the EKS cluster once it's created.
4. **Helm** installed for managing Kubernetes packages (like the ingress-nginx controller).
5. **GitHub repository** containing:
    - Your microservices source code (vote, result, worker, etc.).
    - Dockerfiles for each microservice.
    - A `.github/workflows` folder for GitHub Actions CI/CD definitions.
6. **Container Registry** credentials (Docker Hub, Amazon ECR, etc.) to store images.

---

## 1. Creating an EKS Cluster
A quick way to create an EKS cluster is with `eksctl`. Example:

```bash
eksctl create cluster \
  --name multistack-eks-project \
  --region ca-west-1 \
  --nodegroup-name primary-nodes \
  --node-type t3.medium \
  --nodes 3

```
When the command finishes:

- Check that your cluster is created: `eksctl get cluster`
- Check `kubectl get nodes` to ensure you have ready worker nodes. (eksctl usually configures your `~/.kube/config` automatically.)
- check if kubectl is pointing to the right cluster: ```kubectl config current-context``` </br>
If not, run the following:
```
kubectl config get-contexts
kubectl config use-context <your-eks-cluster-context>
```

## 2. Creating & Managing Secrets
You will likely have credentials (e.g., database passwords, Redis passwords if any). Store these as **Kubernetes Secrets** so they're not exposed in plaintext within your manifests.

Example:

```bash
kubectl create secret generic db-credentials \
  --from-literal=postgres-username=postgres \
  --from-literal=postgres-password=someSecurePassword

```
```kubectl get secrets```
```

Then in your microservice Deployment manifests, you can reference them like this:

```yaml
env:
  - name: POSTGRES_USER
    valueFrom:
      secretKeyRef:
        name: db-credentials
        key: postgres-username
  - name: POSTGRES_PASSWORD
    valueFrom:
      secretKeyRef:
        name: db-credentials
        key: postgres-password

```

This approach ensures your sensitive info remains outside the manifest in a more secure manner.

## 3. Deploying Redis & Postgres
You can deploy Redis and Postgres in multiple ways:

- **Deployments + Services** (simple approach)
- **StatefulSets** + **Persistent Volumes** (more advanced, especially for Postgres data persistence)
- **Helm Charts** (e.g., Bitnami's official charts for Redis, Postgres)

You can use a simple approach for Postgres, or opt for a **StatefulSet** if you need stable hostnames and volumes. (This is particularly important when data persistence is a priority.)

## 4. Deploying the vote, result, and worker Microservices
Create separate Deployment and Service YAML files for each microservice.
**Important:**

The microservices communicate using service DNS names (e.g., `redis-service.default.svc.cluster.local` or simply `redis-service` within the same namespace). This means no hardcoded IP addresses!

Repeat similar patterns for the result and worker services.

For the **worker**, you’ll also specify environment variables for both Redis and Postgres:

```yaml
env:
  - name: REDIS_HOST
    value: "redis-service"
  - name: POSTGRES_HOST
    value: "postgres-service"
  - name: POSTGRES_USER
    valueFrom:
      secretKeyRef:
        name: db-credentials
        key: POSTGRES_USER
  - name: POSTGRES_PASSWORD
    valueFrom:
      secretKeyRef:
        name: db-credentials
        key: POSTGRES_PASSWORD

```

## 5. Installing NGINX Ingress with Helm
We use the NGINX Ingress Controller to route external traffic into our cluster.

**Steps:**

1. **Add the Ingress NGINX Helm repo:**
    
    ```bash
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo update
    
    ```
    
2. **Install the Ingress Controller:**
    
    ```bash
    helm install my-nginx ingress-nginx/ingress-nginx \
      --namespace ingress-nginx --create-namespace
    
    ```
    
3. **Verify the installation:**
    
    ```bash
    kubectl get pods -n ingress-nginx
    
    ```
    
## 6. Ingress Resource and Routing Explanations
In a Kubernetes Ingress, each **path** you specify defines how external requests are routed to the correct backend Service. Here's why this is important for our project:

- **`/` and `/vote`:**
    
    The Flask vote app handles both the root URL (`/`) and `/vote`. Defining these paths ensures that users accessing the main page or the voting page get directed to the vote service.
    
- **`/static`:**
    
    Your vote app serves CSS and other static assets from the `/static` directory. Without an explicit rule for this path, the browser’s requests for static files would result in 404 errors.
    
- **`/result`:**
    
    The Node.js result service manages the result page and its associated Socket.IO endpoint (e.g., `/result/socket.io`). Including this path guarantees that traffic for the results page is properly routed.

## 7. Setting Up CI/CD with GitHub Actions
Create `.github/workflows` folder and add continous integration and continous deployment workflows using YAML file(s).

## 8. Verification
Once pipeline(s) runs successfully, confirm:

- **All Deployments and Pods are running:**
    
    ```bash
    kubectl get deployments
    kubectl get pods
    
    ```
    
- **The NGINX Ingress has an external IP or DNS address:**
    
    ```bash
    kubectl get ingress
    
    ```
    
- **Access the apps:**
    - `http://<INGRESS_IP>/vote` for the vote app.
    - `http://<INGRESS_IP>/result` for the result app.

- **Test the flow:**
Cast votes and observe them flowing from the vote app → Redis → worker → Postgres → result app.

## 9. Conclusion
By following these steps, you'll have:

- A secure and scalable **EKS Cluster** orchestrating your containers.
- **NGINX Ingress** providing a single entry point for your microservices.
- A **CI/CD pipeline** powered by GitHub Actions, automatically building and deploying new versions.
- Service discovery within Kubernetes (using DNS names rather than IPs).

## Further Enhancements

- Auto-scaling your Deployments (using Horizontal Pod Autoscaler, HPA).
- Using advanced features in Helm to manage all your microservices with one chart.
- Integrating secrets with AWS Secret Manager or other secret backends.
- Configuring HTTPS with certificates on NGINX Ingress using Cert-Manager.

**Extra Note on StatefulSets for Redis and Postgres:**

Although using a simple Deployment approach is sufficient for many scenarios, you can opt to run both **Postgres** and **Redis** using **StatefulSets** if you need persistent storage and stable network identities. StatefulSets help ensure each Pod has a unique, stable hostname and can retain data consistently across restarts or node rescheduling. This is especially useful for databases or any service that benefits from consistent storage volumes.
