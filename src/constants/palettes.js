// ============================================================
// DRAMATIC AURORA COLOR PALETTES
// High-vivid, neon gradients for sky and Aurora Engine
// ============================================================

export const PALETTES = {
  midnight: {
    id: 'midnight',
    name: 'Midnight Cyan',
    isFree: true,
    previewColor: '#00d4aa',
    tagline: 'Classic electric cyan & deep blue aurora',
    states: {
      low:      { label: 'Low',      primary: '#00d4aa', secondary: '#0077ff', tertiary: '#7b2ff7' },
      medium:   { label: 'Medium',   primary: '#ffaa00', secondary: '#00d4aa', tertiary: '#ff3300' },
      high:     { label: 'High',     primary: '#ff0055', secondary: '#ff5500', tertiary: '#aa00ff' },
      critical: { label: 'Critical', primary: '#ff0000', secondary: '#990000', tertiary: '#ff3300' },
    },
  },
  sakura: {
    id: 'sakura',
    name: 'Sakura Bloom 🌸',
    isFree: false,
    previewColor: '#ff2a85',
    tagline: 'Vivid rose pink & glowing cherry blossom',
    states: {
      low:      { label: 'Low',      primary: '#ff2a85', secondary: '#ff77aa', tertiary: '#ffb3d9' },
      medium:   { label: 'Medium',   primary: '#ff0066', secondary: '#ffaa00', tertiary: '#ff88cc' },
      high:     { label: 'High',     primary: '#d60052', secondary: '#ff00bb', tertiary: '#ffaa00' },
      critical: { label: 'Critical', primary: '#990033', secondary: '#ff0055', tertiary: '#ff7700' },
    },
  },
  ocean: {
    id: 'ocean',
    name: 'Deep Ocean 🌊',
    isFree: false,
    previewColor: '#00e5ff',
    tagline: 'Bioluminescent electric blue & cyan',
    states: {
      low:      { label: 'Low',      primary: '#00e5ff', secondary: '#0088ff', tertiary: '#0033aa' },
      medium:   { label: 'Medium',   primary: '#00ffa3', secondary: '#00aeff', tertiary: '#7000ff' },
      high:     { label: 'High',     primary: '#0055ff', secondary: '#00f0ff', tertiary: '#e100ff' },
      critical: { label: 'Critical', primary: '#0011bb', secondary: '#00e5ff', tertiary: '#ff00aa' },
    },
  },
  cosmic: {
    id: 'cosmic',
    name: 'Cosmic Violet ✨',
    isFree: false,
    previewColor: '#a855f7',
    tagline: 'Deep space purple & glowing magenta',
    states: {
      low:      { label: 'Low',      primary: '#a855f7', secondary: '#ec4899', tertiary: '#3b82f6' },
      medium:   { label: 'Medium',   primary: '#c084fc', secondary: '#f43f5e', tertiary: '#6366f1' },
      high:     { label: 'High',     primary: '#e11d48', secondary: '#a855f7', tertiary: '#38bdf8' },
      critical: { label: 'Critical', primary: '#7000aa', secondary: '#f43f5e', tertiary: '#a855f7' },
    },
  },
  ember: {
    id: 'ember',
    name: 'Ember Sunset 🔥',
    isFree: false,
    previewColor: '#ff6d00',
    tagline: 'Warm campfire gold & sunset amber',
    states: {
      low:      { label: 'Low',      primary: '#ff6d00', secondary: '#ffab00', tertiary: '#ff3d00' },
      medium:   { label: 'Medium',   primary: '#ff3d00', secondary: '#ffd600', tertiary: '#d50000' },
      high:     { label: 'High',     primary: '#dd2c00', secondary: '#ff6d00', tertiary: '#c51162' },
      critical: { label: 'Critical', primary: '#8b0000', secondary: '#ff3d00', tertiary: '#ffab00' },
    },
  },
  forest: {
    id: 'forest',
    name: 'Forest Canopy 🍃',
    isFree: false,
    previewColor: '#10b981',
    tagline: 'Deep emerald green & golden dawn',
    states: {
      low:      { label: 'Low',      primary: '#10b981', secondary: '#34d399', tertiary: '#f59e0b' },
      medium:   { label: 'Medium',   primary: '#059669', secondary: '#f59e0b', tertiary: '#10b981' },
      high:     { label: 'High',     primary: '#d97706', secondary: '#10b981', tertiary: '#ef4444' },
      critical: { label: 'Critical', primary: '#991b1b', secondary: '#b45309', tertiary: '#059669' },
    },
  },
};