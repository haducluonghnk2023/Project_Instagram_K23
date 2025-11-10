import { StyleSheet } from 'react-native';
import { Colors } from './colors';

/**
 * Common styles used across the app
 */
export const CommonStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
  },
  containerCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 20,
  },
  
  // Spacing
  spacingSmall: {
    marginBottom: 8,
  },
  spacingMedium: {
    marginBottom: 16,
  },
  spacingLarge: {
    marginBottom: 24,
  },
  spacingXLarge: {
    marginBottom: 32,
  },
  
  // Text styles
  textCenter: {
    textAlign: 'center',
  },
  textBold: {
    fontWeight: '600',
  },
  textSemiBold: {
    fontWeight: '500',
  },
  
  // Border styles
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  
  // Shadow styles
  shadowSmall: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  shadowMedium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});

/**
 * Common spacing values
 */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/**
 * Common border radius values
 */
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

/**
 * Common font sizes
 */
export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
  title: 36,
} as const;

