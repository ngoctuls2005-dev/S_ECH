import { describe, it, expect } from 'vitest';
import {
  ACHIEVEMENTS_DEFINITIONS,
  evaluateAchievements,
  AchievementEvaluationContext,
} from '../achievements';

describe('Achievements System v2.0 (40 Achievements & Rewards)', () => {
  it('defines exactly 40 achievements with rewards and valid metadata', () => {
    expect(ACHIEVEMENTS_DEFINITIONS.length).toBe(40);

    const categories = new Set(ACHIEVEMENTS_DEFINITIONS.map((a) => a.category));
    expect(categories.has('click')).toBe(true);
    expect(categories.has('score')).toBe(true);
    expect(categories.has('upgrade')).toBe(true);
    expect(categories.has('gacha')).toBe(true);
    expect(categories.has('collection')).toBe(true);
    expect(categories.has('special')).toBe(true);

    for (const a of ACHIEVEMENTS_DEFINITIONS) {
      expect(a.id.length).toBeGreaterThan(0);
      expect(a.name.length).toBeGreaterThan(0);
      expect(a.description.length).toBeGreaterThan(0);
      expect(a.target).toBeGreaterThan(0);
      expect(a.rewardPoints).toBeGreaterThan(0);
    }
  });

  it('preserves all original 12 legacy achievement IDs to guarantee backward compatibility', () => {
    const legacyIds = [
      'first_touch',
      'click_100',
      'click_1000',
      'click_10000',
      'score_100k',
      'score_1m',
      'first_rare',
      'first_epic',
      'first_legendary',
      'collect_5',
      'collect_10',
      'collect_all', // 15 species collection milestone
    ];

    for (const id of legacyIds) {
      const found = ACHIEVEMENTS_DEFINITIONS.find((a) => a.id === id);
      expect(found).toBeDefined();
    }
  });

  it('detects first touch and 100 click achievement unlocks with reward points', () => {
    const ctx: AchievementEvaluationContext = {
      totalClicks: 105,
      totalPointsEarned: 500,
      points: 100,
      ownedFrogs: { green_frog: { id: 'green_frog', level: 1, fragments: 0, unlockedAt: 1 } },
      upgrades: {},
    };

    const { achievements, newlyUnlockedIds, totalRewardsEarned } = evaluateAchievements(ctx, []);
    expect(newlyUnlockedIds).toContain('first_touch');
    expect(newlyUnlockedIds).toContain('click_100');
    expect(newlyUnlockedIds).not.toContain('click_1000');
    expect(totalRewardsEarned).toBeGreaterThan(0);

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

  it('evaluates upgrade-related achievements accurately using actual upgrades context', () => {
    const ctx: AchievementEvaluationContext = {
      totalClicks: 50,
      totalPointsEarned: 100000,
      points: 5000,
      ownedFrogs: {},
      upgrades: {
        magic_finger: 10,
        frog_factory: 1,
        conveyor_touch: 5,
      },
      pointsPerSecond: 1500,
    };

    const { newlyUnlockedIds } = evaluateAchievements(ctx, []);
    expect(newlyUnlockedIds).toContain('upgrade_first');
    expect(newlyUnlockedIds).toContain('upgrade_magic_finger_10');
    expect(newlyUnlockedIds).toContain('upgrade_factory');
    expect(newlyUnlockedIds).toContain('pps_1000');
  });

  it('evaluates collection milestones for 20, 30, and 40 frogs', () => {
    // 20 frogs
    const twentyFrogs: Record<string, any> = {};
    for (let i = 0; i < 20; i++) {
      twentyFrogs[`frog_${i}`] = { id: `frog_${i}`, level: 1, fragments: 0, unlockedAt: 1 };
    }

    const ctx: AchievementEvaluationContext = {
      totalClicks: 0,
      totalPointsEarned: 0,
      points: 0,
      ownedFrogs: twentyFrogs,
      upgrades: {},
    };

    const { newlyUnlockedIds } = evaluateAchievements(ctx, []);
    expect(newlyUnlockedIds).toContain('collect_20');
    expect(newlyUnlockedIds).not.toContain('collect_30');
    expect(newlyUnlockedIds).not.toContain('collect_40');
  });

  it('detects secret achievement when conditions are met', () => {
    const secretCtx: AchievementEvaluationContext = {
      totalClicks: 100,
      totalPointsEarned: 1000,
      points: 1000,
      ownedFrogs: {},
      upgrades: {},
      mainFrogId: 'mossy_frog',
      highestCombo: 22,
    };

    const { newlyUnlockedIds } = evaluateAchievements(secretCtx, []);
    expect(newlyUnlockedIds).toContain('secret_ribbit_master');
  });
});
