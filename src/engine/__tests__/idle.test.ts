import { describe, it, expect } from 'vitest';
import {
  calculatePointsPerSecond,
  accumulateDeltaPoints,
  calculateOfflineReward,
  DEFAULT_IDLE_CONFIG,
} from '../idle';

describe('Idle Engine & Offline Income System', () => {
  describe('calculatePointsPerSecond', () => {
    it('returns 0 when there are no idle upgrades', () => {
      expect(calculatePointsPerSecond({})).toBe(0);
    });

    it('sums flat bonuses from touch machine (+1), touch team (+10), factory (+100)', () => {
      const upgrades = {
        frog_touch_machine: 3, // +3
        frog_touch_team: 2,    // +20
        frog_factory: 1,       // +100
      };
      // 3 + 20 + 100 = 123
      expect(calculatePointsPerSecond(upgrades)).toBe(123);
    });

    it('applies frog magic (+10% per level) and frog buffs to idle output', () => {
      const upgrades = {
        frog_factory: 1, // 100 base
        frog_magic: 2,   // +20%
      };
      const buffs = [{ type: 'idle_points_percent' as const, value: 0.10 }]; // +10%
      // 100 * (1 + 0.30) = 130
      expect(calculatePointsPerSecond(upgrades, buffs)).toBe(130);
    });
  });

  describe('accumulateDeltaPoints', () => {
    it('accumulates fractional seconds without losing points', () => {
      const pps = 10;
      // 1st tick: 0.05s -> 0.5 points -> pointsToAdd = 0, accumulator = 0.5
      let tick = accumulateDeltaPoints(pps, 0.05, 0);
      expect(tick.pointsToAdd).toBe(0);
      expect(tick.newAccumulator).toBeCloseTo(0.5);

      // 2nd tick: 0.05s -> 0.5 + 0.5 = 1.0 points -> pointsToAdd = 1, accumulator = 0.0
      tick = accumulateDeltaPoints(pps, 0.05, tick.newAccumulator);
      expect(tick.pointsToAdd).toBe(1);
      expect(tick.newAccumulator).toBeCloseTo(0);
    });

    it('clamps huge single delta to safe maximum to prevent abnormal lag spike jumps', () => {
      const pps = 5;
      const tick = accumulateDeltaPoints(pps, 100, 0); // 100s clamped to 10s
      expect(tick.pointsToAdd).toBe(50);
    });
  });

  describe('calculateOfflineReward', () => {
    const baseNow = 1_700_000_000_000;

    it('returns null if PPS is 0', () => {
      const res = calculateOfflineReward(baseNow - 3600_000, baseNow, 0);
      expect(res).toBeNull();
    });

    it('returns null if offline time is less than min threshold (30s)', () => {
      const res = calculateOfflineReward(baseNow - 15_000, baseNow, 10);
      expect(res).toBeNull();
    });

    it('returns null if clock was moved backwards', () => {
      const res = calculateOfflineReward(baseNow + 50_000, baseNow, 10);
      expect(res).toBeNull();
    });

    it('calculates 50% offline rate accurately for 1 hour offline', () => {
      const oneHourMs = 3600 * 1000;
      const pps = 20;
      // 3600 seconds * 20 pps * 50% = 36,000 points
      const res = calculateOfflineReward(baseNow - oneHourMs, baseNow, pps);
      expect(res).not.toBeNull();
      expect(res?.earnedPoints).toBe(36_000);
      expect(res?.elapsedSeconds).toBe(3600);
      expect(res?.wasCapped).toBe(false);
    });

    it('caps offline reward at 8 hours (28,800 seconds) when offline for 24 hours', () => {
      const twentyFourHoursMs = 24 * 3600 * 1000;
      const pps = 10;
      // 28,800 capped seconds * 10 pps * 50% = 144,000 points
      const res = calculateOfflineReward(baseNow - twentyFourHoursMs, baseNow, pps);
      expect(res).not.toBeNull();
      expect(res?.cappedSeconds).toBe(DEFAULT_IDLE_CONFIG.maxOfflineSeconds);
      expect(res?.earnedPoints).toBe(144_000);
      expect(res?.wasCapped).toBe(true);
      expect(res?.elapsedSeconds).toBe(24 * 3600);
    });
  });
});
