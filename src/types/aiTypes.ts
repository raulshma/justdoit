/**
 * AI Types - Type definitions for AI-powered goal analysis features
 */

/**
 * Suggested subgoal from AI analysis
 */
export interface SuggestedSubgoal {
  title: string;
  isMilestone: boolean;
}

/**
 * Clarified/improved goal suggestion from AI
 */
export interface ClarifiedGoal {
  title: string;
  description: string;
  rationale: string;
}

/**
 * AI-suggested category for a goal
 */
export interface CategorySuggestion {
  categoryId: string;
  categoryName: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

/**
 * Related goal detected by AI
 */
export interface RelatedGoal {
  goalId: string;
  goalTitle: string;
  relationship: 'duplicate' | 'dependency' | 'related';
  reason: string;
}

/**
 * Complete AI goal analysis result
 */
export interface AIGoalAnalysis {
  suggestedSubgoals: SuggestedSubgoal[];
  clarifiedGoal: ClarifiedGoal | null;
  suggestedCategory: CategorySuggestion | null;
  relatedGoals: RelatedGoal[];
}

/**
 * AI Log Entry - Records AI request/response for debugging
 */
export interface AILogEntry {
  /** Unique identifier */
  id: string;
  /** ISO timestamp when request was made */
  timestamp: string;
  /** Type of AI operation */
  type: 'goal_analysis' | 'reminder_suggestion';
  /** Request details */
  request: {
    /** The prompt sent to AI */
    prompt: string;
    /** Model ID used */
    model: string;
    /** Goal title if applicable */
    goalTitle?: string;
  };
  /** Response details */
  response: {
    /** Whether the request succeeded */
    success: boolean;
    /** Parsed response data */
    data?: unknown;
    /** Error message if failed */
    error?: string;
    /** Tokens consumed (if available) */
    tokensUsed?: number;
  };
  /** Request duration in milliseconds */
  durationMs: number;
}

/**
 * Options for querying AI logs
 */
export interface AILogQueryOptions {
  /** Maximum number of logs to return */
  limit?: number;
  /** Filter by success/error status */
  filter?: 'success' | 'error';
  /** Search in prompt or goal title */
  search?: string;
}
