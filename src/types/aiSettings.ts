/**
 * AI Settings Types - Types for AI configuration, focus areas, and analytics
 */

import type { AIFocusArea } from './settings';

/**
 * Focus area display information
 */
export interface AIFocusAreaInfo {
  id: AIFocusArea;
  name: string;
  icon: string;
  description: string;
}

/**
 * Predefined focus areas with display info
 */
export const AI_FOCUS_AREAS: AIFocusAreaInfo[] = [
  { id: 'productivity', name: 'Productivity', icon: 'briefcase-outline', description: 'Work and task efficiency' },
  { id: 'health', name: 'Health', icon: 'heart-outline', description: 'Physical fitness and nutrition' },
  { id: 'learning', name: 'Learning', icon: 'book-outline', description: 'Education and skill development' },
  { id: 'wellness', name: 'Wellness', icon: 'meditation', description: 'Mental health and balance' },
  { id: 'creativity', name: 'Creativity', icon: 'palette-outline', description: 'Art, music, and creative projects' },
  { id: 'finance', name: 'Finance', icon: 'cash-outline', description: 'Budgeting and financial goals' },
];

/**
 * Personality trait derived from usage patterns
 */
export interface AIPersonalityTrait {
  id: string;
  name: string;
  icon: string;
  description: string;
  /** Strength of the trait (0-100) */
  strength: number;
}

/**
 * AI usage statistics
 */
export interface AIUsageStats {
  /** Total number of AI requests made */
  totalRequests: number;
  /** Total successful requests */
  successfulRequests: number;
  /** Total input tokens used */
  inputTokens: number;
  /** Total output tokens generated */
  outputTokens: number;
  /** Estimated cost in USD */
  estimatedCost: number;
  /** Average response time in ms */
  averageResponseTime: number;
  /** Requests by type */
  requestsByType: {
    goal_analysis: number;
    reminder_suggestion: number;
  };
}

/**
 * PII pattern for anonymization
 */
export interface PIIPattern {
  name: string;
  pattern: RegExp;
  replacement: string;
}

/**
 * Default PII patterns for common sensitive data
 */
export const DEFAULT_PII_PATTERNS: PIIPattern[] = [
  { name: 'email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL]' },
  { name: 'phone', pattern: /(\+?1?[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, replacement: '[PHONE]' },
  { name: 'ssn', pattern: /\d{3}[-.\s]?\d{2}[-.\s]?\d{4}/g, replacement: '[SSN]' },
  { name: 'creditCard', pattern: /\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}/g, replacement: '[CARD]' },
  { name: 'ipAddress', pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '[IP]' },
  { name: 'date', pattern: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g, replacement: '[DATE]' },
];

/**
 * Improvement suggestion from AI analyzer
 */
export interface AIImprovement {
  id: string;
  category: 'pattern' | 'efficiency' | 'balance' | 'focus';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: string;
}
