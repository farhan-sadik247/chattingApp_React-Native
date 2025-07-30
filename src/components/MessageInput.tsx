import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface MessageInputProps {
  onSendText: (text: string) => void;
  onSendImage: (imageUri: string) => void;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendText,
  onSendImage,
  disabled = false,
}) => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSendText = () => {
    if (message.trim() && !disabled && !isLoading) {
      onSendText(message.trim());
      setMessage('');
    }
  };

  const handleImagePicker = async () => {
    if (disabled || isLoading) return;

    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your photo library to share images.'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // No cropping - upload as-is
        quality: 0.8,
        exif: false, // Don't include EXIF data
      });

      if (!result.canceled && result.assets[0]) {
        setIsLoading(true);
        await onSendImage(result.assets[0].uri);
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleCameraPicker = async () => {
    if (disabled || isLoading) return;

    try {
      // Request permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant permission to access your camera to take photos.'
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false, // No cropping - upload as-is
        quality: 0.8,
        exif: false, // Don't include EXIF data
      });

      if (!result.canceled && result.assets[0]) {
        setIsLoading(true);
        await onSendImage(result.assets[0].uri);
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Image',
      'How would you like to add an image?',
      [
        {
          text: 'Take Photo',
          onPress: handleCameraPicker
        },
        {
          text: 'Choose from Library',
          onPress: handleImagePicker
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            console.log('Image options cancelled');
            // Do nothing - just dismiss the alert
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={[styles.attachButton, (disabled || isLoading) && styles.disabledButton]}
          onPress={showImageOptions}
          disabled={disabled || isLoading}
        >
          <Ionicons 
            name="camera" 
            size={24} 
            color={disabled || isLoading ? '#ccc' : '#007AFF'} 
          />
        </TouchableOpacity>

        <TextInput
          style={[
            styles.textInput,
            (disabled || isLoading) && styles.disabledInput,
            isFocused && styles.focusedInput
          ]}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={1000}
          editable={!disabled && !isLoading}
          onSubmitEditing={handleSendText}
          blurOnSubmit={false}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!message.trim() || disabled || isLoading) && styles.disabledButton,
          ]}
          onPress={handleSendText}
          disabled={!message.trim() || disabled || isLoading}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={!message.trim() || disabled || isLoading ? '#ccc' : '#FFFFFF'} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingHorizontal: 4,
    paddingVertical: 4,
    minHeight: 50,
  },
  attachButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    color: '#333',
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#F0F0F0',
  },
  disabledInput: {
    color: '#999',
  },
  focusedInput: {
    backgroundColor: '#FFFFFF',
  },
});
