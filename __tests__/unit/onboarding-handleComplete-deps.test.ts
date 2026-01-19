import * as fs from 'fs';
import * as path from 'path';

/**
 * Regression test for a real bug:
 * handleComplete was missing AI-related state variables in its useCallback dependency list.
 * That caused onboarding AI settings (e.g., API key, feature toggles) to save stale defaults.
 */
describe('OnboardingScreen handleComplete dependencies', () => {
  it('includes AI state (apiKey and toggles) in the handleComplete useCallback dependency array', () => {
    const filePath = path.join(process.cwd(), 'src', 'screens', 'OnboardingScreen.tsx');
    const src = fs.readFileSync(filePath, 'utf8');

    // Grab the handleComplete useCallback block.
    const match = src.match(
      /const\s+handleComplete\s*=\s*useCallback\(async\s*\(\)\s*=>\s*\{[\s\S]*?\},\s*\[([\s\S]*?)\]\s*\);/m
    );
    expect(match).not.toBeNull();

    const deps = match?.[1] ?? '';

    // Critical AI values that must be included to avoid stale saves.
    expect(deps).toContain('apiKey');
    expect(deps).toContain('smartRemindersEnabled');
    expect(deps).toContain('personalityEnabled');
    expect(deps).toContain('aiSmartReschedulingEnabled');
    expect(deps).toContain('aiMotivationalEnabled');
    expect(deps).toContain('aiPatternDetectionEnabled');
    expect(deps).toContain('aiGoalBreakdownEnabled');
    expect(deps).toContain('aiGoalCoachEnabled');
    expect(deps).toContain('piiEnabled');
  });
});
