import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, StyleSheet, Platform } from 'react-native';

// Import components with error handling
let AuthProvider: any, FriendProvider: any, ChatProvider: any, AppNavigator: any;

try {
  const authModule = require('./src/contexts/AuthContext');
  AuthProvider = authModule.AuthProvider;

  const friendModule = require('./src/contexts/FriendContext');
  FriendProvider = friendModule.FriendProvider;

  const chatModule = require('./src/contexts/ChatContext');
  ChatProvider = chatModule.ChatProvider;

  const navModule = require('./src/navigation/AppNavigator');
  AppNavigator = navModule.AppNavigator;
} catch (error) {
  console.error('Error loading modules:', error);
}

export default function App() {
  // If modules failed to load, show basic UI
  if (!AuthProvider || !FriendProvider || !ChatProvider || !AppNavigator) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>ChatApp</Text>
        <Text style={styles.subtitle}>Loading...</Text>
        <Text style={styles.error}>
          Please check your Appwrite configuration in src/config/appwrite.ts
        </Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          style="dark"
          backgroundColor="#FFFFFF"
          translucent={false}
        />
        <AuthProvider>
          <FriendProvider>
            <ChatProvider>
              <AppNavigator />
            </ChatProvider>
          </FriendProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  error: {
    fontSize: 14,
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 16,
  },
});
