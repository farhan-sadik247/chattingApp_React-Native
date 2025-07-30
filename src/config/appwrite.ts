import { Client, Account, Databases, Storage } from 'appwrite';

// Debug environment variables
console.log('🔧 Appwrite Environment Variables:');
console.log('EXPO_PUBLIC_APPWRITE_ENDPOINT:', process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT);
console.log('EXPO_PUBLIC_APPWRITE_PROJECT_ID:', process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);
console.log('EXPO_PUBLIC_APPWRITE_DATABASE_ID:', process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID);

// Appwrite configuration using environment variables
export const APPWRITE_CONFIG = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1',
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '6888ef1900086dece436',
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || 'chatapp-db',

  // Collection IDs
  usersCollectionId: process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID || 'users',
  friendshipsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_FRIENDSHIPS_COLLECTION_ID || 'friendships',
  chatRoomsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CHATROOMS_COLLECTION_ID || 'chatRooms',
  messagesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID || 'messages',

  // Storage bucket ID
  storageId: process.env.EXPO_PUBLIC_APPWRITE_STORAGE_ID || 'chat-media',
};

console.log('🚀 Final Appwrite Config:', APPWRITE_CONFIG);

// Validate required configuration
if (!APPWRITE_CONFIG.projectId) {
  console.error('❌ APPWRITE_PROJECT_ID is missing!');
  throw new Error('Appwrite Project ID is required');
}

// Initialize Appwrite client
const client = new Client();

try {
  client
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId);

  console.log('✅ Appwrite client initialized with:', {
    endpoint: APPWRITE_CONFIG.endpoint,
    projectId: APPWRITE_CONFIG.projectId
  });
} catch (error) {
  console.error('❌ Failed to initialize Appwrite client:', error);
  throw error;
}

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Test connection function
export const testAppwriteConnection = async () => {
  try {
    console.log('🔍 Testing Appwrite connection...');
    const health = await client.call('GET', '/health');
    console.log('✅ Appwrite connection successful:', health);
    return true;
  } catch (error) {
    console.error('❌ Appwrite connection failed:', error);
    return false;
  }
};

export default client;
