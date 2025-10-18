# Activity Timeline Service API Examples

This document provides examples of how to use the Activity Timeline Service API.

## Base URL

```
http://localhost:3006/api/v1/activity
```

## 1. Get Timeline for All Activities

Get the latest activities across all entities:

```bash
curl -X GET "http://localhost:3006/api/v1/activity/timeline?limit=10"
```

Response:

```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "64a1234567890abcdef123456",
        "entityType": "patient",
        "entityId": "patient-123",
        "activityType": "prescription_filled",
        "description": "Prescription filled for Amoxicillin",
        "timestamp": "2025-10-05T10:30:00.000Z",
        "metadata": {
          "prescriptionId": "rx-456",
          "medicationName": "Amoxicillin",
          "dosage": "500mg",
          "doctorId": "dr-789"
        },
        "source": {
          "service": "patient-record-service",
          "topic": "prescription.filled"
        }
      }
    ],
    "totalCount": 150,
    "hasMore": true
  }
}
```

## 2. Get Timeline for Specific Patient

Get all activities for a specific patient:

```bash
curl -X GET "http://localhost:3006/api/v1/activity/timeline?entityType=patient&entityId=patient-123&limit=20"
```

## 3. Get Timeline with Date Range

Get activities within a specific date range:

```bash
curl -X GET "http://localhost:3006/api/v1/activity/timeline?startDate=2025-10-01&endDate=2025-10-05&limit=50"
```

## 4. Get Timeline for Specific Activity Types

Get only prescription and lab-related activities:

```bash
curl -X GET "http://localhost:3006/api/v1/activity/timeline?activityTypes=prescription_filled,lab_order_created,lab_result_processed"
```

## 5. Get Activities for a Specific Entity

Get activities for a specific patient using the entity endpoint:

```bash
curl -X GET "http://localhost:3006/api/v1/activity/entities/patient/patient-123/activities?limit=15"
```

Response:

```json
{
  "success": true,
  "data": {
    "entityType": "patient",
    "entityId": "patient-123",
    "activities": [
      {
        "id": "64a1234567890abcdef123456",
        "entityType": "patient",
        "entityId": "patient-123",
        "activityType": "soap_note_created",
        "description": "SOAP note created",
        "timestamp": "2025-10-05T14:20:00.000Z",
        "metadata": {
          "soapNoteId": "soap-789",
          "doctorId": "dr-456",
          "chiefComplaint": "Chest pain"
        },
        "source": {
          "service": "patient-record-service",
          "topic": "soapnote.created"
        }
      }
    ]
  }
}
```

## 6. Get Institution Activities

Get activities for a specific institution:

```bash
curl -X GET "http://localhost:3006/api/v1/activity/entities/institution/inst-456/activities"
```

## 7. Get User Activities

Get activities for a specific user:

```bash
curl -X GET "http://localhost:3006/api/v1/activity/entities/user/user-789/activities"
```

## 8. Complex Query Example

Get lab-related activities for a specific patient in the last 7 days:

```bash
curl -X GET "http://localhost:3006/api/v1/activity/timeline?entityType=patient&entityId=patient-123&activityTypes=lab_order_created,lab_sample_created,lab_result_processed&startDate=2025-09-28&limit=25"
```

## 9. Paginated Results

Get second page of results (skip first 50):

```bash
curl -X GET "http://localhost:3006/api/v1/activity/timeline?limit=50&offset=50"
```

## 10. Health Check

Check if the service is healthy:

```bash
curl -X GET "http://localhost:3006/api/v1/activity/health"
```

Response:

```json
{
  "success": true,
  "service": "activity-timeline-service",
  "status": "healthy",
  "timestamp": "2025-10-05T15:30:00.000Z"
}
```

## Activity Types Reference

The following activity types are tracked:

### User Management

- `user_registration` - User account creation
- `institution_registration` - Institution registration

### Patient Care

- `prescription_filled` - Medication prescription filled
- `soap_note_created` - SOAP note documentation
- `quick_exam_created` - Quick examination performed
- `care_plan_created` - Care plan established

### Laboratory

- `lab_order_created` - Lab test ordered
- `lab_sample_created` - Lab sample collected
- `lab_sample_updated` - Lab sample status updated
- `lab_result_processed` - Lab results processed
- `lab_result_extracted` - Lab results extracted from reports

## Error Responses

### Bad Request (400)

```json
{
  "success": false,
  "error": "Invalid query parameters",
  "details": [
    {
      "message": "\"entityType\" must be one of [user, institution, patient]",
      "path": ["entityType"],
      "type": "any.only"
    }
  ]
}
```

### Internal Server Error (500)

```json
{
  "success": false,
  "error": "Internal server error"
}
```

### Not Found (404)

```json
{
  "success": false,
  "error": "Not found"
}
```
