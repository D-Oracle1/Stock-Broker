# Deployment Guide

This guide covers deploying the Stock Brokerage Platform in various environments.

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15+
- Redis 7+

## Quick Start with Docker

### 1. Clone and Configure

```bash
git clone <repository-url>
cd Stock-Broker
cp .env.template .env
```

### 2. Configure Environment Variables

Edit `.env` file with your configurations:

```bash
# Database
POSTGRES_PASSWORD=your_secure_password_here

# JWT Secrets
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here

# Encryption
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_email_password

# Payment Gateway
PAYSTACK_SECRET_KEY=your_paystack_secret_key
FLUTTERWAVE_SECRET_KEY=your_flutterwave_secret_key
```

### 3. Start the Platform

```bash
docker-compose up -d
```

### 4. Initialize Database

```bash
# Run migrations and seed data
docker-compose exec backend npm run migration:run
docker-compose exec backend npm run seed
```

### 5. Access the Platform

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api/docs

### 6. Default Admin Credentials

```
Email: admin@stockbroker.com
Password: Admin123! (change immediately)
```

## Production Deployment

### Using Docker Compose (Production)

1. Create production environment file:

```bash
cp .env.template .env.production
```

2. Update production configurations:

```env
NODE_ENV=production
POSTGRES_HOST=your_production_db_host
REDIS_HOST=your_production_redis_host
FRONTEND_URL=https://your-domain.com
```

3. Deploy:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Using Kubernetes

See `k8s/` directory for Kubernetes manifests.

### AWS Deployment

#### Using ECS/Fargate

1. Build and push Docker images to ECR
2. Create ECS task definitions
3. Configure RDS for PostgreSQL
4. Configure ElastiCache for Redis
5. Deploy using ECS services

#### Using EC2

1. Launch EC2 instances
2. Install Docker and Docker Compose
3. Clone repository and configure
4. Run `docker-compose up -d`

### Azure Deployment

Use Azure Container Instances or Azure Kubernetes Service (AKS).

### Google Cloud Deployment

Use Google Kubernetes Engine (GKE) or Cloud Run.

## SSL/TLS Configuration

### Using Let's Encrypt

```bash
# Install certbot
sudo apt-get install certbot

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Update nginx configuration
# Add SSL certificates to docker-compose
```

## Monitoring

### Application Logs

```bash
# View backend logs
docker-compose logs -f backend

# View frontend logs
docker-compose logs -f frontend
```

### Database Monitoring

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U stockbroker -d stockbroker_db
```

### Redis Monitoring

```bash
# Connect to Redis
docker-compose exec redis redis-cli -a redis123
```

## Backup & Recovery

### Database Backup

```bash
# Backup
docker-compose exec postgres pg_dump -U stockbroker stockbroker_db > backup.sql

# Restore
docker-compose exec -T postgres psql -U stockbroker stockbroker_db < backup.sql
```

### Redis Backup

```bash
# Backup
docker-compose exec redis redis-cli -a redis123 SAVE
docker cp stockbroker_redis:/data/dump.rdb ./redis-backup.rdb
```

## Scaling

### Horizontal Scaling

1. Use a load balancer (nginx, AWS ALB, etc.)
2. Run multiple backend instances
3. Configure Redis for session storage
4. Use managed database (RDS, Cloud SQL)

### Vertical Scaling

Update resource limits in `docker-compose.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

## Security Checklist

- [ ] Change default admin password
- [ ] Configure strong JWT secrets
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Enable database encryption
- [ ] Configure rate limiting
- [ ] Enable 2FA for admin accounts
- [ ] Regular security updates
- [ ] Backup encryption
- [ ] API key rotation

## Troubleshooting

### Common Issues

**Backend won't start:**
- Check database connection
- Verify environment variables
- Check logs: `docker-compose logs backend`

**Database connection failed:**
- Verify PostgreSQL is running
- Check credentials in `.env`
- Ensure network connectivity

**Frontend can't connect to API:**
- Verify `NEXT_PUBLIC_API_URL` in `.env`
- Check CORS configuration
- Verify backend is accessible

## Performance Optimization

### Database

```sql
-- Add indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
```

### Redis Cache

Configure cache TTL in backend:

```typescript
// Increase cache duration for market data
@Cacheable({ ttl: 300 }) // 5 minutes
```

### CDN

Use CloudFlare, AWS CloudFront, or similar for static assets.

## Maintenance

### Regular Tasks

- **Daily**: Monitor logs, check system health
- **Weekly**: Review security alerts, backup verification
- **Monthly**: Update dependencies, security patches
- **Quarterly**: Performance review, capacity planning

### Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d
```

## Support

For issues and questions:
- GitHub Issues: <repository-url>/issues
- Documentation: <repository-url>/docs
