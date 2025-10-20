# MediLink - Medical Records Management System

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

MediLink is a comprehensive microservices-based medical records management platform designed to streamline healthcare data management, including Electronic Medical Records (EMR), Electronic Health Records (EHR), lab reports, and patient timelines.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Core Services](#core-services)
- [Infrastructure](#infrastructure)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

MediLink provides a robust, scalable platform for managing medical records with the following capabilities:

- **Authentication & Authorization** - Secure JWT-based authentication system
- **Institution Management** - Multi-tenant support for medical institutions
- **Patient Records (EMR)** - Clinical visit details and medical encounters
- **Lab Reports Processing** - Automated OCR-based lab report parsing and storage
- **Medical History (EHR)** - Comprehensive patient health records over time
- **Activity Timeline** - Real-time tracking of patient activities and events
- **Notifications** - Email notifications for critical events
- **API Gateway** - Centralized entry point with rate limiting and authentication

---

## Architecture

MediLink follows a **microservices architecture** with event-driven communication:

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway (3000)                      │
│                    Rate Limiting • Authentication               │
└────────────┬────────────────────────────────────────────────────┘
             │
    ┌────────┼────────┬────────────┬───────────┬──────────┐
    │        │        │            │           │          │
┌───▼───┐┌──▼───┐┌───▼────┐┌─────▼────┐┌────▼─────┐┌──▼──────┐
│ Auth  ││Instit││Patient ││   Lab    ││ Medical  ││Activity │
│Service││ution ││ Record ││  Report  ││ History  ││Timeline │
│ 3001  ││ 3002 ││  3003  ││   3004   ││   3005   ││  3006   │
└───┬───┘└──┬───┘└───┬────┘└─────┬────┘└────┬─────┘└──┬──────┘
    │       │        │           │          │         │
    └───────┴────────┴───────────┴──────────┴─────────┴────────┐
                                                                 │
    ┌────────────────────────────────────────────────────────────┤
    │                    Notification Service (3007)             │
    └────────────────────────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
    ┌────▼─────┐          ┌─────▼──────┐         ┌─────▼─────┐
    │PostgreSQL│          │   Redis    │         │   Kafka   │
    │   5432   │          │    6379    │         │   9094    │
    └──────────┘          └────────────┘         └───────────┘
```

### Communication Patterns

- **Synchronous:** REST APIs via API Gateway
- **Asynchronous:** Event-driven via Apache Kafka
- **Caching:** Redis for session management and caching
- **Data Storage:** PostgreSQL for relational data, MongoDB for activity logs

---

## Core Services

| Service Name                  | Port | Description                         | Key Features                            |
| ----------------------------- | ---- | ----------------------------------- | --------------------------------------- |
| **API Gateway**               | 3000 | Entry point for all client requests | Rate limiting, JWT validation, routing  |
| **Auth Service**              | 3001 | Authentication & authorization      | JWT tokens, role-based access control   |
| **Institution Service**       | 3002 | Manage medical institutions         | Multi-tenant support, institution data  |
| **Patient Record Service**    | 3003 | Clinical visit details (EMR)        | Visit records, diagnoses, prescriptions |
| **Lab Report Service**        | 3004 | Upload & parse lab reports          | OCR processing, PDF parsing, storage    |
| **Medical History Service**   | 3005 | Patient health history (EHR)        | Longitudinal health records, analytics  |
| **Activity Timeline Service** | 3006 | Real-time patient activity tracking | Event logging, timeline visualization   |
| **Notification Service**      | 3007 | Email and notification management   | Brevo integration, templated emails     |

---

## Infrastructure

### Core Infrastructure Services

| Service        | Port | Description                      | UI/Management        |
| -------------- | ---- | -------------------------------- | -------------------- |
| **PostgreSQL** | 5432 | Primary relational database      | -                    |
| **Redis**      | 6379 | Caching & session management     | Redis Insight (8001) |
| **Kafka**      | 9094 | Event streaming & message broker | Kafka UI (8080)      |

### Shared Packages

- **kafka-client** - Kafka producer/consumer utilities
- **logger** - Centralized logging with Winston
- **redis-client** - Redis connection and caching utilities

---

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- Docker & Docker Compose
- Git

For **Lab Report Service**, additional requirements:

- Tesseract OCR
- Poppler PDF utilities

### 1. Clone the Repository

```bash
git clone https://github.com/MediLink-ucsc/MediLink-services.git
cd MediLink-services
```

### 2. Quick Start with Docker

```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Access Services

- **API Gateway:** http://localhost:3000
- **Kafka UI:** http://localhost:8080
- **Redis Insight:** http://localhost:8001

---

## Documentation

Comprehensive deployment and setup instructions:

- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
  - Local development setup
  - Docker deployment
  - Environment configuration
  - Tesseract & Poppler installation
  - Troubleshooting

### Service-Specific Documentation

- **[Lab Report Service README](services/lab-report-service/README.md)** - OCR processing, API endpoints
- **[Notification Service Setup](services/notification-service/BREVO_SETUP.md)** - Brevo email configuration
- **[Activity Timeline API Examples](services/activity-timeline-service/examples/API_EXAMPLES.md)** - Usage examples

---

## 🛠 Technology Stack

### Backend & Core

- **Runtime:** Node.js 18+
- **Language:** TypeScript 5.x
- **Framework:** Express.js
- **ORM:** TypeORM

### Databases & Storage

- **PostgreSQL 17.x** - Primary database
- **MongoDB 7.x** - Activity logs
- **Redis 6.2+** - Caching & sessions

### Message Broker & Events

- **Apache Kafka 3.9+** - Event streaming

### OCR & Document Processing

- **Tesseract OCR** - Text extraction from images
- **Poppler** - PDF to image conversion
- **Python** - Custom parsers for lab reports

### Email & Notifications

- **Brevo (Sendinblue)** - Email delivery service

### DevOps & Deployment

- **Docker & Docker Compose** - Containerization

### Development Tools

- **ESLint** - Code linting
- **Jest** - Testing framework
- **Prettier** - Code formatting

---

## Project Structure

```
MediLink-services/
├── packages/                    # Shared packages
│   ├── kafka-client/           # Kafka utilities
│   ├── logger/                 # Logging utilities
│   └── redis-client/           # Redis utilities
│
├── services/                   # Microservices
│   ├── api-gateway/           # API Gateway service
│   ├── auth-service/          # Authentication service
│   ├── institution-service/   # Institution management
│   ├── patient-record-service/# Patient records (EMR)
│   ├── lab-report-service/    # Lab report processing
│   ├── medical-history-service/# Medical history (EHR)
│   ├── activity-timeline-service/# Activity tracking
│   └── notification-service/  # Notification handling
│
├── docker-compose.yml         # Docker orchestration
├── DEPLOYMENT_GUIDE.md        # Deployment instructions
├── buildPackages.sh           # Package build script
└── README.md                  # This file
```

---

## Development

### Setting Up Local Development

```bash
# 1. Install dependencies for shared packages
cd packages/kafka-client && npm install
cd ../logger && npm install
cd ../redis-client && npm install

# 2. Install dependencies for all services
cd ../../services/api-gateway && npm install
cd ../auth-service && npm install
cd ../institution-service && npm install
cd ../patient-record-service && npm install
cd ../lab-report-service && npm install
cd ../medical-history-service && npm install
cd ../activity-timeline-service && npm install
cd ../notification-service && npm install

# 3. Start infrastructure services
cd ../..
docker-compose up -d postgres redis kafka mongo

# 4. Run migrations
cd services/auth-service && npm run migration:run
cd ../lab-report-service && npm run migration:run
# ... (repeat for other services)

# 5. Start services in development mode
cd services/api-gateway && npm run dev
# ... (start each service in a separate terminal)
```

### Running Tests

```bash
# Run tests for a specific service
cd services/lab-report-service
npm test

# Run tests with coverage
npm run test:coverage
```

### Code Standards

- **TypeScript** for type safety
- **ESLint** for code quality
- **Prettier** for code formatting
- Follow RESTful API conventions

---

## Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR
- Keep commits atomic and well-described

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Links

- **Repository:** [MediLink-ucsc/MediLink-services](https://github.com/MediLink-ucsc/MediLink-services)
- **Issues:** [Report a bug or request a feature](https://github.com/MediLink-ucsc/MediLink-services/issues)
- **Documentation:** [Deployment Guide](DEPLOYMENT_GUIDE.md)

---

## Support

For questions or support:

- 📧 Create an issue on GitHub
- 📖 Check the [Deployment Guide](DEPLOYMENT_GUIDE.md)
- 🔍 Review service-specific README files

---

## Acknowledgments

Built with ❤️ by the MediLink team at University of Colombo School of Computing (UCSC)

---

**Last Updated:** October 2025
