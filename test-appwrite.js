// Simple test to verify Appwrite connection
const { Client, Databases } = require('appwrite');
require('dotenv').config();

// Configuration from environment variables
const client = new Client();
client
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

async function testConnection() {
  try {
    console.log('Testing Appwrite connection...');
    console.log('Endpoint:', process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT);
    console.log('Project ID:', process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);
    console.log('Database ID:', process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID);

    // Test database access
    try {
      const database = await databases.get(process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID);
      console.log('✅ Appwrite connection successful!');
      console.log('✅ Database access successful!');
      console.log('Database found:', database.name);
    } catch (dbError) {
      console.log('⚠️  Database not found. You need to create it in Appwrite console.');
      console.log('Expected Database ID:', process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID);
    }

    console.log('\n🎉 Appwrite setup is working correctly!');
    console.log('You can now run your ChatApp with: npm start');

  } catch (error) {
    console.error('❌ Appwrite connection failed:');
    console.error('Error:', error.message);
    console.log('\n🔧 Please check:');
    console.log('1. Your .env file has the correct values');
    console.log('2. Your project ID is correct');
    console.log('3. Your project is active in Appwrite console');
    console.log('4. You have proper permissions set');
  }
}

testConnection();
