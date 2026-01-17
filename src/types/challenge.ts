/**
 * Challenge type categories
 */
export type ChallengeType =
  | 'completion_count'      // Complete X goals
  | 'category_focus'        // Complete X goals in category
  | 'streak_maintenance'    // Maintain X-day streak
  | 'priority_completion'   // Complete X high-priority goals
  | 'early_completion'      // Complete X goals before time
  | 'subgoal_completion';   // Complete X subgoals

/**
 * Challenge status
 */
export type ChallengeStatus = 'active' | 'completed' | 'expired';

/**
 * Challenge entity representing a weekly objective
 */
export interface Challenge {
  /** UUID v4 unique identifier */
  id: string;
  /** Challenge type */
  type: ChallengeType;
  /** Display title */
  title: string;
  /** Description of the challenge */
  description: string;
  /** Target value to achieve */
  target: number;
  /** Current progress value */
  current: number;
  /** XP reward on completion */
  xpReward: number;
  /** ISO date string when challenge starts */
  startDate: string;
  /** ISO date string when challenge ends */
  endDate: string;
  /** Current status */
  status: ChallengeStatus;
  /** Category ID for category-focused challenges */
  categoryId?: string;
}

/**
 * Template for generating challenges
 */
export interface ChallengeTemplate {
  /** Challenge type */
  type: ChallengeType;
  /** Title template with {target} and {category} placeholders */
  titleTemplate: string;
  /** Description template with placeholders */
  descriptionTemplate: string;
  /** Base target value */
  baseTarget: number;
  /** Base XP reward */
  baseXPReward: number;
  /** Difficulty scaling factor */
  scalingFactor: number;
}

/**
 * Challenge templates for generation
 */
export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    type: 'completion_count',
    titleTemplate: 'Complete {target} goals this week',
    descriptionTemplate: 'Finish {target} goals before the week ends',
    baseTarget: 10,
    baseXPReward: 50,
    scalingFactor: 1.2,
  },
  {
    type: 'category_focus',
    titleTemplate: 'Focus on {category}: Complete {target} goals',
    descriptionTemplate: 'Complete {target} {category} goals this week',
    baseTarget: 5,
    baseXPReward: 40,
    scalingFactor: 1.1,
  },
  {
    type: 'streak_maintenance',
    titleTemplate: 'Maintain a {target}-day streak',
    descriptionTemplate: 'Keep your streak going for {target} days',
    baseTarget: 5,
    baseXPReward: 60,
    scalingFactor: 1.3,
  },
  {
    type: 'priority_completion',
    titleTemplate: 'Complete {target} high-priority goals',
    descriptionTemplate: 'Focus on what matters most',
    baseTarget: 3,
    baseXPReward: 45,
    scalingFactor: 1.15,
  },
  {
    type: 'early_completion',
    titleTemplate: 'Early bird: Complete {target} goals before 9 AM',
    descriptionTemplate: 'Start your days strong',
    baseTarget: 3,
    baseXPReward: 55,
    scalingFactor: 1.2,
  },
  {
    type: 'subgoal_completion',
    titleTemplate: 'Complete {target} subgoals this week',
    descriptionTemplate: 'Break down your goals and conquer them step by step',
    baseTarget: 15,
    baseXPReward: 45,
    scalingFactor: 1.15,
  },
];
