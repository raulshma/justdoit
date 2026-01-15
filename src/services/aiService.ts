import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import { storageService } from './storageService';
import { aiLogService } from './aiLogService';
import type { AIGoalAnalysis, AIProviderMetadata, Category, Goal } from '../types';
import type { ParsedVoiceGoal } from '../types/voiceGoal';

/**
 * OpenRouter model architecture information
 */
export interface ModelArchitecture {
  modality: string; // e.g., "text->text", "text+image->text"
  tokenizer?: string;
  instruct_type?: string;
}

/**
 * OpenRouter model top provider information
 */
export interface TopProvider {
  max_completion_tokens?: number;
  is_moderated?: boolean;
}

/**
 * OpenRouter model information
 */
export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing: {
    prompt: string;
    completion: string;
    request?: string;
    image?: string;
  };
  created: number;
  context_length?: number;
  architecture?: ModelArchitecture;
  top_provider?: TopProvider;
  supported_parameters?: string[]; // e.g., ["tools", "vision", "response_format"]
}

/**
 * Grouped models by pricing tier
 */
export interface GroupedModels {
  free: OpenRouterModel[];
  paid: OpenRouterModel[];
}

/**
 * Smart reminder suggestion result
 */
export interface ReminderSuggestion {
  suggestedTime: string;
  rationale: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * AI Service Interface
 */
export interface IAIService {
  isConfigured(): boolean;
  fetchAvailableModels(): Promise<GroupedModels>;
  suggestOptimalReminderTime(
    goalTitle: string,
    goalDescription: string | undefined,
    completionPatterns: string
  ): Promise<ReminderSuggestion | null>;
  analyzeGoal(
    goalTitle: string,
    goalDescription: string | undefined,
    categories: Category[],
    existingGoals: Goal[]
  ): Promise<AIGoalAnalysis | null>;
  parseGoalFromVoice(
    transcript: string,
    categories: Category[]
  ): Promise<ParsedVoiceGoal | null>;
}

/**
 * AIService - Handles OpenRouter integration for AI-powered features
 */
export class AIService implements IAIService {
  private cachedModels: GroupedModels | null = null;
  private modelsCacheTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Check if AI service is configured with an API key
   */
  isConfigured(): boolean {
    const settings = storageService.getSettings();
    return !!settings.openRouterApiKey && settings.openRouterApiKey.trim().length > 0;
  }

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
   * Extract provider metadata from generateText response
   */
  private extractProviderMetadata(
    result: Awaited<ReturnType<typeof generateText>>,
    durationMs: number,
    modelId: string
  ): AIProviderMetadata {
    const metadata: AIProviderMetadata = {
      modelId,
    };

    // Extract usage information
    if (result.usage) {
      metadata.inputTokens = result.usage.inputTokens;
      metadata.outputTokens = result.usage.outputTokens;
      metadata.totalTokens = result.usage.totalTokens;
    }

    // Extract finish reason
    if (result.finishReason) {
      metadata.finishReason = result.finishReason;
    }

    // Extract response headers if available
    if (result.response?.headers) {
      const headers: Record<string, string> = {};
      // Convert headers to plain object
      if (typeof result.response.headers === 'object') {
        const headerObj = result.response.headers as Record<string, string>;
        for (const [key, value] of Object.entries(headerObj)) {
          if (typeof value === 'string') {
            headers[key] = value;
          }
        }
      }
      if (Object.keys(headers).length > 0) {
        metadata.headers = headers;
      }
    }

    // Extract raw provider metadata
    if (result.providerMetadata) {
      metadata.raw = result.providerMetadata as Record<string, unknown>;
    }

    // Calculate throughput (tokens per second)
    if (metadata.outputTokens && durationMs > 0) {
      metadata.tokensPerSecond = Math.round((metadata.outputTokens / durationMs) * 1000 * 100) / 100;
    }

    return metadata;
  }


  /**
   * Fetch available models from OpenRouter API
   * Groups by free/paid and sorts by creation date (newest first)
   */
  async fetchAvailableModels(): Promise<GroupedModels> {
    // Return cached if still valid
    if (this.cachedModels && Date.now() - this.modelsCacheTime < this.CACHE_DURATION) {
      return this.cachedModels;
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { free: [], paid: [] };
    }

    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      const models: OpenRouterModel[] = data.data || [];

      // Group by free/paid
      const free: OpenRouterModel[] = [];
      const paid: OpenRouterModel[] = [];

      for (const model of models) {
        const promptPrice = parseFloat(model.pricing?.prompt || '0');
        const completionPrice = parseFloat(model.pricing?.completion || '0');
        
        if (promptPrice === 0 && completionPrice === 0) {
          free.push(model);
        } else {
          paid.push(model);
        }
      }

      // Sort by created date (newest first)
      const sortByCreated = (a: OpenRouterModel, b: OpenRouterModel) => 
        (b.created || 0) - (a.created || 0);

      free.sort(sortByCreated);
      paid.sort(sortByCreated);

      this.cachedModels = { free, paid };
      this.modelsCacheTime = Date.now();

      return this.cachedModels;
    } catch (error) {
      console.error('Failed to fetch OpenRouter models:', error);
      return { free: [], paid: [] };
    }
  }

  /**
   * Parse a natural language voice command into a structured goal
   */
  async parseGoalFromVoice(
    transcript: string,
    categories: Category[]
  ): Promise<ParsedVoiceGoal | null> {
    const apiKey = this.getApiKey();
    if (!apiKey) return null;

    const startTime = Date.now();
    const modelId = this.getSelectedModel();
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });

    const categoryList = categories.map(c => `- ${c.name} (id: ${c.id})`).join('\n');

    const prompt = `You are a smart personal assistant parsing voice commands into goals.
Current Date: ${currentDate} (${currentDay})

Voice Command: "${transcript}"

Available Categories:
${categoryList}

Extract the intent and structured goal data.
If the user specifies a duration (e.g. "for 30 minutes"), extract 'duration' in minutes.
If the user specifies a time (e.g. "at 5pm"), extract 'reminderTime' if possible, or put it in description.
If the user says "tomorrow", calculate the date based on current date.

Respond ONLY with this JSON structure:
{
  "title": "Clear actionable title",
  "description": "Any additional details or original context",
  "dueDate": "YYYY-MM-DD" (or null if not specified),
  "duration": number (minutes, or null),
  "priority": "low" | "medium" | "high" (default medium),
  "categoryId": "best matching category id" (or null),
  "recurrence": "daily" | "weekly" | "none" (default none),
  "confidence": number (0-1, how confident you are)
}`;

    const requestBody = { model: modelId, prompt };

    try {
      const openrouter = createOpenRouter({ apiKey });
      const aiModel = openrouter(modelId);

      const generateResult = await generateText({
        model: aiModel,
        prompt,
      });

      const durationMs = Date.now() - startTime;
      const providerMetadata = this.extractProviderMetadata(generateResult, durationMs, modelId);
      
      const jsonMatch = generateResult.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
         throw new Error('Failed to parse JSON response');
      }

      const result = JSON.parse(jsonMatch[0]) as ParsedVoiceGoal;
      result.originalTranscript = transcript;

      aiLogService.log({
        type: 'voice_parsing',
        request: { prompt, model: modelId, body: requestBody },
        response: {
          success: true,
          data: result,
          rawText: generateResult.text,
        },
        providerMetadata,
        durationMs,
      });

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      console.error('Failed to parse voice command:', error);
      
      aiLogService.log({
        type: 'voice_parsing',
        request: { prompt, model: modelId, body: requestBody },
        response: {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        },
        durationMs,
      });

      return null;
    }
  }

  /**
   * Suggest optimal reminder time using AI based on completion patterns
   */
  async suggestOptimalReminderTime(
    goalTitle: string,
    goalDescription: string | undefined,
    completionPatterns: string
  ): Promise<ReminderSuggestion | null> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return null;
    }

    const startTime = Date.now();
    const modelId = this.getSelectedModel();

    const prompt = `You are an AI assistant helping users set optimal reminder times for their goals.

Based on the user's historical completion patterns and the goal details, suggest the best time to set a reminder.

Goal Title: ${goalTitle}
Goal Description: ${goalDescription || 'No description provided'}

User's Completion Patterns:
${completionPatterns}

Analyze the patterns and suggest:
1. A specific time (in HH:MM 24-hour format) that would be optimal for reminding about this goal
2. A brief rationale (1-2 sentences) explaining why this time is optimal
3. Your confidence level (high, medium, or low)

Respond in this exact JSON format:
{
  "suggestedTime": "HH:MM",
  "rationale": "Brief explanation",
  "confidence": "high|medium|low"
}`;

    const requestBody = { model: modelId, prompt };

    try {
      const openrouter = createOpenRouter({
        apiKey,
      });

      const model = openrouter(modelId);

      const generateResult = await generateText({
        model,
        prompt,
      });

      const durationMs = Date.now() - startTime;
      const providerMetadata = this.extractProviderMetadata(generateResult, durationMs, modelId);

      // Parse the JSON response
      const jsonMatch = generateResult.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Failed to parse AI response:', generateResult.text);
        
        // Log failed parse attempt with all available info
        aiLogService.log({
          type: 'reminder_suggestion',
          request: { prompt, model: modelId, goalTitle, body: requestBody },
          response: {
            success: false,
            rawText: generateResult.text,
            body: generateResult.response?.body,
            error: 'Failed to parse JSON response',
          },
          providerMetadata,
          durationMs,
        });
        return null;
      }

      const result = JSON.parse(jsonMatch[0]);

      // Log successful request with comprehensive info
      aiLogService.log({
        type: 'reminder_suggestion',
        request: { prompt, model: modelId, goalTitle, body: requestBody },
        response: {
          success: true,
          data: result,
          rawText: generateResult.text,
          body: generateResult.response?.body,
        },
        providerMetadata,
        durationMs,
      });

      return {
        suggestedTime: result.suggestedTime,
        rationale: result.rationale,
        confidence: result.confidence as 'high' | 'medium' | 'low',
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failed request
      aiLogService.log({
        type: 'reminder_suggestion',
        request: { prompt, model: modelId, goalTitle, body: requestBody },
        response: {
          success: false,
          error: errorMessage,
        },
        durationMs,
      });

      console.error('Failed to get AI suggestion:', error);
      return null;
    }
  }

  /**
   * Clear the models cache
   */
  clearCache(): void {
    this.cachedModels = null;
    this.modelsCacheTime = 0;
  }

  /**
   * Analyze a goal using AI to suggest subgoals, clarity improvements, category, and related goals
   */
  async analyzeGoal(
    goalTitle: string,
    goalDescription: string | undefined,
    categories: Category[],
    existingGoals: Goal[]
  ): Promise<AIGoalAnalysis | null> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return null;
    }

    const startTime = Date.now();
    const modelId = this.getSelectedModel();

    // Build category list for the prompt
    const categoryList = categories.map(c => `- ${c.id}: ${c.name}`).join('\n');

    // Build existing goals list (limit to 50 most recent to avoid token overflow)
    const recentGoals = existingGoals.slice(0, 50);
    const goalsList = recentGoals.map(g => `- [${g.id}] ${g.title}`).join('\n');

    const prompt = `You are an AI assistant helping users break down and improve their goals.

Analyze this goal and provide:
1. 3-5 suggested subgoals/steps to accomplish it (mark key milestones)
2. If the goal is vague, suggest a clearer, more actionable version
3. Suggest the best matching category from the available list
4. Identify any related or potentially duplicate goals from the user's existing goals

Goal Title: ${goalTitle}
Goal Description: ${goalDescription || 'No description provided'}

Available Categories:
${categoryList}

User's Existing Goals:
${goalsList || 'No existing goals'}

Respond ONLY with this exact JSON format (no markdown, no extra text):
{
  "suggestedSubgoals": [
    { "title": "Step description", "isMilestone": false },
    { "title": "Key milestone step", "isMilestone": true }
  ],
  "clarifiedGoal": {
    "title": "Clearer goal title",
    "description": "Improved description",
    "rationale": "Why this is clearer"
  },
  "suggestedCategory": {
    "categoryId": "category-id",
    "categoryName": "Category Name",
    "confidence": "high|medium|low",
    "reason": "Why this category fits"
  },
  "relatedGoals": [
    {
      "goalId": "existing-goal-id",
      "goalTitle": "Existing goal title",
      "relationship": "duplicate|dependency|related",
      "reason": "Why it's related"
    }
  ]
}

If the goal is already clear, set clarifiedGoal to null.
If no related goals exist, set relatedGoals to empty array [].
Always suggest at least 3 subgoals.`;

    const requestBody = { model: modelId, prompt };

    try {
      const openrouter = createOpenRouter({ apiKey });
      const aiModel = openrouter(modelId);

      const generateResult = await generateText({
        model: aiModel,
        prompt,
      });

      const durationMs = Date.now() - startTime;
      const providerMetadata = this.extractProviderMetadata(generateResult, durationMs, modelId);

      // Parse the JSON response
      const jsonMatch = generateResult.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        aiLogService.log({
          type: 'goal_analysis',
          request: { prompt, model: modelId, goalTitle, body: requestBody },
          response: {
            success: false,
            rawText: generateResult.text,
            body: generateResult.response?.body,
            error: 'Failed to parse JSON response',
          },
          providerMetadata,
          durationMs,
        });
        return null;
      }

      const result = JSON.parse(jsonMatch[0]) as AIGoalAnalysis;

      // Log successful request with comprehensive info
      aiLogService.log({
        type: 'goal_analysis',
        request: { prompt, model: modelId, goalTitle, body: requestBody },
        response: {
          success: true,
          data: result,
          rawText: generateResult.text,
          body: generateResult.response?.body,
        },
        providerMetadata,
        durationMs,
      });

      return result;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failed request
      aiLogService.log({
        type: 'goal_analysis',
        request: { prompt, model: modelId, goalTitle, body: requestBody },
        response: {
          success: false,
          error: errorMessage,
        },
        durationMs,
      });

      console.error('Failed to analyze goal:', error);
      return null;
    }
  }
}

// Export singleton instance for app-wide use
export const aiService = new AIService();
