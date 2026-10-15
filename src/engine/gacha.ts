import { FrogOwned, FrogSpecies, Rarity } from './types';
import { FROG_SPECIES_LIST } from '../data/frogs';
import { RARITY_CONFIG } from './frogs';

export const GACHA_COST_SINGLE = 500;
export const GACHA_COST_TEN = 5000;

export interface GachaPityState {
  sinceLastRare: number;      // Đảm bảo Rare+ sau 10 lượt
  sinceLastEpic: number;      // Đảm bảo Epic+ sau 30 lượt
  sinceLastLegendary: number; // Đảm bảo Legendary+ sau 100 lượt
}

export const INITIAL_PITY_STATE: GachaPityState = {
  sinceLastRare: 0,
  sinceLastEpic: 0,
  sinceLastLegendary: 0,
};

export interface GachaPullResult {
  species: FrogSpecies;
  isNew: boolean;
  fragmentsAdded: number;
}

export interface GachaSessionResult {
  pulls: GachaPullResult[];
  costPaid: number;
  newPoints: number;
  newPity: GachaPityState;
  newOwnedFrogs: Record<string, FrogOwned>;
}

// Bậc ưu tiên độ hiếm (càng cao càng hiếm)
export const RARITY_TIER: Record<Rarity, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  mythic: 5,
};

/**
 * Xác định độ hiếm rơi ra dựa vào roll và pity
 */
export function rollRarity(
  pity: GachaPityState,
  rng: () => number = Math.random
): { rarity: Rarity; nextPity: GachaPityState } {
  // Kiểm tra pity
  const mustLegendary = pity.sinceLastLegendary >= 99;
  const mustEpic = pity.sinceLastEpic >= 29;
  const mustRare = pity.sinceLastRare >= 9;

  let minTier = 1;
  if (mustLegendary) minTier = 4;
  else if (mustEpic) minTier = 3;
  else if (mustRare) minTier = 2;

  // Lấy các độ hiếm thỏa mãn minTier
  const rarities: Rarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic'];
  const eligibleRarities = rarities.filter((r) => RARITY_TIER[r] >= minTier);

  // Tính tổng trọng số
  const totalWeight = eligibleRarities.reduce((sum, r) => sum + RARITY_CONFIG[r].gachaWeight, 0);
  const roll = rng() * totalWeight;

  let cumulative = 0;
  let selectedRarity: Rarity = eligibleRarities[0];

  for (const r of eligibleRarities) {
    cumulative += RARITY_CONFIG[r].gachaWeight;
    if (roll < cumulative) {
      selectedRarity = r;
      break;
    }
  }

  // Cập nhật pity counters
  const tier = RARITY_TIER[selectedRarity];
  const nextPity: GachaPityState = {
    sinceLastRare: tier >= 2 ? 0 : pity.sinceLastRare + 1,
    sinceLastEpic: tier >= 3 ? 0 : pity.sinceLastEpic + 1,
    sinceLastLegendary: tier >= 4 ? 0 : pity.sinceLastLegendary + 1,
  };

  return { rarity: selectedRarity, nextPity };
}

/**
 * Chọn ngẫu nhiên một loài ếch thuộc độ hiếm cụ thể
 */
export function pickFrogOfRarity(
  rarity: Rarity,
  rng: () => number = Math.random
): FrogSpecies {
  const pool = FROG_SPECIES_LIST.filter((f) => f.rarity === rarity);
  if (pool.length === 0) {
    // Fallback nếu không có
    return FROG_SPECIES_LIST[0];
  }
  const index = Math.floor(rng() * pool.length);
  return pool[index];
}

/**
 * Thực hiện quay Gacha (1 lượt hoặc 10 lượt)
 */
export function executeGacha(
  count: 1 | 10,
  currentPoints: number,
  ownedFrogs: Record<string, FrogOwned>,
  currentPity: GachaPityState,
  rng: () => number = Math.random
): { success: boolean; session?: GachaSessionResult; message?: string } {
  const cost = count === 1 ? GACHA_COST_SINGLE : GACHA_COST_TEN;
  if (currentPoints < cost) {
    return {
      success: false,
      message: 'Không đủ Điểm Sờ Ếch để mở trứng Gacha!',
    };
  }

  const pulls: GachaPullResult[] = [];
  let runningPity = { ...currentPity };
  const updatedOwned: Record<string, FrogOwned> = { ...ownedFrogs };

  for (let i = 0; i < count; i++) {
    const { rarity, nextPity } = rollRarity(runningPity, rng);
    runningPity = nextPity;

    const species = pickFrogOfRarity(rarity, rng);
    const existing = updatedOwned[species.id];

    if (!existing) {
      // Nhận ếch mới
      updatedOwned[species.id] = {
        id: species.id,
        level: 1,
        fragments: 0,
        unlockedAt: Date.now(),
      };
      pulls.push({
        species,
        isNew: true,
        fragmentsAdded: 0,
      });
    } else {
      // Ếch trùng: chuyển thành mảnh
      const frags = RARITY_CONFIG[species.rarity].duplicateFragments;
      updatedOwned[species.id] = {
        ...existing,
        fragments: existing.fragments + frags,
      };
      pulls.push({
        species,
        isNew: false,
        fragmentsAdded: frags,
      });
    }
  }

  return {
    success: true,
    session: {
      pulls,
      costPaid: cost,
      newPoints: currentPoints - cost,
      newPity: runningPity,
      newOwnedFrogs: updatedOwned,
    },
  };
}
