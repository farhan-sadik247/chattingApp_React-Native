import { DatabaseService } from './databaseService';
import { User, Friendship } from '../types';

export class FriendService {
  private databaseService: DatabaseService;

  constructor() {
    this.databaseService = new DatabaseService();
  }

  // Send a friend request
  async sendFriendRequest(currentUserId: string, targetUsername: string): Promise<void> {
    try {
      // First, search for the user by username
      const users = await this.databaseService.searchUsers(targetUsername);
      const targetUser = users.find(user => user.username === targetUsername);

      if (!targetUser) {
        throw new Error('User not found');
      }

      if (targetUser.$id === currentUserId) {
        throw new Error('You cannot send a friend request to yourself');
      }

      // Check if friendship already exists
      const existingFriendship = await this.checkExistingFriendship(currentUserId, targetUser.$id);
      if (existingFriendship) {
        switch (existingFriendship.status) {
          case 'pending':
            throw new Error('Friend request already sent');
          case 'accepted':
            throw new Error('You are already friends with this user');
          case 'blocked':
            throw new Error('Cannot send friend request to this user');
          default:
            break;
        }
      }

      // Send the friend request
      await this.databaseService.sendFriendRequest(currentUserId, targetUser.$id);
    } catch (error) {
      console.error('Send friend request error:', error);
      throw error;
    }
  }

  // Accept a friend request
  async acceptFriendRequest(requestId: string): Promise<void> {
    try {
      await this.databaseService.updateFriendshipStatus(requestId, 'accepted');
    } catch (error) {
      console.error('Accept friend request error:', error);
      throw error;
    }
  }

  // Decline a friend request
  async declineFriendRequest(requestId: string): Promise<void> {
    try {
      await this.databaseService.updateFriendshipStatus(requestId, 'declined');
    } catch (error) {
      console.error('Decline friend request error:', error);
      throw error;
    }
  }

  // Block a user
  async blockUser(currentUserId: string, targetUserId: string): Promise<void> {
    try {
      // For now, we'll implement a simplified version
      // TODO: Implement proper blocking functionality in database
      console.log(`Blocking user ${targetUserId} by ${currentUserId}`);
      // This would update the friendship status to 'blocked'
    } catch (error) {
      console.error('Block user error:', error);
      throw error;
    }
  }

  // Unblock a user
  async unblockUser(currentUserId: string, targetUserId: string): Promise<void> {
    try {
      // For now, we'll implement a simplified version
      // TODO: Implement proper unblocking functionality in database
      console.log(`Unblocking user ${targetUserId} by ${currentUserId}`);
      // This would remove the blocked status
    } catch (error) {
      console.error('Unblock user error:', error);
      throw error;
    }
  }

  // Unfriend a user (alias for removeFriend)
  async unfriendUser(currentUserId: string, friendId: string): Promise<void> {
    return this.removeFriend(currentUserId, friendId);
  }

  // Get friends list
  async getFriends(userId: string): Promise<User[]> {
    try {
      return await this.databaseService.getFriends(userId);
    } catch (error) {
      console.error('Get friends error:', error);
      throw error;
    }
  }

  // Get incoming friend requests
  async getFriendRequests(userId: string): Promise<Friendship[]> {
    try {
      return await this.databaseService.getFriendRequests(userId);
    } catch (error) {
      console.error('Get friend requests error:', error);
      throw error;
    }
  }

  // Get incoming friend requests with sender details
  async getFriendRequestsWithDetails(userId: string): Promise<Array<Friendship & { senderDetails: User }>> {
    try {
      return await this.databaseService.getFriendRequestsWithDetails(userId);
    } catch (error) {
      console.error('Get friend requests with details error:', error);
      throw error;
    }
  }

  // Search users
  async searchUsers(query: string, currentUserId: string): Promise<User[]> {
    try {
      if (query.trim().length < 2) {
        return [];
      }

      const users = await this.databaseService.searchUsers(query);
      
      // Filter out current user
      return users.filter(user => user.$id !== currentUserId);
    } catch (error) {
      console.error('Search users error:', error);
      throw error;
    }
  }

  // Check if friendship exists between two users
  private async checkExistingFriendship(userId1: string, userId2: string): Promise<Friendship | null> {
    try {
      // This would require a custom query to check both directions
      // For now, we'll implement a simplified version
      // In a real app, you'd want to optimize this query
      return null;
    } catch (error) {
      console.error('Check existing friendship error:', error);
      return null;
    }
  }

  // Get friendship status between two users
  async getFriendshipStatus(currentUserId: string, otherUserId: string): Promise<string | null> {
    try {
      const friendship = await this.checkExistingFriendship(currentUserId, otherUserId);
      return friendship ? friendship.status : null;
    } catch (error) {
      console.error('Get friendship status error:', error);
      return null;
    }
  }

  // Remove friend
  async removeFriend(currentUserId: string, friendId: string): Promise<void> {
    try {
      const friendship = await this.checkExistingFriendship(currentUserId, friendId);
      if (friendship && friendship.status === 'accepted') {
        await this.databaseService.updateFriendshipStatus(friendship.$id, 'declined');
      }
    } catch (error) {
      console.error('Remove friend error:', error);
      throw error;
    }
  }
}
