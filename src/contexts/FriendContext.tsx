import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { FriendContextType, User, Friendship, FriendRequestWithDetails } from '../types';
import { FriendService } from '../services/friendService';
import { useAuth } from './AuthContext';
import client from '../config/appwrite';
import { APPWRITE_CONFIG } from '../config/appwrite';

const FriendContext = createContext<FriendContextType | undefined>(undefined);

interface FriendProviderProps {
  children: ReactNode;
}

export const FriendProvider: React.FC<FriendProviderProps> = ({ children }) => {
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequestWithDetails[]>([]);
  const [sentRequests, setSentRequests] = useState<Friendship[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  const friendService = new FriendService();

  useEffect(() => {
    if (user) {
      loadFriends();
      loadFriendRequests();
      subscribeToFriendUpdates();
    }
  }, [user]);

  const loadFriends = async () => {
    if (!user) return;
    
    try {
      const friendsList = await friendService.getFriends(user.$id);
      setFriends(friendsList);
    } catch (error) {
      console.error('Load friends error:', error);
    }
  };

  const loadFriendRequests = async () => {
    if (!user) return;

    try {
      const requests = await friendService.getFriendRequestsWithDetails(user.$id);
      setFriendRequests(requests);
    } catch (error) {
      console.error('Load friend requests error:', error);
    }
  };

  const subscribeToFriendUpdates = () => {
    if (!user) return;

    // For now, we'll disable realtime updates to avoid the error
    // In production, you would set up proper realtime subscriptions
    console.log('Realtime subscriptions would be set up here');

    return () => {
      console.log('Unsubscribing from realtime updates');
    };
  };

  const sendFriendRequest = async (username: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setIsLoading(true);
      await friendService.sendFriendRequest(user.$id, username);
    } catch (error) {
      console.error('Send friend request error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const acceptFriendRequest = async (requestId: string): Promise<void> => {
    try {
      setIsLoading(true);
      await friendService.acceptFriendRequest(requestId);
      
      // Remove from friend requests
      setFriendRequests(prev => prev.filter(req => req.$id !== requestId));
      
      // Reload friends list
      await loadFriends();
    } catch (error) {
      console.error('Accept friend request error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const declineFriendRequest = async (requestId: string): Promise<void> => {
    try {
      setIsLoading(true);
      await friendService.declineFriendRequest(requestId);
      
      // Remove from friend requests
      setFriendRequests(prev => prev.filter(req => req.$id !== requestId));
    } catch (error) {
      console.error('Decline friend request error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async (query: string): Promise<User[]> => {
    if (!user) return [];

    try {
      return await friendService.searchUsers(query, user.$id);
    } catch (error) {
      console.error('Search users error:', error);
      return [];
    }
  };

  const unfriendUser = async (userId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      await friendService.unfriendUser(user.$id, userId);
      // Remove from friends list
      setFriends(prev => prev.filter(friend => friend.$id !== userId));
    } catch (error) {
      console.error('Unfriend user error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const blockUser = async (userId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      await friendService.blockUser(user.$id, userId);
      // Remove from friends list and add to blocked list
      setFriends(prev => prev.filter(friend => friend.$id !== userId));
      // TODO: Add to blocked users list when we fetch it
    } catch (error) {
      console.error('Block user error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const unblockUser = async (userId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      await friendService.unblockUser(user.$id, userId);
      // Remove from blocked users list
      setBlockedUsers(prev => prev.filter(blocked => blocked.$id !== userId));
    } catch (error) {
      console.error('Unblock user error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getFriendshipStatus = (userId: string): 'none' | 'friend' | 'pending_sent' | 'pending_received' | 'blocked' => {
    // Check if user is a friend
    if (friends.some(friend => friend.$id === userId)) {
      return 'friend';
    }

    // Check if user is blocked
    if (blockedUsers.some(blocked => blocked.$id === userId)) {
      return 'blocked';
    }

    // Check if there's a pending request sent to this user
    if (sentRequests.some(request => request.receiverId === userId && request.status === 'pending')) {
      return 'pending_sent';
    }

    // Check if there's a pending request from this user
    if (friendRequests.some(request => request.senderId === userId && request.status === 'pending')) {
      return 'pending_received';
    }

    return 'none';
  };

  const value: FriendContextType = {
    friends,
    friendRequests,
    sentRequests,
    blockedUsers,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    unfriendUser,
    blockUser,
    unblockUser,
    searchUsers,
    getFriendshipStatus,
  };

  return <FriendContext.Provider value={value}>{children}</FriendContext.Provider>;
};

export const useFriend = (): FriendContextType => {
  const context = useContext(FriendContext);
  if (context === undefined) {
    throw new Error('useFriend must be used within a FriendProvider');
  }
  return context;
};
