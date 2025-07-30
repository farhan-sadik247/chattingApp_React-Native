import { account, databases } from '../config/appwrite';
import { APPWRITE_CONFIG } from '../config/appwrite';
import { User } from '../types';
import { ID } from 'appwrite';
import { generateKeyPair } from '../utils/encryption';

export class AuthService {
  // Register a new user
  async register(email: string, password: string, username: string, displayName: string): Promise<User> {
    try {
      // Create account first
      const accountResponse = await account.create(ID.unique(), email, password, displayName);
      console.log('Account created:', accountResponse.$id);

      // Create session immediately after account creation
      await account.createEmailPasswordSession(email, password);
      console.log('Session created');

      // Generate encryption keys for the user
      const keyPair = await generateKeyPair();
      console.log('Encryption keys generated');

      // Create user document in database with the same ID as the auth user
      const userDoc = await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.usersCollectionId,
        accountResponse.$id, // Use the same ID as the auth user
        {
          email,
          username,
          displayName,
          publicKey: keyPair.publicKey,
          isOnline: true,
          lastSeen: new Date().toISOString(),
        }
      );
      console.log('User document created:', userDoc.$id);

      return {
        $id: userDoc.$id,
        $createdAt: userDoc.$createdAt,
        $updatedAt: userDoc.$updatedAt,
        email: userDoc.email,
        username: userDoc.username,
        displayName: userDoc.displayName,
        avatar: userDoc.avatar,
        publicKey: userDoc.publicKey,
        isOnline: userDoc.isOnline,
        lastSeen: userDoc.lastSeen,
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      console.error('Error details:', error.message);
      throw error;
    }
  }

  // Login user
  async login(email: string, password: string): Promise<User> {
    try {
      // Create session
      await account.createEmailPasswordSession(email, password);
      
      // Get current user
      const user = await this.getCurrentUser();
      
      // Update online status
      await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.usersCollectionId,
        user.$id,
        {
          isOnline: true,
          lastSeen: new Date().toISOString(),
        }
      );

      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Get current user
  async getCurrentUser(): Promise<User> {
    try {
      const accountData = await account.get();
      console.log('Account data:', accountData.$id);

      try {
        const userDoc = await databases.getDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.usersCollectionId,
          accountData.$id
        );

        return {
          $id: userDoc.$id,
          $createdAt: userDoc.$createdAt,
          $updatedAt: userDoc.$updatedAt,
          email: userDoc.email,
          username: userDoc.username,
          displayName: userDoc.displayName,
          avatar: userDoc.avatar,
          publicKey: userDoc.publicKey,
          isOnline: userDoc.isOnline,
          lastSeen: userDoc.lastSeen,
        };
      } catch (docError: any) {
        console.error('User document not found, creating one...');

        // If user document doesn't exist, create it
        // Generate encryption keys for the user
        const keyPair = await generateKeyPair();

        const userDoc = await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.usersCollectionId,
          accountData.$id,
          {
            email: accountData.email,
            username: accountData.email.split('@')[0], // Use email prefix as username
            displayName: accountData.name || accountData.email.split('@')[0],
            publicKey: keyPair.publicKey,
            isOnline: true,
            lastSeen: new Date().toISOString(),
          }
        );

        return {
          $id: userDoc.$id,
          $createdAt: userDoc.$createdAt,
          $updatedAt: userDoc.$updatedAt,
          email: userDoc.email,
          username: userDoc.username,
          displayName: userDoc.displayName,
          avatar: userDoc.avatar,
          publicKey: userDoc.publicKey,
          isOnline: userDoc.isOnline,
          lastSeen: userDoc.lastSeen,
        };
      }
    } catch (error: any) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      // Update offline status
      const user = await this.getCurrentUser();
      await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.usersCollectionId,
        user.$id,
        {
          isOnline: false,
          lastSeen: new Date().toISOString(),
        }
      );

      // Delete session
      await account.deleteSession('current');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      await account.get();
      return true;
    } catch {
      return false;
    }
  }

  // Update user profile
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      // Filter out document-specific fields that can't be updated
      const { $id, $createdAt, $updatedAt, ...updateData } = updates;

      const updatedDoc = await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.usersCollectionId,
        userId,
        updateData
      );

      return {
        $id: updatedDoc.$id,
        $createdAt: updatedDoc.$createdAt,
        $updatedAt: updatedDoc.$updatedAt,
        email: updatedDoc.email,
        username: updatedDoc.username,
        displayName: updatedDoc.displayName,
        avatar: updatedDoc.avatar,
        publicKey: updatedDoc.publicKey,
        isOnline: updatedDoc.isOnline,
        lastSeen: updatedDoc.lastSeen,
      };
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }
}
