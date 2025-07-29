import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Keyboard,
  Animated,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFriend } from '../../contexts/FriendContext';
import { MessageBubble } from '../../components/MessageBubble';
import { MessageInput } from '../../components/MessageInput';
import { Message, User } from '../../types';

interface ChatScreenProps {
  navigation: any;
  route: {
    params: {
      chatRoomId: string;
      recipientUser: User;
    };
  };
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
  const { chatRoomId, recipientUser } = route.params;
  const { messages, sendMessage, loadMessages } = useChat();
  const { user } = useAuth();
  const { unfriendUser, blockUser, getFriendshipStatus } = useFriend();
  const [isLoading, setIsLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);
  const keyboardHeightAnim = useRef(new Animated.Value(0)).current;

  const chatMessages = messages[chatRoomId] || [];

  const handleChatOptions = () => {
    const friendshipStatus = getFriendshipStatus(recipientUser.$id);

    const options: any[] = [];

    // Add view profile option
    options.push({
      text: 'View Profile',
      onPress: () => Alert.alert('User Profile', 'Profile viewing feature coming soon!'),
    });

    // Add friendship-related options based on current status
    if (friendshipStatus === 'friend') {
      options.push({
        text: 'Unfriend',
        style: 'destructive',
        onPress: () => handleUnfriend(),
      });

      options.push({
        text: 'Block User',
        style: 'destructive',
        onPress: () => handleBlockUser(),
      });
    } else if (friendshipStatus === 'none') {
      options.push({
        text: 'Send Friend Request',
        onPress: () => Alert.alert('Friend Request', 'Friend request feature coming soon!'),
      });
    }

    // Always add Cancel as the last option
    options.push({
      text: 'Cancel',
      style: 'cancel',
      onPress: () => {
        console.log('Chat options cancelled');
        // Do nothing - just dismiss the alert
      },
    });

    Alert.alert(
      `${recipientUser.displayName || recipientUser.username}`,
      'What would you like to do?',
      options,
      { cancelable: true }
    );
  };

  const handleUnfriend = () => {
    Alert.alert(
      'Unfriend User',
      `Are you sure you want to unfriend ${recipientUser.displayName || recipientUser.username}? You can still chat with them in this conversation.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Unfriend',
          style: 'destructive',
          onPress: async () => {
            try {
              await unfriendUser(recipientUser.$id);
              Alert.alert('Success', 'User unfriended successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to unfriend user');
            }
          },
        },
      ]
    );
  };

  const handleBlockUser = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${recipientUser.displayName || recipientUser.username}? They will not be able to send you messages.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(recipientUser.$id);
              Alert.alert('Success', 'User blocked successfully');
              navigation.goBack(); // Go back to chats list
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to block user');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    // Set navigation header
    navigation.setOptions({
      headerTitle: () => (
        <TouchableOpacity
          style={styles.headerTitleContainer}
          onPress={() => {
            // Navigate to user profile
            Alert.alert('User Profile', 'Feature coming soon!');
          }}
          activeOpacity={0.7}
        >
          <View style={styles.headerAvatar}>
            {recipientUser.avatar ? (
              <Image source={{ uri: recipientUser.avatar }} style={styles.headerAvatarImage} />
            ) : (
              <Ionicons name="person" size={20} color="#666" />
            )}
          </View>
          <View style={styles.headerTitleText}>
            <Text style={styles.headerName} numberOfLines={1}>
              {recipientUser.displayName || recipientUser.username || 'Chat'}
            </Text>
            <Text style={styles.headerStatus} numberOfLines={1}>
              {recipientUser.isOnline ? 'Online' : 'Last seen recently'}
            </Text>
          </View>
        </TouchableOpacity>
      ),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => handleChatOptions()}
          style={styles.headerButton}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#007AFF" />
        </TouchableOpacity>
      ),
    });

    // Load messages when component mounts
    loadChatMessages();
  }, [chatRoomId]);

  // Scroll to bottom when messages are loaded
  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [chatMessages.length]);

  useEffect(() => {
    // Keyboard event listeners
    const keyboardWillShow = (event: any) => {
      const { height } = event.endCoordinates;
      setKeyboardHeight(height);
      Animated.timing(keyboardHeightAnim, {
        toValue: height,
        duration: event.duration || 250,
        useNativeDriver: false,
      }).start();

      // Scroll to bottom when keyboard shows
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    const keyboardWillHide = (event: any) => {
      setKeyboardHeight(0);
      Animated.timing(keyboardHeightAnim, {
        toValue: 0,
        duration: event.duration || 250,
        useNativeDriver: false,
      }).start();
    };

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showListener = Keyboard.addListener(showEvent, keyboardWillShow);
    const hideListener = Keyboard.addListener(hideEvent, keyboardWillHide);

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const loadChatMessages = async () => {
    try {
      setIsLoading(true);
      await loadMessages(chatRoomId);
    } catch (error) {
      console.error('Load chat messages error:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendText = async (text: string) => {
    try {
      await sendMessage(chatRoomId, text, 'text');
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Send text message error:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const handleSendImage = async (imageUri: string) => {
    try {
      await sendMessage(chatRoomId, imageUri, 'image');
      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Send image message error:', error);
      Alert.alert('Error', 'Failed to send image');
    }
  };

  const handleImagePress = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setImageViewerVisible(true);
  };

  const closeImageViewer = () => {
    setImageViewerVisible(false);
    setSelectedImageUrl('');
  };

  const handleMessageLongPress = (message: Message) => {
    const isOwnMessage = message.senderId === user?.$id;
    
    const options = ['Copy'];
    if (isOwnMessage) {
      options.push('Delete');
    }
    options.push('Cancel');

    Alert.alert(
      'Message Options',
      '',
      options.map((option) => ({
        text: option,
        style: option === 'Cancel' ? 'cancel' : option === 'Delete' ? 'destructive' : 'default',
        onPress: () => {
          if (option === 'Copy') {
            // Copy message to clipboard
            Alert.alert('Copied', 'Message copied to clipboard');
          } else if (option === 'Delete') {
            // Delete message
            Alert.alert('Delete Message', 'Feature coming soon!');
          }
          // Cancel option will just dismiss (no action needed)
        },
      }))
    );
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.senderId === user?.$id;

    return (
      <MessageBubble
        message={item}
        isOwnMessage={isOwnMessage}
        senderUser={isOwnMessage ? user : recipientUser}
        onImagePress={handleImagePress}
        onMessageLongPress={handleMessageLongPress}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>Start your conversation</Text>
      <Text style={styles.emptySubtext}>
        Send a message to {recipientUser.displayName || recipientUser.username}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.chatContainer}>
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.$id}
          style={styles.messagesList}
          contentContainerStyle={[
            styles.messagesContainer,
            {
              paddingBottom: keyboardHeight > 0 ? 20 : 140,
              flexGrow: 1
            }
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            // Always scroll to end when content size changes (new messages)
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 50);
          }}
          ListEmptyComponent={!isLoading ? renderEmptyState : null}
        />

        <Animated.View
          style={[
            styles.inputContainer,
            {
              bottom: keyboardHeightAnim
            }
          ]}
        >
          <MessageInput
            onSendText={handleSendText}
            onSendImage={handleSendImage}
            disabled={isLoading}
          />
        </Animated.View>
      </View>

      {/* Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageViewer}
      >
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity
            style={styles.imageViewerBackground}
            activeOpacity={1}
            onPress={closeImageViewer}
          >
            <View style={styles.imageViewerContent}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeImageViewer}
              >
                <Ionicons name="close" size={30} color="#FFFFFF" />
              </TouchableOpacity>

              {selectedImageUrl ? (
                <Image
                  source={{ uri: selectedImageUrl }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              ) : null}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  chatContainer: {
    flex: 1,
    position: 'relative',
  },
  headerButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexGrow: 1,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  imageViewerBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
  },
  fullScreenImage: {
    width: '90%',
    height: '80%',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
    maxWidth: 250, // Ensure it doesn't take too much space
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  headerTitleText: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  headerStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 1,
  },
});
