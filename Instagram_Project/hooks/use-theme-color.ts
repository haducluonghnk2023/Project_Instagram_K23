/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/colors';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: 'text' | 'background' | 'tint' | 'icon' | 'tabIconDefault' | 'tabIconSelected' = 'text'
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }
  
  // Map color names to Colors object
  const colorMap: Record<string, string> = {
    text: Colors.text,
    background: Colors.background,
    tint: Colors.primary,
    icon: Colors.textSecondary,
    tabIconDefault: Colors.textSecondary,
    tabIconSelected: Colors.primary,
  };
  
  return colorMap[colorName] || Colors.text;
}
