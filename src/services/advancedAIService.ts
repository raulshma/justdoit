/**
 * Advanced AI Service - Provides AI-powered features including:
 * - AI Goal Coach (conversational goal-setting)
 * - Smart Rescheduling (AI suggests rescheduling overdue goals)
 * - Pattern Detection (AI identifies productivity patterns)
 * - Goal Breakdown (AI generates subgoals for complex goals)
 * - Motivational AI (personalized motivational messages)
 * - Predictive Completion (predicts goal completion likelihood)
 */

import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import { storageService } from './storageService';
import { aiLogService } from './aiLogService';
import { completionPatternService } from './completionPatternService';
import { statisticsService } from './statisticsService';
import type { Goal, Category } from '../types';
import type {
  CoachMessage,
  CoachConversation,
  GoalSuggestion,
  RescheduleSuggestion,
  PatternInsight,
  PatternInsightType,
  AIGeneratedSubgoal,
  GoalBreakdown,
  MotivationalMessage,
  MotivationalMessageType,
  MotivationContext,
  CompletionPrediction,
  PredictionFactor,
} from '../types/advancedAITypes';

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current time of day
 */
function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Advanced AI Service Interface
 */
export interface IAdvancedAIService {
  // AI Goal Coach
  startCoachConversation(context?: string): Promise<CoachMessage | null>;
  continueCoachConversation(
    messages: CoachMessage[],
    userMessage: string,
    categories: Category[]
  ): Promise<CoachMessage | null>;
  
  // Smart Rescheduling
  suggestReschedules(overdueGoals: Goal[]): Promise<RescheduleSuggestion[]>;
  
  // Pattern Detection
  detectPatterns(): Promise<PatternInsight[]>;
  
  // Goal Breakdown
  breakdownGoal(goal: Goal, categories: Category[]): Promise<GoalBreakdown | null>;
  
  // Motivational AI
  generateMotivation(context: MotivationContext): Promise<MotivationalMessage | null>;
  
  // Predictive Completion
  predictCompletion(goal: Goal): Promise<CompletionPrediction | null>;
}

/**
 * AdvancedAIService - Handles advanced AI-powered features via OpenRouter
 */
class AdvancedAIService implements IAdvancedAIService {
  /**
   * Get the configured API key
   */
  private getApiKey(): string | null {
    const settings = storageService.getSettings();
    return settings.openRouterApiKey || null;
  }

  /**
   * Get the selected model ID
   */
  private getSelectedModel(): string {
    const settings = storageService.getSettings();
    return settings.selectedAiModel || 'meta-llama/llama-3.3-70b-instruct:free';
  }

  /**
   * Check if AI is configured
   */
  private isConfigured(): boolean {
    const apiKey = this.getApiKey();
    return !!apiKey && apiKey.trim().length > 0;
  }

  /**
   * Make an AI request and log it
   */
  private async makeAIRequest<T>(
    type: string,
    prompt: string,
    context?: Record<string, unknown>
  ): Promise<{ result: T | null; rawText: string }> {
    if (!this.isConfigured()) {
      return { result: null, rawText: '' };
    }

    const startTime = Date.now();
    const modelId = this.getSelectedModel();
    const apiKey = this.getApiKey()!;

    try {
      const openrouter = createOpenRouter({ apiKey });
      const model = openrouter(modelId);

      const generateResult = await generateText({
        model,
        prompt,
      });

      const durationMs = Date.now() - startTime;
      const rawText = generateResult.text;

      // Parse JSON from response
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        aiLogService.log({
          type: type as 'goal_analysis',
          request: { prompt, model: modelId, ...context },
          response: { success: false, rawText, error: 'Failed to parse JSON' },
          durationMs,
        });
        return { result: null, rawText };
      }

      const result = JSON.parse(jsonMatch[0]) as T;

      aiLogService.log({
        type: type as 'goal_analysis',
        request: { prompt, model: modelId, ...context },
        response: { success: true, data: result, rawText },
        durationMs,
      });

      return { result, rawText };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      
      aiLogService.log({
        type: type as 'goal_analysis',
        request: { prompt, model: modelId, ...context },
        response: {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        },
        durationMs,
      });

      return { result: null, rawText: '' };
    }
  }

  // ==========================================================================
  // AI Goal Coach
  // ==========================================================================

  /**
   * Start a new coach conversation
   */
  async startCoachConversation(context?: string): Promise<CoachMessage | null> {
    const prompt = `You are an AI Goal Coach helping users set effective, achievable goals.
Your role is to have a friendly, supportive conversation to help the user:
1. Clarify what they want to achieve
2. Make their goals specific and measurable
3. Set realistic timelines
4. Break down large goals if needed

${context ? `Context: ${context}` : ''}

Start with a warm, engaging greeting and ask an open-ended question to understand what the user wants to accomplish.
Keep your response concise (2-3 sentences max).

Respond with this JSON format:
{
  "message": "Your coaching message here",
  "suggestions": []
}`;

    const { result } = await this.makeAIRequest<{
      message: string;
      suggestions?: GoalSuggestion[];
    }>('goal_coach', prompt);

    if (!result) return null;

    return {
      id: generateId(),
      role: 'assistant',
      content: result.message,
      timestamp: new Date().toISOString(),
      suggestions: result.suggestions,
    };
  }

  /**
   * Continue a coach conversation
   */
  async continueCoachConversation(
    messages: CoachMessage[],
    userMessage: string,
    categories: Category[]
  ): Promise<CoachMessage | null> {
    const conversationHistory = messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`)
      .join('\n');

    const categoryList = categories.map((c) => `- ${c.name} (id: ${c.id})`).join('\n');
    const currentDate = new Date().toISOString().split('T')[0];

    const prompt = `You are an AI Goal Coach having an ongoing conversation to help set effective goals.

Previous conversation:
${conversationHistory}

User's new message: "${userMessage}"

Available categories:
${categoryList}

Current date: ${currentDate}

Continue the coaching conversation. If you can now suggest a concrete goal based on the conversation, include it in the suggestions array.
Keep your response concise and actionable.

Respond with this JSON format:
{
  "message": "Your coaching response",
  "suggestions": [
    {
      "title": "Specific goal title",
      "description": "Optional description",
      "priority": "medium",
      "categoryId": "matching-category-id",
      "dueDate": "YYYY-MM-DD"
    }
  ]
}

Only include suggestions when you have enough information to create a specific, actionable goal.`;

    const { result } = await this.makeAIRequest<{
      message: string;
      suggestions?: GoalSuggestion[];
    }>('goal_coach', prompt, { userMessage });

    if (!result) return null;

    return {
      id: generateId(),
      role: 'assistant',
      content: result.message,
      timestamp: new Date().toISOString(),
      suggestions: result.suggestions,
    };
  }

  // ==========================================================================
  // Smart Rescheduling
  // ==========================================================================

  /**
   * Generate reschedule suggestions for overdue goals
   */
  async suggestReschedules(overdueGoals: Goal[]): Promise<RescheduleSuggestion[]> {
    if (overdueGoals.length === 0) return [];

    const patterns = completionPatternService.formatPatternsForAI();
    const insights = completionPatternService.getPeakProductivityTimes();
    const currentDate = new Date().toISOString().split('T')[0];

    const goalsList = overdueGoals
      .map((g) => {
        const daysOverdue = Math.floor(
          (new Date().getTime() - new Date(g.dueDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        return `- "${g.title}" (id: ${g.id}, due: ${g.dueDate}, ${daysOverdue} days overdue, priority: ${g.priority})`;
      })
      .join('\n');

    const prompt = `You are an AI assistant helping reschedule overdue goals based on user patterns.

Overdue Goals:
${goalsList}

User's Completion Patterns:
${patterns}

Peak productivity hours: ${insights.peakHours.join(', ')}:00
Peak productivity days: ${insights.peakDays.map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}

Current Date: ${currentDate}

For each overdue goal, suggest an optimal new date and time based on:
1. The user's productivity patterns
2. The goal's priority
3. Reasonable spacing (don't overload a single day)

Respond with this JSON format:
{
  "suggestions": [
    {
      "goalId": "goal-id",
      "goalTitle": "Goal title",
      "currentDueDate": "original-date",
      "suggestedDueDate": "YYYY-MM-DD",
      "suggestedTime": "HH:MM",
      "rationale": "Why this date/time is optimal",
      "confidence": "high|medium|low",
      "daysOverdue": number
    }
  ]
}`;

    const { result } = await this.makeAIRequest<{
      suggestions: RescheduleSuggestion[];
    }>('reschedule_suggestion', prompt);

    return result?.suggestions || [];
  }

  // ==========================================================================
  // Pattern Detection
  // ==========================================================================

  /**
   * Detect productivity patterns and generate insights
   */
  async detectPatterns(): Promise<PatternInsight[]> {
    const goals = storageService.getAllGoals();
    const stats = statisticsService.calculateTodayStats();
    const patterns = completionPatternService.formatPatternsForAI();
    const insights = completionPatternService.getPeakProductivityTimes();
    const streak = statisticsService.calculateStreak();
    const completionRate = statisticsService.calculateWeeklyCompletionRate();

    const prompt = `You are an AI assistant analyzing user productivity patterns to provide actionable insights.

User Statistics:
- Current streak: ${streak} days
- Weekly completion rate: ${completionRate}%
- Today completed: ${stats.todayCompleted}/${stats.todayTotal} goals
- Total goals tracked: ${goals.length}

Completion Patterns:
${patterns}

Low performance hours: ${insights.lowPerformanceHours.join(', ')}:00
Low performance days: ${insights.lowPerformanceDays.map((d) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]).join(', ')}

Analyze this data and identify 2-4 actionable insights. Focus on:
1. Streak risks (if any)
2. Low-performance day patterns (e.g., "You often skip Monday goals")
3. Optimal scheduling recommendations
4. Workload balance suggestions

Respond with this JSON format:
{
  "insights": [
    {
      "type": "low_performance_day|streak_risk|peak_productivity|category_imbalance|workload_warning",
      "title": "Short insight title",
      "message": "Detailed explanation of the pattern",
      "actionable": "Specific recommendation to improve",
      "priority": "high|medium|low"
    }
  ]
}`;

    const { result } = await this.makeAIRequest<{
      insights: Array<{
        type: PatternInsightType;
        title: string;
        message: string;
        actionable: string;
        priority: 'high' | 'medium' | 'low';
      }>;
    }>('pattern_insight', prompt);

    if (!result?.insights) return [];

    return result.insights.map((insight) => ({
      ...insight,
      id: generateId(),
      generatedAt: new Date().toISOString(),
    }));
  }

  // ==========================================================================
  // Goal Breakdown
  // ==========================================================================

  /**
   * Break down a complex goal into subgoals
   */
  async breakdownGoal(goal: Goal, categories: Category[]): Promise<GoalBreakdown | null> {
    const currentDate = new Date().toISOString().split('T')[0];
    const dueDate = goal.dueDate;
    const daysUntilDue = Math.floor(
      (new Date(dueDate).getTime() - new Date(currentDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    const categoryName = categories.find((c) => c.id === goal.categoryId)?.name || 'Uncategorized';

    const prompt = `You are an AI assistant helping break down complex goals into manageable subgoals.

Goal: "${goal.title}"
Description: ${goal.description || 'No description'}
Category: ${categoryName}
Priority: ${goal.priority}
Due Date: ${dueDate} (${daysUntilDue} days from now)
Current Date: ${currentDate}

Break this goal into 3-6 actionable subgoals. For each subgoal:
1. Make it specific and actionable
2. Estimate time required (in minutes)
3. Suggest order of completion
4. Mark key milestones
5. Calculate due date offset from parent goal (in days)

Respond with this JSON format:
{
  "subgoals": [
    {
      "title": "Specific subgoal title",
      "description": "Brief description",
      "estimatedDuration": 30,
      "order": 1,
      "isMilestone": false,
      "dueDateOffset": -7
    }
  ],
  "totalEstimatedDuration": 180,
  "explanation": "Brief explanation of the breakdown approach",
  "confidence": "high|medium|low"
}`;

    const { result } = await this.makeAIRequest<{
      subgoals: AIGeneratedSubgoal[];
      totalEstimatedDuration?: number;
      explanation: string;
      confidence: 'high' | 'medium' | 'low';
    }>('goal_breakdown', prompt, { goalId: goal.id, goalTitle: goal.title });

    if (!result) return null;

    return {
      goalId: goal.id,
      goalTitle: goal.title,
      subgoals: result.subgoals,
      totalEstimatedDuration: result.totalEstimatedDuration,
      explanation: result.explanation,
      confidence: result.confidence,
    };
  }

  // ==========================================================================
  // Motivational AI
  // ==========================================================================

  /**
   * Generate a personalized motivational message
   */
  async generateMotivation(context: MotivationContext): Promise<MotivationalMessage | null> {
    const prompt = `You are an AI motivational coach generating personalized encouragement.

User Context:
- Current streak: ${context.streakDays} days
- Completed today: ${context.todayCompleted} goals
- Remaining today: ${context.todayRemaining} goals
- Recent completion rate: ${context.recentCompletionRate}%
- Days since last completion: ${context.daysSinceLastCompletion}
- Time of day: ${context.timeOfDay}
${context.dominantCategory ? `- Main focus area: ${context.dominantCategory}` : ''}
${context.specialOccasion ? `- Special occasion: ${context.specialOccasion}` : ''}

Generate a short, personalized motivational message (1-2 sentences max).
Choose an appropriate message type and include a relevant emoji.

Message types:
- encouragement: General positive reinforcement
- celebration: For achievements and milestones
- comeback: After missed days (daysSinceLastCompletion > 0)
- streak: Streak-related motivation
- milestone: Personal best celebration
- morning/evening: Time-specific motivation

Respond with this JSON format:
{
  "type": "encouragement|celebration|comeback|streak|milestone|morning|evening",
  "message": "Your motivational message",
  "emoji": "🎯",
  "context": "Brief note on why this message was chosen"
}`;

    const { result } = await this.makeAIRequest<{
      type: MotivationalMessageType;
      message: string;
      emoji: string;
      context?: string;
    }>('motivational', prompt);

    if (!result) return null;

    return {
      id: generateId(),
      type: result.type,
      message: result.message,
      emoji: result.emoji,
      generatedAt: new Date().toISOString(),
      context: result.context,
      shown: false,
    };
  }

  // ==========================================================================
  // Predictive Completion
  // ==========================================================================

  /**
   * Predict the likelihood of completing a goal
   */
  async predictCompletion(goal: Goal): Promise<CompletionPrediction | null> {
    const goals = storageService.getAllGoals();
    const patterns = completionPatternService.formatPatternsForAI();
    const streak = statisticsService.calculateStreak();
    
    // Calculate category-specific completion rate
    const categoryGoals = goals.filter((g) => g.categoryId === goal.categoryId);
    const categoryCompleted = categoryGoals.filter((g) => g.isCompleted).length;
    const categoryRate = categoryGoals.length > 0
      ? Math.round((categoryCompleted / categoryGoals.length) * 100)
      : 50;

    // Calculate priority-specific completion rate
    const priorityGoals = goals.filter((g) => g.priority === goal.priority);
    const priorityCompleted = priorityGoals.filter((g) => g.isCompleted).length;
    const priorityRate = priorityGoals.length > 0
      ? Math.round((priorityCompleted / priorityGoals.length) * 100)
      : 50;

    const dueDate = new Date(goal.dueDate);
    const dayOfWeek = dueDate.getDay();
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];

    const prompt = `You are an AI assistant predicting goal completion likelihood based on historical data.

Goal to Predict:
- Title: "${goal.title}"
- Priority: ${goal.priority}
- Due: ${goal.dueDate} (${dayName})
- Has description: ${!!goal.description}
- Subgoals count: ${goal.subgoals?.length || 0}

Historical Data:
- Current streak: ${streak} days
- Category completion rate: ${categoryRate}%
- Priority (${goal.priority}) completion rate: ${priorityRate}%
- Total goals: ${goals.length}

Completion Patterns:
${patterns}

Analyze these factors and predict the completion probability.
Consider: day of week patterns, priority, complexity (subgoals), and historical rates.

Respond with this JSON format:
{
  "probability": 75,
  "confidence": "high|medium|low",
  "factors": [
    {
      "name": "Factor name",
      "impact": 10,
      "explanation": "How this affects the prediction"
    }
  ],
  "suggestedActions": ["Optional: suggestions to improve chances"]
}`;

    const { result } = await this.makeAIRequest<{
      probability: number;
      confidence: 'high' | 'medium' | 'low';
      factors: PredictionFactor[];
      suggestedActions?: string[];
    }>('prediction', prompt, { goalId: goal.id, goalTitle: goal.title });

    if (!result) return null;

    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    return {
      goalId: goal.id,
      probability: Math.max(0, Math.min(100, result.probability)),
      confidence: result.confidence,
      factors: result.factors,
      suggestedActions: result.suggestedActions,
      calculatedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Build motivation context from current user data
   */
  buildMotivationContext(): MotivationContext {
    const stats = statisticsService.calculateTodayStats();
    const streak = statisticsService.calculateStreak();
    const goals = storageService.getAllGoals();
    const completionRate = statisticsService.calculateWeeklyCompletionRate();

    // Find dominant category
    const categoryCounts: Record<string, number> = {};
    for (const goal of goals) {
      if (goal.categoryId) {
        categoryCounts[goal.categoryId] = (categoryCounts[goal.categoryId] || 0) + 1;
      }
    }
    const dominantCategory = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    // Calculate days since last completion
    const completedGoals = goals
      .filter((g) => g.isCompleted && g.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
    
    const lastCompletion = completedGoals[0]?.completedAt;
    const daysSinceLastCompletion = lastCompletion
      ? Math.floor((Date.now() - new Date(lastCompletion).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      streakDays: streak,
      todayCompleted: stats.todayCompleted,
      todayRemaining: stats.todayTotal - stats.todayCompleted,
      recentCompletionRate: completionRate,
      daysSinceLastCompletion,
      dominantCategory,
      timeOfDay: getTimeOfDay(),
    };
  }
}

// Export singleton instance
export const advancedAIService = new AdvancedAIService();

// Export class for testing
export { AdvancedAIService };
