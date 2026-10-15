import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { FROG_SPECIES_LIST } from '../../data/frogs';
import {
  RARITY_CONFIG,
  getRequiredFragmentsForLevel,
  calculateFrogBuffValue,
  canLevelUpFrog,
  levelUpFrog,
  calculateActiveFrogBuffs,
  getFrogSpeciesById,
} from '../frogs';

describe('Frog Collection & Real Assets System', () => {
  it('contains at least 15 valid frog species', () => {
    expect(FROG_SPECIES_LIST.length).toBeGreaterThanOrEqual(15);
  });

  it('each frog species has valid name, scientificName, rarity, and credit information', () => {
    for (const frog of FROG_SPECIES_LIST) {
      expect(frog.id).toBeDefined();
      expect(frog.nameVi.length).toBeGreaterThan(0);
      expect(frog.rarity).toBeDefined();
      expect(RARITY_CONFIG[frog.rarity]).toBeDefined();
      expect(frog.buff).toBeDefined();
      expect(frog.buff.value).toBeGreaterThan(0);
      expect(frog.credit.source).toBe('Wikimedia Commons');
      expect(frog.credit.author.length).toBeGreaterThan(0);
      expect(frog.credit.license.length).toBeGreaterThan(0);
    }
  });

  it('each frog points to an existing transparent WebP file in public/assets/frogs', () => {
    for (const frog of FROG_SPECIES_LIST) {
      const cleanPath = frog.image.replace(/^\//, '');
      const fullPath = path.resolve(process.cwd(), 'public', cleanPath);
      expect(fs.existsSync(fullPath)).toBe(true);
      expect(frog.image.endsWith('.webp')).toBe(true);
    }
  });

  it('rarity probabilities in RARITY_CONFIG sum to exactly 100%', () => {
    const totalWeight = Object.values(RARITY_CONFIG).reduce((sum, r) => sum + r.gachaWeight, 0);
    expect(totalWeight).toBe(100);
  });

  describe('Fragment and Level Up logic', () => {
    it('calculates correct fragment requirement for levels', () => {
      expect(getRequiredFragmentsForLevel(1)).toBe(5);
      expect(getRequiredFragmentsForLevel(2)).toBe(10);
      expect(getRequiredFragmentsForLevel(3)).toBe(20);
    });

    it('scales buff value with frog level (+25% per level above 1)', () => {
      // base 0.10, level 1 -> 0.10
      expect(calculateFrogBuffValue(0.10, 1)).toBe(0.10);
      // base 0.10, level 2 -> 0.10 * 1.25 = 0.125
      expect(calculateFrogBuffValue(0.10, 2)).toBe(0.125);
    });

    it('handles level up accurately and prevents under-fragment level up', () => {
      const frog = { id: 'green_frog', level: 1, fragments: 4, unlockedAt: Date.now() };
      expect(canLevelUpFrog(frog)).toBe(false);

      const failRes = levelUpFrog(frog);
      expect(failRes.success).toBe(false);
      expect(failRes.newFrog.level).toBe(1);

      const readyFrog = { ...frog, fragments: 7 };
      expect(canLevelUpFrog(readyFrog)).toBe(true);

      const successRes = levelUpFrog(readyFrog);
      expect(successRes.success).toBe(true);
      expect(successRes.newFrog.level).toBe(2);
      expect(successRes.newFrog.fragments).toBe(2); // 7 - 5 = 2
    });
  });

  describe('calculateActiveFrogBuffs', () => {
    it('applies 100% buff for main frog and 20% passive collection buff for other owned frogs', () => {
      const owned = {
        green_frog: { id: 'green_frog', level: 1, fragments: 0, unlockedAt: 1 },
        tomato_frog: { id: 'tomato_frog', level: 1, fragments: 0, unlockedAt: 2 },
      };

      // Set green_frog as main
      const buffsWithGreenMain = calculateActiveFrogBuffs('green_frog', owned);
      
      const greenBuff = buffsWithGreenMain.find((b) => b.type === 'click_points_percent' && b.value === 0.10);
      expect(greenBuff).toBeDefined(); // 100% of 0.10

      // tomato_frog has base 0.25 click_points_percent, as passive it gives 20% -> 0.05
      const tomatoPassive = buffsWithGreenMain.find((b) => b.type === 'click_points_percent' && b.value === 0.05);
      expect(tomatoPassive).toBeDefined();
    });
  });
});
