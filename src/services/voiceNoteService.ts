import { File, Directory, Paths } from 'expo-file-system';
import { randomUUID } from 'expo-crypto';

/**
 * Service to manage voice note files
 */
class VoiceNoteService {
  private readonly VOICE_NOTES_DIR_NAME = 'voice_notes';
  private voiceNotesDir: Directory;

  constructor() {
    this.voiceNotesDir = new Directory(Paths.document, this.VOICE_NOTES_DIR_NAME);
    this.ensureDirectoryExists();
  }

  /**
   * Ensure voice notes directory exists
   */
  private async ensureDirectoryExists() {
    if (!this.voiceNotesDir.exists) {
      await this.voiceNotesDir.create();
    }
  }

  /**
   * Save a temporary voice recording to permanent storage
   * @param tempUri - URI of the temporary recording
   * @param goalId - ID of the goal (used for filename)
   * @returns The new permanent URI
   */
  async saveVoiceNote(tempUri: string, goalId: string): Promise<string> {
    await this.ensureDirectoryExists();
    
    const fileName = `${goalId}_${Date.now()}.m4a`;
    const tempFile = new File(tempUri);
    const newFile = new File(this.voiceNotesDir, fileName);
    
    await tempFile.copy(newFile);
    
    return newFile.uri;
  }

  /**
   * Delete a voice note file
   * @param uri - URI of the voice note to delete
   */
  async deleteVoiceNote(uri: string): Promise<void> {
    if (!uri) return;
    
    try {
      const file = new File(uri);
      if (file.exists) {
        await file.delete();
      }
    } catch (error) {
      console.warn('Failed to delete voice note:', error);
    }
  }

  /**
   * Get the voice notes directory path
   */
  getVoiceNotesDirectory(): string {
    return this.voiceNotesDir.uri;
  }
}

export const voiceNoteService = new VoiceNoteService();
