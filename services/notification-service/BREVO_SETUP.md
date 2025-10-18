# Brevo Setup Guide for MediLink Notification Service

This guide will help you set up Brevo (formerly SendinBlue) for email notifications in the MediLink platform.

## What is Brevo?

Brevo is a comprehensive email marketing and transactional email service that provides reliable email delivery, advanced analytics, and easy-to-use APIs for sending emails programmatically.

## Getting Started with Brevo

### 1. Create a Brevo Account

1. Visit [https://www.brevo.com](https://www.brevo.com)
2. Click "Sign up for free"
3. Fill out the registration form
4. Verify your email address
5. Complete the account setup

### 2. Set Up Sender Authentication

#### Add and Verify Your Domain

1. Go to **Settings** > **Senders & IP**
2. Click **Domains**
3. Add your domain (e.g., `medilink.com`)
4. Follow the DNS verification steps:
   - Add the provided TXT record to your DNS
   - Add SPF record: `v=spf1 include:spf.brevo.com ~all`
   - Add DKIM records as provided by Brevo

#### Create Sender Identity

1. Go to **Settings** > **Senders & IP**
2. Click **Senders**
3. Add a new sender:
   - **Name**: MediLink Support
   - **Email**: support@medilink.com (or your verified domain)
   - **Reply-to**: Same as sender or different support email

### 3. Get Your API Key

1. Go to **Settings** > **SMTP & API**
2. Click **API Keys**
3. Click **Generate a new API key**
4. Give it a name (e.g., "MediLink Notification Service")
5. Copy the generated API key
6. **Important**: Store this key securely - you won't be able to see it again

### 4. Configure Environment Variables

Add these to your `.env` file:

```env
# Brevo Configuration
BREVO_API_KEY=xkeysib-your-api-key-here
BREVO_SENDER_NAME=MediLink Support
BREVO_SENDER_EMAIL=support@medilink.com
```

### 5. Test Your Configuration

You can test your Brevo setup using the notification service health endpoint:

```bash
curl http://localhost:3005/
```

Look for `"brevoConfigured": true` in the response.

## Brevo Features Used by MediLink

### Transactional Emails

- Password reset emails
- Welcome emails
- Email verification
- Lab report notifications
- Appointment reminders

### Email Analytics

- Delivery rates
- Open rates
- Click rates
- Bounce tracking

### Template Management

- HTML email templates
- Variable substitution
- A/B testing capabilities

## Email Templates in Brevo

While the notification service includes default templates, you can also create templates in Brevo:

### Creating Templates in Brevo Dashboard

1. Go to **Campaigns** > **Templates**
2. Click **Create a new template**
3. Choose **Transactional template**
4. Use the drag-and-drop editor
5. Add variables using `{{ params.variableName }}`
6. Save and get the template ID

### Using Brevo Templates in Code

```javascript
// Send email using Brevo template ID
const response = await emailService.sendEmail({
  to: "user@example.com",
  templateId: 123, // Brevo template ID
  templateParams: {
    userName: "John Doe",
    resetUrl: "https://app.medilink.com/reset",
  },
});
```

## Brevo Pricing

### Free Tier

- 300 emails/day
- Unlimited contacts
- Email templates
- 24/7 support

### Paid Plans

- Starter: $25/month (20K emails/month)
- Business: $65/month (50K emails/month)
- Enterprise: Custom pricing

For MediLink's needs, start with the free tier for development and testing, then upgrade based on email volume.

## Best Practices

### Email Content

1. **Subject Lines**: Keep under 50 characters
2. **HTML**: Use inline CSS for better compatibility
3. **Images**: Host on CDN, include alt text
4. **Links**: Use HTTPS and track clicks

### Deliverability

1. **Warm Up**: Start with low volume, gradually increase
2. **List Hygiene**: Remove bounced emails promptly
3. **Engagement**: Monitor open/click rates
4. **Authentication**: Ensure SPF, DKIM, DMARC are set up

### Security

1. **API Keys**: Never commit to version control
2. **Rate Limiting**: Implement in your application
3. **Monitoring**: Set up alerts for delivery issues
4. **Data Privacy**: Comply with GDPR/CCPA

## Monitoring and Analytics

### Brevo Dashboard

- Real-time delivery statistics
- Email performance metrics
- Bounce and complaint tracking
- Contact management

### Webhook Integration

Configure webhooks to receive delivery events:

```javascript
// Webhook endpoint to receive delivery status
app.post("/webhook/brevo", (req, res) => {
  const { event, email, messageId } = req.body;

  // Update email log with delivery status
  emailService.updateEmailStatus(messageId, event);

  res.status(200).send("OK");
});
```

### Available Webhook Events

- `delivered`: Email successfully delivered
- `opened`: Email opened by recipient
- `clicked`: Link clicked in email
- `bounced`: Email bounced
- `spam`: Email marked as spam
- `unsubscribed`: Recipient unsubscribed

## Troubleshooting

### Common Issues

#### 1. API Key Invalid

```
Error: Invalid API key
```

**Solution**: Check that the API key is correct and has not expired.

#### 2. Sender Email Not Verified

```
Error: Sender email not verified
```

**Solution**: Verify your sender email in Brevo dashboard.

#### 3. Domain Authentication Issues

```
Error: Domain not authenticated
```

**Solution**: Complete DNS verification for your domain.

#### 4. Rate Limits Exceeded

```
Error: Too many requests
```

**Solution**: Implement rate limiting and reduce send frequency.

### Debug Mode

Enable debug mode for detailed logging:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

### Testing with Brevo

Use Brevo's test mode to avoid affecting your email quota:

```javascript
// In development, use a test recipient
const testEmail =
  process.env.NODE_ENV === "development" ? "test@example.com" : actualRecipient;
```

## Support and Resources

### Documentation

- [Brevo API Documentation](https://developers.brevo.com/)
- [Email Templates Guide](https://help.brevo.com/hc/en-us/sections/360003204479-Templates)
- [Deliverability Best Practices](https://help.brevo.com/hc/en-us/sections/360003204679-Deliverability)

### Support

- Brevo Help Center: [https://help.brevo.com](https://help.brevo.com)
- Email: support@brevo.com
- Chat support available in dashboard

### Status Page

Monitor Brevo service status: [https://status.brevo.com](https://status.brevo.com)

## Migration from Other Providers

If migrating from other email providers:

1. **Export Templates**: Save existing email templates
2. **Update DNS**: Add Brevo DNS records
3. **Update Code**: Replace API calls with Brevo SDK
4. **Test Thoroughly**: Verify all email types work correctly
5. **Monitor**: Watch delivery rates closely after migration

This completes the Brevo setup for your MediLink notification service!
