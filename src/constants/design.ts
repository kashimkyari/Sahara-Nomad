export const DesignTokens = {
  colors: {
    light: {
      primary: '#0A2540',
      background: '#FFFFFF',
      surface: '#F6F9FC',
      text: '#1A1F36',
      muted: '#8792A2',
      accent: '#00D47E',
      border: '#E3E8EE',
    },
    dark: {
      primary: '#0A2540', // Maintain high-trust blue as primary
      background: '#1A1F36', // Deep Navy background
      surface: '#2E344A', // Slightly lighter navy for cards
      text: '#FFFFFF',
      muted: '#8792A2',
      accent: '#00D47E', // Trust Green remains constant
      border: '#3E445B',
    },
  },
  typography: {
    heading: 'SpaceGrotesk_700Bold',
    body: 'WorkSans_400Regular',
    bodyMedium: 'WorkSans_500Medium',
    bodySemiBold: 'WorkSans_600SemiBold',
  },
  radius: {
    sm: 4,
    md: 8,
  },
  spacing: {
    sm: 12,
    md: 24,
    lg: 32,
    xl: 40,
  },
} as const;

