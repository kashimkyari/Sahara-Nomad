export const DesignTokens = {
  light: {
    primary: '#FF5722',
    secondary: '#00A859',
    background: '#FFF8EF',
    surface: '#FFFFFF',
    text: '#0F0F0F',
    muted: '#6B6B6B',
    accent: '#FFC107',
    error: '#FF0000',
    border: '#0F0F0F',
  },
  dark: {
    primary: '#FF5722',
    secondary: '#00A859',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#F5F5F5',
    muted: '#9E9E9E',
    accent: '#FFC107',
    error: '#FF3B30',
    border: '#F5F5F5',
  },
  admin: {
    primary: '#6200EE', // Deep Purple
    secondary: '#00E5FF', // Electric Blue
    background: '#0F0F0B', // Darker background
    surface: '#1A1A1A',
    text: '#F5F5F5',
    muted: '#9E9E9E',
    accent: '#FF00FF', // Magenta
    error: '#FF3B30',
    border: '#F5F5F5',
    card: '#222222',
  },
  typography: {
    heading: 'Outfit_700Bold',
    body: 'PlusJakartaSans_500Medium',
    bodySemiBold: 'PlusJakartaSans_600SemiBold',
  },
  radius: 0,
  border: {
    width: 2,
    color: '#0F0F0F',
  },
  shadow: {
    hard: {
      shadowColor: '#0F0F0F',
      shadowOffset: { width: 4, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 4,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 40,
  },
} as const;
