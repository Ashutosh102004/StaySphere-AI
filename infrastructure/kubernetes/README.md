# Kubernetes Deployment Guide

This directory contains production-ready Kubernetes manifests for STAYSPHERE AI.

## Prerequisites

- Kubernetes cluster 1.24+ (EKS, GKE, AKS, or self-hosted)
- `kubectl` configured and authenticated
- Container images pushed to a registry (Docker Hub, ECR, GCR, ACR)
- `cert-manager` (optional, for automatic SSL)
- `nginx-ingress` controller (for Ingress)

## Quick Start

### 1. Create Secrets

**Important:** Never commit real secrets to git.

```bash
# Create secret from template
cp 01-secrets.yaml.template 01-secrets.yaml

# Edit with actual values
nano 01-secrets.yaml

# Generate secure JWT secrets (if needed)
openssl rand -base64 32

# Apply secret
kubectl apply -f 01-secrets.yaml
```

### 2. Deploy All Resources

```bash
# Deploy in order
kubectl apply -f 00-namespace-configmap.yaml
kubectl apply -f 01-secrets.yaml  # After editing
kubectl apply -f 02-mongodb.yaml
kubectl apply -f 03-redis.yaml
kubectl apply -f 04-api.yaml
kubectl apply -f 05-web.yaml
kubectl apply -f 06-ingress.yaml
kubectl apply -f 07-hpa.yaml
kubectl apply -f 08-network-policy.yaml
kubectl apply -f 09-rbac.yaml

# Or deploy all at once (manifests are numbered for dependency order)
kubectl apply -f .
```

### 3. Verify Deployment

```bash
# Check namespace
kubectl get namespace staysphere

# Check all resources
kubectl get all -n staysphere

# Check pods status
kubectl get pods -n staysphere -w

# Check services
kubectl get svc -n staysphere

# Check ingress
kubectl get ingress -n staysphere

# View logs
kubectl logs -n staysphere deployment/api
kubectl logs -n staysphere deployment/web

# Port forward for testing
kubectl port-forward -n staysphere svc/api-service 5000:5000
kubectl port-forward -n staysphere svc/web-service 8080:80
```

## Configuration

### ConfigMap (`00-namespace-configmap.yaml`)

Non-secret configuration values:
- Database hosts/ports
- API URLs
- Environment mode (production)
- Expiration times

**Update for your environment:**
- `CLIENT_URL`: Your frontend domain
- `VITE_API_URL`: Your API domain
- Any other deployment-specific settings

### Secrets (`01-secrets.yaml.template`)

**Required secrets (edit before deploying):**

1. **JWT Secrets** (CRITICAL)
   ```bash
   openssl rand -base64 32
   ```

2. **Database Credentials**
   - MONGODB_USER: Username for MongoDB
   - MONGODB_PASSWORD: Strong password
   - MONGODB_ROOT_PASSWORD: Root password

3. **Payment Gateway** (if using Razorpay)
   - RAZORPAY_KEY_ID
   - RAZORPAY_KEY_SECRET
   - RAZORPAY_WEBHOOK_SECRET

4. **AI Provider**
   - AI_API_KEY: Your API key for Claude/AI provider

5. **Third-party Integrations**
   - IDENTITY_PROVIDER_KEY: KYC provider credentials
   - IDENTITY_WEBHOOK_SECRET: Webhook secret

## Manifest Overview

| File | Purpose | Resources |
|------|---------|-----------|
| `00-namespace-configmap.yaml` | Namespace and configuration | Namespace, ConfigMap |
| `01-secrets.yaml.template` | Sensitive data template | Secret |
| `02-mongodb.yaml` | Database | StatefulSet, Service, PVC |
| `03-redis.yaml` | Cache layer | Deployment, Service |
| `04-api.yaml` | Backend API | Deployment, Service |
| `05-web.yaml` | Frontend (React/Vite) | Deployment, Service |
| `06-ingress.yaml` | Routing layer | Ingress |
| `07-hpa.yaml` | Auto-scaling | HorizontalPodAutoscaler |
| `08-network-policy.yaml` | Network security | NetworkPolicy |
| `09-rbac.yaml` | Access control | ServiceAccount, Role, RoleBinding |

## Production Customization

### 1. Image Registry

Replace placeholder image names:

```bash
# Update image in 04-api.yaml and 05-web.yaml
# Replace: staysphere/api:latest → your-registry/staysphere-api:v1.0.0
# Replace: staysphere/web:latest → your-registry/staysphere-web:v1.0.0

sed -i 's|staysphere/api:latest|your-registry/staysphere-api:v1.0.0|g' 04-api.yaml
sed -i 's|staysphere/web:latest|your-registry/staysphere-web:v1.0.0|g' 05-web.yaml
```

### 2. Ingress Configuration

Update domain names in `06-ingress.yaml`:

```yaml
# Replace staysphere.example.com with your domain
- host: your-domain.com
  http:
    paths:
      - path: /
        backend:
          service:
            name: web-service
```

### 3. SSL/TLS

Enable HTTPS in Ingress:

```yaml
tls:
  - hosts:
      - your-domain.com
    secretName: your-domain-tls
  # For cert-manager:
  # annotations:
  #   cert-manager.io/cluster-issuer: letsencrypt-prod
```

### 4. Replicas

Adjust replica counts in Deployments:
- Increase for high traffic: `replicas: 5`
- Decrease for cost savings: `replicas: 1`

### 5. Resource Limits

Adjust CPU/memory based on your workload:

```yaml
resources:
  requests:
    cpu: 250m        # Guaranteed
    memory: 512Mi
  limits:
    cpu: 1000m       # Maximum allowed
    memory: 1Gi
```

### 6. Storage

MongoDB uses 20Gi PVC. Adjust in `02-mongodb.yaml`:

```yaml
resources:
  requests:
    storage: 50Gi    # For more data
```

## Scaling

### Horizontal Pod Autoscaling

Configured in `07-hpa.yaml`:

- **API**: Scales 2-10 replicas based on 70% CPU or 80% memory
- **Web**: Scales 2-5 replicas based on 75% CPU or 85% memory

Adjust thresholds based on performance requirements.

### Vertical Pod Autoscaling (Optional)

For automatic resource recommendation:

```bash
kubectl apply -f https://github.com/kubernetes/autoscaler/releases/download/vertical-pod-autoscaler-0.14.0/vpa-v0.14.0.yaml
```

## Backup & Disaster Recovery

### MongoDB Backup

```bash
# Create backup
kubectl exec -n staysphere mongodb-0 -- mongodump --authenticationDatabase admin -o /backup

# Restore backup
kubectl exec -n staysphere mongodb-0 -- mongorestore --authenticationDatabase admin /backup
```

### Persistent Volumes

Ensure persistent volumes are backed up regularly:

```bash
# Check PVCs
kubectl get pvc -n staysphere

# For cloud providers:
# - AWS: Enable automated EBS snapshots
# - GCP: Enable persistent disk snapshots
# - Azure: Enable disk snapshots
```

## Monitoring & Logging

### View Logs

```bash
# API logs
kubectl logs -n staysphere -l app=api --tail=100 -f

# Web logs
kubectl logs -n staysphere -l app=web --tail=100 -f

# MongoDB logs
kubectl logs -n staysphere -l app=mongodb --tail=100
```

### Health Checks

All pods have liveness and readiness probes configured.

```bash
# Check probe status
kubectl describe pod -n staysphere <pod-name>

# Manual health check
kubectl exec -n staysphere <api-pod> -- curl http://localhost:5000/health
```

### Metrics

If metrics-server is installed:

```bash
kubectl top nodes
kubectl top pods -n staysphere
```

## Troubleshooting

### Pods not starting

```bash
kubectl describe pod -n staysphere <pod-name>
kubectl logs -n staysphere <pod-name>
```

### ImagePullBackOff

Ensure images are accessible and registry credentials are set.

### Persistent volume issues

```bash
kubectl get pvc -n staysphere
kubectl describe pvc -n staysphere <pvc-name>
```

### Network connectivity

```bash
kubectl exec -n staysphere <api-pod> -- curl http://mongodb-service:27017
kubectl exec -n staysphere <api-pod> -- curl http://redis-service:6379
```

## Cleanup

To delete all resources:

```bash
# Delete namespace (deletes all resources within)
kubectl delete namespace staysphere

# Or delete individual manifests
kubectl delete -f 09-rbac.yaml
kubectl delete -f 08-network-policy.yaml
# ... continue with others in reverse order
```

## Cloud-Specific Notes

### AWS EKS

```bash
# Use AWS ECR for images
# Configure IAM roles for pod access
# Enable EBS snapshots for MongoDB PVC
```

### Google GKE

```bash
# Use Google Artifact Registry
# Enable Google Managed Certificates for Ingress
# Use Google Cloud SQL for managed databases
```

### Azure AKS

```bash
# Use Azure Container Registry
# Configure Azure Managed Disks for PVC
# Use Azure Key Vault for secrets
```

## Next Steps

1. Push Docker images to your registry
2. Update image names in manifests
3. Create secrets with real credentials
4. Deploy to your Kubernetes cluster
5. Configure custom domain and SSL
6. Set up monitoring and logging
7. Configure backups and disaster recovery
