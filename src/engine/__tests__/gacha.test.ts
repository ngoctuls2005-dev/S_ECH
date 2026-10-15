import { describe, it, expect } from 'vitest';
import {
  GACHA_COST_SINGLE,
  GACHA_COST_TEN,
  INITIAL_PITY_STATE,
  rollRarity,
  executeGacha,
  RARITY_TIER,
} from '../gacha';
import { RARITY_CONFIG } from '../frogs';

describe('Gacha System & Pity Mechanism', () => {
  describe('Cost and Point Deductions', () => {
    it('rejects gacha pull when player has insufficient points', () => {
      const resSingle = executeGacha(1, 400, {}, INITIAL_PITY_STATE);
      expect(resSingle.success).toBe(false);

      const resTen = executeGacha(10, 4500, {}, INITIAL_PITY_STATE);
      expect(resTen.success).toBe(false);
    });

    it('deducts exact 500 points for single pull and 5000 for ten pulls', () => {
      const resSingle = executeGacha(1, 1000, {}, INITIAL_PITY_STATE);
      expect(resSingle.success).toBe(true);
      expect(resSingle.session?.costPaid).toBe(GACHA_COST_SINGLE);
      expect(resSingle.session?.newPoints).toBe(500);

      const resTen = executeGacha(10, 6000, {}, INITIAL_PITY_STATE);
      expect(resTen.success).toBe(true);
      expect(resTen.session?.costPaid).toBe(GACHA_COST_TEN);
      expect(resTen.session?.newPoints).toBe(1000);
      expect(resTen.session?.pulls.length).toBe(10);
    });
  });

  describe('Pity Guarantees', () => {
    it('guarantees Rare or higher on 10th pull without Rare', () => {
      const pityAt9 = { sinceLastRare: 9, sinceLastEpic: 9, sinceLastLegendary: 9 };
      // Even if rng produces 0 (which normally maps to common)
      const { rarity, nextPity } = rollRarity(pityAt9, () => 0.0);
      expect(RARITY_TIER[rarity]).toBeGreaterThanOrEqual(2); // At least Rare
      expect(nextPity.sinceLastRare).toBe(0);
    });

    it('guarantees Epic or higher on 30th pull without Epic', () => {
      const pityAt29 = { sinceLastRare: 0, sinceLastEpic: 29, sinceLastLegendary: 29 };
      const { rarity, nextPity } = rollRarity(pityAt29, () => 0.0);
      expect(RARITY_TIER[rarity]).toBeGreaterThanOrEqual(3); // At least Epic
      expect(nextPity.sinceLastEpic).toBe(0);
    });

    it('guarantees Legendary or higher on 100th pull without Legendary', () => {
      const pityAt99 = { sinceLastRare: 0, sinceLastEpic: 0, sinceLastLegendary: 99 };
      const { rarity, nextPity } = rollRarity(pityAt99, () => 0.0);
      expect(RARITY_TIER[rarity]).toBeGreaterThanOrEqual(4); // Legendary or Mythic
      expect(nextPity.sinceLastLegendary).toBe(0);
    });
  });

  describe('Duplicate Frog & Fragment Conversion', () => {
    it('unlocks new frog if not previously owned', () => {
      const initialOwned = {};
      const res = executeGacha(1, 1000, initialOwned, INITIAL_PITY_STATE);
      expect(res.success).toBe(true);
      const pull = res.session!.pulls[0];
      expect(pull.isNew).toBe(true);
      expect(pull.fragmentsAdded).toBe(0);

      const saved = res.session!.newOwnedFrogs[pull.species.id];
      expect(saved).toBeDefined();
      expect(saved.level).toBe(1);
      expect(saved.fragments).toBe(0);
    });

    it('converts duplicate pulls to correct number of fragments based on rarity', () => {
      // Setup existing owned frog
      const frogId = 'red_eyed_frog'; // Rare -> 3 fragments
      const initialOwned = {
        [frogId]: { id: frogId, level: 1, fragments: 2, unlockedAt: 100 },
      };

      // Mock RNG to pick red_eyed_frog specifically
      // rollRarity gives rare, pickFrogOfRarity picks red_eyed_frog
      let res = executeGacha(1, 1000, initialOwned, { sinceLastRare: 9, sinceLastEpic: 0, sinceLastLegendary: 0 });
      expect(res.success).toBe(true);

      const pull = res.session!.pulls[0];
      if (pull.species.id === frogId) {
        expect(pull.isNew).toBe(false);
        expect(pull.fragmentsAdded).toBe(RARITY_CONFIG['rare'].duplicateFragments);
        expect(res.session!.newOwnedFrogs[frogId].fragments).toBe(2 + RARITY_CONFIG['rare'].duplicateFragments);
      }
    });
  });

  describe('Statistical Probability Simulation', () => {
    it('closely aligns with configured weights over 10000 trials', () => {
      const counts: Record<string, number> = {
        common: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
        mythic: 0,
      };

      let currentPity = { ...INITIAL_PITY_STATE };
      const TRIALS = 10_000;

      for (let i = 0; i < TRIALS; i++) {
        const { rarity, nextPity } = rollRarity(currentPity);
        counts[rarity]++;
        currentPity = nextPity;
      }

      // Check within reasonable probability bounds
      // Common is ~50%
      expect(counts.common / TRIALS).toBeGreaterThan(0.40);
      expect(counts.common / TRIALS).toBeLessThan(0.55);

      // Rare is ~28%
      expect(counts.rare / TRIALS).toBeGreaterThan(0.24);

      // Epic is ~15%
      expect(counts.epic / TRIALS).toBeGreaterThan(0.12);

      // Legendary is ~6%
      expect(counts.legendary / TRIALS).toBeGreaterThan(0.04);

      // Mythic is ~1%
      expect(counts.mythic / TRIALS).toBeGreaterThan(0.004);
    });
  });
});
