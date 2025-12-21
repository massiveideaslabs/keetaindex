import pool from './connection.js';

async function runMigrations() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create apps table
    await client.query(`
      CREATE TABLE IF NOT EXISTS apps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        url VARCHAR(500) NOT NULL,
        category VARCHAR(50) NOT NULL,
        tags JSONB DEFAULT '[]'::jsonb,
        added_at BIGINT NOT NULL,
        clicks INTEGER DEFAULT 0,
        featured BOOLEAN DEFAULT false,
        approved BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add approved column if it doesn't exist (for existing databases)
    await client.query(`
      ALTER TABLE apps 
      ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false
    `);

    // Approve all existing apps (they were submitted before approval system)
    await client.query(`
      UPDATE apps 
      SET approved = true 
      WHERE approved IS NULL OR approved = false
    `);

    // Create reports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        app_id UUID NOT NULL,
        app_name VARCHAR(255) NOT NULL,
        reasons JSONB NOT NULL,
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_app FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_apps_category ON apps(category);
      CREATE INDEX IF NOT EXISTS idx_apps_featured ON apps(featured);
      CREATE INDEX IF NOT EXISTS idx_apps_added_at ON apps(added_at);
      CREATE INDEX IF NOT EXISTS idx_reports_app_id ON reports(app_id);
    `);

    await client.query('COMMIT');
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migrations if this file is executed directly (via npm run migrate)
// Only exit if this is the main entry point (not when imported)
const isDirectExecution = process.argv[1]?.endsWith('migrations.ts') || 
                          process.argv[1]?.includes('migrations.ts');

if (isDirectExecution) {
  runMigrations()
    .then(() => {
      console.log('Migrations finished');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration error:', err);
      process.exit(1);
    });
}

export { runMigrations };

