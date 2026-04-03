import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import API from '../constants/api';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import * as Notifications from 'expo-notifications';
import * as ExpoLocation from 'expo-location';
import { Platform } from 'react-native';

interface User {
  id: string;
  full_name: string;
  phone_number: string;
  email: string | null;
  loyalty_badge: string | null;
  is_otp_verified: boolean;
  is_verified: boolean;
  is_runner: boolean;
  role: 'user' | 'support_admin' | 'super_admin';
  stats_rating: number;
  avatar_url: string | null;
  push_notifications_enabled: boolean;
  location_services_enabled: boolean;
  is_dark_mode: boolean;
  language: string;
  region: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  spent_total: number;
  errands_count: number;
  wallet_balance: number;
  runner_profile?: {
    bio?: string;
    hourly_rate?: number;
    stats_trips: number;
    stats_rating: number;
    is_online: boolean;
    reviews?: Array<{
      id: string;
      rating: number;
      comment: string;
      reviewer_name?: string;
      created_at: string;
    }>;
  } | null;
}

interface AuthContextType {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isLoading: boolean;
  signIn: (accessToken: string, refreshToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  const signOut = async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync('userToken'),
        SecureStore.deleteItemAsync('refreshToken'),
        AsyncStorage.removeItem('userData')
      ]);
    } catch (e) {
      console.error('Error during secure storage cleanup:', e);
    }
    setToken(null);
    setRefreshTokenState(null);
    setUser(null);
    // Explicitly navigate NO. Let the guard handle it.
  };

  const refreshAccessToken = async (currentRefreshToken: string) => {
    try {
      const response = await fetch(`${API.API_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: currentRefreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        await Promise.all([
          SecureStore.setItemAsync('userToken', data.access_token),
          SecureStore.setItemAsync('refreshToken', data.refresh_token)
        ]);
        setToken(data.access_token);
        setRefreshTokenState(data.refresh_token);
        return data;
      }
    } catch (e) {
      console.error('Failed to refresh access token', e);
    }
    return null;
  };

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await fetch(`${API.API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        // Persist user data for offline access
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
      } else if (response.status === 401) {
        // Attempt to refresh token if we have a refresh token
        const storedRefreshToken = await SecureStore.getItemAsync('refreshToken');
        if (storedRefreshToken) {
          const newTokens = await refreshAccessToken(storedRefreshToken);
          if (newTokens) {
            // Retry with new token
            await fetchUserProfile(newTokens.access_token);
            return;
          }
        }
        // If we reach here, either no refresh token or refresh failed
        await signOut();
      }
    } catch (e) {
      console.error('Failed to fetch user profile', e);
    }
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUserProfile(token);
    }
  };

  useEffect(() => {
    const loadToken = async () => {
      try {
        const [storedToken, storedRefreshToken, storedUserData] = await Promise.all([
          SecureStore.getItemAsync('userToken'),
          SecureStore.getItemAsync('refreshToken'),
          AsyncStorage.getItem('userData')
        ]);

        if (storedUserData) {
          setUser(JSON.parse(storedUserData));
        }

        if (storedRefreshToken) {
          setRefreshTokenState(storedRefreshToken);
        }

        if (storedToken) {
          setToken(storedToken);
          // Refresh user data in background if online
          fetchUserProfile(storedToken);
        }
      } catch (e) {
        console.error('Failed to load auth state', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadToken();
  }, []);

  const signIn = async (accessToken: string, newRefreshToken: string) => {
    await Promise.all([
      SecureStore.setItemAsync('userToken', accessToken),
      SecureStore.setItemAsync('refreshToken', newRefreshToken)
    ]);
    setToken(accessToken);
    setRefreshTokenState(newRefreshToken);
    await fetchUserProfile(accessToken);
  };

  // Strictly enforce navigation guards
  useEffect(() => {
    if (isLoading || !rootNavigationState?.key) return;

    const firstSegment = segments[0] as any;
    const isIndexRoute = firstSegment === 'index' || !firstSegment;
    const isPublicRoute = firstSegment === 'auth' || firstSegment === 'onboarding';

    if (!token && (isIndexRoute || !isPublicRoute)) {
      // Signed-out users should always land on onboarding, never remain on the splash route.
      router.replace('/onboarding');
    } else if (token && (isIndexRoute || isPublicRoute)) {
      // Authenticated users should not stay on splash/auth screens.
      router.replace('/(tabs)');
    }
  }, [token, isLoading, segments, rootNavigationState?.key]);

  // Sync Push Token when authenticated
  useEffect(() => {
    if (token) {
      const syncPushToken = async () => {
        try {
          const expoPushToken = await registerForPushNotificationsAsync();
          if (expoPushToken) {
            await fetch(`${API.API_URL}/auth/me`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ expo_push_token: expoPushToken })
            });
            // Update local user state too if needed
            if (user) {
              setUser({ ...user, expo_push_token: expoPushToken } as any);
            }
          }
        } catch (e) {
          console.error('Push Token Sync Error:', e);
        }
      };

      // Slight delay to ensure environment is ready
      const timer = setTimeout(syncPushToken, 1000);
      
      // Also register notification listeners if needed
      const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification Received:', notification);
      });

      const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification Response:', response);
        const data = response.notification.request.content.data;
        if (data?.linked_entity_id && data?.linked_entity_type) {
          // Handle navigation based on entity type
          if (data.linked_entity_type === 'conversation') {
            router.push(`/conversation/${data.linked_entity_id}` as any);
          } else if (data.linked_entity_type === 'waka') {
            router.push(`/waka/${data.linked_entity_id}` as any);
          }
        }
      });

      return () => {
        clearTimeout(timer);
        notificationListener.remove();
        responseListener.remove();
      };
    }
  }, [token]);

  // Sync Location every 4 minutes if enabled
  useEffect(() => {
    if (token && user?.location_services_enabled) {
      const syncLocation = async () => {
        try {
          const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const loc = await ExpoLocation.getCurrentPositionAsync({
              accuracy: ExpoLocation.Accuracy.Balanced,
            });
            const [address] = await ExpoLocation.reverseGeocodeAsync({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude
            });
            const city = address?.city || address?.subregion || address?.district;

            await fetch(`${API.API_URL}/auth/me`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ 
                latitude: loc.coords.latitude, 
                longitude: loc.coords.longitude,
                city: city
              })
            });
            console.log('Location Synced:', loc.coords.latitude, loc.coords.longitude);
          }
        } catch (e) {
          console.error('Location Sync Error:', e);
        }
      };

      // Initial sync
      syncLocation();

      // Set interval for 4 minutes
      const intervalId = setInterval(syncLocation, 4 * 60 * 1000);

      return () => clearInterval(intervalId);
    }
  }, [token, user?.location_services_enabled]);

  const isAdmin = user?.role === 'support_admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{ token, refreshToken, user, isLoading, signIn, signOut, refreshUser, isAdmin, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
