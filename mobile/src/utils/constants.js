// API Configuration - Update this URL for production
// For EAS builds, this can be set via app.config.js with environment variables
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://docpatient-staging.preview.emergentagent.com';

// Colors - Healthcare Professional Theme
export const COLORS = {
  primary: '#ea580c',       // Burnt Orange
  primaryDark: '#c2410c',
  primaryLight: '#fb923c',
  secondary: '#1e293b',     // Slate
  background: '#fafaf9',    // Stone 50
  surface: '#ffffff',
  text: '#1c1917',          // Stone 900
  textSecondary: '#78716c', // Stone 500
  textMuted: '#a8a29e',     // Stone 400
  border: '#e7e5e4',        // Stone 200
  success: '#16a34a',
  warning: '#f59e0b',
  error: '#dc2626',
  info: '#0284c7',
  
  // Gradients
  gradientStart: '#ea580c',
  gradientEnd: '#c2410c',
};

// Typography
export const FONTS = {
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border Radius
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Shadows
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
};

// Specialties
export const SPECIALTIES = [
  'General Medicine', 'Cardiology', 'Dermatology', 'Pediatrics',
  'Orthopedics', 'Gynecology', 'Neurology', 'Psychiatry',
  'Ophthalmology', 'ENT', 'Dentistry', 'Urology',
  'Gastroenterology', 'Pulmonology', 'Endocrinology', 'Oncology'
];

// Time Slots
export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00'
];
