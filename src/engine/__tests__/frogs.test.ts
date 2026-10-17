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
  previewFrogBuffImpact,
  getFrogSpeciesById,
} from '../frogs';

describe('Frog Collection v2.0 & Real Assets System', () => {
  it('contains exactly 40 frog species with targeted rarity distribution', () => {
    expect(FROG_SPECIES_LIST.length).toBe(40);

    const counts = {
      common: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
      mythic: 0,
    };

    for (const frog of FROG_SPECIES_LIST) {
      counts[frog.rarity]++;
    }

    expect(counts.common).toBe(8);
    expect(counts.rare).toBe(10);
    expect(counts.epic).toBe(11);
    expect(counts.legendary).toBe(6);
    expect(counts.mythic).toBe(5);
  });

  it('correctly standardizes taxonomy for glass_frog and rain_frog', () => {
    const glassFrog = FROG_SPECIES_LIST.find((f) => f.id === 'glass_frog');
    expect(glassFrog).toBeDefined();
    expect(glassFrog?.scientificName).toBe('Centrolene prosoblepon');
    expect(glassFrog?.nameVi).toContain('Ngọc Lục Bảo');

    const rainFrog = FROG_SPECIES_LIST.find((f) => f.id === 'rain_frog');
    expect(rainFrog).toBeDefined();
    expect(rainFrog?.scientificName).toBe('Breviceps adspersus');
    expect(rainFrog?.nameVi).toContain('Bụi Rậm');
  });

  it('each frog species has valid name, scientificName, rarity, and credit information', () => {
    for (const frog of FROG_SPECIES_LIST) {
      expect(frog.id).toBeDefined();
      expect(frog.nameVi.length).toBeGreaterThan(0);
      expect(frog.rarity).toBeDefined();
      expect(RARITY_CONFIG[frog.rarity]).toBeDefined();
      expect(frog.buff).toBeDefined();
      expect(frog.buff.value).toBeGreaterThan(0);
      expect(frog.credit.source.length).toBeGreaterThan(0);
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
      expect(calculateFrogBuffValue(0.10, 1)).toBe(0.10);
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
      expect(successRes.newFrog.fragments).toBe(2);
    });
  });

  describe('calculateActiveFrogBuffs & Soft-cap balancing', () => {
    it('applies 100% buff for main frog and 20% passive collection buff for other owned frogs', () => {
      const owned = {
        green_frog: { id: 'green_frog', level: 1, fragments: 0, unlockedAt: 1 },
        tomato_frog: { id: 'tomato_frog', level: 1, fragments: 0, unlockedAt: 2 },
      };

      const buffsWithGreenMain = calculateActiveFrogBuffs('green_frog', owned);
      
      const greenBuff = buffsWithGreenMain.find((b) => b.type === 'click_points_percent' && b.value === 0.10);
      expect(greenBuff).toBeDefined();

      const tomatoPassive = buffsWithGreenMain.find((b) => b.type === 'click_points_percent' && b.value === 0.05);
      expect(tomatoPassive).toBeDefined();
    });

    it('safeguards passive crit and discounts with diminishing returns when owning all 40 frogs', () => {
      // Simulate player owning all 40 frogs at level 1
      const allOwned: Record<string, any> = {};
      for (const f of FROG_SPECIES_LIST) {
        allOwned[f.id] = { id: f.id, level: 1, fragments: 0, unlockedAt: Date.now() };
      }

      const buffs = calculateActiveFrogBuffs('green_frog', allOwned);

      // Total crit chance bonus from passive frogs must remain safely below 35%
      const passiveCrits = buffs.filter((b) => b.type === 'crit_chance_bonus');
      const totalPassiveCrit = passiveCrits.reduce((acc, curr) => acc + curr.value, 0);
      expect(totalPassiveCrit).toBeLessThanOrEqual(0.35);

      // Total upgrade discount from passive frogs must remain below 50%
      const passiveDiscounts = buffs.filter((b) => b.type === 'upgrade_discount_percent');
      const totalPassiveDiscount = passiveDiscounts.reduce((acc, curr) => acc + curr.value, 0);
      expect(totalPassiveDiscount).toBeLessThanOrEqual(0.50);
    });

    it('previews buff impact correctly when switching main frog', () => {
      const owned = {
        green_frog: { id: 'green_frog', level: 1, fragments: 0, unlockedAt: 1 },
        tomato_frog: { id: 'tomato_frog', level: 1, fragments: 0, unlockedAt: 2 },
      };

      const { currentBuffs, previewBuffs } = previewFrogBuffImpact('green_frog', 'tomato_frog', owned);
      expect(currentBuffs).toBeDefined();
      expect(previewBuffs).toBeDefined();

      const currentMain = currentBuffs.find((b) => b.value === 0.10);
      expect(currentMain).toBeDefined();

      const previewMain = previewBuffs.find((b) => b.value === 0.25);
      expect(previewMain).toBeDefined();
    });
  });

  describe('Task B — Asset Quality & Honesty Audit', () => {
    it('verifies all 40 frog images exist with valid size (between 10KB and 80KB)', () => {
      for (const frog of FROG_SPECIES_LIST) {
        const cleanPath = frog.image.replace(/^\//, '');
        const fullPath = path.resolve(process.cwd(), 'public', cleanPath);
        expect(fs.existsSync(fullPath)).toBe(true);
        const stats = fs.statSync(fullPath);
        const sizeKb = stats.size / 1024;
        expect(sizeKb).toBeGreaterThan(10);
        expect(sizeKb).toBeLessThan(80);
      }
    });

    it('ensures mythic species are identified as fictional lore and not disguised as recognized biology', () => {
      const mythicFrogs = FROG_SPECIES_LIST.filter((f) => f.rarity === 'mythic');
      expect(mythicFrogs.length).toBe(5);

      for (const frog of mythicFrogs) {
        // Must clearly state fictional / creative edit nature in scientificName or credit
        const isFictionalMarked = 
          frog.scientificName?.includes('Biến thể hư cấu') ||
          frog.scientificName?.includes('Sinh vật thần thoại') ||
          frog.credit.source.includes('phái sinh') ||
          frog.credit.source.includes('PLACEHOLDER');
        expect(isFictionalMarked).toBe(true);
      }
    });

    it('honestly marks v2 programmatic illustration assets as PLACEHOLDER in source credits', () => {
      // 25 v2 frog species
      const v1FrogIds = new Set([
        'green_frog', 'brown_frog', 'tree_frog', 'red_eyed_frog', 'tomato_frog',
        'rain_frog', 'pacman_frog', 'blue_poison_frog', 'glass_frog', 'mossy_frog',
        'golden_frog', 'golden_dart_frog', 'king_frog', 'galaxy_frog', 'lotus_guardian_frog'
      ]);

      const v2Frogs = FROG_SPECIES_LIST.filter((f) => !v1FrogIds.has(f.id));
      expect(v2Frogs.length).toBe(25);

      for (const frog of v2Frogs) {
        expect(frog.credit.source).toContain('PLACEHOLDER');
      }
    });
  });
});
