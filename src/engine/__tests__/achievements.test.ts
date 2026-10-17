import { describe, it, expect } from 'vitest';
import {
  ACHIEVEMENTS_DEFINITIONS,
  evaluateAchievements,
  AchievementEvaluationContext,
} from '../achievements';
import { UPGRADES_CONFIG } from '../upgrade';

describe('Achievements System v3.0 Deep Audit & Event Verification', () => {
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

  describe('Real Crit Counts (Strict Counting Without 10% Estimation)', () => {
    it('does NOT unlock crit_10 when player has 100 clicks but 0 crits', () => {
      const ctx: AchievementEvaluationContext = {
        totalClicks: 100,
        totalPointsEarned: 1000,
        points: 500,
        totalCrits: 0,
        ownedFrogs: {},
        upgrades: {},
      };

      const { newlyUnlockedIds } = evaluateAchievements(ctx, []);
      expect(newlyUnlockedIds).not.toContain('crit_10');
    });

    it('does NOT unlock crit_10 when player has 100 clicks and only 9 crits', () => {
      const ctx: AchievementEvaluationContext = {
        totalClicks: 100,
        totalPointsEarned: 1000,
        points: 500,
        totalCrits: 9,
        ownedFrogs: {},
        upgrades: {},
      };

      const { newlyUnlockedIds } = evaluateAchievements(ctx, []);
      expect(newlyUnlockedIds).not.toContain('crit_10');
    });

    it('unlocks crit_10 strictly when totalCrits reaches 10', () => {
      const ctx: AchievementEvaluationContext = {
        totalClicks: 100,
        totalPointsEarned: 1000,
        points: 500,
        totalCrits: 10,
        ownedFrogs: {},
        upgrades: {},
      };

      const { newlyUnlockedIds } = evaluateAchievements(ctx, []);
      expect(newlyUnlockedIds).toContain('crit_10');
    });
  });

  describe('Real Gacha Pull Tracking', () => {
    it('does NOT unlock gacha_multi_pull when totalGachaPulls is 9', () => {
      const ctx: AchievementEvaluationContext = {
        totalClicks: 10,
        totalPointsEarned: 5000,
        points: 1000,
        totalGachaPulls: 9,
        ownedFrogs: {
          green_frog: { id: 'green_frog', level: 1, fragments: 0, unlockedAt: 0 },
        },
        upgrades: {},
      };

      const { newlyUnlockedIds } = evaluateAchievements(ctx, []);
      expect(newlyUnlockedIds).not.toContain('gacha_multi_pull');
    });

    it('unlocks gacha_multi_pull when actual totalGachaPulls reaches 10', () => {
      const ctx: AchievementEvaluationContext = {
        totalClicks: 10,
        totalPointsEarned: 5000,
        points: 1000,
        totalGachaPulls: 10,
        ownedFrogs: {
          green_frog: { id: 'green_frog', level: 1, fragments: 0, unlockedAt: 0 },
        },
        upgrades: {},
      };

      const { newlyUnlockedIds } = evaluateAchievements(ctx, []);
      expect(newlyUnlockedIds).toContain('gacha_multi_pull');
    });
  });

  describe('Genuine Upgrade ID Verification', () => {
    it('unlocks upgrade_magic_finger_10 with the real divine_finger ID from UPGRADES_CONFIG', () => {
      // Xác nhận divine_finger tồn tại trong UPGRADES_CONFIG thật
      const realUpgrade = UPGRADES_CONFIG.find((u) => u.id === 'divine_finger');
      expect(realUpgrade).toBeDefined();

      const ctx: AchievementEvaluationContext = {
        totalClicks: 50,
        totalPointsEarned: 100000,
        points: 5000,
        ownedFrogs: {},
        upgrades: {
          divine_finger: 10,
          frog_factory: 1,
        },
        pointsPerSecond: 1500,
      };

      const { newlyUnlockedIds } = evaluateAchievements(ctx, []);
      expect(newlyUnlockedIds).toContain('upgrade_first');
      expect(newlyUnlockedIds).toContain('upgrade_magic_finger_10');
      expect(newlyUnlockedIds).toContain('upgrade_factory');
    });
  });

  describe('Secret Ribbit Master Simultaneous Event Verification', () => {
    it('does NOT unlock secret_ribbit_master if player achieved combo 20 on regular frog then switched to special frog', () => {
      const switchFrogCtx: AchievementEvaluationContext = {
        totalClicks: 100,
        totalPointsEarned: 1000,
        points: 1000,
        ownedFrogs: {},
        upgrades: {},
        mainFrogId: 'mossy_frog',
        highestCombo: 25, // historical combo achieved previously
        lastClickCombo: 0, // currently no active event combo
      };

      const { newlyUnlockedIds } = evaluateAchievements(switchFrogCtx, []);
      expect(newlyUnlockedIds).not.toContain('secret_ribbit_master');
    });

    it('unlocks secret_ribbit_master when player hits combo >= 20 while currently accompanying special frog', () => {
      const simultaneousEventCtx: AchievementEvaluationContext = {
        totalClicks: 100,
        totalPointsEarned: 1000,
        points: 1000,
        ownedFrogs: {},
        upgrades: {},
        mainFrogId: 'mossy_frog',
        highestCombo: 20,
        lastClickCombo: 20, // simultaneous event proof
      };

      const { newlyUnlockedIds } = evaluateAchievements(simultaneousEventCtx, []);
      expect(newlyUnlockedIds).toContain('secret_ribbit_master');
    });
  });

  describe('One-Time Reward Guarantee', () => {
    it('awards points only once upon initial achievement unlock and 0 on subsequent evaluations', () => {
      const ctx: AchievementEvaluationContext = {
        totalClicks: 105,
        totalPointsEarned: 500,
        points: 100,
        ownedFrogs: { green_frog: { id: 'green_frog', level: 1, fragments: 0, unlockedAt: 1 } },
        upgrades: {},
      };

      // Initial evaluation: first_touch and click_100 unlocked
      const res1 = evaluateAchievements(ctx, []);
      expect(res1.newlyUnlockedIds).toContain('first_touch');
      expect(res1.newlyUnlockedIds).toContain('click_100');
      expect(res1.totalRewardsEarned).toBeGreaterThan(0);

      const previouslyUnlocked = res1.achievements.filter((a) => a.isUnlocked).map((a) => a.id);

      // Re-evaluation (e.g. reload or action trigger): no duplicate reward
      const res2 = evaluateAchievements(ctx, previouslyUnlocked);
      expect(res2.newlyUnlockedIds.length).toBe(0);
      expect(res2.totalRewardsEarned).toBe(0);
    });
  });

  describe('Collection Milestones', () => {
    it('evaluates collection milestones for 20, 30, and 40 frogs', () => {
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
  });
});
