import { describe, it, expect } from 'vitest';
import { calculateClickPower, processFrogClick } from '../clicker';
import { calculatePointsPerSecond, accumulateDeltaPoints, calculateOfflineReward } from '../idle';
import { purchaseUpgrade, calculateBatchUpgradeCost } from '../upgrade';
import { executeGacha, INITIAL_PITY_STATE } from '../gacha';
import { calculateActiveFrogBuffs } from '../frogs';

describe('Game Economy Balance Simulation', () => {
  it('allows buying first upgrade (Divine Finger, 50 pts) in less than 50 clicks', () => {
    let points = 0;
    let clicks = 0;
    while (points < 50) {
      clicks++;
      const { result } = processFrogClick({
        baseClickPower: 1,
        upgradeLevels: {},
        activeFrogBuffs: [],
        currentCombo: clicks,
        lastClickTimestamp: Date.now() - 500,
        now: Date.now(),
      });
      points += result.earnedPoints;
    }
    // With base power 1 and combo, should take ~30-45 clicks
    expect(clicks).toBeLessThanOrEqual(45);
    expect(points).toBeGreaterThanOrEqual(50);
  });

  it('allows first Gacha pull (500 pts) within reasonable initial gameplay (~150 clicks with first upgrades)', () => {
    let points = 0;
    let upgradeLevels: Record<string, number> = {};
    let clicks = 0;

    // Player clicks and buys affordable upgrades
    for (let c = 0; c < 200; c++) {
      clicks++;
      const buffs = calculateActiveFrogBuffs('green_frog', {
        green_frog: { id: 'green_frog', level: 1, fragments: 0, unlockedAt: 0 },
      });
      const { result } = processFrogClick({
        baseClickPower: 1,
        upgradeLevels,
        activeFrogBuffs: buffs,
        currentCombo: c,
        lastClickTimestamp: Date.now() - 400,
        now: Date.now(),
      });
      points += result.earnedPoints;

      // Buy divine_finger if affordable
      const cost = calculateBatchUpgradeCost(50, upgradeLevels['divine_finger'] || 0, 1);
      if (points >= cost && (upgradeLevels['divine_finger'] || 0) < 3) {
        const res = purchaseUpgrade('divine_finger', 'x1', points, upgradeLevels);
        if (res.success) {
          points = res.newPoints;
          upgradeLevels = res.newLevels;
        }
      }

      if (points >= 500) {
        break;
      }
    }

    expect(points).toBeGreaterThanOrEqual(500);
    expect(clicks).toBeLessThan(180);

    // Can successfully execute first Gacha pull
    const gachaRes = executeGacha(1, points, {}, INITIAL_PITY_STATE);
    expect(gachaRes.success).toBe(true);
    expect(gachaRes.session?.pulls.length).toBe(1);
  });

  it('simulates 15-minute, 30-minute, and 1-hour idle/active progress safely without Infinity or NaN', () => {
    let points = 1000;
    let upgrades: Record<string, number> = {
      frog_touch_machine: 5,
      frog_touch_team: 3,
      frog_factory: 1,
      frog_magic: 1,
    };
    let owned = {
      green_frog: { id: 'green_frog', level: 2, fragments: 1, unlockedAt: 0 },
      tomato_frog: { id: 'tomato_frog', level: 1, fragments: 0, unlockedAt: 0 },
    };

    const buffs = calculateActiveFrogBuffs('green_frog', owned);
    const pps = calculatePointsPerSecond(upgrades, buffs);
    expect(pps).toBeGreaterThan(0);

    // Mô phỏng thu nhập offline qua calculateOfflineReward (50% PPS)
    const baseTime = 1_700_000_000_000;
    
    // 15 phút (900s) -> 900 * 148.5 * 0.50 = ~66,825
    const offline15m = calculateOfflineReward(baseTime, baseTime + 900_000, pps);
    expect(offline15m).not.toBeNull();
    expect(offline15m?.earnedPoints).toBeGreaterThan(50_000);
    expect(offline15m?.wasCapped).toBe(false);

    // 30 phút (1800s) -> 1800 * 148.5 * 0.50 = ~133,650
    const offline30m = calculateOfflineReward(baseTime, baseTime + 1800_000, pps);
    expect(offline30m).not.toBeNull();
    expect(offline30m?.earnedPoints).toBeGreaterThan(100_000);
    expect(offline30m?.wasCapped).toBe(false);

    // 1 giờ (3600s) -> 3600 * 148.5 * 0.50 = ~267,300
    const offline1h = calculateOfflineReward(baseTime, baseTime + 3600_000, pps);
    expect(offline1h).not.toBeNull();
    expect(offline1h?.earnedPoints).toBeGreaterThan(250_000);
    expect(offline1h?.wasCapped).toBe(false);
  });
});
