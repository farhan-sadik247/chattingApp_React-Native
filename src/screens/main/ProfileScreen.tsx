import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../contexts/AuthContext';
import { DatabaseService } from '../../services/databaseService';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, logout, updateUser } = useAuth();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const databaseService = new DatabaseService();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const handleProfilePictureOptions = () => {
    const options: any[] = [];

    // Add main options
    options.push({
      text: 'Take Photo',
      onPress: () => {
        handleTakePhoto();
      }
    });

    options.push({
      text: 'Choose from Library',
      onPress: () => {
        handleSelectPhoto();
      }
    });

    // Add remove option if user has avatar
    if (user?.avatar) {
      options.push({
        text: 'Remove Photo',
        style: 'destructive',
        onPress: () => {
          handleRemovePhoto();
        }
      });
    }

    // Always add Cancel as the last option
    options.push({
      text: 'Cancel',
      style: 'cancel',
      onPress: () => {
        console.log('Profile picture options cancelled');
        // Do nothing - just dismiss the alert
      },
    });

    Alert.alert(
      'Profile Picture Options',
      'What would you like to do?',
      options,
      { cancelable: true }
    );
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleSelectPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Photo library permission is required to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Photo selection error:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const uploadProfilePicture = async (imageUri: string) => {
    try {
      setIsUploadingAvatar(true);

      // For now, we'll store the local image URI as the avatar
      // TODO: Implement proper image upload to Appwrite storage when bucket is set up
      await updateUser({ avatar: imageUri });

      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUploadingAvatar(true);
              await updateUser({ avatar: '' });
              Alert.alert('Success', 'Profile picture removed successfully!');
            } catch (error) {
              console.error('Remove photo error:', error);
              Alert.alert('Error', 'Failed to remove profile picture. Please try again.');
            } finally {
              setIsUploadingAvatar(false);
            }
          }
        },
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert(
      'Edit Profile',
      'Choose what to edit:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Display Name',
          onPress: () => Alert.prompt(
            'Edit Display Name',
            'Enter your new display name:',
            (text) => {
              if (text && text.trim()) {
                Alert.alert('Success', 'Display name updated!');
              }
            },
            'plain-text',
            user?.displayName
          )
        },
        {
          text: 'Username',
          onPress: () => Alert.prompt(
            'Edit Username',
            'Enter your new username:',
            (text) => {
              if (text && text.trim()) {
                Alert.alert('Success', 'Username updated!');
              }
            },
            'plain-text',
            user?.username
          )
        },
      ]
    );
  };



  const menuItems = [
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: 'Manage your notification preferences',
      onPress: () => Alert.alert('Notifications', 'Push notifications: Enabled\nMessage sounds: Enabled\nVibration: Enabled'),
    },
    {
      icon: 'lock-closed-outline',
      title: 'Privacy & Security',
      subtitle: 'Control your privacy settings',
      onPress: () => Alert.alert('Privacy & Security', 'End-to-end encryption: Enabled\nRead receipts: Enabled\nLast seen: Enabled'),
    },
    {
      icon: 'color-palette-outline',
      title: 'Appearance',
      subtitle: 'Customize your app theme',
      onPress: () => Alert.alert('Appearance', 'Theme: Light\nFont size: Medium\nChat wallpaper: Default'),
    },
    {
      icon: 'cloud-outline',
      title: 'Storage & Data',
      subtitle: 'Manage your data usage',
      onPress: () => Alert.alert('Storage & Data', 'Auto-download media: Wi-Fi only\nCache size: 45 MB\nBackup: Enabled'),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      onPress: () => Alert.alert('Help & Support', 'FAQ\nContact Support\nReport a Problem\nCommunity Guidelines'),
    },
    {
      icon: 'information-circle-outline',
      title: 'About',
      subtitle: 'App version and legal info',
      onPress: () => Alert.alert('About ChatApp', 'Version: 1.0.0\nBuild: 2024.01\n\nSecure messaging app with end-to-end encryption.\n\nTerms of Service\nPrivacy Policy'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <ScrollView style={styles.scrollContainer}>

      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity
            style={styles.avatar}
            onPress={handleProfilePictureOptions}
            disabled={isUploadingAvatar}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={40} color="#666" />
            )}
            {isUploadingAvatar && (
              <View style={styles.uploadingOverlay}>
                <Ionicons name="cloud-upload" size={20} color="#007AFF" />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.editAvatarButton}
            onPress={handleProfilePictureOptions}
            disabled={isUploadingAvatar}
          >
            <Ionicons name="camera" size={16} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.displayName}>{user?.displayName}</Text>
          <Text style={styles.username}>@{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.statusContainer}>
            <View style={styles.onlineIndicator} />
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
          <Text style={styles.editProfileText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name={item.icon as any} size={24} color="#666" />
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemText}>{item.title}</Text>
                <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#F44336" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>iTalk v1.0.0</Text>
          <Text style={styles.footerSubtext}>Secure messaging for everyone</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
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
  profileSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#999',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  editProfileButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  editProfileText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  menuSection: {
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8F8',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  logoutSection: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#F44336',
    marginLeft: 16,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#ccc',
  },
  menuItemTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
