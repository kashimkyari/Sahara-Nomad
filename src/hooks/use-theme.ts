import { useThemeContext } from '../context/ThemeContext';

export function useTheme() {
  const { colors, isDarkMode, toggleTheme } = useThemeContext();
  return { colors, isDarkMode, toggleTheme };
}
