import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DesignTokens } from '../constants/design';

type Theme = 'light' | 'dark';
type Colors = typeof DesignTokens.light;

interface ThemeContextType {
  theme: Theme;
  colors: Colors;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

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
