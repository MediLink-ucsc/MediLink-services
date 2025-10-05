# Activity Timeline Service

The Activity Timeline Service subscribes to all relevant Kafka topics across MediLink microservices and builds unified activity timelines for users, institutions, and patients.

## Features

- **Multi-Entity Timelines**: Creates activity timelines for users, institutions, patients, and labs
- **Event Aggregation**: Subscribes to all relevant Kafka topics from other services
- **Real-time Processing**: Processes events in real-time as they occur
- **Flexible Querying**: Supports filtering by entity type, date ranges, and activity types
- **Scalable Storage**: Uses PostgreSQL for efficient timeline storage and querying

## Subscribed Topics

### User Management

- `user.registered` - User registration events
- `institution.registered` - Institution registration events

### Patient Records

- `prescription.filled` - Prescription fill events
- `laborder.created` - Lab order creation events
- `soapnote.created` - SOAP note creation events
- `quickexam.created` - Quick examination events
- `careplan.created` - Care plan creation events

### Lab Workflow

- `lab.sample.created` - Lab sample creation events
- `lab.sample.updated` - Lab sample updates
- `lab.result.processed` - Lab result processing events
- `lab.result.extracted` - Lab result extraction events

### Lab Management

- `lab.registered` - Lab registration events
- `lab.equipment.added` - Lab equipment addition events
- `lab.equipment.updated` - Lab equipment update events
- `lab.staff.assigned` - Lab staff assignment events
- `lab.workflow.updated` - Lab workflow update events

## API Endpoints

### Get Timeline

```
GET /api/v1/activity/timeline
```

Query Parameters:

- `entityType` (optional): Filter by entity type (user, institution, patient, lab)
- `entityId` (optional): Filter by specific entity ID
- `activityTypes` (optional): Filter by activity types (comma-separated or array)
- `startDate` (optional): Filter activities after this date
- `endDate` (optional): Filter activities before this date
- `limit` (optional): Number of activities to return (default: 50, max: 100)
- `offset` (optional): Number of activities to skip (default: 0)

### Get Entity Activities

```
GET /api/v1/activity/entities/{entityType}/{entityId}/activities
```

Parameters:

- `entityType`: The type of entity (user, institution, patient, lab)
- `entityId`: The ID of the entity
- `limit` (optional): Number of activities to return (default: 20)

### Health Check

```
GET /api/v1/activity/health
```

## Environment Variables

- `PORT` - Service port (default: 3006)
- `MONGO_URL` - MongoDB connection string
- `REDIS_URL` - Redis connection string
- `KAFKA_BROKER` - Kafka broker address
- `KAFKA_GROUP_ID` - Kafka consumer group ID
- `LOG_LEVEL` - Logging level (default: info)
- `ALLOWED_ORIGINS` - CORS allowed origins

## Development

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint
```

## Docker

```bash
# Build image
docker build -t medilink/activity-timeline-service .

# Run container
docker run -p 3006:3006 medilink/activity-timeline-service
```

## Architecture

The service consists of several key components:

1. **KafkaConsumerService**: Manages Kafka consumers and message processing
2. **EventProcessor**: Maps Kafka events to activity timeline events
3. **ActivityService**: Handles timeline creation and querying
4. **ActivityController**: Provides REST API endpoints
5. **ActivityEvent Model**: MongoDB schema for activity events

## Activity Event Structure

```typescript
{
  id: string;
  entityType: "user" | "institution" | "patient";
  entityId: string;
  activityType: string;
  description: string;
  timestamp: Date;
  metadata: Record<string, any>;
  source: {
    service: string;
    topic: string;
  }
}
```

## Database Indexes

The service creates optimized indexes for efficient querying:

- `{ entityType: 1, entityId: 1, timestamp: -1 }`
- `{ entityId: 1, activityType: 1, timestamp: -1 }`
- `{ timestamp: -1 }`

## Monitoring

The service includes:

- Health check endpoint
- Structured logging with correlation IDs
- Error handling and recovery
- Graceful shutdown handling
