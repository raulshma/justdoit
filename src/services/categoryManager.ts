import { Category, DEFAULT_CATEGORIES, Goal } from '../types';
import { storageService, StorageService } from './storageService';

/**
 * Storage key for categories
 */
export const CATEGORIES_STORAGE_KEY = 'categories';

/**
 * The "Other" category ID used as fallback when categories are deleted
 */
export const OTHER_CATEGORY_ID = 'other';

/**
 * Category Manager Interface
 * Requirements: 1.1, 1.2, 1.5, 1.6, 1.7, 1.8
 */
export interface ICategoryManager {
  // Category CRUD
  getCategories(): Category[];
  getCategoryById(id: string): Category | undefined;
  createCategory(name: string, color: string): Category;
  updateCategory(id: string, updates: Partial<Pick<Category, 'name' | 'color'>>): Category;
  deleteCategory(id: string): void;
  
  // Goal-Category operations
  assignCategoryToGoal(goalId: string, categoryId: string): Goal;
  getGoalsByCategory(categoryId: string): Goal[];
  
  // Default categories
  initializeDefaultCategories(): void;
}

/**
 * Generates a UUID v4
 */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * CategoryManager - Handles category CRUD and goal-category associations
 * Requirements: 1.1, 1.2, 1.5, 1.6, 1.7, 1.8
 */
export class CategoryManager implements ICategoryManager {
  private storage: StorageService;

  constructor(storage?: StorageService) {
    this.storage = storage ?? storageService;
  }

  /**
   * Gets the raw MMKV storage instance for category operations
   */
  private getStorageInstance() {
    // Access the underlying MMKV storage through the service
    return (this.storage as any).storage;
  }

  /**
   * Retrieves all categories from storage
   * Requirements: 1.1
   */
  getCategories(): Category[] {
    try {
      const storage = this.getStorageInstance();
      const categoriesJson = storage.getString(CATEGORIES_STORAGE_KEY);
      if (!categoriesJson) {
        return [];
      }
      return JSON.parse(categoriesJson) as Category[];
    } catch (error) {
      console.error('Failed to get categories:', error);
      return [];
    }
  }

  /**
   * Saves categories to storage
   */
  private saveCategories(categories: Category[]): void {
    try {
      const storage = this.getStorageInstance();
      storage.set(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch (error) {
      console.error('Failed to save categories:', error);
      throw new Error('Failed to save categories to storage');
    }
  }

  /**
   * Retrieves a category by ID
   * @param id - The category ID to retrieve
   * @returns The category if found, undefined otherwise
   */
  getCategoryById(id: string): Category | undefined {
    const categories = this.getCategories();
    return categories.find((c) => c.id === id);
  }

  /**
   * Creates a new custom category
   * Requirements: 1.6
   * @param name - Category name (1-50 chars)
   * @param color - Hex color code
   * @returns The created category
   * @throws Error if name is invalid or duplicate
   */
  createCategory(name: string, color: string): Category {
    // Validate name
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 50) {
      throw new Error('Category name must be between 1 and 50 characters');
    }

    // Check for duplicate name
    const categories = this.getCategories();
    const duplicate = categories.find(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      throw new Error('A category with this name already exists');
    }

    // Validate color format
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      throw new Error('Invalid color format. Use hex format like #FF5733');
    }

    const newCategory: Category = {
      id: generateId(),
      name: trimmedName,
      color,
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    categories.push(newCategory);
    this.saveCategories(categories);

    return newCategory;
  }

  /**
   * Updates an existing category
   * Requirements: 1.6
   * @param id - Category ID to update
   * @param updates - Partial updates (name and/or color)
   * @returns The updated category
   * @throws Error if category not found or validation fails
   */
  updateCategory(
    id: string,
    updates: Partial<Pick<Category, 'name' | 'color'>>
  ): Category {
    const categories = this.getCategories();
    const index = categories.findIndex((c) => c.id === id);

    if (index === -1) {
      throw new Error('Category not found');
    }

    const category = categories[index];

    // Validate name if provided
    if (updates.name !== undefined) {
      const trimmedName = updates.name.trim();
      if (!trimmedName || trimmedName.length > 50) {
        throw new Error('Category name must be between 1 and 50 characters');
      }

      // Check for duplicate name (excluding current category)
      const duplicate = categories.find(
        (c) => c.id !== id && c.name.toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicate) {
        throw new Error('A category with this name already exists');
      }

      category.name = trimmedName;
    }

    // Validate color if provided
    if (updates.color !== undefined) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(updates.color)) {
        throw new Error('Invalid color format. Use hex format like #FF5733');
      }
      category.color = updates.color;
    }

    categories[index] = category;
    this.saveCategories(categories);

    return category;
  }

  /**
   * Deletes a category and reassigns affected goals to "Other"
   * Requirements: 1.7
   * @param id - Category ID to delete
   * @throws Error if trying to delete a default category
   */
  deleteCategory(id: string): void {
    const categories = this.getCategories();
    const category = categories.find((c) => c.id === id);

    if (!category) {
      throw new Error('Category not found');
    }

    if (category.isDefault) {
      throw new Error('Cannot delete default categories');
    }

    // Reassign all goals with this category to "Other"
    const goals = this.storage.getAllGoals();
    const updatedGoals = goals.map((goal) => {
      if (goal.categoryId === id) {
        return { ...goal, categoryId: OTHER_CATEGORY_ID };
      }
      return goal;
    });

    // Save updated goals
    updatedGoals.forEach((goal) => this.storage.saveGoal(goal));

    // Remove the category
    const filteredCategories = categories.filter((c) => c.id !== id);
    this.saveCategories(filteredCategories);
  }

  /**
   * Assigns a category to a goal
   * Requirements: 1.2
   * @param goalId - The goal ID
   * @param categoryId - The category ID to assign
   * @returns The updated goal
   * @throws Error if goal or category not found
   */
  assignCategoryToGoal(goalId: string, categoryId: string): Goal {
    const goal = this.storage.getGoal(goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    const category = this.getCategoryById(categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    const updatedGoal: Goal = {
      ...goal,
      categoryId,
    };

    this.storage.saveGoal(updatedGoal);
    return updatedGoal;
  }

  /**
   * Gets all goals belonging to a specific category
   * Requirements: 1.4
   * @param categoryId - The category ID to filter by
   * @returns Array of goals in the category
   */
  getGoalsByCategory(categoryId: string): Goal[] {
    const goals = this.storage.getAllGoals();
    return goals.filter((goal) => goal.categoryId === categoryId);
  }

  /**
   * Initializes default categories if they don't exist
   * Requirements: 1.5
   */
  initializeDefaultCategories(): void {
    const existingCategories = this.getCategories();
    
    // Check if default categories already exist
    const hasDefaults = DEFAULT_CATEGORIES.every((defaultCat) =>
      existingCategories.some((c) => c.id === defaultCat.id)
    );

    if (hasDefaults && existingCategories.length > 0) {
      return; // Already initialized
    }

    // Create default categories with timestamps
    const defaultCategoriesWithTimestamp: Category[] = DEFAULT_CATEGORIES.map(
      (cat) => ({
        ...cat,
        createdAt: new Date().toISOString(),
      })
    );

    // Merge with any existing custom categories
    const customCategories = existingCategories.filter((c) => !c.isDefault);
    const allCategories = [...defaultCategoriesWithTimestamp, ...customCategories];

    this.saveCategories(allCategories);
  }
}

// Export singleton instance for app-wide use
export const categoryManager = new CategoryManager();
