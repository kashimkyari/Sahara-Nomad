export const DesignTokens = {
  colors: {
    // Sendam primary palette
    primary: '#FF5722',
    secondary: '#00A859',
    background: '#FFF8EF',
    surface: '#FFFFFF',
    text: '#0F0F0F',
    muted: '#6B6B6B',
    accent: '#FFC107',
    error: '#FF0000',
    // Legacy aliases (kept for backward compatibility with older components)
    backgroundElement: '#EFEFEF',
    backgroundSelected: '#FF5722',
    textSecondary: '#6B6B6B',
    border: '#0F0F0F',
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
