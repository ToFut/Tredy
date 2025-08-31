// Script to create a test user directly in AnythingLLM database
const bcrypt = require('bcrypt');

async function createTestUser() {
  // Initialize Prisma
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    // Create a test user
    const hashedPassword = bcrypt.hashSync('TestPassword123!', 10);
    
    const user = await prisma.users.create({
      data: {
        username: 'testuser@example.com',
        password: hashedPassword,
        role: 'default',
        suspended: 0,
        seen_recovery_codes: false
      }
    });
    
    console.log('Test user created successfully!');
    console.log('Username:', user.username);
    console.log('Password: TestPassword123!');
    console.log('User ID:', user.id);
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('User already exists. Updating password...');
      
      const hashedPassword = bcrypt.hashSync('TestPassword123!', 10);
      const user = await prisma.users.update({
        where: { username: 'testuser@example.com' },
        data: { password: hashedPassword }
      });
      
      console.log('Password updated for existing user');
      console.log('Username:', user.username);
      console.log('Password: TestPassword123!');
    } else {
      console.error('Error creating user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();