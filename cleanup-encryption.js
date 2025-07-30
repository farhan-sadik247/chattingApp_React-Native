// Script to clean up encrypted messages and convert them to plain text
// Run this script if you have existing encrypted messages in your database

const { Client, Databases, Query } = require('appwrite');
require('dotenv').config();

// Configuration
const client = new Client();
client
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

const APPWRITE_CONFIG = {
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || 'chatapp-db',
  messagesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID || 'messages',
  chatRoomsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CHATROOMS_COLLECTION_ID || 'chatRooms',
};

async function cleanupEncryptedMessages() {
  try {
    console.log('🧹 Starting cleanup of encrypted messages...');
    
    // Get all messages
    const messagesResponse = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.messagesCollectionId,
      [Query.limit(1000)] // Adjust limit as needed
    );

    console.log(`Found ${messagesResponse.documents.length} messages to check`);

    let updatedCount = 0;
    let plainTextCount = 0;

    for (const message of messagesResponse.documents) {
      try {
        // Check if message content looks encrypted (base64-like)
        const content = message.content;
        
        if (!content) {
          console.log(`Message ${message.$id}: No content, skipping`);
          continue;
        }

        // Simple heuristic: if content is base64-like and doesn't contain normal words
        const isLikelyEncrypted = /^[A-Za-z0-9+/=]+$/.test(content) && 
                                  content.length > 20 && 
                                  !content.includes(' ') &&
                                  !content.includes('hello') &&
                                  !content.includes('hi') &&
                                  !content.includes('test');

        if (isLikelyEncrypted) {
          console.log(`Message ${message.$id}: Appears encrypted, replacing with placeholder`);
          
          // Replace encrypted content with a placeholder
          await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.messagesCollectionId,
            message.$id,
            {
              content: '[Previous encrypted message - please resend]'
            }
          );
          
          updatedCount++;
        } else {
          console.log(`Message ${message.$id}: Appears to be plain text`);
          plainTextCount++;
        }
      } catch (error) {
        console.error(`Error processing message ${message.$id}:`, error);
      }
    }

    console.log(`✅ Cleanup complete!`);
    console.log(`📊 Results:`);
    console.log(`   - Plain text messages: ${plainTextCount}`);
    console.log(`   - Encrypted messages replaced: ${updatedCount}`);

  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

async function removeEncryptionKeysFromChatRooms() {
  try {
    console.log('🔑 Removing encryption keys from chat rooms...');
    
    // Get all chat rooms
    const chatRoomsResponse = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.chatRoomsCollectionId,
      [Query.limit(1000)]
    );

    console.log(`Found ${chatRoomsResponse.documents.length} chat rooms to update`);

    let updatedCount = 0;

    for (const chatRoom of chatRoomsResponse.documents) {
      try {
        if (chatRoom.encryptionKey) {
          console.log(`Removing encryption key from chat room ${chatRoom.$id}`);
          
          // Remove the encryption key field
          // Note: Appwrite doesn't allow removing fields, so we'll set it to empty string
          await databases.updateDocument(
            APPWRITE_CONFIG.databaseId,
            APPWRITE_CONFIG.chatRoomsCollectionId,
            chatRoom.$id,
            {
              encryptionKey: ''
            }
          );
          
          updatedCount++;
        }
      } catch (error) {
        console.error(`Error updating chat room ${chatRoom.$id}:`, error);
      }
    }

    console.log(`✅ Updated ${updatedCount} chat rooms`);

  } catch (error) {
    console.error('❌ Chat room cleanup failed:', error);
  }
}

async function main() {
  console.log('🚀 Starting encryption cleanup process...');
  console.log('Configuration:');
  console.log('- Endpoint:', process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT);
  console.log('- Project ID:', process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID);
  console.log('- Database ID:', APPWRITE_CONFIG.databaseId);
  
  await cleanupEncryptedMessages();
  await removeEncryptionKeysFromChatRooms();
  
  console.log('🎉 All cleanup tasks completed!');
  console.log('');
  console.log('📝 Next steps:');
  console.log('1. Test your app to ensure messages work correctly');
  console.log('2. Send new messages to verify they are stored as plain text');
  console.log('3. Consider removing the encryption service files if no longer needed');
}

// Run the cleanup
main().catch(console.error);
