import { createAudioPlayer, AudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AmbientSound } from '../types';

/**
 * Ambient sound file mappings
 * 
 * AUDIO FILE REQUIREMENTS:
 * Place the following audio files in assets/sounds/:
 * - ambient_rain.mp3 (looping rain/thunderstorm)
 * - ambient_forest.mp3 (forest with birds/nature)
 * - ambient_cafe.mp3 (coffee shop ambiance)
 * - ambient_waves.mp3 (ocean waves)
 * 
 * Recommended: 1-3 minute loops, ~1-2MB each, 128kbps MP3
 */
const SOUND_FILES: Record<Exclude<AmbientSound, 'none'>, any> = {
  rain: require('../../assets/sounds/ambient_rain.mp3'),
  forest: require('../../assets/sounds/ambient_forest.mp3'),
  cafe: require('../../assets/sounds/ambient_cafe.mp3'),
  waves: require('../../assets/sounds/ambient_waves.mp3'),
};

/**
 * Ambient Sound Service
 * Manages audio playback for focus sessions using expo-audio
 */
class AmbientSoundService {
  private player: AudioPlayer | null = null;
  private currentSound: AmbientSound = 'none';
  private isPlaying: boolean = false;
  private volume: number = 0.5;
  private isInitialized: boolean = false;

  /**
   * Initialize audio mode for background playback
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldRouteThroughEarpiece: false,
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio mode:', error);
    }
  }

  /**
   * Play ambient sound
   * @param sound - Sound type to play
   */
  async play(sound: AmbientSound): Promise<void> {
    console.log('[AmbientSoundService] play() called with:', sound);
    
    if (sound === 'none') {
      await this.stop();
      return;
    }

    try {
      // Ensure audio mode is initialized before playback
      await this.initialize();
      console.log('[AmbientSoundService] Audio mode initialized');
      
      // Stop current if different
      if (this.currentSound !== sound && this.player) {
        console.log('[AmbientSoundService] Stopping current sound:', this.currentSound);
        await this.stop();
      }

      // Load sound if not loaded or different
      if (!this.player || this.currentSound !== sound) {
        console.log('[AmbientSoundService] Creating new player for:', sound);
        const soundSource = SOUND_FILES[sound];
        console.log('[AmbientSoundService] Sound source:', soundSource);
        
        // Create AudioPlayer using the factory function
        this.player = createAudioPlayer(soundSource);
        console.log('[AmbientSoundService] Player created:', !!this.player);
        
        this.player.loop = true;
        this.player.volume = this.volume;
        console.log('[AmbientSoundService] Calling play()...');
        this.player.play();
        this.currentSound = sound;
        console.log('[AmbientSoundService] Play called successfully');
      } else {
        // Resume if paused
        console.log('[AmbientSoundService] Resuming existing player');
        this.player.play();
      }

      this.isPlaying = true;
    } catch (error) {
      console.error('[AmbientSoundService] Failed to play ambient sound:', error);
      throw error;
    }
  }

  /**
   * Play a short preview of a sound (for settings testing)
   * @param sound - Sound type to preview
   */
  async playPreview(sound: AmbientSound): Promise<void> {
    console.log('[AmbientSoundService] playPreview() called with:', sound);
    
    if (sound === 'none') {
      await this.stop();
      return;
    }

    try {
      await this.initialize();
      
      // Stop any current playback
      await this.stop();
      
      // Create a new player for the preview
      const soundSource = SOUND_FILES[sound];
      this.player = createAudioPlayer(soundSource);
      this.player.loop = false; // Don't loop for preview
      this.player.volume = this.volume;
      this.player.play();
      this.currentSound = sound;
      this.isPlaying = true;
      
      // Auto-stop after 3 seconds
      setTimeout(() => {
        if (this.currentSound === sound && this.isPlaying) {
          this.stop();
        }
      }, 3000);
      
    } catch (error) {
      console.error('[AmbientSoundService] Failed to play preview:', error);
    }
  }

  /**
   * Pause ambient sound
   */
  async pause(): Promise<void> {
    if (this.player && this.isPlaying) {
      try {
        this.player.pause();
        this.isPlaying = false;
      } catch (error) {
        console.error('Failed to pause ambient sound:', error);
      }
    }
  }

  /**
   * Resume ambient sound
   */
  async resume(): Promise<void> {
    if (this.player && !this.isPlaying) {
      try {
        this.player.play();
        this.isPlaying = true;
      } catch (error) {
        console.error('Failed to resume ambient sound:', error);
      }
    }
  }

  /**
   * Stop and release ambient sound player
   */
  async stop(): Promise<void> {
    if (this.player) {
      try {
        this.player.pause();
        this.player.release();
      } catch (error) {
        console.warn('Failed to stop ambient sound:', error);
      }
      this.player = null;
      this.currentSound = 'none';
      this.isPlaying = false;
    }
  }

  /**
   * Set volume level
   * @param volume - Volume level (0.0 to 1.0)
   */
  async setVolume(volume: number): Promise<void> {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.player) {
      try {
        this.player.volume = this.volume;
      } catch (error) {
        console.error('Failed to set volume:', error);
      }
    }
  }

  /**
   * Get current playback state
   */
  getState(): { isPlaying: boolean; currentSound: AmbientSound; volume: number } {
    return {
      isPlaying: this.isPlaying,
      currentSound: this.currentSound,
      volume: this.volume,
    };
  }

  /**
   * Check if a sound type is available
   */
  isSoundAvailable(sound: AmbientSound): boolean {
    if (sound === 'none') return true;
    try {
      // Check if require resolves
      return !!SOUND_FILES[sound];
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const ambientSoundService = new AmbientSoundService();
