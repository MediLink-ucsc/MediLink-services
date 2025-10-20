# MediLink Microservices - Deployment Guide

This guide provides step-by-step instructions for deploying the MediLink microservices platform in both **local development** and **Docker containerized** environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Local Development Deployment](#local-development-deployment)
4. [Docker Deployment](#docker-deployment)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

1. **Node.js and npm**

   - Version: Node.js 18.x or higher
   - Download: https://nodejs.org/

2. **Git**

   - Download: https://git-scm.com/downloads

3. **Docker and Docker Compose** (for Docker deployment)

   - Docker Desktop: https://www.docker.com/products/docker-desktop/
   - Ensure Docker Compose is included (v2.0+)

4. **PostgreSQL** (for local development only)

   - Version: 17.x
   - Download: https://www.postgresql.org/download/

5. **Redis** (for local development only)

   - Version: 6.2+
   - Download: https://redis.io/download/

6. **Apache Kafka** (for local development only)
   - Version: 3.9+
   - Download: https://kafka.apache.org/downloads

### Lab Report Service Prerequisites

The Lab Report Service requires additional software for OCR and PDF processing:

#### Windows Installation

1. **Tesseract OCR**

   ```powershell
   # Download the installer from:
   # https://github.com/UB-Mannheim/tesseract/wiki

   # Install to default location or custom path
   # Default: C:\Program Files\Tesseract-OCR\tesseract.exe

   # Verify installation:
   tesseract --version
   ```

2. **Poppler (PDF utilities)**

   ```powershell
   # Download from:
   # https://github.com/oschwartz10612/poppler-windows/releases/

   # Extract to a location (e.g., C:\poppler-24.08.0)
   # Add to PATH or note the bin directory path
   # Example: C:\poppler-24.08.0\Library\bin

   # Verify installation:
   pdfinfo -v
   ```

#### Linux Installation (Ubuntu/Debian)

```bash
# Tesseract OCR
sudo apt-get update
sudo apt-get install -y tesseract-ocr

# Poppler utilities
sudo apt-get install -y poppler-utils

# Verify installations
tesseract --version
pdfinfo -v
```

#### macOS Installation

```bash
# Using Homebrew
brew install tesseract
brew install poppler

# Verify installations
tesseract --version
pdfinfo -v
```

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/MediLink-ucsc/MediLink-services.git
cd MediLink-services
```

### 2. Generate JWT Secrets

Generate secure secrets for JWT tokens:

```bash
# Generate AUTH_JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate GATEWAY_JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate LAB_DATA_ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Save these values** - you'll need them for the `.env` files.

### 3. Create Environment Files

Create `.env` files for each service by copying from `.env.example`:

#### API Gateway (.env)

```bash
# Navigate to service directory
cd services/api-gateway

# Create .env file
cp .env.example .env
```

Edit `services/api-gateway/.env`:

```bash
PORT=3000
NODE_ENV=development

AUTH_JWT_SECRET=<your-generated-auth-jwt-secret>
GATEWAY_JWT_SECRET=<your-generated-gateway-jwt-secret>
GATEWAY_JWT_EXPIRES_IN=1m

RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

DEFAULT_TIMEOUT=30000

LOG_LEVEL=debug

REDIS_URL=redis://:medilink@localhost:6379

AUTH_SERVICE_URL=http://localhost:3001
INSTITUTION_SERVICE_URL=http://localhost:3002
PATIENT_RECORD_SERVICE_URL=http://localhost:3003
LAB_REPORT_SERVICE_URL=http://localhost:3004
MEDICAL_HISTORY_SERVICE_URL=http://localhost:3005
ACTIVITY_TIMELINE_SERVICE_URL=http://localhost:3006
NOTIFICATION_SERVICE_URL=http://localhost:3007
```

#### Auth Service (.env)

```bash
cd ../auth-service
cp .env.example .env
```

Edit `services/auth-service/.env`:

```bash
PORT=3001
NODE_ENV=development

AUTH_JWT_SECRET=<your-generated-auth-jwt-secret>
GATEWAY_JWT_SECRET=<your-generated-gateway-jwt-secret>
GATEWAY_JWT_EXPIRES_IN=1m

RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

LOG_LEVEL=debug

REDIS_URL=redis://:medilink@localhost:6379
DATABASE_URL=postgres://admin:medilink@localhost:5432/medilink
KAFKA_BROKER=localhost:9094

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3010
```

#### Institution Service (.env)

```bash
cd ../institution-service
cp .env.example .env
```

Edit `services/institution-service/.env`:

```bash
PORT=3002
NODE_ENV=development

AUTH_JWT_SECRET=<your-generated-auth-jwt-secret>
GATEWAY_JWT_SECRET=<your-generated-gateway-jwt-secret>
GATEWAY_JWT_EXPIRES_IN=1m

RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

LOG_LEVEL=debug

REDIS_URL=redis://:medilink@localhost:6379
DATABASE_URL=postgres://admin:medilink@localhost:5432/medilink
KAFKA_BROKER=localhost:9094
```

#### Patient Record Service (.env)

```bash
cd ../patient-record-service
cp .env.example .env
```

Edit `services/patient-record-service/.env`:

```bash
PORT=3003
NODE_ENV=development

AUTH_JWT_SECRET=<your-generated-auth-jwt-secret>
GATEWAY_JWT_SECRET=<your-generated-gateway-jwt-secret>
GATEWAY_JWT_EXPIRES_IN=1m

RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

LOG_LEVEL=debug

REDIS_URL=redis://:medilink@localhost:6379
DATABASE_URL=postgres://admin:medilink@localhost:5432/medilink
KAFKA_BROKER=localhost:9094
```

#### Lab Report Service (.env)

```bash
cd ../lab-report-service
cp .env.example .env
```

Edit `services/lab-report-service/.env`:

**Windows:**

```bash
PORT=3004
NODE_ENV=development

DATABASE_URL=postgres://admin:medilink@localhost:5432/medilink
REDIS_URL=redis://:medilink@localhost:6379
KAFKA_BROKER=localhost:9094

JWT_SECRET=<your-generated-auth-jwt-secret>
JWT_EXPIRES_IN=24h

LOG_LEVEL=debug

# Windows paths - adjust to your installation
TESSERACT_PATH=C:/Program Files/Tesseract-OCR/tesseract.exe
POPPLER_PATH=C:/poppler-24.08.0/Library/bin
UPLOADS_DIR=uploads/

LAB_DATA_ENCRYPTION_KEY=<your-generated-encryption-key>
```

**Linux/macOS:**

```bash
PORT=3004
NODE_ENV=development

DATABASE_URL=postgres://admin:medilink@localhost:5432/medilink
REDIS_URL=redis://:medilink@localhost:6379
KAFKA_BROKER=localhost:9094

JWT_SECRET=<your-generated-auth-jwt-secret>
JWT_EXPIRES_IN=24h

LOG_LEVEL=debug

# Linux/macOS paths
TESSERACT_PATH=/usr/bin/tesseract
POPPLER_PATH=/usr/bin
UPLOADS_DIR=uploads/

LAB_DATA_ENCRYPTION_KEY=<your-generated-encryption-key>
```

#### Medical History Service (.env)

```bash
cd ../medical-history-service
cp .env.example .env
```

Edit `services/medical-history-service/.env`:

```bash
PORT=3005
NODE_ENV=development

AUTH_JWT_SECRET=<your-generated-auth-jwt-secret>
GATEWAY_JWT_SECRET=<your-generated-gateway-jwt-secret>
GATEWAY_JWT_EXPIRES_IN=1m

RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

LOG_LEVEL=debug

REDIS_URL=redis://:medilink@localhost:6379
DATABASE_URL=postgres://admin:medilink@localhost:5432/medilink
KAFKA_BROKER=localhost:9094
```

#### Activity Timeline Service (.env)

```bash
cd ../activity-timeline-service
cp .env.example .env
```

Edit `services/activity-timeline-service/.env`:

```bash
PORT=3006
NODE_ENV=development

LOG_LEVEL=debug

REDIS_URL=redis://:medilink@localhost:6379
DATABASE_URL=postgres://admin:medilink@localhost:5432/medilink
KAFKA_BROKER=localhost:9094
KAFKA_GROUP_ID=activity-timeline-service

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3010
```

#### Notification Service (.env)

```bash
cd ../notification-service
cp .env.example .env
```

Edit `services/notification-service/.env`:

```bash
PORT=3007
NODE_ENV=development
LOG_LEVEL=info
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

DATABASE_URL=postgres://admin:medilink@localhost:5432/medilink
REDIS_URL=redis://:medilink@localhost:6379
KAFKA_BROKER=localhost:9094

# Brevo Email Configuration (REQUIRED)
# Get your API key from: https://app.brevo.com/settings/keys/api
BREVO_API_KEY=<your-brevo-api-key>
BREVO_SENDER_NAME=MediLink Support
BREVO_SENDER_EMAIL=support@medilink.com

FRONTEND_URL=http://localhost:3000
PASSWORD_RESET_EXPIRY=15m
```

**Note:** You need to sign up for a Brevo account and get an API key from https://app.brevo.com/

---

## Local Development Deployment

### 1. Start Infrastructure Services

#### Using Docker Compose (Recommended)

```bash
# From the project root
cd MediLink-services

# Start only infrastructure services
docker-compose up -d postgres redis kafka mongo
```

Wait for services to be healthy:

```bash
docker-compose ps
```

#### Manual Setup (Alternative)

If you prefer to run services manually:

1. **PostgreSQL:**

   - Start PostgreSQL server
   - Create database: `CREATE DATABASE medilink;`
   - User: `admin`, Password: `medilink`

2. **Redis:**

   - Start Redis server with password: `medilink`
   - Port: 6379

3. **Kafka:**

   - Start Kafka broker
   - Port: 9094

4. **MongoDB:**
   - Start MongoDB server
   - User: `admin`, Password: `medilink`
   - Port: 27017

### 2. Install Dependencies

Install dependencies for shared packages first:

```bash
# From project root
cd packages/kafka-client
npm install

cd ../logger
npm install

cd ../redis-client
npm install
```

Install dependencies for all services:

```bash
# From project root
cd services/api-gateway
npm install

cd ../auth-service
npm install

cd ../institution-service
npm install

cd ../patient-record-service
npm install

cd ../lab-report-service
npm install

cd ../medical-history-service
npm install

cd ../activity-timeline-service
npm install

cd ../notification-service
npm install
```

**Alternative:** Use the build script if available:

```bash
# From project root
./buildPackages.sh  # Linux/macOS
# or
bash buildPackages.sh  # Windows Git Bash
```

### 3. Run Database Migrations

Each service may have its own migrations. Run them in order:

```bash
# Auth Service
cd services/auth-service
npm run migration:run

# Institution Service
cd ../institution-service
npm run migration:run

# Lab Report Service
cd ../lab-report-service
npm run migration:run

# Activity Timeline Service
cd ../activity-timeline-service
npm run migration:run

# Notification Service
cd ../notification-service
npm run migration:run
```

### 4. Start Services

Start each service in a separate terminal window:

**Terminal 1 - API Gateway:**

```bash
cd services/api-gateway
npm run dev
```

**Terminal 2 - Auth Service:**

```bash
cd services/auth-service
npm run dev
```

**Terminal 3 - Institution Service:**

```bash
cd services/institution-service
npm run dev
```

**Terminal 4 - Patient Record Service:**

```bash
cd services/patient-record-service
npm run dev
```

**Terminal 5 - Lab Report Service:**

```bash
cd services/lab-report-service
npm run dev
```

**Terminal 6 - Medical History Service:**

```bash
cd services/medical-history-service
npm run dev
```

**Terminal 7 - Activity Timeline Service:**

```bash
cd services/activity-timeline-service
npm run dev
```

**Terminal 8 - Notification Service:**

```bash
cd services/notification-service
npm run dev
```

### 5. Verify Services

Check that all services are running:

- API Gateway: http://localhost:3000
- Auth Service: http://localhost:3001
- Institution Service: http://localhost:3002
- Patient Record Service: http://localhost:3003
- Lab Report Service: http://localhost:3004/api/v1/labReport/health
- Medical History Service: http://localhost:3005
- Activity Timeline Service: http://localhost:3006/api/v1/activity/health
- Notification Service: http://localhost:3007

---

## Docker Deployment

### Prerequisites for Docker Deployment

1. Docker Desktop installed and running
2. At least 8GB RAM allocated to Docker
3. All `.env` files created (but adjusted for Docker networking)

### 1. Create Production Environment Files

Create `.env.production` files for each service:

#### services/api-gateway/.env.production

```bash
PORT=3000
NODE_ENV=production

AUTH_JWT_SECRET=<your-generated-auth-jwt-secret>
GATEWAY_JWT_SECRET=<your-generated-gateway-jwt-secret>
GATEWAY_JWT_EXPIRES_IN=1m

RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

DEFAULT_TIMEOUT=30000

LOG_LEVEL=info

REDIS_URL=redis://:medilink@redis:6379

AUTH_SERVICE_URL=http://medilink-auth-service:3001
INSTITUTION_SERVICE_URL=http://medilink-institution-service:3002
PATIENT_RECORD_SERVICE_URL=http://medilink-patient-record-service:3003
LAB_REPORT_SERVICE_URL=http://medilink-lab-report-service:3004
MEDICAL_HISTORY_SERVICE_URL=http://medilink-medical-history-service:3005
ACTIVITY_TIMELINE_SERVICE_URL=http://medilink-activity-timeline-service:3006
NOTIFICATION_SERVICE_URL=http://medilink-notification-service:3007
```

#### services/auth-service/.env.production

```bash
PORT=3001
NODE_ENV=production

AUTH_JWT_SECRET=<your-generated-auth-jwt-secret>
GATEWAY_JWT_SECRET=<your-generated-gateway-jwt-secret>
GATEWAY_JWT_EXPIRES_IN=1m

RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100

LOG_LEVEL=info

REDIS_URL=redis://:medilink@redis:6379
DATABASE_URL=postgres://admin:medilink@postgres:5432/medilink
KAFKA_BROKER=kafka:9092

ALLOWED_ORIGINS=http://localhost:3000
```

#### services/lab-report-service/.env.production

```bash
PORT=3004
NODE_ENV=production

DATABASE_URL=postgres://admin:medilink@postgres:5432/medilink
REDIS_URL=redis://:medilink@redis:6379
KAFKA_BROKER=kafka:9092

JWT_SECRET=<your-generated-auth-jwt-secret>
JWT_EXPIRES_IN=24h

LOG_LEVEL=info

# Docker paths (set in docker-compose.yml)
TESSERACT_PATH=/usr/bin/tesseract
POPPLER_PATH=/usr/bin
UPLOADS_DIR=uploads/

LAB_DATA_ENCRYPTION_KEY=<your-generated-encryption-key>
```

#### services/notification-service/.env.production

```bash
PORT=3007
NODE_ENV=production
LOG_LEVEL=info
ALLOWED_ORIGINS=http://localhost:3000

DATABASE_URL=postgres://admin:medilink@postgres:5432/medilink
REDIS_URL=redis://:medilink@redis:6379
KAFKA_BROKER=kafka:9092

BREVO_API_KEY=<your-brevo-api-key>
BREVO_SENDER_NAME=MediLink Support
BREVO_SENDER_EMAIL=support@medilink.com

FRONTEND_URL=http://localhost:3000
PASSWORD_RESET_EXPIRY=15m
```

**Note:** Create similar `.env.production` files for other services (institution, patient-record, medical-history, activity-timeline) following the same pattern with Docker service names.

### 2. Build Docker Images

Build all service images:

```bash
# From project root
docker-compose build
```

This will build images for:

- API Gateway
- Auth Service
- Lab Report Service
- Activity Timeline Service
- Notification Service

### 3. Start All Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f medilink-auth-service
```

### 4. Run Database Migrations in Docker

```bash
# Auth Service migrations
docker-compose exec medilink-auth-service npm run migration:run

# Lab Report Service migrations
docker-compose exec medilink-lab-report-service npm run migration:run

# Activity Timeline Service migrations
docker-compose exec medilink-activity-timeline-service npm run migration:run

# Notification Service migrations
docker-compose exec medilink-notification-service npm run migration:run
```

### 5. Check Service Health

```bash
# Check all containers
docker-compose ps

# Check health endpoints
curl http://localhost:3004/api/v1/labReport/health
curl http://localhost:3006/api/v1/activity/health
```

### Management Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v

# Restart a specific service
docker-compose restart medilink-auth-service

# View logs for all services
docker-compose logs -f

# Execute command in container
docker-compose exec medilink-lab-report-service sh
```

---

## Verification

### Check Infrastructure Services

```bash
# PostgreSQL
docker-compose exec postgres psql -U admin -d medilink -c "\dt"

# Redis
docker-compose exec redis redis-cli -a medilink ping

# Kafka
docker-compose exec kafka kafka-topics.sh --bootstrap-server localhost:9092 --list
```

### Access Management UIs

- **Kafka UI:** http://localhost:8080
- **Redis Insight:** http://localhost:8001

### Test API Endpoints

```bash
# Health checks
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3004/api/v1/labReport/health
curl http://localhost:3006/api/v1/activity/health
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Find process using port (Windows PowerShell)
Get-NetTCPConnection -LocalPort 3000

# Find process using port (Linux/macOS)
lsof -i :3000

# Kill process
taskkill /PID <PID> /F  # Windows
kill -9 <PID>           # Linux/macOS
```

#### 2. Docker Services Not Starting

```bash
# Check Docker resources
docker system df

# Prune unused resources
docker system prune -a

# Check service logs
docker-compose logs <service-name>
```

#### 3. Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Test connection
docker-compose exec postgres psql -U admin -d medilink
```

#### 4. Tesseract/Poppler Not Found (Lab Report Service)

- **Windows:** Ensure paths in `.env` match installation locations
- **Linux:** Run `sudo apt-get install tesseract-ocr poppler-utils`
- **Docker:** These are installed automatically in the container

#### 5. Kafka Connection Issues

```bash
# Check Kafka health
docker-compose exec kafka kafka-broker-api-versions.sh --bootstrap-server localhost:9092

# Restart Kafka
docker-compose restart kafka
```

#### 6. Redis Connection Issues

```bash
# Test Redis connection
docker-compose exec redis redis-cli -a medilink ping

# Check Redis logs
docker-compose logs redis
```

### Service-Specific Issues

#### Lab Report Service

- **OCR not working:** Verify Tesseract installation and path
- **PDF processing fails:** Verify Poppler installation and path
- **Upload directory errors:** Ensure `uploads/` directory exists and has write permissions

#### Notification Service

- **Email not sending:** Verify Brevo API key is valid
- **Rate limiting:** Check Brevo account limits and upgrade if needed

---

## Service Architecture

```
                                    ┌─────────────────┐
                                    │   API Gateway   │
                                    │    Port: 3000   │
                                    └────────┬────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
           ┌────────▼────────┐      ┌───────▼────────┐      ┌───────▼────────��
           │  Auth Service   │      │  Institution   │      │ Patient Record │
           │   Port: 3001    │      │   Service      │      │    Service     │
           │                 │      │   Port: 3002   │      │   Port: 3003   │
           └────────┬────────┘      └───────┬────────┘      └───────┬────────┘
                    │                       │                        │
           ┌────────▼────────┐      ┌───────▼────────┐      ┌───────▼────────┐
           │  Lab Report     │      │ Medical History│      │   Activity     │
           │    Service      │      │    Service     │      │   Timeline     │
           │   Port: 3004    │      │   Port: 3005   │      │   Port: 3006   │
           └────────┬────────┘      └───────┬────────┘      └───────┬────────┘
                    │                       │                        │
                    └───────────────┬───────┴────────────────────────┘
                                    │
                           ┌────────▼────────┐
                           │  Notification   │
                           │    Service      │
                           │   Port: 3007    │
                           └────────┬────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            │                       │                       │
    ┌───────▼────────┐     ┌───────▼────────┐     ┌───────▼────────┐
    │   PostgreSQL   │     │     Redis      │     │     Kafka      │
    │   Port: 5432   │     │   Port: 6379   │     │   Port: 9094   │
    └────────────────┘     └────────────────┘     └────────────────┘
```

---

## Additional Resources

- **Kafka UI:** Access at http://localhost:8080 for topic management
- **Redis Insight:** Access at http://localhost:8001 for Redis data viewing
- **Project README:** See main README.md for API documentation
- **Brevo Setup:** See `services/notification-service/BREVO_SETUP.md`

---

## Security Notes

⚠️ **Important Security Reminders:**

1. **Never commit `.env` files** to version control
2. **Change default passwords** in production environments
3. **Use strong, unique JWT secrets** for each environment
4. **Rotate encryption keys** periodically
5. **Enable SSL/TLS** for production deployments
6. **Restrict CORS origins** to known frontend domains
7. **Review and update rate limits** based on usage patterns
8. **Keep dependencies updated** for security patches

---

## Quick Reference

### Service Ports

| Service                   | Port | Health Endpoint          |
| ------------------------- | ---- | ------------------------ |
| API Gateway               | 3000 | /health                  |
| Auth Service              | 3001 | /health                  |
| Institution Service       | 3002 | /health                  |
| Patient Record Service    | 3003 | /health                  |
| Lab Report Service        | 3004 | /api/v1/labReport/health |
| Medical History Service   | 3005 | /health                  |
| Activity Timeline Service | 3006 | /api/v1/activity/health  |
| Notification Service      | 3007 | /                        |

### Infrastructure Ports

| Service    | Port  | UI/Management       |
| ---------- | ----- | ------------------- |
| PostgreSQL | 5432  | -                   |
| Redis      | 6379  | Redis Insight: 8001 |
| Kafka      | 9094  | Kafka UI: 8080      |
| MongoDB    | 27017 | -                   |

---

## Support

For issues or questions:

- Check service logs: `docker-compose logs -f <service-name>`
- Review service-specific README files
- Check GitHub Issues: https://github.com/MediLink-ucsc/MediLink-services/issues

---

**Last Updated:** October 2025
