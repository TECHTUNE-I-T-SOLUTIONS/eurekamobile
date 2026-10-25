export const lightColors = {
  // Brand Main Colors
  primary: '#1E1B4B',          // Deep Eureka Navy
  primaryLight: '#312E81',     // Indigo Navy
  primaryForeground: '#FFFFFF',

  secondary: '#2563EB',        // Vibrant Royal Blue
  secondaryLight: '#EFF6FF',   // Soft Blue tint
  secondaryForeground: '#FFFFFF',

  accent: '#0284C7',           // Sky Blue Accent
  accentTeal: '#06B6D4',       // Cyan Accent
  accentEmerald: '#10B981',    // Success Emerald

  // Backgrounds & Surface Containers
  background: '#F8FAFC',       // Clean Off-White Slate
  surface: '#FFFFFF',          // Card Surface
  surfaceVariant: '#F1F5F9',   // Light Muted Surface
  surfaceBorder: '#E2E8F0',    // Card/Input Border

  // Text / Content
  textPrimary: '#0F172A',      // Dark Slate Body Text
  textSecondary: '#64748B',    // Muted Subtitle
  textTertiary: '#94A3B8',     // Disabled / Hint text
  textInverse: '#FFFFFF',

  // Status & Badges
  statusCompleted: '#059669',  // Emerald Green
  statusCompletedBg: '#D1FAE5',
  statusProcessing: '#D97706', // Amber
  statusProcessingBg: '#FEF3C7',
  statusPending: '#2563EB',    // Blue
  statusPendingBg: '#DBEAFE',
  statusError: '#DC2626',      // Red
  statusErrorBg: '#FEE2E2',

  // Input & Overlay
  inputBackground: '#F8FAFC',
  inputBorder: '#CBD5E1',
  inputFocusBorder: '#2563EB',
  overlay: 'rgba(15, 23, 42, 0.4)',

  // Navigation / TabBar
  tabBarBackground: '#FFFFFF',
  tabBarActive: '#1E1B4B',
  tabBarInactive: '#94A3B8',
  tabBarBorder: '#E2E8F0',
};

export const darkColors = {
  // Brand Main Colors
  primary: '#818CF8',          // Vibrant Indigo Blue for Dark
  primaryLight: '#6366F1',
  primaryForeground: '#0F172A',

  secondary: '#3B82F6',        // Bright Blue
  secondaryLight: '#1E293B',
  secondaryForeground: '#FFFFFF',

  accent: '#38BDF8',           // Bright Sky Accent
  accentTeal: '#22D3EE',       // Cyan Accent
  accentEmerald: '#34D399',    // Success Emerald

  // Backgrounds & Surface Containers
  background: '#0B0F19',       // Deep Dark Cosmic Slate
  surface: '#151D2A',          // Dark Card Surface
  surfaceVariant: '#1E293B',   // Dark Muted Surface
  surfaceBorder: '#334155',    // Dark Border

  // Text / Content
  textPrimary: '#F8FAFC',      // White Slate Body Text
  textSecondary: '#94A3B8',    // Muted Subtitle
  textTertiary: '#64748B',     // Disabled / Hint text
  textInverse: '#0F172A',

  // Status & Badges
  statusCompleted: '#34D399',
  statusCompletedBg: '#064E3B',
  statusProcessing: '#FBBF24',
  statusProcessingBg: '#78350F',
  statusPending: '#60A5FA',
  statusPendingBg: '#1E3A8A',
  statusError: '#F87171',
  statusErrorBg: '#7F1D1D',

  // Input & Overlay
  inputBackground: '#1E293B',
  inputBorder: '#334155',
  inputFocusBorder: '#3B82F6',
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Navigation / TabBar
  tabBarBackground: '#151D2A',
  tabBarActive: '#818CF8',
  tabBarInactive: '#64748B',
  tabBarBorder: '#1E293B',
};

export type ThemeColors = typeof lightColors;
