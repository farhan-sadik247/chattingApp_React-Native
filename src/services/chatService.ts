import { DatabaseService } from './databaseService';
import { EncryptionService } from './encryptionService';
import { storage } from '../config/appwrite';
import { APPWRITE_CONFIG } from '../config/appwrite';
import { ChatRoom, Message, User } from '../types';
import { ID } from 'appwrite';

export class ChatService {
  private databaseService: DatabaseService;
  private encryptionService: EncryptionService;

  constructor() {
    this.databaseService = new DatabaseService();
    this.encryptionService = new EncryptionService();
  }

  // Create or get existing chat room between two users
  async createOrGetChatRoom(currentUserId: string, otherUserId: string): Promise<string> {
    try {
      // Check if chat room already exists
      const existingChatRooms = await this.databaseService.getChatRooms(currentUserId);
      const existingRoom = existingChatRooms.find(room => 
        room.participants.includes(otherUserId) && room.participants.length === 2
      );

      if (existingRoom) {
        return existingRoom.$id;
      }

      // Create new chat room
      const participants = [currentUserId, otherUserId];
      const encryptionKey = await this.encryptionService.generateNewChatRoomKey(participants);
      
      const chatRoom = await this.databaseService.createChatRoom(participants, encryptionKey);
      
      // Initialize encryption key for this chat room
      await this.encryptionService.initializeChatRoomKey(chatRoom.$id, participants);

      return chatRoom.$id;
    } catch (error) {
      console.error('Create or get chat room error:', error);
      throw error;
    }
  }

  // Send a text message
  async sendTextMessage(chatRoomId: string, senderId: string, content: string): Promise<Message> {
    try {
      // Encrypt the message
      const { encryptedContent, hash } = await this.encryptionService.encryptMessageForSending(
        content,
        chatRoomId
      );

      // Create message in database
      const message = await this.databaseService.createMessage({
        chatRoomId,
        senderId,
        content: encryptedContent,
        messageType: 'text',
        isDelivered: false,
        isRead: false,
      });

      // Update chat room's last message time
      await this.databaseService.updateChatRoom(chatRoomId, {
        lastMessageTime: new Date().toISOString(),
      });

      return message;
    } catch (error) {
      console.error('Send text message error:', error);
      throw error;
    }
  }

  // Send an image message
  async sendImageMessage(
    chatRoomId: string,
    senderId: string,
    imageUri: string,
    caption?: string
  ): Promise<Message> {
    try {
      // Upload image to storage
      const imageUrl = await this.uploadImage(imageUri);

      // Encrypt caption if provided
      let encryptedContent = '';
      if (caption) {
        const { encryptedContent: encrypted } = await this.encryptionService.encryptMessageForSending(
          caption,
          chatRoomId
        );
        encryptedContent = encrypted;
      }

      // Create message in database
      const message = await this.databaseService.createMessage({
        chatRoomId,
        senderId,
        content: encryptedContent,
        messageType: 'image',
        mediaUrl: imageUrl,
        isDelivered: false,
        isRead: false,
      });

      // Update chat room's last message time
      await this.databaseService.updateChatRoom(chatRoomId, {
        lastMessageTime: new Date().toISOString(),
      });

      return message;
    } catch (error) {
      console.error('Send image message error:', error);
      throw error;
    }
  }

  // Upload image to Appwrite storage
  private async uploadImage(imageUri: string): Promise<string> {
    try {
      // TEMPORARY: For now, return the local image URI since storage bucket setup is needed
      // TODO: Set up Appwrite storage bucket and implement proper upload
      console.log('Image upload requested for:', imageUri);
      console.log('Storage bucket needs to be created in Appwrite console');

      // For demo purposes, return the local URI
      // In production, this should upload to Appwrite storage
      return imageUri;

      /*
      // Uncomment this when storage bucket is properly set up:

      const fileName = `image_${Date.now()}.jpg`;
      const fileId = ID.unique();

      const file = {
        uri: imageUri,
        type: 'image/jpeg',
        name: fileName,
      };

      const uploadedFile = await storage.createFile(
        APPWRITE_CONFIG.storageId,
        fileId,
        file as any
      );

      return `${APPWRITE_CONFIG.endpoint}/storage/buckets/${APPWRITE_CONFIG.storageId}/files/${uploadedFile.$id}/view?project=${APPWRITE_CONFIG.projectId}`;
      */
    } catch (error) {
      console.error('Upload image error:', error);
      throw error;
    }
  }

  // Get messages for a chat room
  async getMessages(chatRoomId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    try {
      const encryptedMessages = await this.databaseService.getMessages(chatRoomId, limit, offset);
      
      // Decrypt messages
      const decryptedMessages = await Promise.all(
        encryptedMessages.map(async (message) => {
          try {
            let decryptedContent = message.content;
            
            // Only decrypt if there's content and it's a text message
            if (message.content && message.messageType === 'text') {
              decryptedContent = await this.encryptionService.decryptReceivedMessage(
                message.content,
                chatRoomId
              );
            } else if (message.content && message.messageType === 'image') {
              // Decrypt caption for image messages
              decryptedContent = await this.encryptionService.decryptReceivedMessage(
                message.content,
                chatRoomId
              );
            }

            return {
              ...message,
              content: decryptedContent,
            };
          } catch (decryptError) {
            console.error('Message decryption error:', decryptError);
            // Return message with placeholder content if decryption fails
            return {
              ...message,
              content: '[Message could not be decrypted]',
            };
          }
        })
      );

      return decryptedMessages;
    } catch (error) {
      console.error('Get messages error:', error);
      throw error;
    }
  }

  // Get chat rooms for a user
  async getChatRooms(userId: string): Promise<ChatRoom[]> {
    try {
      return await this.databaseService.getChatRooms(userId);
    } catch (error) {
      console.error('Get chat rooms error:', error);
      throw error;
    }
  }

  // Mark message as delivered
  async markMessageAsDelivered(messageId: string): Promise<void> {
    try {
      await this.databaseService.updateMessage(messageId, { isDelivered: true });
    } catch (error) {
      console.error('Mark message as delivered error:', error);
      throw error;
    }
  }

  // Mark message as read
  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      await this.databaseService.updateMessage(messageId, { isRead: true });
    } catch (error) {
      console.error('Mark message as read error:', error);
      throw error;
    }
  }

  // Mark all messages in a chat as read
  async markChatAsRead(chatRoomId: string, userId: string): Promise<void> {
    try {
      // Get unread messages in the chat
      const messages = await this.databaseService.getMessages(chatRoomId, 100);
      const unreadMessages = messages.filter(
        message => !message.isRead && message.senderId !== userId
      );

      // Mark all unread messages as read
      await Promise.all(
        unreadMessages.map(message => this.markMessageAsRead(message.$id))
      );
    } catch (error) {
      console.error('Mark chat as read error:', error);
      throw error;
    }
  }

  // Delete a message
  async deleteMessage(messageId: string): Promise<void> {
    try {
      // In a real implementation, you might want to just mark as deleted
      // rather than actually deleting from the database
      await this.databaseService.updateMessage(messageId, {
        content: '[Message deleted]',
        messageType: 'text',
      });
    } catch (error) {
      console.error('Delete message error:', error);
      throw error;
    }
  }
}
