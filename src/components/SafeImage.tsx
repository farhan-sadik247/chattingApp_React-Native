import React, { useState } from 'react';
import {
  Image,
  View,
  StyleSheet,
  ActivityIndicator,
  ImageStyle,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SafeImageProps {
  source: { uri: string };
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  fallbackIcon?: string;
  fallbackIconSize?: number;
  fallbackIconColor?: string;
  showLoader?: boolean;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  source,
  style,
  containerStyle,
  fallbackIcon = 'image-outline',
  fallbackIconSize = 24,
  fallbackIconColor = '#999',
  showLoader = true,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  if (error || !source?.uri) {
    return (
      <View style={[styles.fallbackContainer, style, containerStyle]}>
        <Ionicons 
          name={fallbackIcon as any} 
          size={fallbackIconSize} 
          color={fallbackIconColor} 
        />
      </View>
    );
  }

  return (
    <View style={[containerStyle]}>
      <Image
        source={source}
        style={style}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        resizeMode="cover"
      />
      {loading && showLoader && (
        <View style={[styles.loaderContainer, style]}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 240, 240, 0.8)',
  },
});
