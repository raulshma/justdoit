/**
 * Category entity for organizing goals by type
 */
export interface Category {
  /** UUID v4 unique identifier */
  id: string;
  /** Category name (required, 1-50 chars) */
  name: string;
  /** Hex color code for visual identification */
  color: string;
  /** Whether this is a built-in default category */
  isDefault: boolean;
  /** ISO timestamp when created */
  createdAt: string;
}

/**
 * Default categories provided by the app
 */
export const DEFAULT_CATEGORIES: Omit<Category, 'createdAt'>[] = [
  { id: 'health', name: 'Health', color: '#4CAF50', isDefault: true },
  { id: 'work', name: 'Work', color: '#2196F3', isDefault: true },
  { id: 'personal', name: 'Personal', color: '#9C27B0', isDefault: true },
  { id: 'learning', name: 'Learning', color: '#FF9800', isDefault: true },
  { id: 'other', name: 'Other', color: '#9E9E9E', isDefault: true },
];
