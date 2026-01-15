/**
 * Convex Sync Service - Handles cloud backup and restore via Convex
 * 
 * Best Practices Applied:
 * - Proper error handling with ConvexError
 * - Timeout handling for network requests
 * - Retry logic with exponential backoff
 * - Token hashing for security
 * - Size validation before upload
 */
import { ConvexHttpClient } from 'convex/browser';
import { ConvexError } from 'convex/values';
import { backupService, BackupData } from './backupService';
import { storageService } from './storageService';
import * as Crypto from 'expo-crypto';

/**
 * Result type for sync operations
 */
export interface SyncResult {
  success: boolean;
  error?: string;
  lastSyncedAt?: number;
}

/**
 * Convex Sync Service Interface
 */
export interface IConvexSyncService {
  isConfigured(): boolean;
  syncToCloud(): Promise<SyncResult>;
  syncFromCloud(): Promise<SyncResult>;
}

// Constants
const MAX_BACKUP_SIZE_MB = 10; // Convex has limits on document size
const REQUEST_TIMEOUT_MS = 30000; // 30 second timeout
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

/**
 * ConvexSyncService - Handles cloud backup and restore using Convex
 */
export class ConvexSyncService implements IConvexSyncService {
  private clientCache: ConvexHttpClient | null = null;
  private cachedUrl: string | null = null;

  /**
   * Checks if Convex credentials are configured
   */
  isConfigured(): boolean {
    const settings = storageService.getSettings();
    return !!(settings.convexUrl && settings.convexToken);
  }

  /**
   * Gets a ConvexHttpClient instance (cached for efficiency)
   */
  private getClient(): ConvexHttpClient | null {
    const settings = storageService.getSettings();
    if (!settings.convexUrl) {
      return null;
    }
    
    // Return cached client if URL hasn't changed
    if (this.clientCache && this.cachedUrl === settings.convexUrl) {
      return this.clientCache;
    }
    
    // Create and cache new client
    this.clientCache = new ConvexHttpClient(settings.convexUrl);
    this.cachedUrl = settings.convexUrl;
    return this.clientCache;
  }

  /**
   * Clears client cache (call when URL changes)
   */
  clearClientCache(): void {
    this.clientCache = null;
    this.cachedUrl = null;
  }

  /**
   * Gets a hash of the token for identification
   * Uses SHA-256 for secure hashing
   */
  private async getTokenHash(): Promise<string | null> {
    const settings = storageService.getSettings();
    if (!settings.convexToken) {
      return null;
    }
    
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      settings.convexToken
    );
    return hash;
  }

  /**
   * Executes a request with timeout
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = REQUEST_TIMEOUT_MS
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
      ),
    ]);
  }

  /**
   * Executes with retry logic
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = MAX_RETRIES
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry on certain errors
        if (
          error instanceof ConvexError ||
          lastError.message.includes('not configured') ||
          lastError.message.includes('Invalid')
        ) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => 
            setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, attempt))
          );
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Syncs local data to Convex cloud
   */
  async syncToCloud(): Promise<SyncResult> {
    try {
      const client = this.getClient();
      if (!client) {
        return { success: false, error: 'Convex URL not configured' };
      }

      const tokenHash = await this.getTokenHash();
      if (!tokenHash) {
        return { success: false, error: 'Convex Token not configured' };
      }

      // Gather all local data
      const backupData = backupService.gatherAllData();
      const dataString = JSON.stringify(backupData);
      
      // Check size limit
      const sizeInMB = new Blob([dataString]).size / (1024 * 1024);
      if (sizeInMB > MAX_BACKUP_SIZE_MB) {
        return { 
          success: false, 
          error: `Backup too large (${sizeInMB.toFixed(1)}MB). Max for cloud: ${MAX_BACKUP_SIZE_MB}MB` 
        };
      }

      // Execute with timeout and retry
      await this.withRetry(async () => {
        await this.withTimeout(
          client.mutation('backup:saveBackup' as any, {
            tokenHash,
            data: dataString,
          })
        );
      });

      return { success: true, lastSyncedAt: Date.now() };
    } catch (error) {
      console.error('Sync to cloud failed:', error);
      
      // Handle ConvexError specifically
      if (error instanceof ConvexError) {
        const errorData = error.data as { message?: string } | undefined;
        return {
          success: false,
          error: errorData?.message || 'Convex error occurred',
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      };
    }
  }

  /**
   * Restores data from Convex cloud
   */
  async syncFromCloud(): Promise<SyncResult> {
    try {
      const client = this.getClient();
      if (!client) {
        return { success: false, error: 'Convex URL not configured' };
      }

      const tokenHash = await this.getTokenHash();
      if (!tokenHash) {
        return { success: false, error: 'Convex Token not configured' };
      }

      // Execute with timeout and retry
      const result = await this.withRetry(async () => {
        return await this.withTimeout(
          client.query('backup:getBackup' as any, {
            tokenHash,
          })
        );
      });

      if (!result) {
        return { success: false, error: 'No backup found in cloud' };
      }

      // Parse and restore the data
      let backupData: BackupData;
      try {
        backupData = JSON.parse(result.data);
      } catch {
        return { success: false, error: 'Invalid backup data format' };
      }

      // Validate structure
      if (!backupData.version || !backupData.data) {
        return { success: false, error: 'Invalid backup file format' };
      }

      // Restore the data
      const restoreResult = backupService.restoreFromData(backupData);
      if (!restoreResult.success) {
        return { success: false, error: restoreResult.error };
      }

      return { success: true, lastSyncedAt: result.updatedAt };
    } catch (error) {
      console.error('Sync from cloud failed:', error);
      
      // Handle ConvexError specifically
      if (error instanceof ConvexError) {
        const errorData = error.data as { message?: string } | undefined;
        return {
          success: false,
          error: errorData?.message || 'Convex error occurred',
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Restore failed',
      };
    }
  }
}

// Export singleton instance
export const convexSyncService = new ConvexSyncService();
