const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Initialize database by running Prisma migrations
 * This ensures the database schema is created in production
 */
async function initializeDatabase() {
  try {
    console.log("[Database] Checking database initialization...");
    
    // Check if database file exists (for SQLite)
    const dbPath = path.join(__dirname, '../../storage/anythingllm.db');
    const dbExists = fs.existsSync(dbPath);
    
    if (!dbExists) {
      console.log("[Database] Database file not found, creating...");
    }
    
    // Generate Prisma client first
    console.log("[Database] Generating Prisma client...");
    execSync('npx prisma generate', {
      cwd: path.join(__dirname, '../..'),
      stdio: 'inherit'
    });
    
    // Deploy migrations to create/update schema
    console.log("[Database] Deploying database migrations...");
    execSync('npx prisma migrate deploy', {
      cwd: path.join(__dirname, '../..'),
      stdio: 'inherit'
    });
    
    console.log("[Database] Database initialization completed successfully");
    
  } catch (error) {
    console.error("[Database] Failed to initialize database:", error.message);
    
    // If migration fails, try a fallback approach
    try {
      console.log("[Database] Attempting fallback database push...");
      execSync('npx prisma db push --accept-data-loss', {
        cwd: path.join(__dirname, '../..'),
        stdio: 'inherit'
      });
      console.log("[Database] Fallback database push completed");
    } catch (fallbackError) {
      console.error("[Database] Fallback approach also failed:", fallbackError.message);
      throw new Error("Database initialization failed");
    }
  }
}

module.exports = {
  initializeDatabase
};