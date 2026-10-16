import { describe, it, expect } from 'vitest';
import {
  calculateClickPower,
  calculateCritStats,
  calculateComboMultiplier,
  processFrogClick,
  formatNumber,
  formatExactPoints,
  COMBO_TIMEOUT_MS,
} from '../clicker';

describe('Game Economy & Core Clicker Engine', () => {
  describe('calculateClickPower', () => {
    it('returns base click power with 0 upgrades', () => {
      const power = calculateClickPower(1, {}, []);
      expect(power).toBe(1);
    });

    it('adds flat bonuses from divine finger (+1) and soft glove (+5)', () => {
      const upgrades = {
        divine_finger: 2, // +2
        soft_glove: 1,    // +5
      };
      // Base 1 + 2 + 5 = 8
      const power = calculateClickPower(1, upgrades, []);
      expect(power).toBe(8);
    });

    it('adds flat bonuses from v2 upgrades (platinum_hand, legendary_handprint, cosmic_hand)', () => {
      const upgrades = {
        platinum_hand: 2,         // +200
        legendary_handprint: 1,   // +500
        cosmic_hand: 1,           // +3000
      };
      // Base 1 + 200 + 500 + 3000 = 3701
      const power = calculateClickPower(1, upgrades, []);
      expect(power).toBe(3701);
    });

    it('applies frog magic (+10% per level) and frog buffs', () => {
      const upgrades = {
        divine_finger: 9, // +9 -> 10 total base
        frog_magic: 2,    // +20%
      };
      const frogBuffs = [
        { type: 'click_points_percent' as const, value: 0.15 }, // +15%
      ];
      // Base 10 * (1 + 0.20 + 0.15) = 10 * 1.35 = 13.5 -> round to 14
      const power = calculateClickPower(1, upgrades, frogBuffs);
      expect(power).toBe(14);
    });
  });

  describe('calculateCritStats', () => {
    it('defaults to 5% chance and 2.0x multiplier', () => {
      const { critChance, critMultiplier } = calculateCritStats({}, []);
      expect(critChance).toBeCloseTo(0.05);
      expect(critMultiplier).toBe(2.0);
    });

    it('increases crit chance with lucky hand upgrade (+1% per level)', () => {
      const { critChance } = calculateCritStats({ lucky_hand: 5 }, []);
      expect(critChance).toBeCloseTo(0.10);
    });

    it('increases crit stats with v2 upgrades precise_touch (+2%) and crit_mastery (+0.15)', () => {
      const { critChance, critMultiplier } = calculateCritStats({
        lucky_hand: 5,     // 5% + 5% = 10%
        precise_touch: 3,  // +6% = 16%
        crit_mastery: 4,   // 2.0 + 4 * 0.15 = 2.6
      }, []);
      expect(critChance).toBeCloseTo(0.16);
      expect(critMultiplier).toBeCloseTo(2.6);
    });

    it('applies frog buffs for crit chance and multiplier', () => {
      const frogBuffs = [
        { type: 'crit_chance_bonus' as const, value: 0.05 },
        { type: 'crit_multiplier_bonus' as const, value: 0.5 },
      ];
      const { critChance, critMultiplier } = calculateCritStats({}, frogBuffs);
      expect(critChance).toBeCloseTo(0.10);
      expect(critMultiplier).toBeCloseTo(2.5);
    });
  });

  describe('calculateComboMultiplier', () => {
    it('returns 1.0 when combo is 0 or low', () => {
      expect(calculateComboMultiplier(0)).toBe(1.0);
      expect(calculateComboMultiplier(4)).toBe(1.0);
    });

    it('increases combo multiplier every 5 clicks', () => {
      // 5 clicks -> step 1 -> +0.1 => 1.1
      expect(calculateComboMultiplier(5)).toBeCloseTo(1.1);
      // 10 clicks -> step 2 -> +0.2 => 1.2
      expect(calculateComboMultiplier(10)).toBeCloseTo(1.2);
    });

    it('respects max cap and bonus from combo_frog upgrade', () => {
      // At level 0, max cap is 2.5
      expect(calculateComboMultiplier(100, 0)).toBe(2.5);
      // At level 2, max cap is 2.5 + 2*0.25 = 3.0
      expect(calculateComboMultiplier(100, 2)).toBe(3.0);
    });
  });

  describe('processFrogClick', () => {
    it('handles first click and returns correct points', () => {
      const result = processFrogClick({
        baseClickPower: 1,
        upgradeLevels: {},
        activeFrogBuffs: [],
        currentCombo: 0,
        lastClickTimestamp: 0,
        now: 1000,
        rng: () => 0.5, // > 0.05 -> non-crit
      });

      expect(result.result.earnedPoints).toBe(1);
      expect(result.result.isCritical).toBe(false);
      expect(result.newCombo).toBe(1);
      expect(result.newTimestamp).toBe(1000);
    });

    it('triggers critical click correctly when rng falls below crit chance', () => {
      const result = processFrogClick({
        baseClickPower: 10,
        upgradeLevels: {},
        activeFrogBuffs: [],
        currentCombo: 0,
        lastClickTimestamp: 0,
        now: 1000,
        rng: () => 0.02, // < 0.05 -> crit
      });

      expect(result.result.isCritical).toBe(true);
      expect(result.result.critMultiplier).toBe(2.0);
      // Base 10 * crit 2.0 = 20 points
      expect(result.result.earnedPoints).toBe(20);
    });

    it('increments combo when clicking within COMBO_TIMEOUT_MS', () => {
      const firstClickTime = 1000;
      const secondClickTime = firstClickTime + 500; // 500ms < 1800ms

      const result = processFrogClick({
        baseClickPower: 1,
        upgradeLevels: {},
        activeFrogBuffs: [],
        currentCombo: 1,
        lastClickTimestamp: firstClickTime,
        now: secondClickTime,
      });

      expect(result.newCombo).toBe(2);
    });

    it('resets combo to 1 when clicking after COMBO_TIMEOUT_MS', () => {
      const firstClickTime = 1000;
      const delayedClickTime = firstClickTime + COMBO_TIMEOUT_MS + 200;

      const result = processFrogClick({
        baseClickPower: 1,
        upgradeLevels: {},
        activeFrogBuffs: [],
        currentCombo: 15,
        lastClickTimestamp: firstClickTime,
        now: delayedClickTime,
      });

      expect(result.newCombo).toBe(1);
    });

    it('never produces negative or 0 points', () => {
      const result = processFrogClick({
        baseClickPower: 0,
        upgradeLevels: {},
        activeFrogBuffs: [],
        currentCombo: 0,
        lastClickTimestamp: 0,
      });
      expect(result.result.earnedPoints).toBeGreaterThanOrEqual(1);
    });
  });

  describe('formatNumber', () => {
    it('formats small numbers correctly', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(42)).toBe('42');
      expect(formatNumber(999)).toBe('999');
    });

    it('formats thousands (K)', () => {
      expect(formatNumber(1000)).toBe('1 K');
      expect(formatNumber(1500)).toBe('1.5 K');
      expect(formatNumber(999900)).toBe('999.9 K');
    });

    it('formats millions (M), billions (B), trillions (T)', () => {
      expect(formatNumber(1_000_000)).toBe('1 M');
      expect(formatNumber(2_500_000)).toBe('2.5 M');
      expect(formatNumber(10_000_000_000)).toBe('10 B');
      expect(formatNumber(3_200_000_000_000)).toBe('3.2 T');
    });
  });

  describe('formatExactPoints', () => {
    it('returns exact localized integer format for numbers up to millions and billions', () => {
      expect(formatExactPoints(0)).toBe('0');
      expect(formatExactPoints(1500)).toBe((1500).toLocaleString('vi-VN'));
      expect(formatExactPoints(1_500_000)).toBe((1500000).toLocaleString('vi-VN'));
      expect(formatExactPoints(12_345_678)).toBe((12345678).toLocaleString('vi-VN'));
    });

    it('safely handles extreme numbers beyond MAX_SAFE_INTEGER using exponential format', () => {
      const hugeNum = 1e18; // Beyond Number.MAX_SAFE_INTEGER (9e15)
      const res = formatExactPoints(hugeNum);
      expect(res).toContain('e+18');
    });

    it('handles negative or invalid numbers safely', () => {
      expect(formatExactPoints(-10)).toBe('0');
      expect(formatExactPoints(NaN)).toBe('0');
    });
  });
});

