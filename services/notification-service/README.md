# Notification Service

A microservice for handling email notifications using Brevo (SendinBlue) API. This service is part of the MediLink healthcare management platform.

## Features

- **Email Sending**: Send transactional emails using Brevo API
- **Template Management**: Support for HTML and text email templates with variable substitution
- **Email Types**: Support for various email types (password reset, welcome, verification, etc.)
- **Email Logging**: Track all email activities with detailed logging
- **Retry Mechanism**: Automatic retry for failed emails
- **Health Monitoring**: Service health check endpoints
- **Database Integration**: PostgreSQL with TypeORM for data persistence
- **Event Streaming**: Kafka integration for event-driven architecture

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with TypeORM
- **Email Provider**: Brevo (SendinBlue) API
- **Message Broker**: Apache Kafka
- **Caching**: Redis
- **Logging**: Winston
- **Validation**: Zod
- **Security**: Helmet, CORS

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Service Configuration
PORT=3005
NODE_ENV=development
LOG_LEVEL=info
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Database Configuration
DATABASE_URL=postgres://user:password@localhost:5432/notifications

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Kafka Configuration
KAFKA_BROKER=localhost:9092

# Brevo Email Configuration (REQUIRED)
BREVO_API_KEY=your_brevo_api_key_here
BREVO_SENDER_NAME=MediLink Support
BREVO_SENDER_EMAIL=support@medilink.com

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
PASSWORD_RESET_EXPIRY=15m
```

## API Endpoints

### Health Check

- `GET /` - Service health check

### Email Operations

- `POST /api/v1/email/send` - Send custom email
- `POST /api/v1/email/send-template` - Send email using template
- `POST /api/v1/email/password-reset` - Send password reset email
- `POST /api/v1/email/welcome` - Send welcome email
- `GET /api/v1/email/history` - Get email history
- `POST /api/v1/email/retry/:emailId` - Retry failed email

## Installation

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment variables**:

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Set up database**:

   ```bash
   # Create PostgreSQL database
   createdb notifications
   ```

4. **Run the service**:

   ```bash
   # Development
   npm run dev

   # Production
   npm run build
   npm start
   ```

## Docker

Build and run using Docker:

```bash
# Build image
docker build -t notification-service .

# Run container
docker run -p 3005:3005 --env-file .env notification-service
```

## API Usage Examples

### Send Custom Email

```bash
curl -X POST http://localhost:3005/api/v1/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "toName": "John Doe",
    "subject": "Test Email",
    "htmlContent": "<h1>Hello John!</h1><p>This is a test email.</p>",
    "emailType": "general"
  }'
```

### Send Password Reset Email

```bash
curl -X POST http://localhost:3005/api/v1/email/password-reset \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "resetToken": "abc123token",
    "userName": "John Doe"
  }'
```

### Send Welcome Email

```bash
curl -X POST http://localhost:3005/api/v1/email/welcome \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "userName": "John Doe",
    "verificationToken": "verification123token"
  }'
```

### Get Email History

```bash
curl "http://localhost:3005/api/v1/email/history?limit=10&offset=0"
```

## Email Templates

The service includes default templates for:

- **Password Reset**: Template for password reset emails
- **Welcome**: Template for new user welcome emails
- **Email Verification**: Template for email verification

Templates support variable substitution using `{{variableName}}` syntax.

## Monitoring

### Health Check

```bash
curl http://localhost:3005/
```

### Email Status Monitoring

- Email logs are stored in the database with detailed status tracking
- Failed emails can be retried up to 3 times
- Email delivery status is tracked when supported by Brevo

## Development

### Code Style

```bash
# Lint code
npm run lint

# Format code
npm run format
```

### Testing

```bash
# Run tests
npm test
```

## Security Considerations

1. **API Keys**: Store Brevo API keys securely in environment variables
2. **CORS**: Configure allowed origins appropriately
3. **Rate Limiting**: Consider implementing rate limiting for email endpoints
4. **Input Validation**: All inputs are validated using Zod schemas
5. **Email Content**: Sanitize HTML content to prevent XSS

## Troubleshooting

### Common Issues

1. **Brevo API Key Not Working**:
   - Verify the API key is correct
   - Check Brevo account status and limits

2. **Database Connection Issues**:
   - Verify PostgreSQL is running
   - Check database URL and credentials

3. **Email Not Sending**:
   - Check Brevo service status
   - Verify sender email is configured in Brevo
   - Check email logs for error details

### Logs

Service logs are available in:

- Console output (development)
- `logs/combined.log` (all logs)
- `logs/error.log` (error logs only)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
