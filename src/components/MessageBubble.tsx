import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Message, User } from '../types';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  senderUser?: User;
  onImagePress?: (imageUrl: string) => void;
  onMessageLongPress?: (message: Message) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  senderUser,
  onImagePress,
  onMessageLongPress,
}) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageContent = () => {
    switch (message.messageType) {
      case 'text':
        return (
          <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
            {message.content}
          </Text>
        );
      
      case 'image':
        return (
          <View>
            {message.mediaUrl && (
              <TouchableOpacity
                onPress={() => onImagePress?.(message.mediaUrl!)}
                style={styles.imageContainer}
              >
                <Image source={{ uri: message.mediaUrl }} style={styles.messageImage} />
              </TouchableOpacity>
            )}
            {message.content && (
              <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
                {message.content}
              </Text>
            )}
          </View>
        );
      
      default:
        return (
          <Text style={[styles.messageText, isOwnMessage && styles.ownMessageText]}>
            Unsupported message type
          </Text>
        );
    }
  };

  const renderMessageStatus = () => {
    if (!isOwnMessage) return null;

    return (
      <View style={styles.statusContainer}>
        {message.isRead ? (
          <Ionicons name="checkmark-done" size={14} color="#4CAF50" />
        ) : message.isDelivered ? (
          <Ionicons name="checkmark-done" size={14} color="#999" />
        ) : (
          <Ionicons name="checkmark" size={14} color="#999" />
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, isOwnMessage && styles.ownMessageContainer]}>
      {!isOwnMessage && senderUser && (
        <View style={styles.senderAvatar}>
          {senderUser.avatar ? (
            <Image source={{ uri: senderUser.avatar }} style={styles.senderAvatarImage} />
          ) : (
            <Ionicons name="person" size={16} color="#666" />
          )}
        </View>
      )}

      <TouchableOpacity
        onLongPress={() => onMessageLongPress?.(message)}
        style={[
          styles.bubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble,
        ]}
        activeOpacity={0.8}
      >
        {renderMessageContent()}
        
        <View style={styles.messageFooter}>
          <Text style={[styles.timeText, isOwnMessage && styles.ownTimeText]}>
            {formatTime(message.$createdAt)}
          </Text>
          {renderMessageStatus()}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    marginHorizontal: 16,
    alignItems: 'flex-start',
  },
  ownMessageContainer: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: screenWidth * 0.75,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  ownBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    color: '#333',
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  imageContainer: {
    marginBottom: 4,
  },
  messageImage: {
    width: screenWidth * 0.6,
    height: screenWidth * 0.6,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  ownTimeText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statusContainer: {
    marginLeft: 4,
  },
  senderAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 4,
  },
  senderAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
});
