import { FrogOwned, FrogSpecies, Rarity } from './types';
import { FROG_SPECIES_LIST } from '../data/frogs';
import { RARITY_CONFIG } from './frogs';

export const GACHA_COST_SINGLE = 500;
export const GACHA_COST_TEN = 5000;

export type GachaPoolType = 'ao_sen' | 'rung_mua' | 'dem_trang';

export interface GachaPoolConfig {
  id: GachaPoolType;
  name: string;
  subtitle: string;
  description: string;
  icon: string;
  eggEmoji: string;
  themeColor: string;
  badgeClass: string;
  bgGradient: string;
  borderGlow: string;
  rateUpFrogIds: string[];
}

export const GACHA_POOLS: Record<GachaPoolType, GachaPoolConfig> = {
  ao_sen: {
    id: 'ao_sen',
    name: 'Hồ Ao Sen',
    subtitle: 'Hồ Thường Trực',
    description: 'Nơi quy tụ của toàn bộ 40 loài ếch muôn màu muôn vẻ với tỉ lệ đồng đều tự nhiên.',
    icon: '🪷',
    eggEmoji: '🥚',
    themeColor: 'emerald',
    badgeClass: 'bg-emerald-600 text-white',
    bgGradient: 'from-emerald-950 via-slate-900 to-teal-950',
    borderGlow: 'border-emerald-500/50 shadow-emerald-500/20',
    rateUpFrogIds: [],
  },
  rung_mua: {
    id: 'rung_mua',
    name: 'Hồ Rừng Mưa',
    subtitle: 'Nhiệt Đới Xích Đạo',
    description: 'Tăng mạnh tỉ lệ xuất hiện các loài ếch nhiệt đới Amazon và ếch cây chuyền cành rực rỡ.',
    icon: '🌴',
    eggEmoji: '🌿',
    themeColor: 'teal',
    badgeClass: 'bg-teal-600 text-white',
    bgGradient: 'from-teal-950 via-slate-900 to-emerald-950',
    borderGlow: 'border-teal-500/50 shadow-teal-500/20',
    rateUpFrogIds: [
      'amazon_milk_frog',
      'white_lipped_tree_frog',
      'clown_tree_frog',
      'strawberry_poison_frog',
      'yellow_banded_poison_frog',
      'giant_monkey_frog',
      'tiger_leg_monkey_frog',
      'wallace_flying_frog',
    ],
  },
  dem_trang: {
    id: 'dem_trang',
    name: 'Hồ Đêm Trăng',
    subtitle: 'Huyền Bí Tối Thượng',
    description: 'Dưới ánh trăng rằm huyền ảo, các sinh vật bóng đêm và biến thể Thần thoại thức giấc.',
    icon: '🌙',
    eggEmoji: '🔮',
    themeColor: 'purple',
    badgeClass: 'bg-purple-600 text-white',
    bgGradient: 'from-purple-950 via-slate-900 to-indigo-950',
    borderGlow: 'border-purple-500/50 shadow-purple-500/30',
    rateUpFrogIds: [
      'red_eyed_frog',
      'spotted_salamander_frog',
      'blue_poison_frog',
      'glass_frog',
      'splendid_leaf_frog',
      'black_rain_frog',
      'golden_dart_frog',
      'phoenix_frog',
      'chronos_frog',
      'galaxy_frog',
    ],
  },
};

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

export interface GachaHistoryEntry {
  id: string;
  timestamp: number;
  poolId: GachaPoolType;
  frogId: string;
  frogNameVi: string;
  rarity: Rarity;
  isNew: boolean;
  fragmentsAdded: number;
}

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
  newHistoryEntries: GachaHistoryEntry[];
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
 * Xác định độ hiếm rơi ra dựa vào roll và pity (Dùng chung Pity giữa tất cả các hồ)
 */
export function rollRarity(
  pity: GachaPityState,
  rng: () => number = Math.random
): { rarity: Rarity; nextPity: GachaPityState } {
  const mustLegendary = pity.sinceLastLegendary >= 99;
  const mustEpic = pity.sinceLastEpic >= 29;
  const mustRare = pity.sinceLastRare >= 9;

  let minTier = 1;
  if (mustLegendary) minTier = 4;
  else if (mustEpic) minTier = 3;
  else if (mustRare) minTier = 2;

  const rarities: Rarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic'];
  const eligibleRarities = rarities.filter((r) => RARITY_TIER[r] >= minTier);

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

  const tier = RARITY_TIER[selectedRarity];
  const nextPity: GachaPityState = {
    sinceLastRare: tier >= 2 ? 0 : pity.sinceLastRare + 1,
    sinceLastEpic: tier >= 3 ? 0 : pity.sinceLastEpic + 1,
    sinceLastLegendary: tier >= 4 ? 0 : pity.sinceLastLegendary + 1,
  };

  return { rarity: selectedRarity, nextPity };
}

/**
 * Chọn ngẫu nhiên một loài ếch thuộc độ hiếm cụ thể trong pool đang chọn:
 * - Áp dụng trọng số Rate-up nếu có trong pool
 * - Ưu tiên x1.4 trọng số cho loài người chơi chưa sở hữu để hỗ trợ sưu tầm 40 loài
 */
export function pickFrogOfRarity(
  rarity: Rarity,
  poolType: GachaPoolType = 'ao_sen',
  ownedFrogs: Record<string, FrogOwned> = {},
  rng: () => number = Math.random
): FrogSpecies {
  const pool = FROG_SPECIES_LIST.filter((f) => f.rarity === rarity);
  if (pool.length === 0) {
    return FROG_SPECIES_LIST[0];
  }

  const poolConfig = GACHA_POOLS[poolType] || GACHA_POOLS.ao_sen;
  const rateUpSet = new Set(poolConfig.rateUpFrogIds);

  // Tính trọng số cho từng loài trong tier
  const weights: number[] = pool.map((frog) => {
    let w = 1.0;
    // Tăng trọng số nếu nằm trong danh sách Rate-up của hồ
    if (rateUpSet.has(frog.id)) {
      w *= 3.0;
    }
    // Ưu tiên nhẹ loài chưa sở hữu (+40% trọng số)
    if (!ownedFrogs[frog.id]) {
      w *= 1.4;
    }
    return w;
  });

  const totalWeight = weights.reduce((acc, w) => acc + w, 0);
  const roll = rng() * totalWeight;

  let cumulative = 0;
  for (let i = 0; i < pool.length; i++) {
    cumulative += weights[i];
    if (roll <= cumulative) {
      return pool[i];
    }
  }

  return pool[pool.length - 1];
}

/**
 * Tính bảng tỉ lệ rơi % chính xác của từng loài theo pool đang chọn
 */
export function getSpeciesDropRates(
  poolType: GachaPoolType = 'ao_sen',
  ownedFrogs: Record<string, FrogOwned> = {}
): { frog: FrogSpecies; dropChancePercent: number; isRateUp: boolean }[] {
  const poolConfig = GACHA_POOLS[poolType] || GACHA_POOLS.ao_sen;
  const rateUpSet = new Set(poolConfig.rateUpFrogIds);
  const result: { frog: FrogSpecies; dropChancePercent: number; isRateUp: boolean }[] = [];

  const rarities: Rarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic'];

  for (const r of rarities) {
    const frogsInTier = FROG_SPECIES_LIST.filter((f) => f.rarity === r);
    if (frogsInTier.length === 0) continue;

    const tierGachaWeight = RARITY_CONFIG[r].gachaWeight; // e.g. 50, 28, 15, 6, 1
    const weights = frogsInTier.map((frog) => {
      let w = 1.0;
      if (rateUpSet.has(frog.id)) w *= 3.0;
      if (!ownedFrogs[frog.id]) w *= 1.4;
      return w;
    });

    const tierTotalWeight = weights.reduce((acc, w) => acc + w, 0);

    for (let i = 0; i < frogsInTier.length; i++) {
      const frog = frogsInTier[i];
      const shareOfTier = weights[i] / tierTotalWeight;
      const finalPercent = Number((tierGachaWeight * shareOfTier).toFixed(3));
      result.push({
        frog,
        dropChancePercent: finalPercent,
        isRateUp: rateUpSet.has(frog.id),
      });
    }
  }

  return result;
}

/**
 * Thêm các lượt quay mới vào lịch sử (giữ tối đa 20 lượt gần nhất)
 */
export function appendGachaHistory(
  currentHistory: GachaHistoryEntry[],
  newEntries: GachaHistoryEntry[]
): GachaHistoryEntry[] {
  return [...newEntries, ...currentHistory].slice(0, 20);
}

/**
 * Thực hiện quay Gacha (1 lượt hoặc 10 lượt) trên pool được chỉ định
 */
export function executeGacha(
  count: 1 | 10,
  currentPoints: number,
  ownedFrogs: Record<string, FrogOwned>,
  currentPity: GachaPityState,
  poolType: GachaPoolType = 'ao_sen',
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
  const historyEntries: GachaHistoryEntry[] = [];
  let runningPity = { ...currentPity };
  const updatedOwned: Record<string, FrogOwned> = { ...ownedFrogs };

  for (let i = 0; i < count; i++) {
    const { rarity, nextPity } = rollRarity(runningPity, rng);
    runningPity = nextPity;

    const species = pickFrogOfRarity(rarity, poolType, updatedOwned, rng);
    const existing = updatedOwned[species.id];
    const timestamp = Date.now();
    const entryId = `gacha_${timestamp}_${i}_${Math.random().toString(36).substring(2, 6)}`;

    if (!existing) {
      // Nhận ếch mới
      updatedOwned[species.id] = {
        id: species.id,
        level: 1,
        fragments: 0,
        unlockedAt: timestamp,
      };
      pulls.push({
        species,
        isNew: true,
        fragmentsAdded: 0,
      });
      historyEntries.push({
        id: entryId,
        timestamp,
        poolId: poolType,
        frogId: species.id,
        frogNameVi: species.nameVi,
        rarity: species.rarity,
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
      historyEntries.push({
        id: entryId,
        timestamp,
        poolId: poolType,
        frogId: species.id,
        frogNameVi: species.nameVi,
        rarity: species.rarity,
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
      newHistoryEntries: historyEntries,
    },
  };
}
