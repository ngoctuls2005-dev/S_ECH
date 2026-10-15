import { describe, it, expect } from 'vitest';
import {
  UPGRADES_CONFIG,
  getSingleUpgradePrice,
  calculateBatchUpgradeCost,
  calculateMaxAffordableUpgrades,
  purchaseUpgrade,
} from '../upgrade';

describe('Upgrade System', () => {
  it('defines exactly 8 standard upgrades with correct initial base prices', () => {
    expect(UPGRADES_CONFIG.length).toBe(8);

    const priceMap: Record<string, number> = {
      divine_finger: 50,
      soft_glove: 250,
      frog_touch_machine: 100,
      frog_touch_team: 1000,
      lucky_hand: 2500,
      frog_combo: 5000,
      frog_factory: 15000,
      frog_magic: 50000,
    };

    for (const item of UPGRADES_CONFIG) {
      expect(priceMap[item.id]).toBeDefined();
      expect(item.basePrice).toBe(priceMap[item.id]);
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
  });
});
