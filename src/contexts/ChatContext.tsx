import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ChatContextType, ChatRoom, Message } from '../types';
import { ChatService } from '../services/chatService';
import { useAuth } from './AuthContext';
import client from '../config/appwrite';
import { APPWRITE_CONFIG } from '../config/appwrite';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<{ [chatRoomId: string]: Message[] }>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  const chatService = new ChatService();

  useEffect(() => {
    if (user) {
      loadChatRooms();
      subscribeToRealtimeUpdates();
    }
  }, [user]);

  const loadChatRooms = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const rooms = await chatService.getChatRooms(user.$id);
      setChatRooms(rooms);
    } catch (error) {
      console.error('Load chat rooms error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToRealtimeUpdates = () => {
    if (!user) return;

    // For now, we'll disable realtime updates to avoid the error
    // In production, you would set up proper realtime subscriptions
    console.log('Realtime subscriptions would be set up here');

    return () => {
      console.log('Unsubscribing from realtime updates');
    };
  };

  const sendMessage = async (
    chatRoomId: string,
    content: string,
    type: 'text' | 'image'
  ): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);

      // Create optimistic message with original content for immediate display
      const optimisticMessage: Message = {
        $id: `temp-${Date.now()}`,
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
        chatRoomId,
        senderId: user.$id,
        content: content, // Use original content for optimistic update
        messageType: type,
        mediaUrl: type === 'image' ? content : undefined,
        isDelivered: false,
        isRead: false,
      };

      // Add optimistic message immediately
      setMessages(prev => ({
        ...prev,
        [chatRoomId]: [...(prev[chatRoomId] || []), optimisticMessage],
      }));

      // Send the actual message (this will be encrypted)
      let actualMessage: Message;
      if (type === 'text') {
        actualMessage = await chatService.sendTextMessage(chatRoomId, user.$id, content);
      } else {
        actualMessage = await chatService.sendImageMessage(chatRoomId, user.$id, content);
      }

      // Decrypt the actual message content before replacing optimistic message
      const decryptedMessage = {
        ...actualMessage,
        content: content, // Use the original content since we already have it
      };

      // Replace optimistic message with actual decrypted message
      setMessages(prev => ({
        ...prev,
        [chatRoomId]: prev[chatRoomId]?.map(msg =>
          msg.$id === optimisticMessage.$id ? decryptedMessage : msg
        ) || [decryptedMessage],
      }));

      // Refresh chat rooms to update last message
      loadChatRooms();

    } catch (error) {
      console.error('Send message error:', error);
      // Remove optimistic message on error
      setMessages(prev => ({
        ...prev,
        [chatRoomId]: prev[chatRoomId]?.filter(msg => !msg.$id.startsWith('temp-')) || [],
      }));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (chatRoomId: string): Promise<void> => {
    try {
      setIsLoading(true);
      const chatMessages = await chatService.getMessages(chatRoomId);
      
      setMessages(prev => ({
        ...prev,
        [chatRoomId]: chatMessages,
      }));

      // Mark messages as read
      await chatService.markChatAsRead(chatRoomId, user?.$id || '');
    } catch (error) {
      console.error('Load messages error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createChatRoom = async (participantId: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setIsLoading(true);
      const chatRoomId = await chatService.createOrGetChatRoom(user.$id, participantId);
      
      // Reload chat rooms to include the new one
      await loadChatRooms();
      
      return chatRoomId;
    } catch (error) {
      console.error('Create chat room error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const markMessageAsRead = async (messageId: string): Promise<void> => {
    try {
      await chatService.markMessageAsRead(messageId);
    } catch (error) {
      console.error('Mark message as read error:', error);
    }
  };

  const markChatAsRead = async (chatRoomId: string): Promise<void> => {
    if (!user) return;
    
    try {
      await chatService.markChatAsRead(chatRoomId, user.$id);
    } catch (error) {
      console.error('Mark chat as read error:', error);
    }
  };

  const deleteMessage = async (messageId: string): Promise<void> => {
    try {
      await chatService.deleteMessage(messageId);
    } catch (error) {
      console.error('Delete message error:', error);
      throw error;
    }
  };

  const value: ChatContextType = {
    chatRooms,
    messages,
    sendMessage,
    loadMessages,
    createChatRoom,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
