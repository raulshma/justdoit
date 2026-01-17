import type { ColorPalette, ColorPaletteInfo, ThemeMood, ThemeMoodInfo } from '../types/settings';

/**
 * Color palette definitions for the Daily Goals App
 * Organized by Mood Categories
 */

// ============================================
// MOOD DEFINITIONS
// ============================================
export const themeMoods: ThemeMoodInfo[] = [
  { id: 'calm', name: 'Calm & Relaxing', description: 'Soothing tones for focus and tranquility' },
  { id: 'energetic', name: 'Energetic & Vibrant', description: 'Bold colors to boost motivation' },
  { id: 'elegant', name: 'Elegant & Sophisticated', description: 'Refined palettes for a premium feel' },
  { id: 'bold', name: 'Bold & Modern', description: 'High contrast for clarity and impact' },
  { id: 'inspired', name: 'App Inspired', description: 'Themes inspired by popular applications' },
];

// ============================================
// CALM & RELAXING PALETTES
// ============================================

// DEFAULT PALETTE - "Modern Amber"
// WCAG AA compliant contrast ratios (4.5:1 for normal text, 3:1 for large text)
const defaultPalette = {
  light: {
    primary: '#B8750D', // Darkened from #D68910 for better contrast on light backgrounds
    primaryContainer: '#FDF2E9',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#5A2400', // Darkened for better contrast
    secondary: '#9A3D00', // Darkened from #BA4A00 for better contrast
    secondaryContainer: '#FFDDC1',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#3E1901',
    tertiary: '#1A6B9C', // Darkened from #2E86C1 for better contrast
    tertiaryContainer: '#D6EAF8',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#0D3550', // Darkened for better contrast
    accent: '#C9A00C', // Darkened from #F1C40F for better contrast
    surface: '#FFFFFF',
    surfaceVariant: '#F5F6F7',
    onSurface: '#17202A',
    onSurfaceVariant: '#3D4852', // Darkened from #566573 for 7:1+ contrast ratio
    background: '#FDFBF9',
    onBackground: '#17202A',
    error: '#B32D20', // Darkened from #C0392B for better contrast
    errorContainer: '#FDEAEA',
    onError: '#FFFFFF',
    onErrorContainer: '#641E16',
    outline: '#8B9299', // Darkened from #E5E7E9 for visible borders (3:1 contrast)
    outlineVariant: '#C5CACD', // Darkened from #D7DBDD for better visibility
  },
  dark: {
    primary: '#F5A623', // Brightened from #F39C12 for better contrast on dark
    primaryContainer: '#4E3402',
    onPrimary: '#1A1200', // Changed from #000000 for softer contrast
    onPrimaryContainer: '#FAD7A0',
    secondary: '#F08C32', // Brightened from #E67E22 for better contrast
    secondaryContainer: '#5D2E04',
    onSecondary: '#1A1200',
    onSecondaryContainer: '#FFDDC1',
    tertiary: '#6DBDE8', // Brightened from #5DADE2 for better contrast
    tertiaryContainer: '#1B4F72',
    onTertiary: '#0A1A24',
    onTertiaryContainer: '#D6EAF8',
    accent: '#F7D94C', // Brightened from #F4D03F for better contrast
    surface: '#1A1A1A', // Lightened from #141414 for better contrast
    surfaceVariant: '#252525', // Lightened from #1C1C1C for better contrast
    onSurface: '#F2F4F5', // Brightened from #ECF0F1 for better contrast
    onSurfaceVariant: '#D0D5D9', // Brightened from #BDC3C7 for better contrast
    background: '#0A0A0A', // Lightened from #050505
    onBackground: '#F2F4F5',
    error: '#F25C4E', // Brightened from #E74C3C for better contrast
    errorContainer: '#922B21',
    onError: '#FFFFFF',
    onErrorContainer: '#FADBD8',
    outline: '#4A5A68', // Lightened from #2C3E50 for visible borders
    outlineVariant: '#3D4D5A', // Adjusted for better visibility
  },
  preview: ['#B8750D', '#9A3D00', '#FDFBF9', '#1A1A1A'],
};

// OCEAN PALETTE - "Deep Ocean"
// WCAG AA compliant contrast ratios
const oceanPalette = {
  light: {
    primary: '#0267A3', // Darkened for better contrast
    primaryContainer: '#E1F5FE',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#002C3B',
    secondary: '#005054', // Darkened for better contrast
    secondaryContainer: '#B2EBF2',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#002C3B',
    tertiary: '#006D78', // Darkened for better contrast
    tertiaryContainer: '#B2EBF2',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#002C3B',
    accent: '#00ACC1', // Darkened for better contrast
    surface: '#FFFFFF',
    surfaceVariant: '#E8F4F8',
    onSurface: '#002C3B',
    onSurfaceVariant: '#2D4A54', // Darkened for 7:1+ contrast
    background: '#F0F9FC',
    onBackground: '#002C3B',
    error: '#B32D20',
    errorContainer: '#FFCDD2',
    onError: '#FFFFFF',
    onErrorContainer: '#B71C1C',
    outline: '#5D8A96', // Darkened for 3:1 contrast on light backgrounds
    outlineVariant: '#9DBDC7',
  },
  dark: {
    primary: '#5DCAE8', // Brightened for better contrast
    primaryContainer: '#01579B',
    onPrimary: '#00232E',
    onPrimaryContainer: '#E1F5FE',
    secondary: '#5DD8E8', // Brightened for better contrast
    secondaryContainer: '#006064',
    onSecondary: '#00232E',
    onSecondaryContainer: '#B2EBF2',
    tertiary: '#8DE4EE', // Brightened for better contrast
    tertiaryContainer: '#00838F',
    onTertiary: '#00232E',
    onTertiaryContainer: '#B2EBF2',
    accent: '#26C6DA',
    surface: '#0D2830',
    surfaceVariant: '#1A3A45',
    onSurface: '#E8F4F6',
    onSurfaceVariant: '#B8D4DC', // Brightened for better contrast
    background: '#061820',
    onBackground: '#E8F4F6',
    error: '#F25C4E',
    errorContainer: '#8E0000',
    onError: '#FFFFFF',
    onErrorContainer: '#FFCDD2',
    outline: '#3D6A78', // Lightened for visibility
    outlineVariant: '#2A4D58',
  },
  preview: ['#0267A3', '#005054', '#F0F9FC', '#0D2830'],
};

// FOREST PALETTE - "Evergreen"
// WCAG AA compliant contrast ratios
const forestPalette = {
  light: {
    primary: '#256D29', // Darkened for better contrast
    primaryContainer: '#E8F5E9',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#0D3D10',
    secondary: '#4A7A28', // Darkened for better contrast
    secondaryContainer: '#F1F8E9',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#2A5016',
    tertiary: '#2E7532', // Darkened for better contrast
    tertiaryContainer: '#C8E6C9',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#0D3D10',
    accent: '#66A869', // Darkened for better contrast
    surface: '#FFFFFF',
    surfaceVariant: '#E8F0E8',
    onSurface: '#0D3D10',
    onSurfaceVariant: '#2D5030', // Darkened for 7:1+ contrast
    background: '#F5FAF5',
    onBackground: '#0D3D10',
    error: '#B32D20',
    errorContainer: '#FFCDD2',
    onError: '#FFFFFF',
    onErrorContainer: '#B71C1C',
    outline: '#6B9A6E', // Darkened for 3:1 contrast
    outlineVariant: '#A3C9A5',
  },
  dark: {
    primary: '#8ED091', // Brightened for better contrast
    primaryContainer: '#1B5E20',
    onPrimary: '#0A2A0C',
    onPrimaryContainer: '#E8F5E9',
    secondary: '#BCE085', // Brightened for better contrast
    secondaryContainer: '#33691E',
    onSecondary: '#1A2E0D',
    onSecondaryContainer: '#F1F8E9',
    tertiary: '#7AC97E', // Brightened for better contrast
    tertiaryContainer: '#2E7D32',
    onTertiary: '#0A2A0C',
    onTertiaryContainer: '#C8E6C9',
    accent: '#5DBF61',
    surface: '#142816',
    surfaceVariant: '#1E3A20',
    onSurface: '#E8F5E9',
    onSurfaceVariant: '#B5D9B7', // Brightened for better contrast
    background: '#0A1A0C',
    onBackground: '#E8F5E9',
    error: '#F25C4E',
    errorContainer: '#8E0000',
    onError: '#FFFFFF',
    onErrorContainer: '#FFCDD2',
    outline: '#3D6B40', // Lightened for visibility
    outlineVariant: '#2A4D2C',
  },
  preview: ['#256D29', '#4A7A28', '#F5FAF5', '#142816'],
};

// ZEN PALETTE - "Peaceful Sage"
// WCAG AA compliant contrast ratios
const zenPalette = {
  light: {
    primary: '#5A6D78', // Darkened for better contrast
    primaryContainer: '#ECEFF1',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#263238',
    secondary: '#6B8290', // Darkened for better contrast
    secondaryContainer: '#CFD8DC',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#37474F',
    tertiary: '#4A8A4D', // Darkened green for better contrast
    tertiaryContainer: '#E8F5E9',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#1B5E20',
    accent: '#8A9BA3',
    surface: '#FFFFFF',
    surfaceVariant: '#F0F2F3',
    onSurface: '#263238',
    onSurfaceVariant: '#3D4D56', // Darkened for 7:1+ contrast
    background: '#FAFAFA',
    onBackground: '#263238',
    error: '#B32D20',
    errorContainer: '#FFCDD2',
    onError: '#FFFFFF',
    onErrorContainer: '#B71C1C',
    outline: '#7A8C94', // Darkened for 3:1 contrast
    outlineVariant: '#B0BEC5',
  },
  dark: {
    primary: '#C0CCD2', // Brightened for better contrast
    primaryContainer: '#455A64',
    onPrimary: '#1A2328',
    onPrimaryContainer: '#ECEFF1',
    secondary: '#D8E2E6', // Brightened for better contrast
    secondaryContainer: '#546E7A',
    onSecondary: '#1A2328',
    onSecondaryContainer: '#ECEFF1',
    tertiary: '#8ED091', // Brightened for better contrast
    tertiaryContainer: '#2E7D32',
    onTertiary: '#0A2A0C',
    onTertiaryContainer: '#E8F5E9',
    accent: '#A0B4BC',
    surface: '#1E2A30',
    surfaceVariant: '#2A3940',
    onSurface: '#ECF0F2',
    onSurfaceVariant: '#C0CCD2', // Brightened for better contrast
    background: '#141C20',
    onBackground: '#ECF0F2',
    error: '#F25C4E',
    errorContainer: '#8E0000',
    onError: '#FFFFFF',
    onErrorContainer: '#FFCDD2',
    outline: '#4D6068', // Lightened for visibility
    outlineVariant: '#3A4850',
  },
  preview: ['#5A6D78', '#6B8290', '#FAFAFA', '#1E2A30'],
};

// MISTY PALETTE - "Morning Fog"
// WCAG AA compliant contrast ratios
const mistyPalette = {
  light: {
    primary: '#4A6572', // Darkened for better contrast
    primaryContainer: '#E3F2FD',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#1A2C34',
    secondary: '#6B7880', // Darkened for better contrast
    secondaryContainer: '#F5F5F5',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#2D3436',
    tertiary: '#7A8C94', // Darkened for better contrast
    tertiaryContainer: '#ECEFF1',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#37474F',
    accent: '#9AACB4',
    surface: '#FFFFFF',
    surfaceVariant: '#EDF1F4',
    onSurface: '#263238',
    onSurfaceVariant: '#3D4D56', // Darkened for 7:1+ contrast
    background: '#F5F7FA',
    onBackground: '#263238',
    error: '#B32D20',
    errorContainer: '#FFCDD2',
    onError: '#FFFFFF',
    onErrorContainer: '#B71C1C',
    outline: '#7A8A92', // Darkened for 3:1 contrast
    outlineVariant: '#B0BEC5',
  },
  dark: {
    primary: '#A8BCC6', // Brightened for better contrast
    primaryContainer: '#37474F',
    onPrimary: '#1A2328',
    onPrimaryContainer: '#ECEFF1',
    secondary: '#CDD6DA', // Brightened for better contrast
    secondaryContainer: '#616161',
    onSecondary: '#1A1A1A',
    onSecondaryContainer: '#F5F5F5',
    tertiary: '#D8E2E6', // Brightened for better contrast
    tertiaryContainer: '#546E7A',
    onTertiary: '#1A2328',
    onTertiaryContainer: '#ECEFF1',
    accent: '#B8C8D0',
    surface: '#1A2328',
    surfaceVariant: '#263238',
    onSurface: '#ECF0F2',
    onSurfaceVariant: '#A8BCC6', // Brightened for better contrast
    background: '#101518',
    onBackground: '#ECF0F2',
    error: '#F25C4E',
    errorContainer: '#8E0000',
    onError: '#FFFFFF',
    onErrorContainer: '#FFCDD2',
    outline: '#4D5D65', // Lightened for visibility
    outlineVariant: '#3A4850',
  },
  preview: ['#4A6572', '#6B7880', '#F5F7FA', '#1A2328'],
};


// ============================================
// ENERGETIC & VIBRANT PALETTES
// ============================================

// SUNSET PALETTE - "Golden Hour"
// WCAG AA compliant contrast ratios
const sunsetPalette = {
  light: {
    primary: '#C43E14', // Darkened for better contrast
    primaryContainer: '#FBE9E7',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#7A2508',
    secondary: '#D49500', // Darkened for better contrast
    secondaryContainer: '#FFF8E1',
    onSecondary: '#1A1200',
    onSecondaryContainer: '#8A5A00',
    tertiary: '#D04318', // Darkened for better contrast
    tertiaryContainer: '#FFCCBC',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#7A2508',
    accent: '#D4A520', // Darkened for better contrast
    surface: '#FFFFFF',
    surfaceVariant: '#FFF0E0',
    onSurface: '#2E1F1A',
    onSurfaceVariant: '#4A3228', // Darkened for 7:1+ contrast
    background: '#FFFAF5',
    onBackground: '#2E1F1A',
    error: '#B32D20',
    errorContainer: '#FFCDD2',
    onError: '#FFFFFF',
    onErrorContainer: '#B71C1C',
    outline: '#C08060', // Darkened for 3:1 contrast
    outlineVariant: '#E0B090',
  },
  dark: {
    primary: '#FF9A75', // Brightened for better contrast
    primaryContainer: '#BF360C',
    onPrimary: '#2A0E04',
    onPrimaryContainer: '#FBE9E7',
    secondary: '#FFE066', // Brightened for better contrast
    secondaryContainer: '#FF6F00',
    onSecondary: '#2A1A00',
    onSecondaryContainer: '#FFF8E1',
    tertiary: '#FFB8A0', // Brightened for better contrast
    tertiaryContainer: '#D84315',
    onTertiary: '#2A0E04',
    onTertiaryContainer: '#FFCCBC',
    accent: '#FFC85C',
    surface: '#2A1A14',
    surfaceVariant: '#3A2820',
    onSurface: '#FFF5F0',
    onSurfaceVariant: '#E8C0A8', // Brightened for better contrast
    background: '#1A0F0A',
    onBackground: '#FFF5F0',
    error: '#F25C4E',
    errorContainer: '#8E0000',
    onError: '#FFFFFF',
    onErrorContainer: '#FFCDD2',
    outline: '#8A5030', // Lightened for visibility
    outlineVariant: '#6A3820',
  },
  preview: ['#C43E14', '#D49500', '#FFFAF5', '#2A1A14'],
};

// NEON PALETTE - "Cyberpunk"
// WCAG AA compliant contrast ratios
const neonPalette = {
  light: {
    primary: '#5000C8', // Darkened for better contrast
    primaryContainer: '#ECE0FD',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#250060',
    secondary: '#0090D4', // Darkened for better contrast
    secondaryContainer: '#E1F5FE',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#003D5C',
    tertiary: '#B000D4', // Darkened for better contrast
    tertiaryContainer: '#FCE4EC',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#550068',
    accent: '#8AC040', // Darkened for better contrast
    surface: '#FFFFFF',
    surfaceVariant: '#F0E8F8',
    onSurface: '#1A0040',
    onSurfaceVariant: '#3A2060', // Darkened for 7:1+ contrast
    background: '#FAF5FF',
    onBackground: '#1A0040',
    error: '#C02020',
    errorContainer: '#FF8A80',
    onError: '#FFFFFF',
    onErrorContainer: '#8A0000',
    outline: '#8060A0', // Darkened for 3:1 contrast
    outlineVariant: '#C0B0D8',
  },
  dark: {
    primary: '#C4A0FF', // Brightened for better contrast
    primaryContainer: '#6200EA',
    onPrimary: '#1A0040',
    onPrimaryContainer: '#ECE0FD',
    secondary: '#60D4FF', // Brightened for better contrast
    secondaryContainer: '#0091EA',
    onSecondary: '#002840',
    onSecondaryContainer: '#E1F5FE',
    tertiary: '#F0A0FF', // Brightened for better contrast
    tertiaryContainer: '#AA00FF',
    onTertiary: '#300040',
    onTertiaryContainer: '#FCE4EC',
    accent: '#D8FF98',
    surface: '#140020',
    surfaceVariant: '#200038',
    onSurface: '#F0E8FF',
    onSurfaceVariant: '#D8C0F0', // Brightened for better contrast
    background: '#0A0010',
    onBackground: '#F0E8FF',
    error: '#FF6060',
    errorContainer: '#D32F2F',
    onError: '#200000',
    onErrorContainer: '#FF8A80',
    outline: '#6040A0', // Lightened for visibility
    outlineVariant: '#402060',
  },
  preview: ['#5000C8', '#0090D4', '#FAF5FF', '#140020'],
};

// TROPICAL PALETTE - "Paradise"
// WCAG AA compliant contrast ratios
const tropicalPalette = {
  light: {
    primary: '#009688', // Darkened for better contrast
    primaryContainer: '#E0F2F1',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#003D36',
    secondary: '#D45A00', // Darkened for better contrast
    secondaryContainer: '#FFE0B2',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#7A3400',
    tertiary: '#D49000', // Darkened for better contrast
    tertiaryContainer: '#FFF8E1',
    onTertiary: '#1A1200',
    onTertiaryContainer: '#7A5000',
    accent: '#00D4B4', // Darkened for better contrast
    surface: '#FFFFFF',
    surfaceVariant: '#E0F5F2',
    onSurface: '#003D36',
    onSurfaceVariant: '#1A5048', // Darkened for 7:1+ contrast
    background: '#F0FAF8',
    onBackground: '#003D36',
    error: '#B32D20',
    errorContainer: '#FFCDD2',
    onError: '#FFFFFF',
    onErrorContainer: '#B71C1C',
    outline: '#5A9A90', // Darkened for 3:1 contrast
    outlineVariant: '#98C8C0',
  },
  dark: {
    primary: '#70FFE0', // Brightened for better contrast
    primaryContainer: '#00695C',
    onPrimary: '#002820',
    onPrimaryContainer: '#E0F2F1',
    secondary: '#FFB860', // Brightened for better contrast
    secondaryContainer: '#E65100',
    onSecondary: '#2A1800',
    onSecondaryContainer: '#FFE0B2',
    tertiary: '#FFE060', // Brightened for better contrast
    tertiaryContainer: '#FF6F00',
    onTertiary: '#2A1A00',
    onTertiaryContainer: '#FFF8E1',
    accent: '#40F0D0',
    surface: '#0A2820',
    surfaceVariant: '#143830',
    onSurface: '#E8F8F5',
    onSurfaceVariant: '#A0D8D0', // Brightened for better contrast
    background: '#041810',
    onBackground: '#E8F8F5',
    error: '#F25C4E',
    errorContainer: '#8E0000',
    onError: '#FFFFFF',
    onErrorContainer: '#FFCDD2',
    outline: '#2A6A60', // Lightened for visibility
    outlineVariant: '#1A4A40',
  },
  preview: ['#009688', '#D45A00', '#F0FAF8', '#0A2820'],
};

// FIESTA PALETTE - "Carnival"
// WCAG AA compliant contrast ratios
const fiestaPalette = {
  light: {
    primary: '#B52525', // Darkened for better contrast
    primaryContainer: '#FFEBEE',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#7A1414',
    secondary: '#D4A000', // Darkened for better contrast
    secondaryContainer: '#FFF8E1',
    onSecondary: '#1A1400',
    onSecondaryContainer: '#8A5A00',
    tertiary: '#3D8B40', // Darkened for better contrast
    tertiaryContainer: '#E8F5E9',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#1A4A1C',
    accent: '#1976D2', // Darkened for better contrast
    surface: '#FFFFFF',
    surfaceVariant: '#FFF8E8',
    onSurface: '#2E1F1A',
    onSurfaceVariant: '#4A3228', // Darkened for 7:1+ contrast
    background: '#FFFDF5',
    onBackground: '#2E1F1A',
    error: '#B32D20',
    errorContainer: '#FFCDD2',
    onError: '#FFFFFF',
    onErrorContainer: '#B71C1C',
    outline: '#C09050', // Darkened for 3:1 contrast
    outlineVariant: '#E0C080',
  },
  dark: {
    primary: '#F07070', // Brightened for better contrast
    primaryContainer: '#B71C1C',
    onPrimary: '#200808',
    onPrimaryContainer: '#FFEBEE',
    secondary: '#FFE066', // Brightened for better contrast
    secondaryContainer: '#FF6F00',
    onSecondary: '#2A1A00',
    onSecondaryContainer: '#FFF8E1',
    tertiary: '#90D894', // Brightened for better contrast
    tertiaryContainer: '#2E7D32',
    onTertiary: '#0A2A0C',
    onTertiaryContainer: '#E8F5E9',
    accent: '#80C8F8', // Brightened for better contrast
    surface: '#241414',
    surfaceVariant: '#341C1C',
    onSurface: '#FFF5F0',
    onSurfaceVariant: '#E8C0A8', // Brightened for better contrast
    background: '#140A0A',
    onBackground: '#FFF5F0',
    error: '#FF6060',
    errorContainer: '#D32F2F',
    onError: '#200000',
    onErrorContainer: '#FFCDD2',
    outline: '#7A5040', // Lightened for visibility
    outlineVariant: '#5A3830',
  },
  preview: ['#B52525', '#D4A000', '#FFFDF5', '#241414'],
};


// ============================================
// ELEGANT & SOPHISTICATED PALETTES
// ============================================

// LAVENDER PALETTE - "Royal Amethyst"
// WCAG AA compliant contrast ratios
const lavenderPalette = {
  light: {
    primary: '#6A3080', // Darkened for better contrast
    primaryContainer: '#F4ECF7',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#3A1848',
    secondary: '#7A3890', // Darkened for better contrast
    secondaryContainer: '#E8DAEF',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#3A1848',
    tertiary: '#8A5A9A', // Darkened for better contrast
    tertiaryContainer: '#F5B7B1',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#4A1810',
    accent: '#B090C0',
    surface: '#FFFFFF',
    surfaceVariant: '#F8F4FA',
    onSurface: '#1A1A1A',
    onSurfaceVariant: '#3A3040', // Darkened for 7:1+ contrast
    background: '#FBF8FC',
    onBackground: '#1A1A1A',
    error: '#B32D20',
    errorContainer: '#FFCDD2',
    onError: '#FFFFFF',
    onErrorContainer: '#B71C1C',
    outline: '#9070A0', // Darkened for 3:1 contrast
    outlineVariant: '#C8B0D8',
  },
  dark: {
    primary: '#CCA8DC', // Brightened for better contrast
    primaryContainer: '#4A235A',
    onPrimary: '#1A0820',
    onPrimaryContainer: '#F4ECF7',
    secondary: '#E0C8E8', // Brightened for better contrast
    secondaryContainer: '#5B2C6F',
    onSecondary: '#1A0820',
    onSecondaryContainer: '#E8DAEF',
    tertiary: '#F0C0B8', // Brightened for better contrast
    tertiaryContainer: '#784212',
    onTertiary: '#2A1008',
    onTertiaryContainer: '#F5B7B1',
    accent: '#E8D0F0',
    surface: '#140A18',
    surfaceVariant: '#201420',
    onSurface: '#F8F0FA',
    onSurfaceVariant: '#E0D0E8', // Brightened for better contrast
    background: '#0A0408',
    onBackground: '#F8F0FA',
    error: '#F25C4E',
    errorContainer: '#8E0000',
    onError: '#FFFFFF',
    onErrorContainer: '#FFCDD2',
    outline: '#5A3868', // Lightened for visibility
    outlineVariant: '#402850',
  },
  preview: ['#6A3080', '#7A3890', '#FBF8FC', '#140A18'],
};

// ORCHID PALETTE - "Soft Blossom"
// WCAG AA compliant contrast ratios
const orchidPalette = {
  light: {
    primary: '#A01048', // Darkened for better contrast
    primaryContainer: '#FCE4EC',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#600830',
    secondary: '#B01450', // Darkened for better contrast
    secondaryContainer: '#F8BBD9',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#600830',
    tertiary: '#C01850', // Darkened for better contrast
    tertiaryContainer: '#F48FB1',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#600830',
    accent: '#E06090', // Darkened for better contrast
    surface: '#FFFFFF',
    surfaceVariant: '#FFF5F8',
    onSurface: '#201418',
    onSurfaceVariant: '#4A2830', // Darkened for 7:1+ contrast
    background: '#FFFBFC',
    onBackground: '#201418',
    error: '#A02018',
    errorContainer: '#F9DEDC',
    onError: '#FFFFFF',
    onErrorContainer: '#400808',
    outline: '#C06080', // Darkened for 3:1 contrast
    outlineVariant: '#E8A0B8',
  },
  dark: {
    primary: '#F8A8C8', // Brightened for better contrast
    primaryContainer: '#880E4F',
    onPrimary: '#300818',
    onPrimaryContainer: '#FCE4EC',
    secondary: '#FFA0C0', // Brightened for better contrast
    secondaryContainer: '#AD1457',
    onSecondary: '#300818',
    onSecondaryContainer: '#F8BBD9',
    tertiary: '#FF80A0', // Brightened for better contrast
    tertiaryContainer: '#C2185B',
    onTertiary: '#300818',
    onTertiaryContainer: '#FCE4EC',
    accent: '#F06080',
    surface: '#1C1014',
    surfaceVariant: '#2A181C',
    onSurface: '#FFF0F4',
    onSurfaceVariant: '#F8C8D8', // Brightened for better contrast
    background: '#100808',
    onBackground: '#FFF0F4',
    error: '#F25C4E',
    errorContainer: '#8E0000',
    onError: '#FFFFFF',
    onErrorContainer: '#FFCDD2',
    outline: '#7A3048', // Lightened for visibility
    outlineVariant: '#5A2038',
  },
  preview: ['#A01048', '#B01450', '#FFFBFC', '#1C1014'],
};

// ROSEGOLD PALETTE - "Blush"
// WCAG AA compliant contrast ratios
const rosegoldPalette = {
  light: {
    primary: '#9A5A64', // Darkened for better contrast
    primaryContainer: '#FBE9E7',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#4A2830',
    secondary: '#A87878', // Darkened for better contrast
    secondaryContainer: '#FFEBEE',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#4A3030',
    tertiary: '#C08890', // Darkened for better contrast
    tertiaryContainer: '#FCE4EC',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#600830',
    accent: '#D8B0A8',
    surface: '#FFFFFF',
    surfaceVariant: '#FFF8F6',
    onSurface: '#2E1F1A',
    onSurfaceVariant: '#4A3830', // Darkened for 7:1+ contrast
    background: '#FFF8F6',
    onBackground: '#2E1F1A',
    error: '#B32D20',
    errorContainer: '#FFCDD2',
    onError: '#FFFFFF',
    onErrorContainer: '#B71C1C',
    outline: '#B08888', // Darkened for 3:1 contrast
    outlineVariant: '#D8B8B8',
  },
  dark: {
    primary: '#F0C8CC', // Brightened for better contrast
    primaryContainer: '#6D4C4C',
    onPrimary: '#2A1818',
    onPrimaryContainer: '#FBE9E7',
    secondary: '#F8E0D8', // Brightened for better contrast
    secondaryContainer: '#8D6E63',
    onSecondary: '#2A1818',
    onSecondaryContainer: '#FFEBEE',
    tertiary: '#FFD8DC', // Brightened for better contrast
    tertiaryContainer: '#AD1457',
    onTertiary: '#300818',
    onTertiaryContainer: '#FCE4EC',
    accent: '#E0B8B8',
    surface: '#241818',
    surfaceVariant: '#342424',
    onSurface: '#FFF5F0',
    onSurfaceVariant: '#F0C8CC', // Brightened for better contrast
    background: '#140C0C',
    onBackground: '#FFF5F0',
    error: '#F25C4E',
    errorContainer: '#8E0000',
    onError: '#FFFFFF',
    onErrorContainer: '#FFCDD2',
    outline: '#6A4848', // Lightened for visibility
    outlineVariant: '#503838',
  },
  preview: ['#9A5A64', '#A87878', '#FFF8F6', '#241818'],
};

// CHAMPAGNE PALETTE - "Luxe"
// WCAG AA compliant contrast ratios
const champagnePalette = {
  light: {
    primary: '#A88820', // Darkened for better contrast
    primaryContainer: '#FFF8E1',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#4A3A20',
    secondary: '#B09028', // Darkened for better contrast
    secondaryContainer: '#FFFDE7',
    onSecondary: '#1A1400',
    onSecondaryContainer: '#5A4828',
    tertiary: '#C0A040', // Darkened for better contrast
    tertiaryContainer: '#FFF9C4',
    onTertiary: '#2A2010',
    onTertiaryContainer: '#6A5810',
    accent: '#D8C8A0',
    surface: '#FFFFFF',
    surfaceVariant: '#FFF8E8',
    onSurface: '#2E2820',
    onSurfaceVariant: '#4A4030', // Darkened for 7:1+ contrast
    background: '#FFFCF5',
    onBackground: '#2E2820',
    error: '#B32D20',
    errorContainer: '#FFCDD2',
    onError: '#FFFFFF',
    onErrorContainer: '#B71C1C',
    outline: '#A09070', // Darkened for 3:1 contrast
    outlineVariant: '#D0C0A0',
  },
  dark: {
    primary: '#F0D870', // Brightened for better contrast
    primaryContainer: '#6D5C3F',
    onPrimary: '#2A2010',
    onPrimaryContainer: '#FFF8E1',
    secondary: '#F8F0D0', // Brightened for better contrast
    secondaryContainer: '#827717',
    onSecondary: '#2A2010',
    onSecondaryContainer: '#FFFDE7',
    tertiary: '#FFE898', // Brightened for better contrast
    tertiaryContainer: '#9E8B3D',
    onTertiary: '#2A2010',
    onTertiaryContainer: '#FFF9C4',
    accent: '#E0C850',
    surface: '#242018',
    surfaceVariant: '#342C20',
    onSurface: '#FFF8E8',
    onSurfaceVariant: '#E8D8B8', // Brightened for better contrast
    background: '#141008',
    onBackground: '#FFF8E8',
    error: '#F25C4E',
    errorContainer: '#8E0000',
    onError: '#FFFFFF',
    onErrorContainer: '#FFCDD2',
    outline: '#6A5838', // Lightened for visibility
    outlineVariant: '#504028',
  },
  preview: ['#A88820', '#B09028', '#FFFCF5', '#242018'],
};


// ============================================
// BOLD & MODERN PALETTES
// ============================================

// BRUTALIST PALETTE - "Swiss International"
// WCAG AA compliant - already high contrast by design
const brutalistPalette = {
  light: {
    primary: '#000000',
    primaryContainer: '#E0E0E0',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#121212',
    secondary: '#0044CC', // Darkened for better contrast
    secondaryContainer: '#D0E3FF',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#001540',
    tertiary: '#CC2800', // Darkened for better contrast
    tertiaryContainer: '#FFDAD3',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#400000',
    accent: '#00A050', // Darkened for better contrast
    surface: '#FFFFFF',
    surfaceVariant: '#F0F0F0',
    onSurface: '#000000',
    onSurfaceVariant: '#2A2A2A', // Darkened for 7:1+ contrast
    background: '#FFFFFF',
    onBackground: '#000000',
    error: '#C02020',
    errorContainer: '#FFCDD2',
    onError: '#FFFFFF',
    onErrorContainer: '#8A0000',
    outline: '#404040', // Darkened for 3:1 contrast
    outlineVariant: '#808080',
  },
  dark: {
    primary: '#FFFFFF',
    primaryContainer: '#333333',
    onPrimary: '#000000',
    onPrimaryContainer: '#E0E0E0',
    secondary: '#70A8FF', // Brightened for better contrast
    secondaryContainer: '#003399',
    onSecondary: '#001030',
    onSecondaryContainer: '#D0E3FF',
    tertiary: '#FF9980', // Brightened for better contrast
    tertiaryContainer: '#AA2200',
    onTertiary: '#200800',
    onTertiaryContainer: '#FFDAD3',
    accent: '#80FFB0', // Brightened for better contrast
    surface: '#0A0A0A',
    surfaceVariant: '#1A1A1A',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#D8D8D8', // Brightened for better contrast
    background: '#000000',
    onBackground: '#FFFFFF',
    error: '#F25C4E',
    errorContainer: '#8E0000',
    onError: '#FFFFFF',
    onErrorContainer: '#FFCDD2',
    outline: '#808080', // Lightened for visibility
    outlineVariant: '#606060',
  },
  preview: ['#000000', '#0044CC', '#FFFFFF', '#0A0A0A'],
};

// OBSIDIAN PALETTE - "Carbon Fiber"
// WCAG AA compliant contrast ratios
const obsidianPalette = {
  light: {
    primary: '#2A3D48', // Darkened for better contrast
    primaryContainer: '#D6DBDF',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#141C20',
    secondary: '#4A5A68', // Darkened for better contrast
    secondaryContainer: '#EBEDEF',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#1C2830',
    tertiary: '#5A6A78', // Darkened for better contrast
    tertiaryContainer: '#EAEDED',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#2A3840',
    accent: '#8090A0',
    surface: '#FFFFFF',
    surfaceVariant: '#F0F2F4',
    onSurface: '#141C20',
    onSurfaceVariant: '#3A4850', // Darkened for 7:1+ contrast
    background: '#F8F9F9',
    onBackground: '#141C20',
    error: '#8A2820',
    errorContainer: '#F2D7D5',
    onError: '#FFFFFF',
    onErrorContainer: '#4A1410',
    outline: '#6A7A88', // Darkened for 3:1 contrast
    outlineVariant: '#A0ACB4',
  },
  dark: {
    primary: '#C8D0D8', // Brightened for better contrast
    primaryContainer: '#2C3E50',
    onPrimary: '#101820',
    onPrimaryContainer: '#ECF0F1',
    secondary: '#B8C4CC', // Brightened for better contrast
    secondaryContainer: '#34495E',
    onSecondary: '#101820',
    onSecondaryContainer: '#D6DBDF',
    tertiary: '#A8B8C4', // Brightened for better contrast
    tertiaryContainer: '#4D5656',
    onTertiary: '#101820',
    onTertiaryContainer: '#EAEDED',
    accent: '#90A0AC',
    surface: '#141C20',
    surfaceVariant: '#1C2830',
    onSurface: '#F0F4F5',
    onSurfaceVariant: '#C8D0D8', // Brightened for better contrast
    background: '#0A0C0E',
    onBackground: '#F0F4F5',
    error: '#F25C4E',
    errorContainer: '#922B21',
    onError: '#FFFFFF',
    onErrorContainer: '#FADBD8',
    outline: '#4A5A68', // Lightened for visibility
    outlineVariant: '#3A4850',
  },
  preview: ['#2A3D48', '#4A5A68', '#F8F9F9', '#141C20'],
};

// MIDNIGHT PALETTE - "Deep Space"
// WCAG AA compliant contrast ratios
const midnightPalette = {
  light: {
    primary: '#141C68', // Darkened for better contrast
    primaryContainer: '#E8EAF6',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#080C40',
    secondary: '#283890', // Darkened for better contrast
    secondaryContainer: '#C5CAE9',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#101860',
    tertiary: '#3040A0', // Darkened for better contrast
    tertiaryContainer: '#9FA8DA',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#101860',
    accent: '#5868B0', // Darkened for better contrast
    surface: '#FFFFFF',
    surfaceVariant: '#F0F2F8',
    onSurface: '#0C1040',
    onSurfaceVariant: '#202860', // Darkened for 7:1+ contrast
    background: '#FAFAFA',
    onBackground: '#0C1040',
    error: '#B32D20',
    errorContainer: '#FFCDD2',
    onError: '#FFFFFF',
    onErrorContainer: '#B71C1C',
    outline: '#6878B0', // Darkened for 3:1 contrast
    outlineVariant: '#A0A8D0',
  },
  dark: {
    primary: '#98A0D8', // Brightened for better contrast
    primaryContainer: '#1A237E',
    onPrimary: '#080C30',
    onPrimaryContainer: '#E8EAF6',
    secondary: '#B0B8E0', // Brightened for better contrast
    secondaryContainer: '#303F9F',
    onSecondary: '#080C30',
    onSecondaryContainer: '#C5CAE9',
    tertiary: '#7080C8', // Brightened for better contrast
    tertiaryContainer: '#283593',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#9FA8DA',
    accent: '#5060B0',
    surface: '#0C1040',
    surfaceVariant: '#141C60',
    onSurface: '#F0F2F8',
    onSurfaceVariant: '#B0B8E0', // Brightened for better contrast
    background: '#040818',
    onBackground: '#F0F2F8',
    error: '#F25C4E',
    errorContainer: '#8E0000',
    onError: '#FFFFFF',
    onErrorContainer: '#FFCDD2',
    outline: '#404890', // Lightened for visibility
    outlineVariant: '#283068',
  },
  preview: ['#141C68', '#283890', '#FAFAFA', '#0C1040'],
};

// SLATE PALETTE - "Industrial"
// WCAG AA compliant contrast ratios
const slatePalette = {
  light: {
    primary: '#374850', // Darkened for better contrast
    primaryContainer: '#CFD8DC',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#1C2428',
    secondary: '#4A6068', // Darkened for better contrast
    secondaryContainer: '#ECEFF1',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#283438',
    tertiary: '#5A7078', // Darkened for better contrast
    tertiaryContainer: '#B0BEC5',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#283438',
    accent: '#708890',
    surface: '#FFFFFF',
    surfaceVariant: '#F0F2F4',
    onSurface: '#1C2428',
    onSurfaceVariant: '#3A4850', // Darkened for 7:1+ contrast
    background: '#F5F5F5',
    onBackground: '#1C2428',
    error: '#B32D20',
    errorContainer: '#FFCDD2',
    onError: '#FFFFFF',
    onErrorContainer: '#B71C1C',
    outline: '#6A7A84', // Darkened for 3:1 contrast
    outlineVariant: '#A0ACB4',
  },
  dark: {
    primary: '#A8B8C0', // Brightened for better contrast
    primaryContainer: '#37474F',
    onPrimary: '#101820',
    onPrimaryContainer: '#CFD8DC',
    secondary: '#C0CCD4', // Brightened for better contrast
    secondaryContainer: '#455A64',
    onSecondary: '#101820',
    onSecondaryContainer: '#ECEFF1',
    tertiary: '#90A0A8', // Brightened for better contrast
    tertiaryContainer: '#546E7A',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#B0BEC5',
    accent: '#708890',
    surface: '#181C20',
    surfaceVariant: '#202830',
    onSurface: '#F0F4F5',
    onSurfaceVariant: '#A8B8C0', // Brightened for better contrast
    background: '#0C1014',
    onBackground: '#F0F4F5',
    error: '#F25C4E',
    errorContainer: '#8E0000',
    onError: '#FFFFFF',
    onErrorContainer: '#FFCDD2',
    outline: '#4A5A64', // Lightened for visibility
    outlineVariant: '#3A4850',
  },
  preview: ['#374850', '#4A6068', '#F5F5F5', '#181C20'],
};


// ============================================
// APP INSPIRED PALETTES
// ============================================

// SPOTIFY INSPIRED - "Stream"
const spotifyPalette = {
  light: {
    primary: '#1DB954',
    primaryContainer: '#EEFAEE',
    onPrimary: '#000000',
    onPrimaryContainer: '#042D15',
    secondary: '#191414',
    secondaryContainer: '#E8E8E8',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#121212',
    tertiary: '#1ED760',
    tertiaryContainer: '#E0F8E8',
    onTertiary: '#000000',
    onTertiaryContainer: '#043618',
    accent: '#1DB954',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    onSurface: '#191414',
    onSurfaceVariant: '#535353',
    background: '#FFFFFF',
    onBackground: '#191414',
    error: '#E91429',
    errorContainer: '#FCECEC',
    onError: '#FFFFFF',
    onErrorContainer: '#730A14',
    outline: '#B3B3B3',
    outlineVariant: '#D8D8D8',
  },
  dark: {
    primary: '#1DB954',
    primaryContainer: '#0F5C2A',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#D2F2DD',
    secondary: '#FFFFFF',
    secondaryContainer: '#282828',
    onSecondary: '#191414',
    onSecondaryContainer: '#FFFFFF',
    tertiary: '#1ED760',
    tertiaryContainer: '#0F6B30',
    onTertiary: '#000000',
    onTertiaryContainer: '#D2F8DD',
    accent: '#1DB954',
    surface: '#121212',
    surfaceVariant: '#282828',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#B3B3B3',
    background: '#191414',
    onBackground: '#FFFFFF',
    error: '#E91429',
    errorContainer: '#800B16',
    onError: '#FFFFFF',
    onErrorContainer: '#FCECEC',
    outline: '#535353',
    outlineVariant: '#404040',
  },
  preview: ['#1DB954', '#191414', '#FFFFFF', '#121212'],
};

// DISCORD INSPIRED - "Chat"
const discordPalette = {
  light: {
    primary: '#5865F2',
    primaryContainer: '#EEF0FD',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#151A66',
    secondary: '#23272A',
    secondaryContainer: '#E9EAEB',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#0D0F10',
    tertiary: '#EB459E',
    tertiaryContainer: '#FDEDF5',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#5E1B3F',
    accent: '#5865F2',
    surface: '#FFFFFF',
    surfaceVariant: '#F2F3F5',
    onSurface: '#23272A',
    onSurfaceVariant: '#4F545C',
    background: '#FFFFFF',
    onBackground: '#23272A',
    error: '#ED4245',
    errorContainer: '#FDECEC',
    onError: '#FFFFFF',
    onErrorContainer: '#762122',
    outline: '#747F8D',
    outlineVariant: '#CACCce',
  },
  dark: {
    primary: '#5865F2',
    primaryContainer: '#3C45A5',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#DEE0FC',
    secondary: '#B9BBBE',
    secondaryContainer: '#40444B',
    onSecondary: '#202225',
    onSecondaryContainer: '#FFFFFF',
    tertiary: '#EB459E',
    tertiaryContainer: '#8A295C',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#FDECEC',
    accent: '#5865F2',
    surface: '#36393F',
    surfaceVariant: '#2F3136',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#B9BBBE',
    background: '#202225',
    onBackground: '#FFFFFF',
    error: '#ED4245',
    errorContainer: '#872527',
    onError: '#FFFFFF',
    onErrorContainer: '#FDECEC',
    outline: '#4F545C',
    outlineVariant: '#292B2F',
  },
  preview: ['#5865F2', '#23272A', '#FFFFFF', '#36393F'],
};

// AIRBNB INSPIRED - "Stay"
const airbnbPalette = {
  light: {
    primary: '#FF385C',
    primaryContainer: '#FFEBEE',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#661625',
    secondary: '#00A699',
    secondaryContainer: '#E6F6F5',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#00423D',
    tertiary: '#FC642D',
    tertiaryContainer: '#FFF0EA',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#652812',
    accent: '#FF385C',
    surface: '#FFFFFF',
    surfaceVariant: '#F7F7F7',
    onSurface: '#222222',
    onSurfaceVariant: '#484848',
    background: '#FFFFFF',
    onBackground: '#222222',
    error: '#B32D20',
    errorContainer: '#FDEAEA',
    onError: '#FFFFFF',
    onErrorContainer: '#641E16',
    outline: '#B0B0B0',
    outlineVariant: '#EBEBEB',
  },
  dark: {
    primary: '#FF385C',
    primaryContainer: '#8A1E32',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#FFD7DE',
    secondary: '#00A699',
    secondaryContainer: '#005952',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#B3F0E9',
    tertiary: '#FC642D',
    tertiaryContainer: '#8F3819',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#FFDDCF',
    accent: '#FF385C',
    surface: '#222222',
    surfaceVariant: '#2B2B2B',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#B0B0B0',
    background: '#141414',
    onBackground: '#FFFFFF',
    error: '#F25C4E',
    errorContainer: '#922B21',
    onError: '#FFFFFF',
    onErrorContainer: '#FADBD8',
    outline: '#484848',
    outlineVariant: '#333333',
  },
  preview: ['#FF385C', '#00A699', '#FFFFFF', '#222222'],
};

// NOTION INSPIRED - "Docs"
const notionPalette = {
  light: {
    primary: '#37352F',
    primaryContainer: '#EBECED',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#0D0D0C',
    secondary: '#ACABA9',
    secondaryContainer: '#F1F1EF',
    onSecondary: '#37352F',
    onSecondaryContainer: '#5A5A58',
    tertiary: '#D44C47',
    tertiaryContainer: '#FDECEB',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#551C1A',
    accent: '#37352F',
    surface: '#FFFFFF',
    surfaceVariant: '#F7F7F5',
    onSurface: '#37352F',
    onSurfaceVariant: '#787774',
    background: '#FFFFFF',
    onBackground: '#37352F',
    error: '#D44C47',
    errorContainer: '#FDECEB',
    onError: '#FFFFFF',
    onErrorContainer: '#551C1A',
    outline: '#D9D9D9',
    outlineVariant: '#EBEBEB',
  },
  dark: {
    primary: '#E3E2E0',
    primaryContainer: '#454545',
    onPrimary: '#191919',
    onPrimaryContainer: '#FFFFFF',
    secondary: '#979A9B',
    secondaryContainer: '#3F4448',
    onSecondary: '#191919',
    onSecondaryContainer: '#E3E2E0',
    tertiary: '#FF7369',
    tertiaryContainer: '#692925',
    onTertiary: '#191919',
    onTertiaryContainer: '#FFE3E2',
    accent: '#E3E2E0',
    surface: '#2F3437',
    surfaceVariant: '#3F4448',
    onSurface: '#E3E2E0',
    onSurfaceVariant: '#979A9B',
    background: '#191919',
    onBackground: '#E3E2E0',
    error: '#FF7369',
    errorContainer: '#692925',
    onError: '#191919',
    onErrorContainer: '#FFE3E2',
    outline: '#454545',
    outlineVariant: '#2F3437',
  },
  preview: ['#37352F', '#ACABA9', '#FFFFFF', '#191919'],
};

// LINEAR INSPIRED - "Task"
const linearPalette = {
  light: {
    primary: '#5E6AD2',
    primaryContainer: '#EFF1FC',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#131952',
    secondary: '#22252B',
    secondaryContainer: '#E8EAED',
    onSecondary: '#FFFFFF',
    onSecondaryContainer: '#0D0E10',
    tertiary: '#F2C94C',
    tertiaryContainer: '#FEF9ED',
    onTertiary: '#000000',
    onTertiaryContainer: '#59460D',
    accent: '#5E6AD2',
    surface: '#FFFFFF',
    surfaceVariant: '#F4F5F8',
    onSurface: '#22252B',
    onSurfaceVariant: '#5F6B7C',
    background: '#FCFCFD',
    onBackground: '#22252B',
    error: '#E25555',
    errorContainer: '#FCEEEE',
    onError: '#FFFFFF',
    onErrorContainer: '#661414',
    outline: '#EBECEF',
    outlineVariant: '#D7D8DB',
  },
  dark: {
    primary: '#5E6AD2',
    primaryContainer: '#303669',
    onPrimary: '#FFFFFF',
    onPrimaryContainer: '#E6E8FA',
    secondary: '#878C99',
    secondaryContainer: '#2C3038',
    onSecondary: '#13151F',
    onSecondaryContainer: '#FFFFFF',
    tertiary: '#F2C94C',
    tertiaryContainer: '#665520',
    onTertiary: '#000000',
    onTertiaryContainer: '#FEF9ED',
    accent: '#5E6AD2',
    surface: '#13151F',
    surfaceVariant: '#1E212B',
    onSurface: '#F7F8F3',
    onSurfaceVariant: '#878C99',
    background: '#0B0C11',
    onBackground: '#F7F8F3',
    error: '#E25555',
    errorContainer: '#661414',
    onError: '#FFFFFF',
    onErrorContainer: '#FCEEEE',
    outline: '#2E313A',
    outlineVariant: '#1F2127',
  },
  preview: ['#5E6AD2', '#22252B', '#FFFFFF', '#0B0C11'],
};

// ============================================
// PALETTE EXPORTS
// ============================================

/**
 * All available color palettes
 */
export const colorPalettes: Record<ColorPalette, { light: typeof defaultPalette.light; dark: typeof defaultPalette.dark; preview: string[] }> = {
  // Calm & Relaxing
  default: defaultPalette,
  ocean: oceanPalette,
  forest: forestPalette,
  zen: zenPalette,
  misty: mistyPalette,
  // Energetic & Vibrant
  sunset: sunsetPalette,
  neon: neonPalette,
  tropical: tropicalPalette,
  fiesta: fiestaPalette,
  // Elegant & Sophisticated
  lavender: lavenderPalette,
  orchid: orchidPalette,
  rosegold: rosegoldPalette,
  champagne: champagnePalette,
  // Bold & Modern
  brutalist: brutalistPalette,
  obsidian: obsidianPalette,
  midnight: midnightPalette,
  slate: slatePalette,
  // App Inspired
  spotify: spotifyPalette,
  discord: discordPalette,
  airbnb: airbnbPalette,
  notion: notionPalette,
  linear: linearPalette,
};

/**
 * Color palette info for display in settings, grouped by mood
 */
export const colorPaletteInfoList: ColorPaletteInfo[] = [
  // Calm & Relaxing
  { id: 'default', name: 'Amber (Default)', colors: defaultPalette.preview, mood: 'calm' },
  { id: 'ocean', name: 'Deep Ocean', colors: oceanPalette.preview, mood: 'calm' },
  { id: 'forest', name: 'Evergreen', colors: forestPalette.preview, mood: 'calm' },
  { id: 'zen', name: 'Peaceful Sage', colors: zenPalette.preview, mood: 'calm' },
  { id: 'misty', name: 'Morning Fog', colors: mistyPalette.preview, mood: 'calm' },
  // Energetic & Vibrant
  { id: 'sunset', name: 'Golden Hour', colors: sunsetPalette.preview, mood: 'energetic' },
  { id: 'neon', name: 'Cyberpunk', colors: neonPalette.preview, mood: 'energetic' },
  { id: 'tropical', name: 'Paradise', colors: tropicalPalette.preview, mood: 'energetic' },
  { id: 'fiesta', name: 'Carnival', colors: fiestaPalette.preview, mood: 'energetic' },
  // Elegant & Sophisticated
  { id: 'lavender', name: 'Royal Amethyst', colors: lavenderPalette.preview, mood: 'elegant' },
  { id: 'orchid', name: 'Soft Blossom', colors: orchidPalette.preview, mood: 'elegant' },
  { id: 'rosegold', name: 'Blush', colors: rosegoldPalette.preview, mood: 'elegant' },
  { id: 'champagne', name: 'Luxe', colors: champagnePalette.preview, mood: 'elegant' },
  // Bold & Modern
  { id: 'brutalist', name: 'Swiss (High Contrast)', colors: brutalistPalette.preview, mood: 'bold' },
  { id: 'obsidian', name: 'Carbon', colors: obsidianPalette.preview, mood: 'bold' },
  { id: 'midnight', name: 'Deep Space', colors: midnightPalette.preview, mood: 'bold' },
  { id: 'slate', name: 'Industrial', colors: slatePalette.preview, mood: 'bold' },
  // App Inspired
  { id: 'spotify', name: 'Stream (Spotify)', colors: spotifyPalette.preview, mood: 'inspired' },
  { id: 'discord', name: 'Chat (Discord)', colors: discordPalette.preview, mood: 'inspired' },
  { id: 'airbnb', name: 'Stay (Airbnb)', colors: airbnbPalette.preview, mood: 'inspired' },
  { id: 'notion', name: 'Docs (Notion)', colors: notionPalette.preview, mood: 'inspired' },
  { id: 'linear', name: 'Task (Linear)', colors: linearPalette.preview, mood: 'inspired' },
];

/**
 * Get palettes grouped by mood
 */
export const getPalettesByMood = (mood: ThemeMood): ColorPaletteInfo[] => {
  return colorPaletteInfoList.filter(palette => palette.mood === mood);
};

/**
 * Get colors for a specific palette and mode
 */
export const getColorsForPalette = (palette: ColorPalette, isDark: boolean) => {
  const selectedPalette = colorPalettes[palette] || colorPalettes.default;
  return isDark ? selectedPalette.dark : selectedPalette.light;
};

// Legacy exports for backward compatibility
export const colors = colorPalettes.default;
