#!/usr/bin/env node

/**
 * Enable Multi-User Mode for AnythingLLM
 * This script enables multi-user mode which is required for user profiles and Supabase OAuth
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function enableMultiUserMode() {
  try {
    console.log('[Multi-User Mode] Checking current settings...');
    
    // Check if multi_user_mode setting exists
    const existingSetting = await prisma.system_settings.findUnique({
      where: { label: 'multi_user_mode' }
    });
    
    if (existingSetting) {
      if (existingSetting.value === 'true') {
        console.log('[Multi-User Mode] Already enabled!');
      } else {
        // Update existing setting
        await prisma.system_settings.update({
          where: { label: 'multi_user_mode' },
          data: { value: 'true' }
        });
        console.log('[Multi-User Mode] Successfully enabled!');
      }
    } else {
      // Create new setting
      await prisma.system_settings.create({
        data: {
          label: 'multi_user_mode',
          value: 'true'
        }
      });
      console.log('[Multi-User Mode] Successfully enabled!');
    }
    
    // Also ensure users have proper roles
    const users = await prisma.users.findMany();
    console.log(`[Multi-User Mode] Found ${users.length} user(s)`);
    
    for (const user of users) {
      console.log(`[Multi-User Mode] User: ${user.username} - Role: ${user.role} - Supabase: ${user.supabaseId ? 'Yes' : 'No'}`);
      
      // Ensure first user is admin if not already set
      if (users.indexOf(user) === 0 && user.role !== 'admin') {
        await prisma.users.update({
          where: { id: user.id },
          data: { role: 'admin' }
        });
        console.log(`[Multi-User Mode] Updated ${user.username} to admin role`);
      }
    }
    
    console.log('[Multi-User Mode] Configuration complete!');
    console.log('[Multi-User Mode] Please restart the application for changes to take effect.');
    
  } catch (error) {
    console.error('[Multi-User Mode] Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  enableMultiUserMode();
}

module.exports = { enableMultiUserMode };