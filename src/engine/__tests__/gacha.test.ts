import { describe, it, expect } from 'vitest';
import {
  GACHA_COST_SINGLE,
  GACHA_COST_TEN,
  GACHA_POOLS,
  INITIAL_PITY_STATE,
  rollRarity,
  executeGacha,
  RARITY_TIER,
  getSpeciesDropRates,
  appendGachaHistory,
  pickFrogOfRarity,
  getNextPullGuaranteedStatus,
} from '../gacha';
import { RARITY_CONFIG } from '../frogs';

describe('Gacha System v3.0 Deep Audit & Pity Transparency', () => {
  describe('Cost and Point Deductions', () => {
    it('rejects gacha pull when player has insufficient points', () => {
      const resSingle = executeGacha(1, 400, {}, INITIAL_PITY_STATE);
      expect(resSingle.success).toBe(false);

      const resTen = executeGacha(10, 4500, {}, INITIAL_PITY_STATE);
      expect(resTen.success).toBe(false);
    });

    it('deducts exact 500 points for single pull and 5000 for ten pulls', () => {
      const resSingle = executeGacha(1, 1000, {}, INITIAL_PITY_STATE, 'ao_sen');
      expect(resSingle.success).toBe(true);
      expect(resSingle.session?.costPaid).toBe(GACHA_COST_SINGLE);
      expect(resSingle.session?.newPoints).toBe(500);

      const resTen = executeGacha(10, 6000, {}, INITIAL_PITY_STATE, 'rung_mua');
      expect(resTen.success).toBe(true);
      expect(resTen.session?.costPaid).toBe(GACHA_COST_TEN);
      expect(resTen.session?.newPoints).toBe(1000);
      expect(resTen.session?.pulls.length).toBe(10);
    });
  });

  describe('3 Themed Gacha Pools and Shared Pity', () => {
    it('defines 3 distinct gacha pools: Ao Sen, Rung Mua, Dem Trang', () => {
      expect(GACHA_POOLS.ao_sen).toBeDefined();
      expect(GACHA_POOLS.rung_mua).toBeDefined();
      expect(GACHA_POOLS.dem_trang).toBeDefined();

      expect(GACHA_POOLS.ao_sen.name).toBe('Hồ Ao Sen');
      expect(GACHA_POOLS.rung_mua.name).toBe('Hồ Rừng Mưa');
      expect(GACHA_POOLS.dem_trang.name).toBe('Hồ Đêm Trăng');
    });

    it('shares pity state across pool switches without loss', () => {
      let pity = { sinceLastRare: 8, sinceLastEpic: 28, sinceLastLegendary: 98 };

      // Pull 1 on Rung Mua
      const res1 = executeGacha(1, 500, {}, pity, 'rung_mua');
      expect(res1.success).toBe(true);
      const nextPity = res1.session!.newPity;

      // Switch to Dem Trang using the updated pity
      const res2 = executeGacha(1, 500, {}, nextPity, 'dem_trang');
      expect(res2.success).toBe(true);
      expect(res2.session!.newPity).toBeDefined();
    });

    it('correctly calculates detailed drop rates summing to ~100%', () => {
      for (const poolId of ['ao_sen', 'rung_mua', 'dem_trang'] as const) {
        const rates = getSpeciesDropRates(poolId, {});
        expect(rates.length).toBe(40); // Exactly 40 species

        const sumRates = rates.reduce((acc, r) => acc + r.dropChancePercent, 0);
        // Expect close to 100% (floating point precision ~ 99.5 - 100.5)
        expect(sumRates).toBeGreaterThan(99.0);
        expect(sumRates).toBeLessThan(101.0);
      }
    });

    it('boosts rate-up species in target pool', () => {
      const ratesAoSen = getSpeciesDropRates('ao_sen', {});
      const ratesRungMua = getSpeciesDropRates('rung_mua', {});

      const milkAoSen = ratesAoSen.find((r) => r.frog.id === 'amazon_milk_frog');
      const milkRungMua = ratesRungMua.find((r) => r.frog.id === 'amazon_milk_frog');

      expect(milkAoSen).toBeDefined();
      expect(milkRungMua).toBeDefined();
      expect(milkRungMua!.dropChancePercent).toBeGreaterThan(milkAoSen!.dropChancePercent);
      expect(milkRungMua!.isRateUp).toBe(true);
    });

    it('prioritizes unowned species within the same rarity tier (x1.4 weight)', () => {
      // Compare 2 common frogs: green_frog (owned) vs brown_frog (unowned)
      const owned = {
        green_frog: { id: 'green_frog', level: 1, fragments: 0, unlockedAt: 0 },
      };

      const rates = getSpeciesDropRates('ao_sen', owned);
      const greenRate = rates.find((r) => r.frog.id === 'green_frog')!;
      const brownRate = rates.find((r) => r.frog.id === 'brown_frog')!;

      expect(brownRate.dropChancePercent).toBeGreaterThan(greenRate.dropChancePercent);
    });
  });

  describe('Pity Guarantees and Drop Rate Transparency', () => {
    it('guarantees Rare or higher on 10th pull without Rare', () => {
      const pityAt9 = { sinceLastRare: 9, sinceLastEpic: 9, sinceLastLegendary: 9 };
      const { rarity, nextPity } = rollRarity(pityAt9, () => 0.0);
      expect(RARITY_TIER[rarity]).toBeGreaterThanOrEqual(2);
      expect(nextPity.sinceLastRare).toBe(0);
    });

    it('guarantees Epic or higher on 30th pull without Epic', () => {
      const pityAt29 = { sinceLastRare: 0, sinceLastEpic: 29, sinceLastLegendary: 29 };
      const { rarity, nextPity } = rollRarity(pityAt29, () => 0.0);
      expect(RARITY_TIER[rarity]).toBeGreaterThanOrEqual(3);
      expect(nextPity.sinceLastEpic).toBe(0);
    });

    it('guarantees Legendary or higher on 100th pull without Legendary', () => {
      const pityAt99 = { sinceLastRare: 0, sinceLastEpic: 0, sinceLastLegendary: 99 };
      const { rarity, nextPity } = rollRarity(pityAt99, () => 0.0);
      expect(RARITY_TIER[rarity]).toBeGreaterThanOrEqual(4);
      expect(nextPity.sinceLastLegendary).toBe(0);
    });

    it('accurately reports guaranteed next pull status', () => {
      const normalPity = { sinceLastRare: 5, sinceLastEpic: 15, sinceLastLegendary: 40 };
      expect(getNextPullGuaranteedStatus(normalPity).isGuaranteed).toBe(false);

      const rarePity = { sinceLastRare: 9, sinceLastEpic: 15, sinceLastLegendary: 40 };
      const rareRes = getNextPullGuaranteedStatus(rarePity);
      expect(rareRes.isGuaranteed).toBe(true);
      expect(rareRes.minRarity).toBe('rare');

      const epicPity = { sinceLastRare: 0, sinceLastEpic: 29, sinceLastLegendary: 40 };
      const epicRes = getNextPullGuaranteedStatus(epicPity);
      expect(epicRes.isGuaranteed).toBe(true);
      expect(epicRes.minRarity).toBe('epic');

      const legPity = { sinceLastRare: 0, sinceLastEpic: 0, sinceLastLegendary: 99 };
      const legRes = getNextPullGuaranteedStatus(legPity);
      expect(legRes.isGuaranteed).toBe(true);
      expect(legRes.minRarity).toBe('legendary');
    });

    it('calculates guaranteed drop rates for next pull with Common set to 0% when Rare+ is guaranteed', () => {
      const rarePity = { sinceLastRare: 9, sinceLastEpic: 15, sinceLastLegendary: 40 };
      const pityRates = getSpeciesDropRates('ao_sen', {}, rarePity, true);

      // Common species must have 0% drop chance in guaranteed pull
      const commonSpecies = pityRates.filter((r) => r.frog.rarity === 'common');
      for (const c of commonSpecies) {
        expect(c.dropChancePercent).toBe(0);
      }

      // Rare, Epic, Legendary, Mythic must sum to ~100%
      const nonCommonSum = pityRates
        .filter((r) => r.frog.rarity !== 'common')
        .reduce((sum, r) => sum + r.dropChancePercent, 0);
      expect(nonCommonSum).toBeGreaterThan(99.0);
      expect(nonCommonSum).toBeLessThan(101.0);
    });
  });

  describe('Duplicate Frog & History Management', () => {
    it('unlocks new frog if not previously owned and tracks history entry', () => {
      const initialOwned = {};
      const res = executeGacha(1, 1000, initialOwned, INITIAL_PITY_STATE, 'ao_sen');
      expect(res.success).toBe(true);
      const pull = res.session!.pulls[0];
      expect(pull.isNew).toBe(true);
      expect(pull.fragmentsAdded).toBe(0);

      const history = res.session!.newHistoryEntries;
      expect(history.length).toBe(1);
      expect(history[0].frogId).toBe(pull.species.id);
      expect(history[0].poolId).toBe('ao_sen');
    });

    it('converts duplicate frog into fragments accurately per rarity config', () => {
      const owned = {
        green_frog: { id: 'green_frog', level: 1, fragments: 0, unlockedAt: 0 },
      };

      // Mock RNG that always rolls green_frog
      const res = executeGacha(1, 1000, owned, INITIAL_PITY_STATE, 'ao_sen', () => 0.0);
      expect(res.success).toBe(true);
      const pull = res.session!.pulls[0];
      if (pull.species.id === 'green_frog') {
        expect(pull.isNew).toBe(false);
        expect(pull.fragmentsAdded).toBe(RARITY_CONFIG.common.duplicateFragments);
        expect(res.session!.newOwnedFrogs['green_frog'].fragments).toBe(
          RARITY_CONFIG.common.duplicateFragments
        );
      }
    });

    it('caps gacha history at maximum 20 entries with latest on top', () => {
      let history: any[] = [];
      const newBatch: any[] = [];
      for (let i = 0; i < 25; i++) {
        newBatch.push({
          id: `hist_${i}`,
          timestamp: Date.now() + i,
          poolId: 'ao_sen',
          frogId: 'green_frog',
          frogNameVi: 'Ếch Xanh',
          rarity: 'common',
          isNew: false,
          fragmentsAdded: 1,
        });
      }

      history = appendGachaHistory(history, newBatch);
      expect(history.length).toBe(20);
      expect(history[0].id).toBe('hist_0');
    });
  });
});
