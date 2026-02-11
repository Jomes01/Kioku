/**
 * Dark theme - palette: Black, Dark Navy, Orange, Light Gray, White
 */
const palette = {
  white: '#FFFFFF',
  lightGray: '#E5E5E5',
  orange: '#FCA311',
  darkNavy: '#14213D',
  black: '#000000',
};

export const colors = {
  background: palette.black,
  surface: palette.darkNavy,
  card: '#1a2a4d',
  cardElevated: '#243b5c',
  primary: palette.orange,
  primaryMuted: 'rgba(252, 163, 17, 0.25)',
  text: palette.white,
  textSecondary: palette.lightGray,
  muted: 'rgba(229, 229, 229, 0.7)',
  border: 'rgba(229, 229, 229, 0.2)',
  shadow: 'rgba(0,0,0,0.4)',
  birthday: '#EF4444',
  anniversary: '#22C55E',
  death: '#3B82F6',
  other: '#EAB308',
  today: palette.orange,
  todayBg: 'rgba(252, 163, 17, 0.2)',
  danger: '#EF4444',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
};

export const typography = {
  title: 22,
  subtitle: 18,
  body: 15,
  small: 13,
};

export const fontFamily = 'Azonix';

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  soft: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
};

export const eventTypeColors = {
  Birthday: colors.birthday,
  Anniversary: colors.anniversary,
  'Death Anniversary': colors.death,
  Other: colors.other,
};

export const EVENT_TYPES = ['Birthday', 'Anniversary', 'Death Anniversary', 'Other'];
