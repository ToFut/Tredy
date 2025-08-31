// Script to create a Google user directly in AnythingLLM database
const bcrypt = require('bcrypt');

async function createGoogleUser() {
  // Initialize Prisma
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    // Get the Google user's email from Supabase (you mentioned you see it there)
    // For now, let's create a user that matches what Google would provide
    const googleEmail = 'your-google-email@gmail.com'; // Replace with your actual Google email
    
    // Check if user exists
    let user = await prisma.users.findFirst({
      where: { username: googleEmail }
    });
    
    if (!user) {
      // Create a new user with a temporary password
      const hashedPassword = bcrypt.hashSync('TempPassword123!', 10);
      
      user = await prisma.users.create({
        data: {
          username: googleEmail,
          password: hashedPassword,
          role: 'default',
          suspended: 0,
          seen_recovery_codes: false,
          supabase_id: 'google-oauth-user' // Mark as OAuth user
        }
      });
      
      console.log('Google user created successfully!');
    } else {
      console.log('User already exists');
    }
    
    // Generate a JWT token for immediate login
    const JWT = require('jsonwebtoken');
    const token = JWT.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'my-random-string-for-seeding',
      { expiresIn: '30d' }
    );
    
    console.log('\n=== Login Instructions ===');
    console.log('1. Open browser console (F12)');
    console.log('2. Run these commands:');
    console.log(`localStorage.setItem('anythingllm_authToken', '${token}');`);
    console.log(`localStorage.setItem('anythingllm_user', '${JSON.stringify({
      id: user.id,
      username: user.username,
      role: user.role
    })}');`);
    console.log(`localStorage.setItem('anythingllm_authTimestamp', '${Date.now()}');`);
    console.log('3. Navigate to http://localhost:8126/');
    console.log('\nYou will be logged in immediately!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createGoogleUser();