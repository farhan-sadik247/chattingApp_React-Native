import { databases } from '../config/appwrite';
import { APPWRITE_CONFIG } from '../config/appwrite';
import { User, Friendship, ChatRoom, Message } from '../types';
import { Query, ID } from 'appwrite';
import { generateChatRoomKey } from '../utils/encryption';

export class DatabaseService {
  // User operations
  async createUser(userId: string, userData: any): Promise<User> {
    try {
      const userDoc = await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.usersCollectionId,
        userId,
        userData
      );
      return userDoc as unknown as User;
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  async getUser(userId: string): Promise<User> {
    try {
      const userDoc = await databases.getDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.usersCollectionId,
        userId
      );
      return userDoc as unknown as User;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }

  async updateUser(userId: string, userData: any): Promise<User> {
    try {
      const userDoc = await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.usersCollectionId,
        userId,
        userData
      );
      return userDoc as unknown as User;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  async searchUsers(query: string): Promise<User[]> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.usersCollectionId,
        [
          Query.or([
            Query.search('username', query),
            Query.search('displayName', query),
          ]),
          Query.limit(20),
        ]
      );
      return response.documents as unknown as User[];
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  }

  // Friendship operations
  async sendFriendRequest(senderId: string, receiverId: string): Promise<Friendship> {
    try {
      const friendshipDoc = await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.friendshipsCollectionId,
        ID.unique(),
        {
          senderId,
          receiverId,
          status: 'pending',
        }
      );
      return friendshipDoc as unknown as Friendship;
    } catch (error) {
      console.error('Send friend request error:', error);
      throw error;
    }
  }

  async updateFriendshipStatus(friendshipId: string, status: string): Promise<Friendship> {
    try {
      const friendshipDoc = await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.friendshipsCollectionId,
        friendshipId,
        { status }
      );
      return friendshipDoc as unknown as Friendship;
    } catch (error) {
      console.error('Update friendship status error:', error);
      throw error;
    }
  }

  async getFriends(userId: string): Promise<User[]> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.friendshipsCollectionId,
        [
          Query.or([
            Query.and([Query.equal('senderId', userId), Query.equal('status', 'accepted')]),
            Query.and([Query.equal('receiverId', userId), Query.equal('status', 'accepted')]),
          ]),
        ]
      );

      const friendIds = response.documents.map((doc: any) => 
        doc.senderId === userId ? doc.receiverId : doc.senderId
      );

      if (friendIds.length === 0) return [];

      const friendsResponse = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.usersCollectionId,
        [Query.equal('$id', friendIds)]
      );

      return friendsResponse.documents as unknown as User[];
    } catch (error) {
      console.error('Get friends error:', error);
      throw error;
    }
  }

  async getFriendRequests(userId: string): Promise<Friendship[]> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.friendshipsCollectionId,
        [
          Query.equal('receiverId', userId),
          Query.equal('status', 'pending'),
        ]
      );
      return response.documents as unknown as Friendship[];
    } catch (error) {
      console.error('Get friend requests error:', error);
      throw error;
    }
  }

  // Get friend requests with sender details
  async getFriendRequestsWithDetails(userId: string): Promise<Array<Friendship & { senderDetails: User }>> {
    try {
      const friendRequests = await this.getFriendRequests(userId);

      // Fetch sender details for each request
      const requestsWithDetails = await Promise.all(
        friendRequests.map(async (request) => {
          try {
            const senderDetails = await this.getUserById(request.senderId);
            return {
              ...request,
              senderDetails
            };
          } catch (error) {
            console.error(`Error fetching sender details for ${request.senderId}:`, error);
            // Return request with placeholder details if user fetch fails
            return {
              ...request,
              senderDetails: {
                $id: request.senderId,
                $createdAt: '',
                $updatedAt: '',
                email: 'Unknown',
                username: 'unknown_user',
                displayName: 'Unknown User',
                avatar: undefined,
                publicKey: '',
                isOnline: false,
                lastSeen: ''
              }
            };
          }
        })
      );

      return requestsWithDetails;
    } catch (error) {
      console.error('Get friend requests with details error:', error);
      throw error;
    }
  }

  // Helper function to get user by ID
  async getUserById(userId: string): Promise<User> {
    try {
      const userDoc = await databases.getDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.usersCollectionId,
        userId
      );
      return userDoc as unknown as User;
    } catch (error) {
      console.error('Get user by ID error:', error);
      throw error;
    }
  }

  // Chat room operations
  async createChatRoom(participants: string[]): Promise<ChatRoom> {
    try {
      // Generate encryption key for the chat room
      const encryptionKey = await generateChatRoomKey(participants[0], participants[1]);

      const chatRoomDoc = await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.chatRoomsCollectionId,
        ID.unique(),
        {
          participants,
          encryptionKey,
          lastMessageTime: new Date().toISOString(),
        }
      );
      return chatRoomDoc as unknown as ChatRoom;
    } catch (error) {
      console.error('Create chat room error:', error);
      throw error;
    }
  }

  async getChatRooms(userId: string): Promise<ChatRoom[]> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.chatRoomsCollectionId,
        [
          Query.contains('participants', userId),
          Query.orderDesc('lastMessageTime'),
        ]
      );
      return response.documents as unknown as ChatRoom[];
    } catch (error) {
      console.error('Get chat rooms error:', error);
      throw error;
    }
  }

  async updateChatRoom(chatRoomId: string, data: any): Promise<ChatRoom> {
    try {
      const chatRoomDoc = await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.chatRoomsCollectionId,
        chatRoomId,
        data
      );
      return chatRoomDoc as unknown as ChatRoom;
    } catch (error) {
      console.error('Update chat room error:', error);
      throw error;
    }
  }

  // Message operations
  async createMessage(messageData: any): Promise<Message> {
    try {
      const messageDoc = await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.messagesCollectionId,
        ID.unique(),
        messageData
      );
      return messageDoc as unknown as Message;
    } catch (error) {
      console.error('Create message error:', error);
      throw error;
    }
  }

  async getMessages(chatRoomId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    try {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.messagesCollectionId,
        [
          Query.equal('chatRoomId', chatRoomId),
          Query.orderDesc('$createdAt'),
          Query.limit(limit),
          Query.offset(offset),
        ]
      );
      return response.documents.reverse() as unknown as Message[];
    } catch (error) {
      console.error('Get messages error:', error);
      throw error;
    }
  }

  async updateMessage(messageId: string, data: any): Promise<Message> {
    try {
      const messageDoc = await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.messagesCollectionId,
        messageId,
        data
      );
      return messageDoc as unknown as Message;
    } catch (error) {
      console.error('Update message error:', error);
      throw error;
    }
  }
}
