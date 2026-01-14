/**
 * AI Log Service - Handles logging and querying of AI requests/responses
 */
import { storageService, StorageService } from './storageService';
import type { AILogEntry, AILogQueryOptions } from '../types/aiTypes';

/** Storage key for AI logs */
const AI_LOGS_STORAGE_KEY = 'ai_logs';

/** Maximum number of log entries to retain */
const MAX_LOG_ENTRIES = 100;

/**
 * Generates a UUID v4
 */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * AI Log Service Interface
 */
export interface IAILogService {
  log(entry: Omit<AILogEntry, 'id' | 'timestamp'>): AILogEntry;
  getLogs(options?: AILogQueryOptions): AILogEntry[];
  getLogById(id: string): AILogEntry | undefined;
  getLogCount(): number;
  clearLogs(): void;
}

/**
 * AILogService - Persists AI request/response logs to MMKV storage
 */
export class AILogService implements IAILogService {
  private storage: StorageService;

  constructor(storage?: StorageService) {
    this.storage = storage ?? storageService;
  }

  /**
   * Gets the raw MMKV storage instance
   */
  private getStorageInstance() {
    return (this.storage as any).storage;
  }

  /**
   * Retrieves all logs from storage
   */
  private getAllLogs(): AILogEntry[] {
    try {
      const storage = this.getStorageInstance();
      const logsJson = storage.getString(AI_LOGS_STORAGE_KEY);
      if (!logsJson) {
        return [];
      }
      return JSON.parse(logsJson) as AILogEntry[];
    } catch (error) {
      console.error('Failed to get AI logs:', error);
      return [];
    }
  }

  /**
   * Saves logs to storage
   */
  private saveLogs(logs: AILogEntry[]): void {
    try {
      const storage = this.getStorageInstance();
      storage.set(AI_LOGS_STORAGE_KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save AI logs:', error);
    }
  }

  /**
   * Logs an AI request/response
   * @param entry - Log entry without id and timestamp
   * @returns Complete log entry with generated id and timestamp
   */
  log(entry: Omit<AILogEntry, 'id' | 'timestamp'>): AILogEntry {
    const completeEntry: AILogEntry = {
      ...entry,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };

    const logs = this.getAllLogs();
    
    // Add new entry at the beginning (most recent first)
    logs.unshift(completeEntry);

    // Prune old entries if exceeding max
    if (logs.length > MAX_LOG_ENTRIES) {
      logs.length = MAX_LOG_ENTRIES;
    }

    this.saveLogs(logs);

    return completeEntry;
  }

  /**
   * Retrieves logs with optional filtering
   * @param options - Query options
   * @returns Filtered log entries (newest first)
   */
  getLogs(options?: AILogQueryOptions): AILogEntry[] {
    let logs = this.getAllLogs();

    // Apply status filter
    if (options?.filter) {
      logs = logs.filter((log) =>
        options.filter === 'success' ? log.response.success : !log.response.success
      );
    }

    // Apply search filter
    if (options?.search) {
      const searchLower = options.search.toLowerCase();
      logs = logs.filter(
        (log) =>
          log.request.prompt.toLowerCase().includes(searchLower) ||
          log.request.goalTitle?.toLowerCase().includes(searchLower)
      );
    }

    // Apply limit
    if (options?.limit && options.limit > 0) {
      logs = logs.slice(0, options.limit);
    }

    return logs;
  }

  /**
   * Retrieves a specific log by ID
   * @param id - Log entry ID
   * @returns Log entry if found
   */
  getLogById(id: string): AILogEntry | undefined {
    const logs = this.getAllLogs();
    return logs.find((log) => log.id === id);
  }

  /**
   * Gets the total count of log entries
   * @returns Number of stored logs
   */
  getLogCount(): number {
    return this.getAllLogs().length;
  }

  /**
   * Clears all stored logs
   */
  clearLogs(): void {
    try {
      const storage = this.getStorageInstance();
      storage.delete(AI_LOGS_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear AI logs:', error);
    }
  }
}

// Export singleton instance
export const aiLogService = new AILogService();
