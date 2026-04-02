import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';

interface AuthContextType {
  token: string | null;
  isLoading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Load token from storage on mount
    const loadToken = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('userToken');
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (e) {
        console.error('Failed to load token', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadToken();
  }, []);

  const signIn = async (newToken: string) => {
    await SecureStore.setItemAsync('userToken', newToken);
    setToken(newToken);
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync('userToken');
    setToken(null);
  };

  // Strictly enforce navigation guards
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth' || segments[0] === 'onboarding';

    if (!token && !inAuthGroup) {
      // Redirect to login if NOT authenticated and NOT in auth group
      router.replace('/auth');
    } else if (token && inAuthGroup) {
      // Redirect to home if authenticated and currently in auth group
      router.replace('/(tabs)');
    }
  }, [token, isLoading, segments]);

  return (
    <AuthContext.Provider value={{ token, isLoading, signIn, signOut }}>
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
