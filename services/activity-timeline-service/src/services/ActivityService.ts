import { Repository } from "typeorm";
import { ActivityEvent } from "../entity/ActivityEvent";
import {
  ActivityEvent as ActivityEventInterface,
  TimelineQuery,
  TimelineResponse,
} from "../types";
import { AppDataSource } from "../database";
import logger from "../config/logger";

export class ActivityService {
  private activityRepository: Repository<ActivityEvent>;

  constructor() {
    this.activityRepository = AppDataSource.getRepository(ActivityEvent);
  }

  async createActivity(
    activityData: Omit<ActivityEventInterface, "id">
  ): Promise<ActivityEventInterface> {
    try {
      const activity = this.activityRepository.create(activityData);
      const savedActivity = await this.activityRepository.save(activity);

      logger.info(`Activity created: ${savedActivity.id}`, {
        entityType: savedActivity.entityType,
        entityId: savedActivity.entityId,
        activityType: savedActivity.activityType,
      });

      return this.mapToActivityEvent(savedActivity);
    } catch (error) {
      logger.error("Failed to create activity:", error);
      throw new Error("Failed to create activity");
    }
  }

  async getTimeline(query: TimelineQuery): Promise<TimelineResponse> {
    try {
      const queryBuilder =
        this.activityRepository.createQueryBuilder("activity");

      if (query.entityType) {
        queryBuilder.andWhere("activity.entityType = :entityType", {
          entityType: query.entityType,
        });
      }
      if (query.entityId) {
        queryBuilder.andWhere("activity.entityId = :entityId", {
          entityId: query.entityId,
        });
      }
      if (query.activityTypes && query.activityTypes.length > 0) {
        queryBuilder.andWhere("activity.activityType IN (:...activityTypes)", {
          activityTypes: query.activityTypes,
        });
      }

      if (query.startDate) {
        queryBuilder.andWhere("activity.timestamp >= :startDate", {
          startDate: query.startDate,
        });
      }
      if (query.endDate) {
        queryBuilder.andWhere("activity.timestamp <= :endDate", {
          endDate: query.endDate,
        });
      }

      const limit = query.limit || 50;
      const offset = query.offset || 0;

      queryBuilder.orderBy("activity.timestamp", "DESC");
      queryBuilder.skip(offset).take(limit);

      const [activities, totalCount] = await Promise.all([
        queryBuilder.getMany(),
        queryBuilder.getCount(),
      ]);

      const mappedActivities = activities.map((activity: ActivityEvent) =>
        this.mapToActivityEvent(activity)
      );

      return {
        activities: mappedActivities,
        totalCount,
        hasMore: offset + activities.length < totalCount,
      };
    } catch (error) {
      logger.error("Failed to get timeline:", error);
      throw new Error("Failed to get timeline");
    }
  }

  async getActivityByEntity(
    entityType: string,
    entityId: string,
    limit = 20
  ): Promise<ActivityEventInterface[]> {
    try {
      const activities = await this.activityRepository.find({
        where: { entityType: entityType as any, entityId },
        order: { timestamp: "DESC" },
        take: limit,
      });

      return activities.map((activity: ActivityEvent) =>
        this.mapToActivityEvent(activity)
      );
    } catch (error) {
      logger.error("Failed to get activities by entity:", error);
      throw new Error("Failed to get activities by entity");
    }
  }

  private mapToActivityEvent(entity: ActivityEvent): ActivityEventInterface {
    return {
      id: entity.id,
      entityType: entity.entityType,
      entityId: entity.entityId,
      activityType: entity.activityType,
      description: entity.description,
      timestamp: entity.timestamp,
      metadata: entity.metadata,
      source: entity.source,
    };
  }
}
