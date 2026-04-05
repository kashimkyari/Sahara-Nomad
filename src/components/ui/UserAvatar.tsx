import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { User, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import API from '../../constants/api';

interface UserAvatarProps {
  url?: string | null;
  size?: number;
  borderWidth?: number;
  borderColor?: string;
  fallbackIcon?: 'user' | 'support';
}

export default function UserAvatar({ 
  url, 
  size = 40, 
  borderWidth = 2, 
  borderColor = '#000',
  fallbackIcon = 'user'
}: UserAvatarProps) {
  const { token } = useAuth();
  
  const fullUrl = url ? (url.startsWith('http') ? url : `${API.API_URL}${url}`) : null;

  return (
    <View style={[
      styles.container, 
      { 
        width: size, 
        height: size, 
        borderWidth, 
        borderColor,
      }
    ]}>
      {fullUrl ? (
        <Image
          source={{ uri: fullUrl, headers: { Authorization: `Bearer ${token}` } }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={styles.fallback}>
          {fallbackIcon === 'support' ? (
            <ShieldCheck size={size * 0.5} color="#000" strokeWidth={2.5} />
          ) : (
            <User size={size * 0.5} color="#000" strokeWidth={2.5} />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  }
});
