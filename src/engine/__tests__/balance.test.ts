import { describe, it, expect } from 'vitest';
import { calculateClickPower, processFrogClick } from '../clicker';
import { calculatePointsPerSecond, accumulateDeltaPoints, calculateOfflineReward } from '../idle';
import { purchaseUpgrade, calculateBatchUpgradeCost, UPGRADES_CONFIG } from '../upgrade';
import { executeGacha, INITIAL_PITY_STATE, getSpeciesDropRates } from '../gacha';
import { calculateActiveFrogBuffs } from '../frogs';
import { FROG_SPECIES_LIST } from '../../data/frogs';

describe('Game Economy Balance Simulation v2.0', () => {
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

    const gachaRes = executeGacha(1, points, {}, INITIAL_PITY_STATE);
    expect(gachaRes.success).toBe(true);
    expect(gachaRes.session?.pulls.length).toBe(1);
  });

  it('simulates 15-minute, 30-minute, and 1-hour idle/active progress safely without Infinity or NaN', () => {
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

    const baseTime = 1_700_000_000_000;
    
    // 15 phút (900s)
    const offline15m = calculateOfflineReward(baseTime, baseTime + 900_000, pps);
    expect(offline15m).not.toBeNull();
    expect(offline15m?.earnedPoints).toBeGreaterThan(50_000);
    expect(offline15m?.wasCapped).toBe(false);

    // 30 phút (1800s)
    const offline30m = calculateOfflineReward(baseTime, baseTime + 1800_000, pps);
    expect(offline30m).not.toBeNull();
    expect(offline30m?.earnedPoints).toBeGreaterThan(100_000);
    expect(offline30m?.wasCapped).toBe(false);

    // 1 giờ (3600s)
    const offline1h = calculateOfflineReward(baseTime, baseTime + 3600_000, pps);
    expect(offline1h).not.toBeNull();
    expect(offline1h?.earnedPoints).toBeGreaterThan(250_000);
    expect(offline1h?.wasCapped).toBe(false);
  });

  it('simulates late-game economy with 18 upgrades and 40 frogs safely within MAX_SAFE_INTEGER', () => {
    // Giả lập người chơi cuối game sở hữu tất cả 18 nâng cấp ở cấp độ cao
    const lateGameUpgrades: Record<string, number> = {};
    for (const u of UPGRADES_CONFIG) {
      lateGameUpgrades[u.id] = 20; // Cấp 20 cho mỗi nâng cấp
    }

    // Giả lập sở hữu trọn vẹn 40 loài ếch
    const lateGameFrogs: Record<string, any> = {};
    for (const f of FROG_SPECIES_LIST) {
      lateGameFrogs[f.id] = { id: f.id, level: 3, fragments: 10, unlockedAt: 1 };
    }

    const buffs = calculateActiveFrogBuffs('chronos_frog', lateGameFrogs);
    const pps = calculatePointsPerSecond(lateGameUpgrades, buffs);
    const clickPower = calculateClickPower(1, lateGameUpgrades, buffs);

    expect(Number.isFinite(pps)).toBe(true);
    expect(Number.isFinite(clickPower)).toBe(true);
    expect(pps).toBeGreaterThan(1_000_000); // Late game sản sinh hàng triệu điểm/s
    expect(pps).toBeLessThan(Number.MAX_SAFE_INTEGER / 1000); // An toàn tuyệt đối không tràn số

    // 24h offline của tài khoản late game vẫn trong giới hạn an toàn
    const offlineLateGame = calculateOfflineReward(1000, 1000 + 86400 * 1000, pps);
    expect(offlineLateGame).not.toBeNull();
    expect(Number.isFinite(offlineLateGame!.earnedPoints)).toBe(true);
    expect(offlineLateGame!.wasCapped).toBe(true); // Đã chạm trần 12h an toàn
  });

  it('validates 100% total drop probability across all 3 Gacha pools', () => {
    for (const pool of ['ao_sen', 'rung_mua', 'dem_trang'] as const) {
      const dropRates = getSpeciesDropRates(pool, {});
      const total = dropRates.reduce((acc, r) => acc + r.dropChancePercent, 0);
      expect(total).toBeGreaterThan(99.0);
      expect(total).toBeLessThan(101.0);
    }
  });

  it('compares player archetypes and ensures no deadlock for any playstyle', () => {
    const durationSeconds = 300;

    // Archetype 1: Click only
    let ptsClickOnly = 0;
    let totalEarnedClickOnly = 0;
    let upgClickOnly: Record<string, number> = {};
    for (let s = 0; s < durationSeconds; s++) {
      for (let c = 0; c < 3; c++) {
        const { result } = processFrogClick({
          baseClickPower: 1,
          upgradeLevels: upgClickOnly,
          activeFrogBuffs: [],
          currentCombo: c,
          lastClickTimestamp: 0,
        });
        ptsClickOnly += result.earnedPoints;
        totalEarnedClickOnly += result.earnedPoints;
      }
      const cost = calculateBatchUpgradeCost(50, upgClickOnly['divine_finger'] || 0, 1);
      if (ptsClickOnly >= cost) {
        const res = purchaseUpgrade('divine_finger', 'x1', ptsClickOnly, upgClickOnly);
        if (res.success) {
          ptsClickOnly = res.newPoints;
          upgClickOnly = res.newLevels;
        }
      }
    }

    // Archetype 2: Idle only
    let ptsIdleOnly = 50;
    let totalEarnedIdleOnly = 50;
    let upgIdleOnly: Record<string, number> = { frog_touch_machine: 1 };
    ptsIdleOnly -= 50;
    for (let s = 0; s < durationSeconds; s++) {
      const pps = calculatePointsPerSecond(upgIdleOnly, []);
      ptsIdleOnly += pps;
      totalEarnedIdleOnly += pps;
      const cost = calculateBatchUpgradeCost(50, upgIdleOnly['frog_touch_machine'] || 0, 1);
      if (ptsIdleOnly >= cost) {
        const res = purchaseUpgrade('frog_touch_machine', 'x1', ptsIdleOnly, upgIdleOnly);
        if (res.success) {
          ptsIdleOnly = res.newPoints;
          upgIdleOnly = res.newLevels;
        }
      }
    }


    expect(totalEarnedClickOnly).toBeGreaterThan(500);
    expect(totalEarnedIdleOnly).toBeGreaterThan(200);
  });

});
