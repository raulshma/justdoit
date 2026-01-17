/**
 * PII Anonymizer - Utility for anonymizing personally identifiable information
 * before sending data to AI services
 */

import { DEFAULT_PII_PATTERNS, PIIPattern } from '../types/aiSettings';

/**
 * PII Anonymizer class for replacing sensitive data with placeholders
 */
class PIIAnonymizer {
  private patterns: PIIPattern[];

  constructor(patterns: PIIPattern[] = DEFAULT_PII_PATTERNS) {
    this.patterns = patterns;
  }

  /**
   * Anonymizes text by replacing PII patterns with placeholders
   * @param text - The text to anonymize
   * @returns Anonymized text with PII replaced
   */
  anonymize(text: string): string {
    if (!text) return text;

    let result = text;
    for (const { pattern, replacement } of this.patterns) {
      result = result.replace(pattern, replacement);
    }
    return result;
  }

  /**
   * Checks if text contains any PII patterns
   * @param text - The text to check
   * @returns True if PII is detected
   */
  containsPII(text: string): boolean {
    if (!text) return false;

    for (const { pattern } of this.patterns) {
      // Reset regex lastIndex for global patterns
      pattern.lastIndex = 0;
      if (pattern.test(text)) {
        return true;
      }
      pattern.lastIndex = 0;
    }
    return false;
  }

  /**
   * Detects and returns all PII found in text
   * @param text - The text to analyze
   * @returns Array of detected PII with their types
   */
  detectPII(text: string): Array<{ type: string; value: string; index: number }> {
    if (!text) return [];

    const detected: Array<{ type: string; value: string; index: number }> = [];

    for (const { name, pattern } of this.patterns) {
      // Reset and create a new regex to get fresh matches
      const regex = new RegExp(pattern.source, pattern.flags);
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        detected.push({
          type: name,
          value: match[0],
          index: match.index,
        });
      }
    }

    return detected.sort((a, b) => a.index - b.index);
  }

  /**
   * Gets the current patterns being used
   * @returns Array of PII patterns
   */
  getPatterns(): PIIPattern[] {
    return [...this.patterns];
  }

  /**
   * Adds a custom pattern to the anonymizer
   * @param pattern - The PII pattern to add
   */
  addPattern(pattern: PIIPattern): void {
    this.patterns.push(pattern);
  }

  /**
   * Creates a preview of what will be anonymized
   * @param text - The text to preview
   * @returns Object with original, anonymized, and detected PII
   */
  preview(text: string): {
    original: string;
    anonymized: string;
    detectedPII: Array<{ type: string; value: string; index: number }>;
    hasPII: boolean;
  } {
    return {
      original: text,
      anonymized: this.anonymize(text),
      detectedPII: this.detectPII(text),
      hasPII: this.containsPII(text),
    };
  }
}

// Export singleton instance
export const piiAnonymizer = new PIIAnonymizer();

// Export class for custom instances
export { PIIAnonymizer };
