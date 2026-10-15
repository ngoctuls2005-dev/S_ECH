import { describe, it, expect } from 'vitest';
import {
  ACHIEVEMENTS_DEFINITIONS,
  evaluateAchievements,
  AchievementEvaluationContext,
} from '../achievements';

describe('Achievements System', () => {
  it('defines comprehensive achievements covering clicks, scores, gacha and collection', () => {
    expect(ACHIEVEMENTS_DEFINITIONS.length).toBeGreaterThanOrEqual(10);
    const categories = new Set(ACHIEVEMENTS_DEFINITIONS.map((a) => a.category));
    expect(categories.has('click')).toBe(true);
    expect(categories.has('score')).toBe(true);
    expect(categories.has('gacha')).toBe(true);
    expect(categories.has('collection')).toBe(true);
  });

  it('detects first touch and 100 click achievement unlocks', () => {
    const ctx: AchievementEvaluationContext = {
      totalClicks: 105,
      totalPointsEarned: 500,
      points: 100,
      ownedFrogs: { green_frog: { id: 'green_frog', level: 1, fragments: 0, unlockedAt: 1 } },
      upgrades: {},
    };

    const { achievements, newlyUnlockedIds } = evaluateAchievements(ctx, []);
    expect(newlyUnlockedIds).toContain('first_touch');
    expect(newlyUnlockedIds).toContain('click_100');
    expect(newlyUnlockedIds).not.toContain('click_1000');

    const firstTouch = achievements.find((a) => a.id === 'first_touch');
    expect(firstTouch?.isUnlocked).toBe(true);
  });

  it('does not re-trigger previously unlocked achievements in newlyUnlockedIds', () => {
    const ctx: AchievementEvaluationContext = {
      totalClicks: 105,
      totalPointsEarned: 500,
      points: 100,
      ownedFrogs: {},
      upgrades: {},
    };

    const { newlyUnlockedIds } = evaluateAchievements(ctx, ['first_touch']);
    expect(newlyUnlockedIds).not.toContain('first_touch');
    expect(newlyUnlockedIds).toContain('click_100');
  });

  it('unlocks gacha rarity and collection milestones accurately', () => {
    const ctx: AchievementEvaluationContext = {
      totalClicks: 10,
      totalPointsEarned: 2000,
      points: 2000,
      ownedFrogs: {
        green_frog: { id: 'green_frog', level: 1, fragments: 0, unlockedAt: 1 },
        brown_frog: { id: 'brown_frog', level: 1, fragments: 0, unlockedAt: 2 },
        tree_frog: { id: 'tree_frog', level: 1, fragments: 0, unlockedAt: 3 },
        red_eyed_frog: { id: 'red_eyed_frog', level: 1, fragments: 0, unlockedAt: 4 }, // Rare
        golden_frog: { id: 'golden_frog', level: 1, fragments: 0, unlockedAt: 5 },     // Legendary
      },
      upgrades: {},
    };

    const { achievements, newlyUnlockedIds } = evaluateAchievements(ctx, []);
    expect(newlyUnlockedIds).toContain('first_rare');
    expect(newlyUnlockedIds).toContain('first_legendary');
    expect(newlyUnlockedIds).toContain('collect_5');
  });
});
