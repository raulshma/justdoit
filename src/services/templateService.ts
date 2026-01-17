import { randomUUID } from 'expo-crypto';
import { GoalTemplate, TemplateSubgoal, BUILT_IN_TEMPLATES, Goal, Subgoal } from '../types';
import { StorageService, storageService as defaultStorageService } from './storageService';
import { TEMPLATES_STORAGE_KEY } from '../constants';

// Re-export TEMPLATES_STORAGE_KEY for backward compatibility
export { TEMPLATES_STORAGE_KEY } from '../constants';

/**
 * Template Service Interface
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 3.8
 */
export interface ITemplateService {
  // Template retrieval
  getTemplates(): GoalTemplate[];
  getTemplatesByCategory(categoryId: string): GoalTemplate[];
  getBuiltInTemplates(): GoalTemplate[];
  getCustomTemplates(): GoalTemplate[];
  getTemplateById(id: string): GoalTemplate | undefined;
  
  // Template application
  createGoalFromTemplate(templateId: string, customizations?: Partial<Pick<Goal, 'title' | 'description' | 'dueDate' | 'priority' | 'categoryId'>>): Goal;
  
  // Custom template management
  saveAsTemplate(goal: Goal, name: string, description?: string): GoalTemplate;
  deleteCustomTemplate(id: string): void;
}

/**
 * Gets today's date in ISO format (YYYY-MM-DD)
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * TemplateService - Handles goal template management and application
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 3.8
 */
export class TemplateService implements ITemplateService {
  private storage: StorageService;

  constructor(storage?: StorageService) {
    this.storage = storage ?? defaultStorageService;
  }

  /**
   * Gets the raw MMKV storage instance for template operations
   */
  private getStorageInstance() {
    return (this.storage as any).storage;
  }

  /**
   * Retrieves custom templates from storage
   * Requirements: 3.8
   */
  private getCustomTemplatesFromStorage(): GoalTemplate[] {
    try {
      const storage = this.getStorageInstance();
      const templatesJson = storage.getString(TEMPLATES_STORAGE_KEY);
      if (!templatesJson) {
        return [];
      }
      return JSON.parse(templatesJson) as GoalTemplate[];
    } catch (error) {
      console.error('Failed to get custom templates:', error);
      return [];
    }
  }

  /**
   * Saves custom templates to storage
   * Requirements: 3.8
   */
  private saveCustomTemplates(templates: GoalTemplate[]): void {
    try {
      const storage = this.getStorageInstance();
      storage.set(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    } catch (error) {
      console.error('Failed to save custom templates:', error);
      throw new Error('Failed to save custom templates to storage');
    }
  }

  /**
   * Retrieves all templates (built-in and custom)
   * Requirements: 3.1
   * @returns Array of all templates
   */
  getTemplates(): GoalTemplate[] {
    const builtIn = this.getBuiltInTemplates();
    const custom = this.getCustomTemplates();
    return [...builtIn, ...custom];
  }

  /**
   * Retrieves templates filtered by category
   * Requirements: 3.2
   * @param categoryId - The category ID to filter by
   * @returns Array of templates in the category
   */
  getTemplatesByCategory(categoryId: string): GoalTemplate[] {
    const allTemplates = this.getTemplates();
    return allTemplates.filter((template) => template.categoryId === categoryId);
  }

  /**
   * Retrieves all built-in templates
   * Requirements: 3.5
   * @returns Array of built-in templates with timestamps
   */
  getBuiltInTemplates(): GoalTemplate[] {
    // Add createdAt timestamp to built-in templates
    return BUILT_IN_TEMPLATES.map((template) => ({
      ...template,
      createdAt: new Date(0).toISOString(), // Epoch time for built-in templates
    }));
  }

  /**
   * Retrieves all custom templates
   * Requirements: 3.7, 3.8
   * @returns Array of custom templates
   */
  getCustomTemplates(): GoalTemplate[] {
    return this.getCustomTemplatesFromStorage();
  }

  /**
   * Retrieves a template by ID
   * @param id - The template ID to retrieve
   * @returns The template if found, undefined otherwise
   */
  getTemplateById(id: string): GoalTemplate | undefined {
    const allTemplates = this.getTemplates();
    return allTemplates.find((template) => template.id === id);
  }

  /**
   * Creates a new goal from a template
   * Requirements: 3.3, 3.4
   * @param templateId - The template ID to use
   * @param customizations - Optional customizations for the goal
   * @returns The created goal (not persisted - caller should save)
   * @throws Error if template not found
   */
  createGoalFromTemplate(
    templateId: string,
    customizations?: Partial<Pick<Goal, 'title' | 'description' | 'dueDate' | 'priority' | 'categoryId'>>
  ): Goal {
    const template = this.getTemplateById(templateId);
    
    if (!template) {
      throw new Error(`Template with id ${templateId} not found`);
    }

    const now = new Date().toISOString();
    const goalId = randomUUID();

    // Create subgoals from template
    const subgoals: Subgoal[] = template.subgoals.map((templateSubgoal: TemplateSubgoal) => ({
      id: randomUUID(),
      parentGoalId: goalId,
      title: templateSubgoal.title,
      isCompleted: false,
      isMilestone: templateSubgoal.isMilestone,
      order: templateSubgoal.order,
      createdAt: now,
    }));

    // Create the goal with template values and customizations
    const goal: Goal = {
      id: goalId,
      title: customizations?.title ?? template.name,
      description: customizations?.description ?? template.description,
      dueDate: customizations?.dueDate ?? getTodayDate(),
      createdAt: now,
      isCompleted: false,
      priority: customizations?.priority ?? 'medium',
      recurrence: { type: 'none' },
      categoryId: customizations?.categoryId ?? template.categoryId,
      subgoals,
      templateId: template.id,
    };

    return goal;
  }

  /**
   * Saves an existing goal as a custom template
   * Requirements: 3.7
   * @param goal - The goal to save as template
   * @param name - Template name (1-100 chars)
   * @param description - Optional template description
   * @returns The created template
   * @throws Error if name is invalid
   */
  saveAsTemplate(goal: Goal, name: string, description?: string): GoalTemplate {
    // Validate name
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length > 100) {
      throw new Error('Template name must be between 1 and 100 characters');
    }

    // Check for duplicate name among custom templates
    const customTemplates = this.getCustomTemplates();
    const duplicate = customTemplates.find(
      (t) => t.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      throw new Error('A custom template with this name already exists');
    }

    // Convert goal subgoals to template subgoals
    const templateSubgoals: TemplateSubgoal[] = (goal.subgoals ?? [])
      .sort((a, b) => a.order - b.order)
      .map((subgoal, index) => ({
        title: subgoal.title,
        isMilestone: subgoal.isMilestone,
        order: index,
      }));

    const newTemplate: GoalTemplate = {
      id: randomUUID(),
      name: trimmedName,
      description: description?.trim() ?? goal.description ?? '',
      categoryId: goal.categoryId ?? 'other',
      subgoals: templateSubgoals,
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
    };

    customTemplates.push(newTemplate);
    this.saveCustomTemplates(customTemplates);

    return newTemplate;
  }

  /**
   * Deletes a custom template
   * Requirements: 3.7
   * @param id - Template ID to delete
   * @throws Error if template not found or is built-in
   */
  deleteCustomTemplate(id: string): void {
    // Check if it's a built-in template
    const builtInTemplate = BUILT_IN_TEMPLATES.find((t) => t.id === id);
    if (builtInTemplate) {
      throw new Error('Cannot delete built-in templates');
    }

    const customTemplates = this.getCustomTemplates();
    const index = customTemplates.findIndex((t) => t.id === id);

    if (index === -1) {
      throw new Error('Custom template not found');
    }

    customTemplates.splice(index, 1);
    this.saveCustomTemplates(customTemplates);
  }
}

// Export singleton instance for app-wide use
export const templateService = new TemplateService();
