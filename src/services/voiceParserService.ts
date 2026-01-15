import { aiService } from './aiService';
import { categoryManager } from './categoryManager';
import { ParsedVoiceGoal } from '../types/voiceGoal';

/**
 * Service to parse voice commands into structured goals
 */
class VoiceParserService {
  /**
   * Parse a voice command into a goal structure
   * @param transcript - The spoken text
   * @returns Parsed goal or null if parsing failed
   */
  async parseVoiceCommand(transcript: string): Promise<ParsedVoiceGoal | null> {
    // 1. Check if AI is available
    if (aiService.isConfigured()) {
      const categories = categoryManager.getCategories();
      return await aiService.parseGoalFromVoice(transcript, categories);
    }

    // 2. Fallback if AI is not configured
    // Just use the transcript as the title
    return {
      title: transcript,
      confidence: 1.0,
      originalTranscript: transcript,
      dueDate: new Date().toISOString().split('T')[0], // Default to today
      priority: 'medium',
      recurrence: 'none',
      // No description, duration, or smart category
    };
  }
}

export const voiceParserService = new VoiceParserService();
