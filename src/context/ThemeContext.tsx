import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DesignTokens } from '../constants/design';

type Theme = 'light' | 'dark';
interface Colors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  error: string;
  border: string;
}

interface ThemeContextType {
  theme: Theme;
  colors: Colors;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

import { useAuth } from './AuthContext';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    if (user?.is_dark_mode !== undefined) {
      setTheme(user.is_dark_mode ? 'dark' : 'light');
    }
  }, [user?.is_dark_mode]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const colors = DesignTokens[theme];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors,
        isDarkMode: theme === 'dark',
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}
