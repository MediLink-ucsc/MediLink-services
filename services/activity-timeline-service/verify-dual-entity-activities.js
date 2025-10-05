const { DataSource } = require("typeorm");
require("dotenv").config();

const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "medilink",
  schema: "activity_timeline",
  entities: [],
  synchronize: false,
  logging: false,
});

async function verifyDualEntityActivities() {
  await AppDataSource.initialize();
  console.log("🔗 Connected to database");

  // Query for recent lab workflow activities
  const recentActivities = await AppDataSource.query(`
    SELECT 
      entity_type,
      entity_id,
      activity_type,
      description,
      metadata,
      source,
      created_at
    FROM activity_timeline.activity_events 
    WHERE activity_type IN ('LAB_SAMPLE_CREATED', 'LAB_SAMPLE_UPDATED', 'LAB_RESULT_PROCESSED', 'LAB_RESULT_EXTRACTED')
    ORDER BY created_at DESC 
    LIMIT 10
  `);

  console.log("📊 Recent lab workflow activities:");
  console.log("=====================================");

  recentActivities.forEach((activity, index) => {
    console.log(
      `${index + 1}. ${activity.entity_type.toUpperCase()} Activity:`
    );
    console.log(`   Entity ID: ${activity.entity_id}`);
    console.log(`   Type: ${activity.activity_type}`);
    console.log(`   Description: ${activity.description}`);
    console.log(`   Metadata:`, JSON.stringify(activity.metadata, null, 2));
    console.log(`   Source:`, JSON.stringify(activity.source, null, 2));
    console.log(`   Created: ${activity.created_at}`);
    console.log("   ---");
  });

  // Count activities by entity type for lab workflow topics
  const entityCounts = await AppDataSource.query(`
    SELECT 
      entity_type,
      activity_type,
      COUNT(*) as count
    FROM activity_timeline.activity_events 
    WHERE activity_type IN ('LAB_SAMPLE_CREATED', 'LAB_SAMPLE_UPDATED', 'LAB_RESULT_PROCESSED', 'LAB_RESULT_EXTRACTED')
    GROUP BY entity_type, activity_type
    ORDER BY entity_type, activity_type
  `);

  console.log("📈 Activity counts by entity type:");
  console.log("===================================");
  entityCounts.forEach((count) => {
    console.log(
      `${count.entity_type}: ${count.activity_type} = ${count.count}`
    );
  });

  await AppDataSource.destroy();
}

verifyDualEntityActivities().catch(console.error);
