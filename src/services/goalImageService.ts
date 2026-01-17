import { File, Directory, Paths } from 'expo-file-system';
import { randomUUID } from 'expo-crypto';
import { GoalImage, GoalImageType } from '../types';

// Image limits per type
export const IMAGE_LIMITS: Record<GoalImageType, number> = {
  cover: 1,
  progress: 12,
  mood: 6,
  vision: 9,
};

/**
 * Service to manage goal image files
 */
class GoalImageService {
  private readonly IMAGES_DIR_NAME = 'goal_images';
  private imagesDir: Directory;

  constructor() {
    this.imagesDir = new Directory(Paths.document, this.IMAGES_DIR_NAME);
    this.ensureDirectoryExists();
  }

  /**
   * Ensure images directory exists
   */
  private async ensureDirectoryExists() {
    if (!this.imagesDir.exists) {
      await this.imagesDir.create();
    }
  }

  /**
   * Save a picked image to permanent storage
   * @param tempUri - URI of the temporary image
   * @param goalId - ID of the goal
   * @param type - Type of goal image
   * @param caption - Optional caption
   * @returns The GoalImage metadata
   */
  async saveGoalImage(
    tempUri: string,
    goalId: string,
    type: GoalImageType,
    caption?: string
  ): Promise<GoalImage> {
    await this.ensureDirectoryExists();

    const imageId = randomUUID();
    const extension = this.getExtension(tempUri);
    const fileName = `${goalId}_${type}_${imageId}${extension}`;
    
    const tempFile = new File(tempUri);
    const newFile = new File(this.imagesDir, fileName);

    await tempFile.copy(newFile);

    const goalImage: GoalImage = {
      id: imageId,
      uri: newFile.uri,
      type,
      createdAt: new Date().toISOString(),
      caption,
      order: type === 'vision' ? 0 : undefined,
    };

    return goalImage;
  }

  /**
   * Delete a single goal image
   * @param image - The GoalImage to delete
   */
  async deleteGoalImage(image: GoalImage): Promise<void> {
    if (!image?.uri) return;

    try {
      const file = new File(image.uri);
      if (file.exists) {
        await file.delete();
      }
    } catch (error) {
      console.warn('Failed to delete goal image:', error);
    }
  }

  /**
   * Delete a cover image by URI
   * @param uri - The image URI to delete
   */
  async deleteCoverImage(uri: string): Promise<void> {
    if (!uri) return;

    try {
      const file = new File(uri);
      if (file.exists) {
        await file.delete();
      }
    } catch (error) {
      console.warn('Failed to delete cover image:', error);
    }
  }

  /**
   * Delete all images for a goal
   * @param goalId - ID of the goal
   * @param coverImage - Cover image URI if any
   * @param progressPhotos - Progress photos array if any
   * @param moodBoardImages - Mood board images if any
   * @param visionBoardImages - Vision board images if any
   */
  async deleteAllGoalImages(
    goalId: string,
    coverImage?: string,
    progressPhotos?: GoalImage[],
    moodBoardImages?: GoalImage[],
    visionBoardImages?: GoalImage[]
  ): Promise<void> {
    // Delete cover image
    if (coverImage) {
      await this.deleteCoverImage(coverImage);
    }

    // Delete progress photos
    if (progressPhotos) {
      for (const photo of progressPhotos) {
        await this.deleteGoalImage(photo);
      }
    }

    // Delete mood board images
    if (moodBoardImages) {
      for (const image of moodBoardImages) {
        await this.deleteGoalImage(image);
      }
    }

    // Delete vision board images
    if (visionBoardImages) {
      for (const image of visionBoardImages) {
        await this.deleteGoalImage(image);
      }
    }
  }

  /**
   * Check if adding more images would exceed the limit
   * @param currentCount - Current number of images
   * @param type - Image type
   * @returns true if limit would be exceeded
   */
  wouldExceedLimit(currentCount: number, type: GoalImageType): boolean {
    return currentCount >= IMAGE_LIMITS[type];
  }

  /**
   * Get remaining slots for an image type
   * @param currentCount - Current number of images
   * @param type - Image type
   */
  getRemainingSlots(currentCount: number, type: GoalImageType): number {
    return Math.max(0, IMAGE_LIMITS[type] - currentCount);
  }

  /**
   * Get file extension from URI
   */
  private getExtension(uri: string): string {
    const match = uri.match(/\.([a-zA-Z0-9]+)$/);
    return match ? `.${match[1]}` : '.jpg';
  }

  /**
   * Get the images directory path
   */
  getImagesDirectory(): string {
    return this.imagesDir.uri;
  }
}

export const goalImageService = new GoalImageService();
