# Notification Service API Documentation

## Base URL

```
http://localhost:3005
```

## Authentication

Currently, the service does not require authentication. In production, consider implementing API key authentication or JWT tokens.

## Endpoints

### Health Check

#### GET /

Check if the notification service is running.

**Response:**

```json
{
  "success": true,
  "message": "Notification service is running",
  "data": {
    "service": "notification-service",
    "brevoConfigured": true,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Email Operations

#### POST /api/v1/email/send

Send a custom email.

**Request Body:**

```json
{
  "to": "user@example.com",
  "toName": "John Doe",
  "subject": "Test Email",
  "htmlContent": "<h1>Hello John!</h1><p>This is a test email.</p>",
  "textContent": "Hello John! This is a test email.",
  "emailType": "general",
  "userId": "uuid-of-user",
  "metadata": {
    "campaign": "welcome_series"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "emailId": "uuid-of-email-log",
    "status": "sent",
    "sentAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/v1/email/send-template

Send an email using a predefined template.

**Request Body:**

```json
{
  "to": "user@example.com",
  "toName": "John Doe",
  "templateType": "password_reset",
  "templateParams": {
    "userName": "John Doe",
    "resetUrl": "https://app.medilink.com/reset?token=abc123",
    "expiryTime": "15 minutes"
  },
  "userId": "uuid-of-user",
  "metadata": {
    "source": "forgot_password_flow"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Template email sent successfully",
  "data": {
    "emailId": "uuid-of-email-log",
    "status": "sent",
    "sentAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/v1/email/password-reset

Send a password reset email (convenience endpoint).

**Request Body:**

```json
{
  "email": "user@example.com",
  "resetToken": "abc123token",
  "userName": "John Doe"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password reset email sent successfully",
  "data": {
    "emailId": "uuid-of-email-log",
    "status": "sent"
  }
}
```

#### POST /api/v1/email/welcome

Send a welcome email to new users.

**Request Body:**

```json
{
  "email": "user@example.com",
  "userName": "John Doe",
  "verificationToken": "verification123token"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Welcome email sent successfully",
  "data": {
    "emailId": "uuid-of-email-log",
    "status": "sent"
  }
}
```

#### GET /api/v1/email/history

Get email history with optional filtering.

**Query Parameters:**

- `userId` (optional): Filter by user ID
- `limit` (optional): Number of emails to return (default: 50)
- `offset` (optional): Number of emails to skip (default: 0)

**Example:**

```
GET /api/v1/email/history?userId=user-uuid&limit=10&offset=0
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "email-uuid",
      "recipientEmail": "user@example.com",
      "recipientName": "John Doe",
      "subject": "Password Reset",
      "emailType": "password_reset",
      "status": "sent",
      "sentAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "count": 1
  }
}
```

#### POST /api/v1/email/retry/:emailId

Retry sending a failed email.

**Parameters:**

- `emailId`: UUID of the failed email

**Response:**

```json
{
  "success": true,
  "message": "Email retry completed",
  "data": {
    "emailId": "uuid-of-email-log",
    "status": "sent",
    "retryCount": 1
  }
}
```

## Email Types

The service supports the following email types:

- `password_reset`: Password reset emails
- `user_onboarding`: User onboarding emails
- `welcome`: Welcome emails for new users
- `email_verification`: Email verification emails
- `lab_report`: Lab report notifications
- `clinic_visit`: Clinic visit notifications
- `appointment_reminder`: Appointment reminder emails
- `general`: General purpose emails

## Template Types

Predefined templates available:

### password_reset

Variables:

- `userName`: User's name
- `resetUrl`: Password reset URL
- `expiryTime`: Token expiry time

### welcome

Variables:

- `userName`: User's name
- `verificationUrl`: Email verification URL (optional)
- `supportEmail`: Support email address

### email_verification

Variables:

- `userName`: User's name
- `verificationUrl`: Email verification URL

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "errors": [] // For validation errors
}
```

### Common HTTP Status Codes

- `200`: Success
- `400`: Bad Request (validation errors)
- `404`: Resource not found
- `500`: Internal Server Error

## Email Status Tracking

Emails can have the following statuses:

- `pending`: Email is queued for sending
- `sent`: Email has been sent successfully
- `failed`: Email sending failed
- `delivered`: Email was delivered (when webhook is configured)
- `bounced`: Email bounced
- `spam`: Email marked as spam

## Integration Examples

### Node.js/JavaScript

```javascript
const axios = require("axios");

// Send password reset email
const sendPasswordReset = async (email, resetToken, userName) => {
  try {
    const response = await axios.post(
      "http://localhost:3005/api/v1/email/password-reset",
      {
        email,
        resetToken,
        userName,
      }
    );
    console.log("Email sent:", response.data);
  } catch (error) {
    console.error("Failed to send email:", error.response.data);
  }
};
```

### cURL

```bash
# Send custom email
curl -X POST http://localhost:3005/api/v1/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "subject": "Test Email",
    "htmlContent": "<h1>Hello!</h1>",
    "emailType": "general"
  }'
```

## Environment Configuration

Required environment variables:

```env
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=support@medilink.com
BREVO_SENDER_NAME=MediLink Support
FRONTEND_URL=https://app.medilink.com
```

## Rate Limiting

Consider implementing rate limiting in production to prevent abuse:

- Per IP: 100 requests per minute
- Per email address: 10 emails per hour
- Per user: 50 emails per day
