const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

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
    
    // Enable multi-user mode for OAuth support
    await enableMultiUserMode();
    
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

/**
 * Enable multi-user mode for OAuth support
 */
async function enableMultiUserMode() {
  const prisma = new PrismaClient();
  try {
    console.log('[Database] Enabling multi-user mode for OAuth support...');
    
    // Check if setting exists
    const existingSetting = await prisma.system_settings.findUnique({
      where: { label: 'multi_user_mode' }
    });
    
    if (existingSetting?.value === 'true') {
      console.log('[Database] Multi-user mode already enabled');
    } else if (existingSetting) {
      await prisma.system_settings.update({
        where: { label: 'multi_user_mode' },
        data: { value: 'true' }
      });
      console.log('[Database] Multi-user mode enabled successfully');
    } else {
      await prisma.system_settings.create({
        data: {
          label: 'multi_user_mode',
          value: 'true'
        }
      });
      console.log('[Database] Multi-user mode enabled successfully');
    }
  } catch (error) {
    console.error('[Database] Failed to enable multi-user mode:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = {
  initializeDatabase
};