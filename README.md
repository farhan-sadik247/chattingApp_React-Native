# iTalk 💬 - Secure Messaging App

A modern, secure messaging application built with React Native and Expo. iTalk provides real-time messaging with end-to-end encryption, media sharing, and a beautiful user interface designed for seamless communication.

![iTalk Logo](./assets/logo.png)

## 🌟 Overview

iTalk is a feature-rich messaging app that prioritizes security, user experience, and modern design. Built with React Native and Expo, it offers cross-platform compatibility with native performance. The app includes comprehensive chat functionality, friend management, media sharing, and robust encryption to keep your conversations private.

## ✨ Features

### 🔐 Security & Privacy
- **End-to-End Encryption** - All messages are encrypted with AES encryption before sending
- **Secure Key Management** - Encryption keys stored securely on device with AsyncStorage
- **Message Integrity** - Hash verification ensures message authenticity
- **Privacy First** - No message content stored in plain text

### 💬 Messaging & Communication
- **Real-time Messaging** - Instant message delivery with Appwrite Realtime
- **Message Status** - Delivery and read receipts for all messages
- **Media Sharing** - Send and receive images with automatic compression
- **Chat History** - Persistent message history with pagination
- **Typing Indicators** - See when friends are typing

### � Social Features
- **Friend Management** - Send/accept friend requests, manage friend lists
- **User Profiles** - Customizable profiles with avatars and display names
- **Online Status** - See when friends are online or last seen
- **User Search** - Find and add friends by username or email

### 🎨 User Experience
- **Modern UI/UX** - Clean, intuitive interface with smooth animations
- **Cross-platform** - Native performance on iOS and Android
- **Responsive Design** - Optimized for different screen sizes
- **Offline Support** - Messages sync when connection is restored
- **Dark/Light Theme Ready** - Prepared for theme customization

## 🛠️ Tech Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **Expo** - Development platform and build tools
- **TypeScript** - Type-safe JavaScript development
- **React Navigation v6** - Navigation and routing
- **React Native Safe Area Context** - Safe area handling
- **React Native Gesture Handler** - Touch and gesture handling

### Backend & Services
- **Appwrite** - Backend-as-a-Service (Database, Auth, Storage, Realtime)
- **Appwrite Database** - NoSQL document database
- **Appwrite Auth** - User authentication and management
- **Appwrite Storage** - File and media storage
- **Appwrite Realtime** - WebSocket-based real-time updates

### Security & Encryption
- **AES Encryption** - Message encryption with crypto-js
- **AsyncStorage** - Secure local key storage
- **Hash Verification** - Message integrity checking
- **Deterministic Key Generation** - Backward-compatible key recovery

### UI & Media
- **Expo Vector Icons** - Icon library (Ionicons)
- **Expo Image Picker** - Camera and gallery access
- **Expo Media Library** - Photo library management
- **React Native Elements** - UI component library

## 📋 Prerequisites

Before running iTalk on your local device, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **Expo CLI** - Install globally: `npm install -g @expo/cli`
- **Expo Go App** - Download on your mobile device:
- **Appwrite Account** - [Sign up at Appwrite Cloud](https://cloud.appwrite.io)
- **Git** - For cloning the repository

## 🚀 How to Run iTalk on Your Local Device

### Step 1: Clone the Repository

```bash
git clone https://github.com/farhan-sadik247/chattingApp_React-Native.git
cd ChatApp
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Appwrite Backend Setup

#### 3.1 Create Appwrite Project

1. **Sign up** at [Appwrite Cloud](https://cloud.appwrite.io)
2. **Create a new project** and name it "iTalk"
3. **Note down** your Project ID and Endpoint URL
4. **Add your platform**:
   - Go to "Settings" → "Platforms"
   - Add "Expo" platform
   - Enter your bundle identifier: `com.italk.mobile`

#### 3.2 Database Setup

1. **Create a new database** in your Appwrite project
2. **Name it**: `italk-db`
3. **Create the following collections** with these exact names and attributes:

**Users Collection (`users`)**
- email (String, Required)
- username (String, Required, Unique)
- displayName (String, Required)
- avatar (String, Optional)
- publicKey (String, Required)
- isOnline (Boolean, Required)
- lastSeen (DateTime, Required)

**Friendships Collection (`friendships`)**
- senderId (String, Required)
- receiverId (String, Required)
- status (String, Required) - Values: 'pending', 'accepted', 'declined', 'blocked'

**Chat Rooms Collection (`chatRooms`)**
- participants (Array[String], Required)
- encryptionKey (String, Required)
- lastMessageTime (DateTime, Required)

**Messages Collection (`messages`)**
- chatRoomId (String, Required)
- senderId (String, Required)
- content (String, Required)
- messageType (String, Required) - Values: 'text', 'image', 'file'
- mediaUrl (String, Optional)
- isDelivered (Boolean, Required)
- isRead (Boolean, Required)

#### 3.3 Storage Setup

1. **Go to Storage** in your Appwrite console
2. **Create a new bucket** named `chat-media`
3. **Set permissions** to allow authenticated users to read/write

#### 3.4 Permissions Setup

For each collection, set these permissions:
- **Read Access**: `users` (authenticated users)
- **Write Access**: `users` (authenticated users)
- **Update Access**: `users` (authenticated users)
- **Delete Access**: `users` (authenticated users)

### Step 4: Configure Environment Variables

1. **Copy the example environment file**:
   ```bash
   cp .env
   ```

2. **Edit the `.env` file** with your Appwrite project details:
   ```env
   EXPO_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
   EXPO_PUBLIC_APPWRITE_PROJECT_ID=your_project_id_here
   EXPO_PUBLIC_APPWRITE_DATABASE_ID=italk-db

   # Collection IDs (use the exact IDs from your Appwrite console)
   EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID=users
   EXPO_PUBLIC_APPWRITE_FRIENDSHIPS_COLLECTION_ID=friendships
   EXPO_PUBLIC_APPWRITE_CHATROOMS_COLLECTION_ID=chatRooms
   EXPO_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID=messages

   # Storage Bucket ID
   EXPO_PUBLIC_APPWRITE_STORAGE_ID=chat-media
   ```

3. **Replace the placeholder values** with your actual Appwrite project details from the console

### Step 5: Start the Development Server

1. **Start Expo development server**:
   ```bash
   npx expo start
   ```

2. **You'll see a QR code** in your terminal and a development server will open in your browser

### Step 6: Run on Your Device

#### Option A: Using Expo Go (Recommended for Development)

1. **Install Expo Go** on your mobile device:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Scan the QR code** displayed in your terminal or browser with:
   - **iOS**: Use the Camera app to scan the QR code
   - **Android**: Use the Expo Go app to scan the QR code

3. **iTalk will load** on your device automatically

#### Option B: Using Simulators/Emulators

```bash
# iOS Simulator (macOS only)
npx expo run:ios

# Android Emulator
npx expo run:android

# Web Browser
npx expo start --web
```

### Step 7: Create Your Account

1. **Open iTalk** on your device
2. **Sign up** with your email and create a username
3. **Start chatting** by adding friends and sending messages!

## 📁 Project Structure

```
iTalk/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── MessageBubble.tsx    # Chat message display
│   │   ├── MessageInput.tsx     # Message input with media
│   │   ├── FriendListItem.tsx   # Friend list component
│   │   └── UserAvatar.tsx       # User avatar component
│   ├── contexts/           # React contexts for state management
│   │   ├── AuthContext.tsx      # Authentication state
│   │   ├── ChatContext.tsx      # Chat and messaging state
│   │   └── FriendContext.tsx    # Friend management state
│   ├── navigation/         # Navigation configuration
│   │   └── AppNavigator.tsx     # Tab and stack navigation
│   ├── screens/           # Screen components
│   │   ├── auth/               # Authentication screens
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   └── main/               # Main app screens
│   │       ├── ChatListScreen.tsx
│   │       ├── ChatScreen.tsx
│   │       ├── FriendsScreen.tsx
│   │       └── ProfileScreen.tsx
│   ├── services/          # Business logic and API calls
│   │   ├── authService.ts       # Authentication logic
│   │   ├── chatService.ts       # Chat and messaging
│   │   ├── databaseService.ts   # Database operations
│   │   ├── encryptionService.ts # Message encryption
│   │   └── friendService.ts     # Friend management
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts            # App-wide type definitions
│   ├── utils/             # Utility functions
│   │   └── encryption.ts       # Encryption utilities
│   └── config/            # Configuration files
│       └── appwrite.ts         # Appwrite configuration
├── assets/                # Static assets
│   ├── logo.png              # App logo
│   ├── icon.png              # App icon
│   └── splash.png            # Splash screen
├── App.tsx               # Main app component
├── app.json              # Expo configuration
├── package.json          # Dependencies and scripts
└── .env                  # Environment variables
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ using React Native and Expo**

*iTalk - Secure messaging for everyone* 🔒💬
