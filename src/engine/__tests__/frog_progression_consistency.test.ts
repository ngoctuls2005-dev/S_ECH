import { describe, it, expect } from 'vitest';
import {
  MAX_FROG_LEVEL,
  getRequiredFragmentsForLevel,
  canLevelUpFrog,
  levelUpFrog,
} from '../frogs';
import { validateSaveData, DEFAULT_INITIAL_SAVE, GameSaveData } from '../save';

describe('Task C03: Frog Progression Consistency & Level Cap Boundaries', () => {
  it('defines MAX_FROG_LEVEL as 22 matching effective fragment boundaries', () => {
    expect(MAX_FROG_LEVEL).toBe(22);
    // Cấp 21 lên 22 cần 5 * 2^20 = 5,242,880 mảnh (dưới 10M fragment cap)
    expect(getRequiredFragmentsForLevel(21)).toBe(5242880);
    // Cấp 22 đã đạt trần -> không có cost hợp lệ (Infinity)
    expect(getRequiredFragmentsForLevel(22)).toBe(Infinity);
  });

  it('allows level up from level 21 to 22 when sufficient fragments are available', () => {
    const frogAt21 = {
      id: 'green_frog',
      level: 21,
      fragments: 6000000,
      unlockedAt: 1700000000000,
    };

    expect(canLevelUpFrog(frogAt21)).toBe(true);

    const result = levelUpFrog(frogAt21);
    expect(result.success).toBe(true);
    expect(result.newFrog.level).toBe(22);
    expect(result.newFrog.fragments).toBe(6000000 - 5242880);
  });

  it('strictly blocks level up once frog reaches MAX_FROG_LEVEL (22) even with massive fragments', () => {
    const frogAtMax = {
      id: 'green_frog',
      level: 22,
      fragments: 10000000,
      unlockedAt: 1700000000000,
    };

    // canLevelUpFrog phải trả về false
    expect(canLevelUpFrog(frogAtMax)).toBe(false);

    // levelUpFrog phải từ chối và giữ nguyên state
    const result = levelUpFrog(frogAtMax);
    expect(result.success).toBe(false);
    expect(result.newFrog.level).toBe(22);
    expect(result.newFrog.fragments).toBe(10000000);
  });

  it('maintains consistency between canLevelUpFrog and levelUpFrog across all levels', () => {
    for (let lvl = 1; lvl <= 25; lvl++) {
      const frogZeroFragments = { id: 'green_frog', level: lvl, fragments: 0, unlockedAt: 1 };
      expect(canLevelUpFrog(frogZeroFragments)).toBe(false);
      expect(levelUpFrog(frogZeroFragments).success).toBe(false);

      const frogRich = { id: 'green_frog', level: lvl, fragments: 10000000, unlockedAt: 1 };
      const can = canLevelUpFrog(frogRich);
      const res = levelUpFrog(frogRich);

      // Tính nhất quán: can === true <=> res.success === true
      expect(can).toBe(res.success);
      if (lvl >= MAX_FROG_LEVEL) {
        expect(can).toBe(false);
        expect(res.success).toBe(false);
      }
    }
  });

  it('save validation preserves valid high-level frogs (e.g. level 22 and level 50) without down-leveling', () => {
    const rawData: GameSaveData = {
      ...DEFAULT_INITIAL_SAVE,
      points: 1000,
      totalPointsEarned: 1000,
      totalClicks: 100,
      ownedFrogs: {
        green_frog: { id: 'green_frog', level: 22, fragments: 500, unlockedAt: 1700000000000 },
        tomato_frog: { id: 'tomato_frog', level: 50, fragments: 0, unlockedAt: 1700000000000 },
      },
    };

    const validation = validateSaveData(rawData);
    expect(validation.valid).toBe(true);
    expect(validation.cleanData?.ownedFrogs['green_frog'].level).toBe(22);
    expect(validation.cleanData?.ownedFrogs['tomato_frog'].level).toBe(50);
  });
});
