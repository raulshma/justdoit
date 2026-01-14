/**
 * Template subgoal definition for goal templates
 */
export interface TemplateSubgoal {
  /** Subgoal title */
  title: string;
  /** Whether this subgoal is a milestone */
  isMilestone: boolean;
  /** Display order within template */
  order: number;
}

/**
 * Goal template for quickly creating structured goals
 */
export interface GoalTemplate {
  /** UUID v4 unique identifier */
  id: string;
  /** Template name (required, 1-100 chars) */
  name: string;
  /** Template description */
  description: string;
  /** Associated category ID */
  categoryId: string;
  /** Pre-configured subgoals */
  subgoals: TemplateSubgoal[];
  /** Whether this is a built-in template */
  isBuiltIn: boolean;
  /** ISO timestamp when created */
  createdAt: string;
}

/**
 * Built-in templates provided by the app
 */
export const BUILT_IN_TEMPLATES: Omit<GoalTemplate, 'createdAt'>[] = [
  {
    id: 'morning-routine',
    name: 'Morning Routine',
    description: 'Start your day right with a structured morning',
    categoryId: 'personal',
    subgoals: [
      { title: 'Wake up at target time', isMilestone: false, order: 0 },
      { title: 'Drink water', isMilestone: false, order: 1 },
      { title: 'Exercise/Stretch', isMilestone: true, order: 2 },
      { title: 'Healthy breakfast', isMilestone: false, order: 3 },
      { title: 'Review daily goals', isMilestone: true, order: 4 },
    ],
    isBuiltIn: true,
  },
  {
    id: 'workout-session',
    name: 'Workout Session',
    description: 'Complete a full workout routine',
    categoryId: 'health',
    subgoals: [
      { title: 'Warm-up (5-10 min)', isMilestone: false, order: 0 },
      { title: 'Main workout', isMilestone: true, order: 1 },
      { title: 'Cool-down stretches', isMilestone: false, order: 2 },
      { title: 'Log workout', isMilestone: false, order: 3 },
    ],
    isBuiltIn: true,
  },
  {
    id: 'study-block',
    name: 'Study Block',
    description: 'Focused study session with breaks',
    categoryId: 'learning',
    subgoals: [
      { title: 'Set up study environment', isMilestone: false, order: 0 },
      { title: 'First focus session (25 min)', isMilestone: false, order: 1 },
      { title: 'Short break (5 min)', isMilestone: false, order: 2 },
      { title: 'Second focus session (25 min)', isMilestone: true, order: 3 },
      { title: 'Review notes', isMilestone: true, order: 4 },
    ],
    isBuiltIn: true,
  },
  {
    id: 'weekly-review',
    name: 'Weekly Review',
    description: 'Reflect on the week and plan ahead',
    categoryId: 'work',
    subgoals: [
      { title: 'Review completed goals', isMilestone: false, order: 0 },
      { title: 'Identify wins and lessons', isMilestone: true, order: 1 },
      { title: 'Clear inbox and tasks', isMilestone: false, order: 2 },
      { title: 'Plan next week priorities', isMilestone: true, order: 3 },
    ],
    isBuiltIn: true,
  },
  {
    id: 'daily-planning',
    name: 'Daily Planning',
    description: 'Plan your day for maximum productivity',
    categoryId: 'work',
    subgoals: [
      { title: 'Review calendar', isMilestone: false, order: 0 },
      { title: 'Identify top 3 priorities', isMilestone: true, order: 1 },
      { title: 'Time-block schedule', isMilestone: false, order: 2 },
      { title: 'Prepare materials needed', isMilestone: false, order: 3 },
    ],
    isBuiltIn: true,
  },
];
