import { Client, Account, Databases, Storage } from 'appwrite';

// Appwrite configuration using environment variables
export const APPWRITE_CONFIG = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '',
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || 'chatapp-db',

  // Collection IDs
  usersCollectionId: process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID || 'users',
  friendshipsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_FRIENDSHIPS_COLLECTION_ID || 'friendships',
  chatRoomsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CHATROOMS_COLLECTION_ID || 'chatRooms',
  messagesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID || 'messages',

  // Storage bucket ID
  storageId: process.env.EXPO_PUBLIC_APPWRITE_STORAGE_ID || 'chat-media',
};

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId);

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export default client;
