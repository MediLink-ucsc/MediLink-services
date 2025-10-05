export interface ActivityEvent {
  id: string;
  entityType: "user" | "institution" | "patient" | "lab";
  entityId: string;
  activityType: string;
  description: string;
  timestamp: Date;
  metadata: Record<string, any>;
  source: {
    service: string;
    topic: string;
  };
}

export interface TimelineQuery {
  entityType?: "user" | "institution" | "patient" | "lab";
  entityId?: string;
  activityTypes?: string[];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface TimelineResponse {
  activities: ActivityEvent[];
  totalCount: number;
  hasMore: boolean;
}

export interface KafkaEventData {
  key: string;
  value: any;
  topic: string;
  partition: number;
  offset: string;
  timestamp: string;
}
