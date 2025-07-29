import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFriend } from '../../contexts/FriendContext';
import { useChat } from '../../contexts/ChatContext';
import { User, Friendship, FriendRequestWithDetails } from '../../types';

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

interface FriendsScreenProps {
  navigation: any;
}

export const FriendsScreen: React.FC<FriendsScreenProps> = ({ navigation }) => {
  const {
    friends,
    friendRequests,
    sentRequests,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    unfriendUser,
    blockUser,
    searchUsers,
    getFriendshipStatus
  } = useFriend();
  const { createChatRoom } = useChat();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        setIsSearching(true);
        const results = await searchUsers(query.trim());
        setSearchResults(results);
      } catch (error) {
        console.error('Search users error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500), // 500ms delay
    [searchUsers]
  );

  // Effect to trigger debounced search when query changes
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Refresh logic would go here
    setRefreshing(false);
  }, []);



  const handleSendFriendRequest = async (username: string) => {
    try {
      await sendFriendRequest(username);
      Alert.alert('Success', 'Friend request sent!');
      setSearchQuery('');
      setSearchResults([]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      Alert.alert('Success', 'Friend request accepted!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to accept friend request');
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      await declineFriendRequest(requestId);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to decline friend request');
    }
  };

  const handleStartChat = async (friendId: string) => {
    try {
      const chatRoomId = await createChatRoom(friendId);
      const friend = friends.find(f => f.$id === friendId);

      navigation.navigate('Chat', {
        chatRoomId,
        recipientUser: friend,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start chat');
    }
  };

  const handleFriendOptions = (friend: User) => {
    Alert.alert(
      friend.displayName || friend.username,
      'Choose an action',
      [
        {
          text: 'Chat',
          onPress: () => handleStartChat(friend.$id),
        },
        {
          text: 'Unfriend',
          style: 'destructive',
          onPress: () => handleUnfriend(friend),
        },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => handleBlock(friend),
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            // Do nothing - just dismiss the alert
          },
        },
      ]
    );
  };

  const handleUnfriend = (friend: User) => {
    Alert.alert(
      'Unfriend User',
      `Are you sure you want to unfriend ${friend.displayName || friend.username}? You can still chat with them if you have an existing conversation.`,
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
              await unfriendUser(friend.$id);
              Alert.alert('Success', 'User unfriended successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to unfriend user');
            }
          },
        },
      ]
    );
  };

  const handleBlock = (friend: User) => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${friend.displayName || friend.username}? They will not be able to send you messages.`,
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
              await blockUser(friend.$id);
              Alert.alert('Success', 'User blocked successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to block user');
            }
          },
        },
      ]
    );
  };

  const renderFriend = ({ item }: { item: User }) => (
    <View style={styles.friendItem}>
      <View style={styles.friendInfo}>
        <View style={styles.avatar}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={24} color="#666" />
          )}
          {item.isOnline && (
            <View style={styles.onlineIndicator} />
          )}
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.displayName}</Text>
          <Text style={styles.friendUsername}>@{item.username}</Text>
          <Text style={styles.friendStatus}>
            {item.isOnline ? 'Online' : 'Last seen recently'}
          </Text>
        </View>
      </View>
      <View style={styles.friendActions}>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => handleStartChat(item.$id)}
        >
          <Ionicons name="chatbubble" size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.optionsButton}
          onPress={() => handleFriendOptions(item)}
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFriendRequest = ({ item }: { item: FriendRequestWithDetails }) => (
    <View style={styles.requestItem}>
      <View style={styles.friendInfo}>
        <View style={styles.avatar}>
          {item.senderDetails?.avatar ? (
            <Image source={{ uri: item.senderDetails.avatar }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={24} color="#666" />
          )}
          {item.senderDetails?.isOnline && (
            <View style={styles.onlineIndicator} />
          )}
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{item.senderDetails.displayName}</Text>
          <Text style={styles.friendUsername}>@{item.senderDetails.username}</Text>
          <Text style={styles.friendEmail}>{item.senderDetails.email}</Text>
          <Text style={styles.requestTime}>
            {new Date(item.$createdAt).toLocaleDateString()} at {new Date(item.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptRequest(item.$id)}
        >
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => handleDeclineRequest(item.$id)}
        >
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchResult = ({ item }: { item: User }) => {
    const friendshipStatus = getFriendshipStatus(item.$id);

    const renderActionButton = () => {
      switch (friendshipStatus) {
        case 'friend':
          return (
            <TouchableOpacity
              style={[styles.addButton, styles.friendButton]}
              onPress={() => handleStartChat(item.$id)}
            >
              <Ionicons name="chatbubble" size={20} color="#4CAF50" />
              <Text style={styles.buttonText}>Chat</Text>
            </TouchableOpacity>
          );
        case 'pending_sent':
          return (
            <View style={[styles.addButton, styles.pendingButton]}>
              <Ionicons name="time" size={20} color="#FF9800" />
              <Text style={styles.buttonText}>Requested</Text>
            </View>
          );
        case 'pending_received':
          return (
            <TouchableOpacity
              style={[styles.addButton, styles.acceptSearchButton]}
              onPress={() => {
                const request = friendRequests.find(req => req.senderId === item.$id);
                if (request) {
                  handleAcceptRequest(request.$id);
                }
              }}
            >
              <Ionicons name="checkmark" size={20} color="#4CAF50" />
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>
          );
        case 'blocked':
          return (
            <View style={[styles.addButton, styles.blockedButton]}>
              <Ionicons name="ban" size={20} color="#F44336" />
              <Text style={styles.buttonText}>Blocked</Text>
            </View>
          );
        default:
          return (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleSendFriendRequest(item.username)}
            >
              <Ionicons name="person-add" size={20} color="#007AFF" />
              <Text style={styles.buttonText}>Add</Text>
            </TouchableOpacity>
          );
      }
    };

    return (
      <View style={styles.searchResultItem}>
        <View style={styles.friendInfo}>
          <View style={styles.avatar}>
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={24} color="#666" />
            )}
            {item.isOnline && (
              <View style={styles.onlineIndicator} />
            )}
          </View>
          <View style={styles.friendDetails}>
            <Text style={styles.friendName}>{item.displayName}</Text>
            <Text style={styles.friendUsername}>@{item.username}</Text>
          </View>
        </View>
        {renderActionButton()}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name={activeTab === 'friends' ? 'people-outline' : 'mail-outline'} 
        size={64} 
        color="#ccc" 
      />
      <Text style={styles.emptyTitle}>
        {activeTab === 'friends' ? 'No Friends Yet' : 'No Friend Requests'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'friends' 
          ? 'Search for users to add as friends' 
          : 'Friend requests will appear here'
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>
      </View>

      {searchQuery.length >= 2 && (
        <View style={styles.searchResults}>
          {isSearching ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.$id}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No users found</Text>
                  <Text style={styles.emptySubtext}>Try a different search term</Text>
                </View>
              }
            />
          )}
        </View>
      )}

      {searchQuery.length < 2 && (
        <>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
              onPress={() => setActiveTab('friends')}
            >
              <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
                Friends ({friends.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
              onPress={() => setActiveTab('requests')}
            >
              <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
                Requests ({friendRequests.length})
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'friends' ? (
            <FlatList
              data={friends}
              renderItem={renderFriend}
              keyExtractor={(item) => item.$id}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={renderEmptyState}
            />
          ) : (
            <FlatList
              data={friendRequests}
              renderItem={renderFriendRequest}
              keyExtractor={(item) => item.$id}
              style={styles.list}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              ListEmptyComponent={renderEmptyState}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
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
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  requestItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  friendEmail: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  requestTime: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  friendStatus: {
    fontSize: 12,
    color: '#999',
  },
  chatButton: {
    padding: 8,
  },
  requestActions: {
    flexDirection: 'row',
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  declineButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    padding: 8,
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  friendButton: {
    backgroundColor: '#E8F5E8',
  },
  pendingButton: {
    backgroundColor: '#FFF3E0',
  },
  acceptSearchButton: {
    backgroundColor: '#E8F5E8',
  },
  blockedButton: {
    backgroundColor: '#FFEBEE',
  },
  friendActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionsButton: {
    padding: 8,
    marginLeft: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
});
