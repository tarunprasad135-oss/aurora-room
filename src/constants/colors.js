// Aurora Room — Color System
// These are the core colors for every stress state the aurora can be in

export const AURORA_STATES = {
  // Level 0 — Completely calm, nothing due soon
  calm: {
    primary: '#00d4aa',
    secondary: '#7b2ff7',
    tertiary: '#00a8cc',
    glow: '#00d4aa40',
    label: 'Calm',
    level: 0,
  },
  // Level 1 — Low stress, one or two things upcoming
  low: {
    primary: '#00cccc',
    secondary: '#5533ff',
    tertiary: '#0099cc',
    glow: '#00cccc40',
    label: 'Low',
    level: 1,
  },
  // Level 2 — Medium stress, things are getting real
  medium: {
    primary: '#cc8800',
    secondary: '#ff6600',
    tertiary: '#ffaa00',
    glow: '#cc880040',
    label: 'Medium',
    level: 2,
  },
  // Level 3 — High stress, aurora goes warm and vivid
  high: {
    primary: '#ff4400',
    secondary: '#cc0066',
    tertiary: '#ff6600',
    glow: '#ff440040',
    label: 'High',
    level: 3,
  },
  // Level 4 — Critical, everything is due
  critical: {
    primary: '#ff0033',
    secondary: '#ff4400',
    tertiary: '#cc0000',
    glow: '#ff003350',
    label: 'Critical',
    level: 4,
  },
};

// Room theme colors — free vs paid
export const ROOM_THEMES = {
  // FREE — default
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    sky: '#0a0a1a',
    horizon: '#0d1a2e',
    floor: '#0f0f1a',
    windowFrame: '#1a1a2e',
    isPaid: false,
  },
  // PAID — unlockable via RevenueCat
  dusk: {
    id: 'dusk',
    name: 'Dusk',
    sky: '#1a0a1f',
    horizon: '#2e0d1a',
    floor: '#1a0f1a',
    windowFrame: '#2e1a2e',
    isPaid: true,
  },
  arctic: {
    id: 'arctic',
    name: 'Arctic',
    sky: '#0a1a1f',
    horizon: '#0d2e2e',
    floor: '#0f1a1a',
    windowFrame: '#1a2e2e',
    isPaid: true,
  },
};

export const UI_COLORS = {
  background: '#0a0a1a',
  surface: '#12122a',
  surfaceLight: '#1a1a35',
  text: '#e8e8ff',
  textDim: '#8888aa',
  border: '#2a2a4a',
  success: '#00d4aa',
  white: '#ffffff',
};