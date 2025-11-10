/**
 * Instagram Color Palette
 * Centralized color constants for the app
 */
export const Colors = {
  // Primary colors
  primary: '#0095F6',
  primaryDark: '#0074CC',
  primaryLight: '#B2DFFC',
  
  // Instagram brand
  instagram: '#E4405F',
  instagramGradient: ['#405DE6', '#5851DB', '#833AB4', '#C13584', '#E1306C', '#FD1D1D', '#F56040', '#F77737', '#FCAF45', '#FFDC80'],
  
  // Background colors
  background: '#FFFFFF',
  backgroundSecondary: '#FAFAFA',
  backgroundDark: '#000000',
  
  // Text colors
  text: '#262626',
  textSecondary: '#8E8E8E',
  textPlaceholder: '#999999',
  textLight: '#FFFFFF',
  
  // Border colors
  border: '#DBDBDB',
  borderLight: '#EFEFEF',
  
  // Action colors
  success: '#4CAF50',
  error: '#FF3B30',
  warning: '#FF9500',
  
  // Status colors
  online: '#4CAF50',
  offline: '#8E8E8E',
  
  // Social colors
  facebook: '#1877F2',
  twitter: '#1DA1F2',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
} as const;

export type ColorKey = keyof typeof Colors;

