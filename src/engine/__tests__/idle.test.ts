import { describe, it, expect } from 'vitest';
import {
  calculatePointsPerSecond,
  accumulateDeltaPoints,
  calculateOfflineReward,
  processVisibilityTransition,
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

  describe('processVisibilityTransition (Tab switching & Offline handling)', () => {
    const baseNow = 1_700_000_000_000;
    const pps = 10;

    it('handles tab switch for 5 seconds: 100% active catchup, no popup modal', () => {
      const res = processVisibilityTransition(baseNow - 5_000, baseNow, pps, 0);
      expect(res.type).toBe('active_catchup');
      expect(res.elapsedSeconds).toBe(5);
      expect(res.pointsToAdd).toBe(50); // 5s * 10 pps = 50
      expect(res.offlineRewardResult).toBeNull();
    });

    it('handles tab switch for 15 seconds: 100% active catchup, preserves accumulator', () => {
      const res = processVisibilityTransition(baseNow - 15_000, baseNow, pps, 0.4);
      expect(res.type).toBe('active_catchup');
      expect(res.elapsedSeconds).toBe(15);
      expect(res.pointsToAdd).toBe(150); // floor(0.4 + 15 * 10) = 150
      expect(res.newAccumulator).toBeCloseTo(0.4);
      expect(res.offlineRewardResult).toBeNull();
    });

    it('handles tab switch for 29 seconds: exactly threshold boundary (< 30s) -> active catchup', () => {
      const res = processVisibilityTransition(baseNow - 29_000, baseNow, pps, 0);
      expect(res.type).toBe('active_catchup');
      expect(res.elapsedSeconds).toBe(29);
      expect(res.pointsToAdd).toBe(290); // 29 * 10 = 290
      expect(res.offlineRewardResult).toBeNull();
    });

    it('handles tab switch for 31 seconds: exceeds threshold (>= 30s) -> 50% offline reward with modal', () => {
      const res = processVisibilityTransition(baseNow - 31_000, baseNow, pps, 0);
      expect(res.type).toBe('offline_reward');
      expect(res.elapsedSeconds).toBe(31);
      // 31s * 10 pps * 50% = 155 points
      expect(res.pointsToAdd).toBe(155);
      expect(res.offlineRewardResult).not.toBeNull();
      expect(res.offlineRewardResult?.earnedPoints).toBe(155);
    });

    it('simulates 1 hour away: 3600s * 10 pps * 50% = 18,000 points', () => {
      const res = processVisibilityTransition(baseNow - 3600_000, baseNow, pps, 0);
      expect(res.type).toBe('offline_reward');
      expect(res.elapsedSeconds).toBe(3600);
      expect(res.pointsToAdd).toBe(18_000);
      expect(res.offlineRewardResult?.wasCapped).toBe(false);
    });

    it('simulates 8 hours away: exactly caps at max limit (28,800s)', () => {
      const eightHoursMs = 8 * 3600 * 1000;
      const res = processVisibilityTransition(baseNow - eightHoursMs, baseNow, pps, 0);
      expect(res.type).toBe('offline_reward');
      expect(res.elapsedSeconds).toBe(28_800);
      expect(res.pointsToAdd).toBe(144_000); // 28800 * 10 * 0.5
      expect(res.offlineRewardResult?.wasCapped).toBe(false);
    });

    it('simulates 12 hours away: capped at 8 hours (28,800s)', () => {
      const twelveHoursMs = 12 * 3600 * 1000;
      const res = processVisibilityTransition(baseNow - twelveHoursMs, baseNow, pps, 0);
      expect(res.type).toBe('offline_reward');
      expect(res.elapsedSeconds).toBe(43_200);
      expect(res.offlineRewardResult?.cappedSeconds).toBe(28_800);
      expect(res.offlineRewardResult?.wasCapped).toBe(true);
      expect(res.pointsToAdd).toBe(144_000);
    });

    it('safely ignores backwards clock or abnormal future timestamps', () => {
      const resBackwards = processVisibilityTransition(baseNow + 60_000, baseNow, pps, 0);
      expect(resBackwards.type).toBe('none');
      expect(resBackwards.pointsToAdd).toBe(0);

      const resZeroPps = processVisibilityTransition(baseNow - 60_000, baseNow, 0, 0);
      expect(resZeroPps.type).toBe('none');
      expect(resZeroPps.pointsToAdd).toBe(0);
    });

    it('handles multiple rapid tab switches without losing points or duplicate rewards', () => {
      let currentAcc = 0;
      let totalEarned = 0;
      let lastTime = baseNow;

      // Switch tab 3 times, each 5 seconds
      for (let i = 1; i <= 3; i++) {
        const nextTime = lastTime + 5_000;
        const res = processVisibilityTransition(lastTime, nextTime, pps, currentAcc);
        expect(res.type).toBe('active_catchup');
        totalEarned += res.pointsToAdd;
        currentAcc = res.newAccumulator;
        lastTime = nextTime;
      }

      // Total earned for 15s should be 150 points
      expect(totalEarned).toBe(150);
    });
  });
});

