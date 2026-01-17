import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { Category, Goal } from '../types';
import { categoryManager, ICategoryManager } from '../services/categoryManager';

/**
 * Category state interface
 */
interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Category action types
 */
type CategoryAction =
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

/**
 * Category context value interface
 */
interface CategoryContextValue extends CategoryState {
  // Category CRUD operations
  createCategory: (name: string, color: string) => Category;
  updateCategory: (id: string, updates: Partial<Pick<Category, 'name' | 'color'>>) => Category;
  deleteCategory: (id: string) => void;
  // Category retrieval
  getCategoryById: (id: string) => Category | undefined;
  getGoalsByCategory: (categoryId: string) => Goal[];
  // Goal-Category operations
  assignCategoryToGoal: (goalId: string, categoryId: string) => Goal;
  // Refresh
  refreshCategories: () => void;
}

/**
 * Initial state
 */
const initialState: CategoryState = {
  categories: [],
  isLoading: true,
  error: null,
};

/**
 * Category reducer
 */
function categoryReducer(state: CategoryState, action: CategoryAction): CategoryState {
  switch (action.type) {
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload, isLoading: false };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.payload),
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

/**
 * Create context with undefined default
 */
const CategoryContext = createContext<CategoryContextValue | undefined>(undefined);

/**
 * CategoryProvider props
 */
interface CategoryProviderProps {
  children: ReactNode;
}

/**
 * CategoryProvider - Provides category state management throughout the app
 * Requirements: 1.1, 1.5
 */
export function CategoryProvider({ children }: CategoryProviderProps) {
  const [state, dispatch] = useReducer(categoryReducer, initialState);

  /**
   * Load all categories from storage on mount
   * Initialize default categories if needed
   * Requirements: 1.5
   */
  const refreshCategories = useCallback(() => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Initialize default categories if they don't exist
      categoryManager.initializeDefaultCategories();
      
      const allCategories = categoryManager.getCategories();
      dispatch({ type: 'SET_CATEGORIES', payload: allCategories });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Failed to load categories:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load categories' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  /**
   * Initial load
   */
  useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  /**
   * Create a new category
   * Requirements: 1.6
   */
  const createCategory = useCallback((name: string, color: string): Category => {
    try {
      const category = categoryManager.createCategory(name, color);
      dispatch({ type: 'ADD_CATEGORY', payload: category });
      return category;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create category';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  }, []);

  /**
   * Update an existing category
   * Requirements: 1.6
   */
  const updateCategory = useCallback(
    (id: string, updates: Partial<Pick<Category, 'name' | 'color'>>): Category => {
      try {
        const category = categoryManager.updateCategory(id, updates);
        dispatch({ type: 'UPDATE_CATEGORY', payload: category });
        return category;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update category';
        dispatch({ type: 'SET_ERROR', payload: message });
        throw error;
      }
    },
    []
  );

  /**
   * Delete a category
   * Requirements: 1.7
   */
  const deleteCategory = useCallback((id: string): void => {
    try {
      categoryManager.deleteCategory(id);
      dispatch({ type: 'DELETE_CATEGORY', payload: id });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete category';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  }, []);

  /**
   * Get a single category by ID
   */
  const getCategoryById = useCallback((id: string): Category | undefined => {
    return categoryManager.getCategoryById(id);
  }, []);

  /**
   * Get goals by category
   * Requirements: 1.4
   */
  const getGoalsByCategory = useCallback((categoryId: string): Goal[] => {
    return categoryManager.getGoalsByCategory(categoryId);
  }, []);

  /**
   * Assign a category to a goal
   * Requirements: 1.2
   */
  const assignCategoryToGoal = useCallback((goalId: string, categoryId: string): Goal => {
    try {
      return categoryManager.assignCategoryToGoal(goalId, categoryId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to assign category';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw error;
    }
  }, []);

  const value: CategoryContextValue = {
    ...state,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getGoalsByCategory,
    assignCategoryToGoal,
    refreshCategories,
  };

  return (
    <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>
  );
}

/**
 * Hook to use category context
 * @throws Error if used outside of CategoryProvider
 */
export function useCategories(): CategoryContextValue {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
}

export default CategoryContext;
