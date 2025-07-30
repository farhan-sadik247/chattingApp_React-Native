// User types
export interface User {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  publicKey?: string;

  isOnline: boolean;
  lastSeen: string;
}

// Friendship types
export interface Friendship {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  senderUser?: User;
  receiverUser?: User;
}

export interface FriendRequestWithDetails extends Friendship {
  senderDetails: User;
}

// Chat room types
export interface ChatRoom {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  participants: string[];
  lastMessage?: Message;
  lastMessageTime: string;

}

// Message types
export interface Message {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  chatRoomId: string;
  senderId: string;
  content: string; // Plain text content
  messageType: 'text' | 'image' | 'file';
  mediaUrl?: string;
  isDelivered: boolean;
  isRead: boolean;
  sender?: User;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  Chat: { chatRoomId: string; recipientUser: User };
  Profile: undefined;
  Friends: undefined;
  AddFriend: undefined;
};

export type MainTabParamList = {
  Chats: undefined;
  Friends: undefined;
  Profile: undefined;
};

// Auth context types
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

// Chat context types
export interface ChatContextType {
  chatRooms: ChatRoom[];
  messages: { [chatRoomId: string]: Message[] };
  sendMessage: (chatRoomId: string, content: string, type: 'text' | 'image') => Promise<void>;
  loadMessages: (chatRoomId: string) => Promise<void>;
  createChatRoom: (participantId: string) => Promise<string>;
}

// Friend context types
export interface FriendContextType {
  friends: User[];
  friendRequests: FriendRequestWithDetails[];
  sentRequests: Friendship[];
  blockedUsers: User[];
  sendFriendRequest: (username: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  unfriendUser: (userId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  searchUsers: (query: string) => Promise<User[]>;
  getFriendshipStatus: (userId: string) => 'none' | 'friend' | 'pending_sent' | 'pending_received' | 'blocked';
}
