import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChatRoom, User, Message } from '../../types';
import { DatabaseService } from '../../services/databaseService';
import { ChatService } from '../../services/chatService';

interface ChatsScreenProps {
  navigation: any;
}

export const ChatsScreen: React.FC<ChatsScreenProps> = ({ navigation }) => {
  const { chatRooms, loadMessages } = useChat();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [userDetails, setUserDetails] = useState<{ [userId: string]: User }>({});
  const [lastMessages, setLastMessages] = useState<{ [chatRoomId: string]: Message }>({});
  const databaseService = new DatabaseService();
  const chatService = new ChatService();

  // Fetch user details for chat participants
  useEffect(() => {
    const fetchUserDetails = async () => {
      const userIds = new Set<string>();

      // Collect all unique user IDs from chat rooms
      chatRooms.forEach(room => {
        room.participants.forEach(participantId => {
          if (participantId !== user?.$id) {
            userIds.add(participantId);
          }
        });
      });

      // Fetch user details for each unique user ID
      const newUserDetails: { [userId: string]: User } = {};
      for (const userId of userIds) {
        try {
          const userDetail = await databaseService.getUserById(userId);
          newUserDetails[userId] = userDetail;
        } catch (error) {
          console.error(`Failed to fetch user details for ${userId}:`, error);
          // Create placeholder user if fetch fails
          newUserDetails[userId] = {
            $id: userId,
            $createdAt: '',
            $updatedAt: '',
            email: 'Unknown',
            username: 'unknown_user',
            displayName: 'Unknown User',
            avatar: undefined,
            publicKey: '',
            isOnline: false,
            lastSeen: ''
          };
        }
      }

      setUserDetails(newUserDetails);
    };

    if (chatRooms.length > 0) {
      fetchUserDetails();
    }
  }, [chatRooms, user?.$id]);

  // Fetch last messages for each chat room
  useEffect(() => {
    const fetchLastMessages = async () => {
      const newLastMessages: { [chatRoomId: string]: Message } = {};

      for (const chatRoom of chatRooms) {
        try {
          // Get the last message for this chat room
          const messages = await chatService.getMessages(chatRoom.$id, 1); // Get only 1 message (the latest)
          if (messages.length > 0) {
            newLastMessages[chatRoom.$id] = messages[0];
          }
        } catch (error) {
          console.error(`Failed to fetch last message for chat room ${chatRoom.$id}:`, error);
        }
      }

      setLastMessages(newLastMessages);
    };

    if (chatRooms.length > 0) {
      fetchLastMessages();
    }
  }, [chatRooms]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // Refresh user details and last messages
      if (chatRooms.length > 0) {
        // Re-fetch user details
        const userIds = new Set<string>();
        chatRooms.forEach(room => {
          room.participants.forEach(participantId => {
            if (participantId !== user?.$id) {
              userIds.add(participantId);
            }
          });
        });

        const newUserDetails: { [userId: string]: User } = {};
        for (const userId of userIds) {
          try {
            const userDetail = await databaseService.getUserById(userId);
            newUserDetails[userId] = userDetail;
          } catch (error) {
            console.error(`Failed to refresh user details for ${userId}:`, error);
          }
        }
        setUserDetails(newUserDetails);

        // Re-fetch last messages
        const newLastMessages: { [chatRoomId: string]: Message } = {};
        for (const chatRoom of chatRooms) {
          try {
            const messages = await chatService.getMessages(chatRoom.$id, 1);
            if (messages.length > 0) {
              newLastMessages[chatRoom.$id] = messages[0];
            }
          } catch (error) {
            console.error(`Failed to refresh last message for chat room ${chatRoom.$id}:`, error);
          }
        }
        setLastMessages(newLastMessages);
      }
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [chatRooms, user?.$id]);

  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getOtherParticipant = (chatRoom: ChatRoom) => {
    return chatRoom.participants.find(id => id !== user?.$id);
  };

  const formatLastMessageContent = (message: Message | undefined): string => {
    if (!message) return 'Start a conversation...';

    const isMyMessage = message.senderId === user?.$id;
    const prefix = isMyMessage ? 'You: ' : '';

    if (message.messageType === 'image') {
      return `${prefix}📷 Photo`;
    } else if (message.messageType === 'file') {
      return `${prefix}📎 File`;
    } else {
      return `${prefix}${message.content}`;
    }
  };

  const renderChatItem = ({ item }: { item: ChatRoom }) => {
    const otherParticipantId = getOtherParticipant(item);
    const otherUser = userDetails[otherParticipantId || ''];
    const lastMessage = lastMessages[item.$id];

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => {
          // Navigate to chat screen with full user details
          navigation.navigate('Chat', {
            chatRoomId: item.$id,
            recipientUser: otherUser || {
              $id: otherParticipantId,
              $createdAt: '',
              $updatedAt: '',
              email: 'Unknown',
              username: 'unknown_user',
              displayName: 'Unknown User',
              avatar: undefined,
              publicKey: '',
              isOnline: false,
              lastSeen: ''
            },
          });
        }}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            {otherUser?.avatar ? (
              <Image source={{ uri: otherUser.avatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={24} color="#666" />
            )}
          </View>
          {otherUser?.isOnline && (
            <View style={styles.onlineIndicator} />
          )}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {otherUser?.displayName || otherUser?.username || 'Unknown User'}
            </Text>
            <Text style={styles.timeText}>
              {formatLastMessageTime(item.lastMessageTime)}
            </Text>
          </View>

          <View style={styles.lastMessageContainer}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {formatLastMessageContent(lastMessage)}
            </Text>
            {/* Unread count badge would go here */}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Chats Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start a conversation with your friends
      </Text>
      <TouchableOpacity
        style={styles.startChatButton}
        onPress={() => navigation.navigate('Friends')}
      >
        <Text style={styles.startChatButtonText}>Find Friends</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <TouchableOpacity
          style={styles.newChatButton}
          onPress={() => navigation.navigate('Friends')}
        >
          <Ionicons name="create-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={chatRooms}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.$id}
        style={styles.chatList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  newChatButton: {
    padding: 8,
  },
  chatList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  startChatButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startChatButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
});
