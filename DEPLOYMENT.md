# MACS Backend API Deployment Guide

This guide covers deployment options for the MACS Backend API across different environments.

## 🚀 Deployment Options

### 1. Local Development

```bash
# Clone repository
git clone <repository-url>
cd macs-backend-api

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Set up database
npx prisma migrate dev
npx prisma generate

# Start development server
npm run dev
```

### 2. Docker Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

### 3. Production Deployment

#### Option A: Traditional Server (Ubuntu/CentOS)

```bash
# 1. Server Setup
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm postgresql redis-server nginx

# 2. Database Setup
sudo -u postgres createuser macs_user
sudo -u postgres createdb macs_db
sudo -u postgres psql -c "ALTER USER macs_user PASSWORD 'secure_password';"

# 3. Application Setup
git clone <repository-url>
cd macs-backend-api
npm ci --production
cp .env.example .env.production
# Edit .env.production with production values

# 4. Database Migration
npx prisma migrate deploy
npx prisma generate

# 5. Process Manager
npm install -g pm2
pm2 start ecosystem.config.js
pm2 startup
pm2 save

# 6. Nginx Configuration
sudo cp nginx.conf /etc/nginx/sites-available/macs-api
sudo ln -s /etc/nginx/sites-available/macs-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

#### Option B: Docker Production

```bash
# 1. Build production image
docker build -t macs-api:latest .

# 2. Run with production compose
docker-compose -f docker-compose.prod.yml up -d

# 3. Set up SSL (Let's Encrypt)
docker run --rm -it \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  -d api.macs.art
```

#### Option C: Cloud Platforms

##### AWS ECS/Fargate
```bash
# 1. Build and push to ECR
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-west-2.amazonaws.com
docker build -t macs-api .
docker tag macs-api:latest <account>.dkr.ecr.us-west-2.amazonaws.com/macs-api:latest
docker push <account>.dkr.ecr.us-west-2.amazonaws.com/macs-api:latest

# 2. Deploy using AWS CLI or Console
aws ecs update-service --cluster macs-cluster --service macs-api-service --force-new-deployment
```

##### Google Cloud Run
```bash
# 1. Build and deploy
gcloud builds submit --tag gcr.io/PROJECT-ID/macs-api
gcloud run deploy macs-api \
  --image gcr.io/PROJECT-ID/macs-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

##### Heroku
```bash
# 1. Create Heroku app
heroku create macs-api-prod

# 2. Add PostgreSQL and Redis
heroku addons:create heroku-postgresql:hobby-dev
heroku addons:create heroku-redis:hobby-dev

# 3. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-production-secret

# 4. Deploy
git push heroku main
```

## 🔧 Environment Configuration

### Required Environment Variables

```bash
# Core Configuration
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://user:pass@host:5432/db"
JWT_SECRET="your-super-secret-production-key"

# Blockchain
POLYGON_RPC_URL="https://polygon-mainnet.infura.io/v3/YOUR-PROJECT-ID"
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"

# External Services
REDIS_URL="redis://localhost:6379"
EMAIL_API_KEY="your-email-service-key"
```

### Optional Environment Variables

```bash
# Monitoring
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project"
LOG_LEVEL="info"

# Performance
CLUSTER_WORKERS=4
DATABASE_POOL_SIZE=20

# Security
RATE_LIMIT_MAX_REQUESTS=1000
CORS_ORIGIN="https://app.macs.art"
```

## 🗄️ Database Setup

### PostgreSQL Setup

```sql
-- Create database and user
CREATE DATABASE macs_db;
CREATE USER macs_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE macs_db TO macs_user;

-- Connect to database
\c macs_db

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO macs_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO macs_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO macs_user;
```

### Database Migration

```bash
# Production migration
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed database (optional)
npx prisma db seed
```

## 🔒 SSL/TLS Configuration

### Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d api.macs.art

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Custom Certificate

```nginx
server {
    listen 443 ssl http2;
    server_name api.macs.art;
    
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Monitoring & Logging

### PM2 Monitoring

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs macs-api

# Restart application
pm2 restart macs-api

# View process info
pm2 info macs-api
```

### Log Management

```bash
# Rotate logs
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

### Health Checks

```bash
# Basic health check
curl http://localhost:3000/health

# Detailed health check
curl http://localhost:3000/health/detailed
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy MACS API

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm test
      
    - name: Build Docker image
      run: docker build -t macs-api:${{ github.sha }} .
      
    - name: Deploy to production
      run: |
        # Your deployment script here
        echo "Deploying to production..."
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U macs_user -d macs_db

# Reset password
sudo -u postgres psql -c "ALTER USER macs_user PASSWORD 'new_password';"
```

#### Port Already in Use
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

#### Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER /path/to/macs-backend-api
chmod +x scripts/*.sh
```

#### Memory Issues
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Monitor memory usage
pm2 monit
```

### Performance Optimization

#### Database Optimization
```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_bookings_artist_id ON bookings(artist_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
```

#### Redis Caching
```javascript
// Cache frequently accessed data
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

// Cache user data
await client.setex(`user:${userId}`, 3600, JSON.stringify(userData));
```

## 📞 Support

### Getting Help
- **Documentation**: [docs.macs.art](https://docs.macs.art)
- **API Reference**: [api.macs.art/docs](https://api.macs.art/docs)
- **Discord**: [discord.gg/macs](https://discord.gg/macs)
- **Email**: devops@macs.art

### Reporting Issues
1. Check existing issues on GitHub
2. Provide detailed error logs
3. Include environment information
4. Steps to reproduce the issue

---

**Happy Deploying! 🚀**

