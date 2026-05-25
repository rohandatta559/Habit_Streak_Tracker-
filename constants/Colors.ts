import { ColorSchemeName } from 'react-native';

export default {
  light: {
    text: '#1a1a1a',
    background: '#ffffff',
    tint: '#007AFF',
    tabIconDefault: '#8E8E93',
    tabIconSelected: '#007AFF',
    card: '#ffffff',
    border: '#e0e0e0',
    notification: '#FF3B30',
  },
  dark: {
    text: '#ffffff',
    background: '#121212',
    tint: '#0A84FF',
    tabIconDefault: '#8E8E93',
    tabIconSelected: '#0A84FF',
    card: '#1E1E1E',
    border: '#2C2C2E',
    notification: '#FF453A',
  },
} as const;

export type ThemeColors = {
  light: ColorSchemeName;
  dark: ColorSchemeName;
};
