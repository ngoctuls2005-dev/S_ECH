import { describe, it, expect } from 'vitest';
import {
  UPGRADES_CONFIG,
  getSingleUpgradePrice,
  calculateBatchUpgradeCost,
  calculateMaxAffordableUpgrades,
  purchaseUpgrade,
} from '../upgrade';

describe('Upgrade System', () => {
  it('defines exactly 18 upgrades with correct initial base prices and categories', () => {
    expect(UPGRADES_CONFIG.length).toBe(18);

    const priceMap: Record<string, number> = {
      divine_finger: 50,
      soft_glove: 250,
      frog_touch_machine: 100,
      frog_touch_team: 1000,
      lucky_hand: 2500,
      frog_combo: 5000,
      frog_factory: 15000,
      frog_magic: 50000,
      platinum_hand: 80000,
      conveyor_touch: 150000,
      precise_touch: 300000,
      legendary_handprint: 750000,
      robot_touch: 1000000,
      crit_mastery: 2000000,
      frog_ranch: 6000000,
      cosmic_hand: 12000000,
      frog_corporation: 40000000,
      frog_sanctuary: 250000000,
    };

    for (const item of UPGRADES_CONFIG) {
      expect(priceMap[item.id]).toBeDefined();
      expect(item.basePrice).toBe(priceMap[item.id]);
      expect(item.category).toBeDefined();
    }
  });

  describe('Price Formula', () => {
    it('calculates price = ceil(basePrice * 1.15 ^ level)', () => {
      // Level 0: 50 * 1.15^0 = 50
      expect(getSingleUpgradePrice(50, 0)).toBe(50);
      // Level 1: ceil(50 * 1.15) = 58
      expect(getSingleUpgradePrice(50, 1)).toBe(58);
      // Level 2: ceil(50 * 1.15^2) = ceil(50 * 1.3225) = ceil(66.125) = 67
      expect(getSingleUpgradePrice(50, 2)).toBe(67);
    });

    it('calculates batch cost x10 matching sum of individual prices', () => {
      let manualSum = 0;
      for (let i = 0; i < 10; i++) {
        manualSum += getSingleUpgradePrice(50, i);
      }
      const batchCost = calculateBatchUpgradeCost(50, 0, 10);
      expect(batchCost).toBe(manualSum);
    });
  });

  describe('calculateMaxAffordableUpgrades', () => {
    it('returns 0 when points are insufficient for level 1', () => {
      const res = calculateMaxAffordableUpgrades(50, 0, 30);
      expect(res.count).toBe(0);
      expect(res.totalCost).toBe(0);
    });

    it('returns correct max count within available points', () => {
      // For base 50, level 0:
      // level 0: 50
      // level 1: 58 (total 108)
      // level 2: 67 (total 175)
      // with 150 points, can buy 2 levels (cost 108)
      const res = calculateMaxAffordableUpgrades(50, 0, 150);
      expect(res.count).toBe(2);
      expect(res.totalCost).toBe(108);
    });
  });

  describe('purchaseUpgrade', () => {
    it('buys 1 level successfully and deducts points', () => {
      const res = purchaseUpgrade('divine_finger', 'x1', 100, {});
      expect(res.success).toBe(true);
      expect(res.levelsBought).toBe(1);
      expect(res.cost).toBe(50);
      expect(res.newPoints).toBe(50);
      expect(res.newLevels['divine_finger']).toBe(1);
    });

    it('fails when points are insufficient', () => {
      const res = purchaseUpgrade('divine_finger', 'x1', 20, {});
      expect(res.success).toBe(false);
      expect(res.newPoints).toBe(20);
      expect(res.levelsBought).toBe(0);
      expect(res.cost).toBe(0);
    });

    it('handles x10 purchase correctly', () => {
      const costFor10 = calculateBatchUpgradeCost(50, 0, 10);
      const res = purchaseUpgrade('divine_finger', 'x10', costFor10 + 100, {});
      expect(res.success).toBe(true);
      expect(res.levelsBought).toBe(10);
      expect(res.newPoints).toBe(100);
      expect(res.newLevels['divine_finger']).toBe(10);
    });

    it('handles MAX purchase correctly', () => {
      // With 150 points and 0 level, can buy 2 levels of divine_finger
      const res = purchaseUpgrade('divine_finger', 'max', 150, {});
      expect(res.success).toBe(true);
      expect(res.levelsBought).toBe(2);
      expect(res.cost).toBe(108);
      expect(res.newPoints).toBe(42);
      expect(res.newLevels['divine_finger']).toBe(2);
    });

    it('never leaves negative points', () => {
      const res = purchaseUpgrade('frog_magic', 'max', 40000, {});
      expect(res.success).toBe(false);
      expect(res.newPoints).toBe(40000);
    });

    it('applies frog discount buff properly', () => {
      const buffs = [{ type: 'upgrade_discount_percent' as const, value: 0.20 }]; // 20% discount
      // Base 50 at level 0: ceil(50 * 0.8) = 40
      const res = purchaseUpgrade('divine_finger', 'x1', 100, {}, buffs);
      expect(res.success).toBe(true);
      expect(res.cost).toBe(40);
      expect(res.newPoints).toBe(60);
    });

    it('successfully purchases newly added v2.0 upgrades (e.g. platinum_hand, frog_sanctuary)', () => {
      // Platinum hand (base 80,000)
      const resPlat = purchaseUpgrade('platinum_hand', 'x1', 100000, {});
      expect(resPlat.success).toBe(true);
      expect(resPlat.cost).toBe(80000);
      expect(resPlat.newPoints).toBe(20000);
      expect(resPlat.newLevels['platinum_hand']).toBe(1);

      // Frog sanctuary (base 250,000,000)
      const resSanc = purchaseUpgrade('frog_sanctuary', 'x1', 300000000, {});
      expect(resSanc.success).toBe(true);
      expect(resSanc.cost).toBe(250000000);
      expect(resSanc.newLevels['frog_sanctuary']).toBe(1);
    });
  });

  describe('Task H — Upgrade Configuration & Engine Architecture Cross-Validation', () => {
    it('verifies all 18 upgrades have verified effects and no dead upgrades exist', () => {
      const upgradeIds = UPGRADES_CONFIG.map((u) => u.id);
      expect(upgradeIds.length).toBe(18);

      // Verify each upgrade has valid effectType and positive effectValue
      for (const u of UPGRADES_CONFIG) {
        expect(['click_flat', 'idle_flat', 'crit_chance_flat', 'crit_multiplier_flat', 'combo_bonus_flat', 'multiplier_percent']).toContain(u.effectType);
        expect(u.effectValue).toBeGreaterThan(0);
        expect(u.basePrice).toBeGreaterThan(0);
      }
    });

    it('rejects purchases for non-existent upgrade IDs gracefully', () => {
      const invalidRes = purchaseUpgrade('non_existent_upgrade_xyz', 'x1', 999999, {});
      expect(invalidRes.success).toBe(false);
      expect(invalidRes.cost).toBe(0);
      expect(invalidRes.levelsBought).toBe(0);
    });
  });
});
