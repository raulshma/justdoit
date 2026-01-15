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
 * Token usage breakdown details
 */
export interface TokenUsageDetails {
  /** Number of text tokens */
  textTokens?: number;
  /** Number of reasoning tokens */
  reasoningTokens?: number;
  /** Number of cached input tokens */
  cachedInputTokens?: number;
  /** Number of non-cached input tokens */
  noCacheTokens?: number;
  /** Number of cache read tokens */
  cacheReadTokens?: number;
  /** Number of cache write tokens */
  cacheWriteTokens?: number;
}

/**
 * Provider metadata containing usage and model information
 */
export interface AIProviderMetadata {
  /** Input/prompt tokens used */
  inputTokens?: number;
  /** Output/completion tokens generated */
  outputTokens?: number;
  /** Total tokens used (input + output) */
  totalTokens?: number;
  /** Detailed token breakdown */
  tokenDetails?: TokenUsageDetails;
  /** Reason for completion (stop, length, etc.) */
  finishReason?: string;
  /** Model ID used */
  modelId?: string;
  /** Raw provider-specific metadata */
  raw?: Record<string, unknown>;
  /** Response headers from provider */
  headers?: Record<string, string>;
  /** Estimated cost in USD (if pricing available) */
  estimatedCost?: number;
  /** Tokens per second throughput */
  tokensPerSecond?: number;
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
    /** Full request body/payload sent */
    body?: Record<string, unknown>;
  };
  /** Response details */
  response: {
    /** Whether the request succeeded */
    success: boolean;
    /** Parsed response data */
    data?: unknown;
    /** Raw text response from AI */
    rawText?: string;
    /** Full response body from provider */
    body?: unknown;
    /** Error message if failed */
    error?: string;
    /** HTTP status code if available */
    statusCode?: number;
  };
  /** Provider metadata (tokens, throughput, pricing, etc.) */
  providerMetadata?: AIProviderMetadata;
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
