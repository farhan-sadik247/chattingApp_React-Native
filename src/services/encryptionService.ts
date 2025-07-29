import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  generateEncryptionKey,
  generateChatRoomKey,
  encryptMessage,
  decryptMessage,
  generateSecureKey,
  deriveKey,
  generateSalt,
  createMessageHash,
  verifyMessageHash,
} from '../utils/encryption';

export class EncryptionService {
  private static readonly USER_KEY_PREFIX = 'user_key_';
  private static readonly CHAT_KEY_PREFIX = 'chat_key_';

  // Initialize user encryption keys
  async initializeUserKeys(userId: string): Promise<void> {
    try {
      const existingKey = await this.getUserKey(userId);
      if (!existingKey) {
        const newKey = await generateSecureKey();
        await this.storeUserKey(userId, newKey);
      }
    } catch (error) {
      console.error('Initialize user keys error:', error);
      throw error;
    }
  }

  // Store user's private key securely
  private async storeUserKey(userId: string, key: string): Promise<void> {
    try {
      await AsyncStorage.setItem(`${EncryptionService.USER_KEY_PREFIX}${userId}`, key);
    } catch (error) {
      console.error('Store user key error:', error);
      throw error;
    }
  }

  // Retrieve user's private key
  private async getUserKey(userId: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(`${EncryptionService.USER_KEY_PREFIX}${userId}`);
    } catch (error) {
      console.error('Get user key error:', error);
      return null;
    }
  }

  // Generate and store chat room encryption key
  async initializeChatRoomKey(chatRoomId: string, participants: string[]): Promise<string> {
    try {
      const existingKey = await this.getChatRoomKey(chatRoomId);
      if (existingKey) {
        return existingKey;
      }

      // Generate a new key for the chat room
      const chatKey = await generateChatRoomKey(participants[0], participants[1]);
      await this.storeChatRoomKey(chatRoomId, chatKey);
      
      return chatKey;
    } catch (error) {
      console.error('Initialize chat room key error:', error);
      throw error;
    }
  }

  // Store chat room key
  private async storeChatRoomKey(chatRoomId: string, key: string): Promise<void> {
    try {
      await AsyncStorage.setItem(`${EncryptionService.CHAT_KEY_PREFIX}${chatRoomId}`, key);
    } catch (error) {
      console.error('Store chat room key error:', error);
      throw error;
    }
  }

  // Generate a deterministic key based on chat room ID for backward compatibility
  private async generateDeterministicKey(chatRoomId: string): Promise<string> {
    try {
      // Use a simple deterministic approach based on chat room ID
      // This ensures the same key is generated for the same chat room
      const baseKey = `chatroom_${chatRoomId}_key`;

      // Create a simple hash-like key (not cryptographically secure but deterministic)
      let hash = 0;
      for (let i = 0; i < baseKey.length; i++) {
        const char = baseKey.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }

      // Convert to a 32-character hex string (similar to other keys)
      const deterministicKey = Math.abs(hash).toString(16).padStart(8, '0').repeat(4);

      return deterministicKey;
    } catch (error) {
      console.error('Generate deterministic key error:', error);
      throw error;
    }
  }

  // Retrieve chat room key
  async getChatRoomKey(chatRoomId: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(`${EncryptionService.CHAT_KEY_PREFIX}${chatRoomId}`);
    } catch (error) {
      console.error('Get chat room key error:', error);
      return null;
    }
  }

  // Encrypt message for sending
  async encryptMessageForSending(
    message: string,
    chatRoomId: string
  ): Promise<{ encryptedContent: string; hash: string }> {
    try {
      let chatKey = await this.getChatRoomKey(chatRoomId);

      // If no key exists, initialize one
      if (!chatKey) {
        console.log(`No chat key found for room ${chatRoomId}, initializing...`);
        const newKey = await this.initializeChatRoomKey(chatRoomId, []);
        chatKey = newKey;
      }

      // Final check to ensure we have a valid key
      if (!chatKey) {
        throw new Error('Unable to obtain valid chat room key for encryption');
      }

      const encryptedContent = encryptMessage(message, chatKey);
      const hash = createMessageHash(message, chatKey);

      return { encryptedContent, hash };
    } catch (error) {
      console.error('Encrypt message error:', error);
      throw error;
    }
  }

  // Decrypt received message with multiple fallback strategies
  async decryptReceivedMessage(
    encryptedContent: string,
    chatRoomId: string,
    hash?: string
  ): Promise<string> {
    try {
      // Strategy 1: Try with existing stored key
      let chatKey = await this.getChatRoomKey(chatRoomId);

      if (chatKey) {
        try {
          const decryptedMessage = decryptMessage(encryptedContent, chatKey);

          // Verify message integrity if hash is provided
          if (hash && !verifyMessageHash(decryptedMessage, hash, chatKey)) {
            console.warn('Message hash verification failed, trying other methods');
          } else {
            return decryptedMessage;
          }
        } catch (decryptError) {
          console.log('Decryption with stored key failed, trying alternatives...');
        }
      }

      // Strategy 2: Try with deterministic key based on chat room ID
      try {
        console.log(`Trying deterministic key for room ${chatRoomId}...`);
        const deterministicKey = await this.generateDeterministicKey(chatRoomId);
        const decryptedMessage = decryptMessage(encryptedContent, deterministicKey);

        // If successful, store this key for future use
        await this.storeChatRoomKey(chatRoomId, deterministicKey);
        console.log(`Successfully decrypted with deterministic key for room ${chatRoomId}`);
        return decryptedMessage;
      } catch (deterministicError) {
        console.log('Deterministic key decryption failed');
      }

      // Strategy 3: Check if the content is already decrypted (plain text)
      if (this.isLikelyPlainText(encryptedContent)) {
        console.log(`Content appears to be plain text for room ${chatRoomId}`);
        return encryptedContent;
      }

      // Strategy 4: Return a user-friendly placeholder
      console.warn(`All decryption strategies failed for room ${chatRoomId}`);
      return '🔒 Message encrypted with old key';

    } catch (error) {
      console.error('Decrypt message error:', error);
      return '❌ Unable to decrypt message';
    }
  }

  // Helper method to check if content is likely plain text
  private isLikelyPlainText(content: string): boolean {
    // Check if content contains mostly readable characters
    const readableChars = content.match(/[a-zA-Z0-9\s.,!?'"()-]/g);
    const readableRatio = readableChars ? readableChars.length / content.length : 0;

    // If more than 70% of characters are readable, it's likely plain text
    return readableRatio > 0.7 && content.length < 1000; // Also check reasonable length
  }

  // Check if content looks like encrypted data that can't be decrypted
  private isEncryptedContent(content: string): boolean {
    // Check for patterns that suggest encrypted content
    const hasSpecialChars = /[^\w\s.,!?'"()-]/.test(content);
    const hasRandomPattern = content.length > 10 && !/\s/.test(content); // No spaces in long strings
    const hasBase64Pattern = /^[A-Za-z0-9+/=]+$/.test(content.replace(/\s/g, ''));

    return hasSpecialChars || hasRandomPattern || hasBase64Pattern;
  }

  // Clear all stored encryption keys (for debugging/reset purposes)
  async clearAllKeys(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const encryptionKeys = keys.filter(key =>
        key.startsWith(EncryptionService.USER_KEY_PREFIX) ||
        key.startsWith(EncryptionService.CHAT_KEY_PREFIX)
      );

      await AsyncStorage.multiRemove(encryptionKeys);
      console.log('All encryption keys cleared');
    } catch (error) {
      console.error('Clear keys error:', error);
    }
  }

  // Generate key for new chat room
  async generateNewChatRoomKey(participants: string[]): Promise<string> {
    try {
      if (participants.length !== 2) {
        throw new Error('Only 1-on-1 chats are supported');
      }

      return await generateChatRoomKey(participants[0], participants[1]);
    } catch (error) {
      console.error('Generate new chat room key error:', error);
      throw error;
    }
  }



  // Backup encryption keys (for account recovery)
  async backupKeys(userId: string): Promise<{ userKey: string; chatKeys: { [chatRoomId: string]: string } }> {
    try {
      const userKey = await this.getUserKey(userId);
      if (!userKey) {
        throw new Error('User key not found');
      }

      const allKeys = await AsyncStorage.getAllKeys();
      const chatKeyEntries = allKeys.filter(key => key.startsWith(EncryptionService.CHAT_KEY_PREFIX));
      
      const chatKeys: { [chatRoomId: string]: string } = {};
      for (const keyName of chatKeyEntries) {
        const chatRoomId = keyName.replace(EncryptionService.CHAT_KEY_PREFIX, '');
        const key = await AsyncStorage.getItem(keyName);
        if (key) {
          chatKeys[chatRoomId] = key;
        }
      }

      return { userKey, chatKeys };
    } catch (error) {
      console.error('Backup keys error:', error);
      throw error;
    }
  }

  // Restore encryption keys (for account recovery)
  async restoreKeys(
    userId: string,
    backup: { userKey: string; chatKeys: { [chatRoomId: string]: string } }
  ): Promise<void> {
    try {
      await this.storeUserKey(userId, backup.userKey);

      for (const [chatRoomId, key] of Object.entries(backup.chatKeys)) {
        await this.storeChatRoomKey(chatRoomId, key);
      }
    } catch (error) {
      console.error('Restore keys error:', error);
      throw error;
    }
  }
}
