import { StyleSheet, Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

export type TextVariant = 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';

export interface TextProps extends RNTextProps {
  lightColor?: string;
  darkColor?: string;
  variant?: TextVariant;
}

export function Text({
  style,
  lightColor,
  darkColor,
  variant = 'default',
  ...rest
}: TextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <RNText
      style={[
        { color },
        variant === 'default' ? styles.default : undefined,
        variant === 'title' ? styles.title : undefined,
        variant === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        variant === 'subtitle' ? styles.subtitle : undefined,
        variant === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});
