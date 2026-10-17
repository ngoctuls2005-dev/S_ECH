import { describe, it, expect } from 'vitest';
import { calculateClickPower, processFrogClick } from '../clicker';
import { calculatePointsPerSecond, calculateOfflineReward } from '../idle';
import { purchaseUpgrade, calculateBatchUpgradeCost, UPGRADES_CONFIG } from '../upgrade';
import { executeGacha, INITIAL_PITY_STATE, getSpeciesDropRates } from '../gacha';
import { calculateActiveFrogBuffs } from '../frogs';
import { evaluateAchievements } from '../achievements';
import { FROG_SPECIES_LIST } from '../../data/frogs';

describe('Game Economy Balance Simulation v3.0 (Quality Recovery)', () => {
  describe('1. Early Game Pacing and Initial Progression', () => {
    it('enforces early game pacing: first click does not instantly grant first upgrade', () => {
      let points = 0;
      let totalClicks = 0;
      let unlockedAchievements: string[] = [];

      // Cú click đầu tiên
      totalClicks++;
      const { result } = processFrogClick({
        baseClickPower: 1,
        upgradeLevels: {},
        activeFrogBuffs: [],
        currentCombo: 1,
        lastClickTimestamp: 0,
        now: Date.now(),
      });
      points += result.earnedPoints;

      // Kiểm tra thành tựu sau 1 click
      const achResult = evaluateAchievements(
        {
          points,
          totalPointsEarned: points,
          totalClicks,
          highestCombo: 1,
          totalCrits: result.isCritical ? 1 : 0,
          totalGachaPulls: 0,
          ownedFrogs: { green_frog: { id: 'green_frog', level: 1, fragments: 0, unlockedAt: 1 } },
          upgrades: {},
          mainFrogId: 'green_frog',
        },
        unlockedAchievements
      );

      points += achResult.totalRewardsEarned;
      unlockedAchievements = achResult.achievements.filter((a) => a.isUnlocked).map((a) => a.id);

      // Điểm nhận được từ click (1 hoặc 2 nếu crit) + first_touch reward (20) = 21-22 điểm
      expect(unlockedAchievements).toContain('first_touch');
      expect(points).toBeGreaterThanOrEqual(21);
      expect(points).toBeLessThanOrEqual(25);

      // Nâng cấp đầu tiên rẻ nhất (divine_finger: 50 điểm) chưa thể mua ngay lập tức!
      const minUpgradeCost = calculateBatchUpgradeCost(50, 0, 1);
      expect(points).toBeLessThan(minUpgradeCost);

      // Người chơi cần bấm thêm khoảng 20-30 clicks nữa để mở khóa nâng cấp đầu tiên
      while (points < minUpgradeCost) {
        totalClicks++;
        const clickRes = processFrogClick({
          baseClickPower: 1,
          upgradeLevels: {},
          activeFrogBuffs: [],
          currentCombo: totalClicks,
          lastClickTimestamp: Date.now() - 500,
          now: Date.now(),
        });
        points += clickRes.result.earnedPoints;
      }

      // Đạt được nâng cấp đầu tiên sau khoảng 20-30 clicks tích lũy tự nhiên
      expect(totalClicks).toBeGreaterThanOrEqual(20);
      expect(totalClicks).toBeLessThanOrEqual(35);
      expect(points).toBeGreaterThanOrEqual(50);

      // Mua thành công nâng cấp đầu tiên
      const buyRes = purchaseUpgrade('divine_finger', 'x1', points, {});
      expect(buyRes.success).toBe(true);
      expect(buyRes.newLevels['divine_finger']).toBe(1);
    });

    it('enables first Gacha pull (500 pts) within natural early-session pacing (~80-120 clicks with click_100)', () => {
      let points = 0;
      let totalPointsEarned = 0;
      let upgradeLevels: Record<string, number> = {};
      let totalClicks = 0;
      let totalCrits = 0;
      let unlockedAchievements: string[] = [];

      for (let c = 1; c <= 150; c++) {
        totalClicks++;
        const clickRes = processFrogClick({
          baseClickPower: 1,
          upgradeLevels,
          activeFrogBuffs: [],
          currentCombo: c,
          lastClickTimestamp: Date.now() - 400,
          now: Date.now(),
        });
        points += clickRes.result.earnedPoints;
        totalPointsEarned += clickRes.result.earnedPoints;
        if (clickRes.result.isCritical) totalCrits++;

        // Kiểm tra và nhận thưởng thành tựu
        const achRes = evaluateAchievements(
          {
            points,
            totalPointsEarned,
            totalClicks,
            highestCombo: c,
            totalCrits,
            totalGachaPulls: 0,
            ownedFrogs: { green_frog: { id: 'green_frog', level: 1, fragments: 0, unlockedAt: 1 } },
            upgrades: upgradeLevels,
            mainFrogId: 'green_frog',
          },
          unlockedAchievements
        );

        if (achRes.totalRewardsEarned > 0) {
          points += achRes.totalRewardsEarned;
          totalPointsEarned += achRes.totalRewardsEarned;
          unlockedAchievements = achRes.achievements.filter((a) => a.isUnlocked).map((a) => a.id);
        }

        // Tự động mua divine_finger nếu đủ điểm và chưa đạt cấp 2
        const cost = calculateBatchUpgradeCost(50, upgradeLevels['divine_finger'] || 0, 1);
        if (points >= cost && (upgradeLevels['divine_finger'] || 0) < 2) {
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

      // Người chơi đạt đủ 500 điểm để quay gacha đầu tiên trong khoảng hợp lý
      expect(points).toBeGreaterThanOrEqual(500);
      expect(totalClicks).toBeLessThanOrEqual(120);

      // Thực hiện quay gacha đầu tiên thành công
      const gachaRes = executeGacha(1, points, {}, INITIAL_PITY_STATE);
      expect(gachaRes.success).toBe(true);
      expect(gachaRes.session?.pulls.length).toBe(1);
    });
  });

  describe('2. Five Player Archetypes Simulation (No Deadlocks)', () => {
    const DURATION_SECONDS = 300; // 5 phút mô phỏng

    it('simulates Archetype 1: Click Specialist (Clicks fast, focuses on Click Upgrades)', () => {
      let points = 0;
      let totalEarned = 0;
      let upgrades: Record<string, number> = {};
      let totalClicks = 0;

      for (let s = 0; s < DURATION_SECONDS; s++) {
        // Click 4 lần/giây
        for (let c = 0; c < 4; c++) {
          totalClicks++;
          const { result } = processFrogClick({
            baseClickPower: 1,
            upgradeLevels: upgrades,
            activeFrogBuffs: [],
            currentCombo: c + 1,
            lastClickTimestamp: Date.now() - 250,
          });
          points += result.earnedPoints;
          totalEarned += result.earnedPoints;
        }

        // Ưu tiên mua divine_finger và golden_glove
        const costFinger = calculateBatchUpgradeCost(50, upgrades['divine_finger'] || 0, 1);
        if (points >= costFinger) {
          const res = purchaseUpgrade('divine_finger', 'x1', points, upgrades);
          if (res.success) {
            points = res.newPoints;
            upgrades = res.newLevels;
          }
        }
        const costGlove = calculateBatchUpgradeCost(250, upgrades['golden_glove'] || 0, 1);
        if (points >= costGlove) {
          const res = purchaseUpgrade('golden_glove', 'x1', points, upgrades);
          if (res.success) {
            points = res.newPoints;
            upgrades = res.newLevels;
          }
        }
      }

      expect(totalEarned).toBeGreaterThan(2000);
      expect((upgrades['divine_finger'] || 0) + (upgrades['golden_glove'] || 0)).toBeGreaterThan(5);
    });

    it('simulates Archetype 2: Idle Specialist (Buys first idle machine then relies purely on PPS)', () => {
      let points = 50; // Giả sử click ban đầu đủ 50đ mua máy đầu
      let totalEarned = 50;
      let upgrades: Record<string, number> = { frog_touch_machine: 1 };
      points -= 50;

      for (let s = 0; s < DURATION_SECONDS; s++) {
        const pps = calculatePointsPerSecond(upgrades, []);
        points += pps;
        totalEarned += pps;

        // Tự động mua các máy sờ idle theo cấp độ giá
        const costMachine = calculateBatchUpgradeCost(50, upgrades['frog_touch_machine'] || 0, 1);
        if (points >= costMachine) {
          const res = purchaseUpgrade('frog_touch_machine', 'x1', points, upgrades);
          if (res.success) {
            points = res.newPoints;
            upgrades = res.newLevels;
          }
        }
        const costTeam = calculateBatchUpgradeCost(300, upgrades['frog_touch_team'] || 0, 1);
        if (points >= costTeam) {
          const res = purchaseUpgrade('frog_touch_team', 'x1', points, upgrades);
          if (res.success) {
            points = res.newPoints;
            upgrades = res.newLevels;
          }
        }
      }

      expect(totalEarned).toBeGreaterThan(500);
      expect(calculatePointsPerSecond(upgrades, [])).toBeGreaterThan(3);
    });

    it('simulates Archetype 3: Hybrid Player (Balanced Clicks and Idle Purchases)', () => {
      let points = 0;
      let totalEarned = 0;
      let upgrades: Record<string, number> = {};

      for (let s = 0; s < DURATION_SECONDS; s++) {
        // 2 clicks/s
        for (let c = 0; c < 2; c++) {
          const { result } = processFrogClick({
            baseClickPower: 1,
            upgradeLevels: upgrades,
            activeFrogBuffs: [],
            currentCombo: c + 1,
            lastClickTimestamp: Date.now() - 500,
          });
          points += result.earnedPoints;
          totalEarned += result.earnedPoints;
        }

        // Thêm PPS
        const pps = calculatePointsPerSecond(upgrades, []);
        points += pps;
        totalEarned += pps;

        // Mua luân phiên Click và Idle
        if (s % 2 === 0) {
          const cost = calculateBatchUpgradeCost(50, upgrades['divine_finger'] || 0, 1);
          if (points >= cost) {
            const res = purchaseUpgrade('divine_finger', 'x1', points, upgrades);
            if (res.success) {
              points = res.newPoints;
              upgrades = res.newLevels;
            }
          }
        } else {
          const cost = calculateBatchUpgradeCost(50, upgrades['frog_touch_machine'] || 0, 1);
          if (points >= cost) {
            const res = purchaseUpgrade('frog_touch_machine', 'x1', points, upgrades);
            if (res.success) {
              points = res.newPoints;
              upgrades = res.newLevels;
            }
          }
        }
      }

      expect(totalEarned).toBeGreaterThan(1500);
      expect(upgrades['divine_finger']).toBeGreaterThanOrEqual(2);
      expect(upgrades['frog_touch_machine']).toBeGreaterThanOrEqual(2);
    });

    it('simulates Archetype 4: Gacha Enthusiast (Reinvests points into pulls for passive collection buffs)', () => {
      let points = 1000;
      let ownedFrogs: Record<string, any> = {
        green_frog: { id: 'green_frog', level: 1, fragments: 0, unlockedAt: 1 },
      };
      let pity = INITIAL_PITY_STATE;
      let totalPulls = 0;

      // Thực hiện quay gacha tích lũy
      while (points >= 500 && totalPulls < 10) {
        const res = executeGacha(1, points, ownedFrogs, pity, 'ao_sen');
        if (res.success && res.session) {
          points = res.session.newPoints;
          ownedFrogs = res.session.newOwnedFrogs;
          pity = res.session.newPity;
          totalPulls++;
        }
      }

      expect(totalPulls).toBe(2);
      const buffs = calculateActiveFrogBuffs('green_frog', ownedFrogs);
      expect(buffs.length).toBeGreaterThanOrEqual(1);
    });

    it('simulates Archetype 5: Upgrade Optimizer (Always purchases lowest cost available upgrade)', () => {
      let points = 2000;
      let upgrades: Record<string, number> = {};

      for (let iter = 0; iter < 10; iter++) {
        // Tìm upgrade có chi phí rẻ nhất hiện tại
        let cheapestUpgradeId: string | null = null;
        let lowestCost = Infinity;

        for (const upg of UPGRADES_CONFIG.slice(0, 5)) {
          const cost = calculateBatchUpgradeCost(upg.basePrice, upgrades[upg.id] || 0, 1);
          if (cost < lowestCost) {
            lowestCost = cost;
            cheapestUpgradeId = upg.id;
          }
        }

        if (cheapestUpgradeId && points >= lowestCost) {
          const res = purchaseUpgrade(cheapestUpgradeId, 'x1', points, upgrades);
          if (res.success) {
            points = res.newPoints;
            upgrades = res.newLevels;
          }
        }
      }

      const totalLevels = Object.values(upgrades).reduce((a, b) => a + b, 0);
      expect(totalLevels).toBeGreaterThanOrEqual(5);
    });
  });

  describe('3. Multi-Horizon Progression and Number Safety (1m to 24h)', () => {
    it('verifies 1m, 5m, 15m, 30m, 1h, 3h, 12h, and 24h progress without overflow or NaN', () => {
      const midGameUpgrades: Record<string, number> = {
        frog_touch_machine: 15,
        frog_touch_team: 10,
        frog_factory: 8,
        frog_magic: 5,
        frog_altar: 3,
        frog_dimension_portal: 1,
      };

      const ownedFrogs: Record<string, any> = {
        green_frog: { id: 'green_frog', level: 3, fragments: 2, unlockedAt: 1 },
        bullfrog: { id: 'bullfrog', level: 2, fragments: 0, unlockedAt: 1 },
        golden_poison_frog: { id: 'golden_poison_frog', level: 1, fragments: 0, unlockedAt: 1 },
      };

      const buffs = calculateActiveFrogBuffs('green_frog', ownedFrogs);
      const pps = calculatePointsPerSecond(midGameUpgrades, buffs);
      expect(pps).toBeGreaterThan(100);

      const baseTimestamp = 1_700_000_000_000;

      const horizons = [
        { label: '1m', seconds: 60, expectCapped: false },
        { label: '5m', seconds: 300, expectCapped: false },
        { label: '15m', seconds: 900, expectCapped: false },
        { label: '30m', seconds: 1800, expectCapped: false },
        { label: '1h', seconds: 3600, expectCapped: false },
        { label: '3h', seconds: 10800, expectCapped: false },
        { label: '8h', seconds: 28800, expectCapped: false },
        { label: '12h', seconds: 43200, expectCapped: true }, // Vượt trần 8h mặc định
        { label: '24h', seconds: 86400, expectCapped: true }, // Vượt trần 8h mặc định
      ];

      let lastReward = 0;
      for (const h of horizons) {
        const reward = calculateOfflineReward(baseTimestamp, baseTimestamp + h.seconds * 1000, pps);
        expect(reward).not.toBeNull();
        expect(Number.isFinite(reward!.earnedPoints)).toBe(true);
        expect(Number.isNaN(reward!.earnedPoints)).toBe(false);
        expect(reward!.wasCapped).toBe(h.expectCapped);
        expect(reward!.earnedPoints).toBeGreaterThanOrEqual(lastReward);
        lastReward = reward!.earnedPoints;
      }

      // Xác nhận trần 8h: Phần thưởng ở mốc 12h và 24h phải bằng nhau do chạm trần 8h
      const reward12h = calculateOfflineReward(baseTimestamp, baseTimestamp + 43200 * 1000, pps);
      const reward24h = calculateOfflineReward(baseTimestamp, baseTimestamp + 86400 * 1000, pps);
      expect(reward12h?.earnedPoints).toBe(reward24h?.earnedPoints);
    });

    it('simulates absolute late-game economy (all 18 upgrades at lv 50, all 40 frogs) within MAX_SAFE_INTEGER', () => {
      const lateGameUpgrades: Record<string, number> = {};
      for (const u of UPGRADES_CONFIG) {
        lateGameUpgrades[u.id] = 50; // Cấp 50 cho mọi nâng cấp
      }

      const lateGameFrogs: Record<string, any> = {};
      for (const f of FROG_SPECIES_LIST) {
        lateGameFrogs[f.id] = { id: f.id, level: 5, fragments: 20, unlockedAt: 1 };
      }

      const buffs = calculateActiveFrogBuffs('chronos_frog', lateGameFrogs);
      const pps = calculatePointsPerSecond(lateGameUpgrades, buffs);
      const clickPower = calculateClickPower(1, lateGameUpgrades, buffs);

      expect(Number.isFinite(pps)).toBe(true);
      expect(Number.isFinite(clickPower)).toBe(true);
      expect(pps).toBeGreaterThan(10_000_000);
      expect(pps).toBeLessThan(Number.MAX_SAFE_INTEGER / 1000);

      // Offline reward late-game không bao giờ bị NaN hay Infinity
      const lateOffline = calculateOfflineReward(1000, 1000 + 86400 * 1000, pps);
      expect(lateOffline).not.toBeNull();
      expect(Number.isFinite(lateOffline!.earnedPoints)).toBe(true);
      expect(lateOffline!.earnedPoints).toBeLessThan(Number.MAX_SAFE_INTEGER);
    });

    it('guarantees 100% total drop rate integrity for all 3 Gacha pools', () => {
      for (const pool of ['ao_sen', 'rung_mua', 'dem_trang'] as const) {
        const dropRates = getSpeciesDropRates(pool, {});
        const total = dropRates.reduce((acc, r) => acc + r.dropChancePercent, 0);
        expect(total).toBeGreaterThan(99.0);
        expect(total).toBeLessThan(101.0);
      }
    });
  });
});
