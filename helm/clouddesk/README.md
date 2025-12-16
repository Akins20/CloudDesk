# CloudDesk Helm Chart

Deploy CloudDesk - Remote Desktop Management Platform - to Kubernetes.

## Prerequisites

- Kubernetes 1.23+
- Helm 3.8+
- PV provisioner support in the underlying infrastructure (for MongoDB and Redis persistence)
- Ingress controller (nginx-ingress recommended)

## Installation

### Add the repository

```bash
helm repo add clouddesk https://charts.clouddesk.io
helm repo update
```

### Install the chart

```bash
helm install my-clouddesk clouddesk/clouddesk \
  --namespace clouddesk \
  --create-namespace \
  --set ingress.hosts[0].host=clouddesk.example.com \
  --set license.key=YOUR_LICENSE_KEY
```

### Install with custom values

```bash
helm install my-clouddesk clouddesk/clouddesk \
  --namespace clouddesk \
  --create-namespace \
  -f my-values.yaml
```

## Configuration

### Key Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `license.key` | License key for self-hosted deployment | `""` (Community tier) |
| `license.serverUrl` | License server URL | `https://license.clouddesk.io` |
| `ingress.enabled` | Enable ingress | `true` |
| `ingress.hosts[0].host` | Hostname for CloudDesk | `clouddesk.example.com` |
| `mongodb.enabled` | Deploy MongoDB | `true` |
| `redis.enabled` | Deploy Redis | `true` |

### Backend Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `backend.replicaCount` | Number of backend replicas | `1` |
| `backend.image.repository` | Backend image repository | `clouddesk/backend` |
| `backend.image.tag` | Backend image tag | `1.0.0` |
| `backend.resources` | Backend resource limits/requests | See values.yaml |

### Frontend Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `frontend.replicaCount` | Number of frontend replicas | `1` |
| `frontend.image.repository` | Frontend image repository | `clouddesk/frontend` |
| `frontend.image.tag` | Frontend image tag | `1.0.0` |
| `frontend.resources` | Frontend resource limits/requests | See values.yaml |

### Session Controller Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `sessionController.replicaCount` | Number of session controller replicas | `1` |
| `sessionController.image.repository` | Session controller image repository | `clouddesk/session-controller` |
| `sessionController.dockerSocket.enabled` | Mount Docker socket for worker spawning | `true` |

### Database Configuration

#### Using built-in MongoDB

```yaml
mongodb:
  enabled: true
  auth:
    rootPassword: "your-root-password"
    username: clouddesk
    password: "your-password"
    database: clouddesk
  persistence:
    size: 10Gi
```

#### Using external MongoDB

```yaml
mongodb:
  enabled: false
  external:
    host: mongodb.example.com
    port: 27017
    username: clouddesk
    password: "your-password"
    database: clouddesk
```

### Security Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `security.jwtAccessSecret` | JWT access token secret | Auto-generated |
| `security.jwtRefreshSecret` | JWT refresh token secret | Auto-generated |
| `security.encryptionKey` | Encryption key for credentials | Auto-generated |

> **Warning**: In production, always set explicit values for security secrets to ensure consistency across upgrades.

### Ingress Configuration

```yaml
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
  hosts:
    - host: clouddesk.example.com
      paths:
        - path: /
          pathType: Prefix
          service: frontend
        - path: /api
          pathType: Prefix
          service: backend
        - path: /socket.io
          pathType: Prefix
          service: backend
  tls:
    - secretName: clouddesk-tls
      hosts:
        - clouddesk.example.com
```

## License Tiers

| Tier | Users | Instances | Concurrent Sessions |
|------|-------|-----------|---------------------|
| Community (Free) | 5 | 10 | 3 |
| Team ($99/mo) | 25 | 50 | 10 |
| Enterprise ($299/mo) | Unlimited | Unlimited | Unlimited |

Purchase a license at [https://license.clouddesk.io](https://license.clouddesk.io)

## Upgrading

```bash
helm upgrade my-clouddesk clouddesk/clouddesk \
  --namespace clouddesk \
  -f my-values.yaml
```

## Uninstalling

```bash
helm uninstall my-clouddesk --namespace clouddesk
```

> **Note**: This will not delete PVCs. To fully clean up:
> ```bash
> kubectl delete pvc -l app.kubernetes.io/instance=my-clouddesk -n clouddesk
> ```

## Troubleshooting

### Check pod status

```bash
kubectl get pods -n clouddesk
```

### View logs

```bash
kubectl logs -f deployment/my-clouddesk-backend -n clouddesk
kubectl logs -f deployment/my-clouddesk-frontend -n clouddesk
```

### Check ingress

```bash
kubectl get ingress -n clouddesk
kubectl describe ingress my-clouddesk -n clouddesk
```

## Support

- Documentation: https://docs.clouddesk.io
- GitHub Issues: https://github.com/clouddesk/clouddesk/issues
- Email: support@clouddesk.io
