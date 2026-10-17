import { FrogBuff, FrogOwned, FrogSpecies, Rarity } from './types';
import { FROG_SPECIES_LIST } from '../data/frogs';

export const RARITY_CONFIG: Record<
  Rarity,
  {
    nameVi: string;
    color: string;
    bgGradient: string;
    borderGlow: string;
    badgeBg: string;
    duplicateFragments: number;
    gachaWeight: number; // Tỉ lệ %
  }
> = {
  common: {
    nameVi: 'Thường',
    color: 'text-slate-200',
    bgGradient: 'from-slate-800 to-slate-900',
    borderGlow: 'border-slate-600',
    badgeBg: 'bg-slate-700 text-slate-200',
    duplicateFragments: 1,
    gachaWeight: 50,
  },
  rare: {
    nameVi: 'Hiếm',
    color: 'text-blue-400',
    bgGradient: 'from-blue-950 to-slate-900',
    borderGlow: 'border-blue-500 shadow-blue-500/30',
    badgeBg: 'bg-blue-600 text-white',
    duplicateFragments: 3,
    gachaWeight: 28,
  },
  epic: {
    nameVi: 'Sử Thi',
    color: 'text-purple-400',
    bgGradient: 'from-purple-950 to-slate-900',
    borderGlow: 'border-purple-500 shadow-purple-500/40',
    badgeBg: 'bg-purple-600 text-white',
    duplicateFragments: 8,
    gachaWeight: 15,
  },
  legendary: {
    nameVi: 'Huyền Thoại',
    color: 'text-amber-400',
    bgGradient: 'from-amber-950 to-slate-900',
    borderGlow: 'border-amber-400 shadow-amber-400/50',
    badgeBg: 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold',
    duplicateFragments: 20,
    gachaWeight: 6,
  },
  mythic: {
    nameVi: 'Thần Thoại',
    color: 'text-rose-400',
    bgGradient: 'from-rose-950 via-purple-950 to-slate-900',
    borderGlow: 'border-rose-500 shadow-rose-500/60 animate-pulse',
    badgeBg: 'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 text-white font-extrabold',
    duplicateFragments: 50,
    gachaWeight: 1,
  },
};

/**
 * Giới hạn cấp độ tối đa của loài ếch trong gameplay
 * (Ở cấp 21 lên 22 cần 5.242.880 mảnh; cấp 22 lên 23 cần > 10.000.000 mảnh vượt trần lưu)
 */
export const MAX_FROG_LEVEL = 22;

/**
 * Số mảnh cần thiết để nâng cấp lên cấp tiếp theo
 */
export function getRequiredFragmentsForLevel(currentLevel: number): number {
  if (currentLevel >= MAX_FROG_LEVEL) return Infinity;
  return 5 * Math.pow(2, currentLevel - 1);
}

/**
 * Tính giá trị buff sau khi nhân hệ số cấp độ
 */
export function calculateFrogBuffValue(baseValue: number, level: number): number {
  if (level <= 1) return baseValue;
  // Mỗi cấp tăng thêm +25% hiệu quả buff
  return Number((baseValue * (1 + (level - 1) * 0.25)).toFixed(3));
}

/**
 * Kiểm tra xem ếch có đủ mảnh để thăng cấp không
 */
export function canLevelUpFrog(frogOwned: FrogOwned): boolean {
  if (frogOwned.level >= MAX_FROG_LEVEL) return false;
  const req = getRequiredFragmentsForLevel(frogOwned.level);
  return frogOwned.fragments >= req;
}

/**
 * Thăng cấp ếch bằng mảnh
 */
export function levelUpFrog(frogOwned: FrogOwned): { success: boolean; newFrog: FrogOwned } {
  if (frogOwned.level >= MAX_FROG_LEVEL) {
    return { success: false, newFrog: frogOwned };
  }

  const req = getRequiredFragmentsForLevel(frogOwned.level);
  if (frogOwned.fragments < req) {
    return { success: false, newFrog: frogOwned };
  }

  return {
    success: true,
    newFrog: {
      ...frogOwned,
      level: frogOwned.level + 1,
      fragments: frogOwned.fragments - req,
    },
  };
}

/**
 * Ngưỡng kích hoạt diminishing returns cho từng loại passive collection buff
 */
const PASSIVE_CAPS: Record<FrogBuff['type'], { threshold: number; scale: number; hardCap?: number }> = {
  crit_chance_bonus: { threshold: 0.25, scale: 0.15, hardCap: 0.35 },
  upgrade_discount_percent: { threshold: 0.35, scale: 0.15, hardCap: 0.50 },
  click_points_percent: { threshold: 1.50, scale: 2.50 },
  idle_points_percent: { threshold: 1.50, scale: 2.50 },
  total_points_percent: { threshold: 1.50, scale: 2.50 },
  combo_bonus_percent: { threshold: 1.50, scale: 2.50 },
  crit_multiplier_bonus: { threshold: 2.00, scale: 3.00 },
};

/**
 * Tính toán toàn bộ buff đang hoạt động:
 * - Ếch Chính (Main Frog): 100% hiệu lực buff theo level
 * - Tất cả các ếch khác đã sở hữu: 20% passive collection buff (thưởng sưu tầm)
 * - Áp dụng Soft-cap / Diminishing returns cho nhóm passive khi mở rộng lên 40 loài
 */
export function calculateActiveFrogBuffs(
  mainFrogId: string,
  ownedFrogs: Record<string, FrogOwned>
): FrogBuff[] {
  const speciesMap = new Map<string, FrogSpecies>();
  for (const s of FROG_SPECIES_LIST) {
    speciesMap.set(s.id, s);
  }

  const mainBuffs: FrogBuff[] = [];
  const rawPassiveByType: Record<FrogBuff['type'], { frogId: string; value: number }[]> = {
    click_points_percent: [],
    idle_points_percent: [],
    crit_chance_bonus: [],
    crit_multiplier_bonus: [],
    combo_bonus_percent: [],
    total_points_percent: [],
    upgrade_discount_percent: [],
  };

  for (const [frogId, owned] of Object.entries(ownedFrogs)) {
    const species = speciesMap.get(frogId);
    if (!species) continue;

    const baseBuff = species.buff;
    const scaledValue = calculateFrogBuffValue(baseBuff.value, owned.level);

    if (frogId === mainFrogId) {
      // Ếch chính: 100%
      mainBuffs.push({
        type: baseBuff.type,
        value: scaledValue,
      });
    } else {
      // Passive collection buff thô: 20% của scaledValue
      const rawPassiveVal = Number((scaledValue * 0.20).toFixed(4));
      rawPassiveByType[baseBuff.type].push({
        frogId,
        value: rawPassiveVal,
      });
    }
  }

  // Áp dụng soft-cap diminishing returns cho passive buffs
  const passiveBuffs: FrogBuff[] = [];
  for (const [typeKey, list] of Object.entries(rawPassiveByType) as [FrogBuff['type'], { frogId: string; value: number }[]][]) {
    if (list.length === 0) continue;
    const rawTotal = list.reduce((acc, curr) => acc + curr.value, 0);
    const capRule = PASSIVE_CAPS[typeKey];

    if (!capRule || rawTotal <= capRule.threshold) {
      // Dưới ngưỡng: giữ nguyên 100% không suy giảm
      for (const item of list) {
        passiveBuffs.push({ type: typeKey, value: item.value });
      }
    } else {
      // Vượt ngưỡng: nén phần vượt mức bằng hàm hyperbolic mượt mà
      const excess = rawTotal - capRule.threshold;
      let effectiveTotal = capRule.threshold + (excess / (1 + excess / capRule.scale));
      if (capRule.hardCap && effectiveTotal > capRule.hardCap) {
        effectiveTotal = capRule.hardCap;
      }
      const scaleFactor = effectiveTotal / rawTotal;

      for (const item of list) {
        passiveBuffs.push({
          type: typeKey,
          value: Number((item.value * scaleFactor).toFixed(4)),
        });
      }
    }
  }

  return [...mainBuffs, ...passiveBuffs];
}

/**
 * Xem trước sự thay đổi buff khi người chơi đổi ếch chính sang candidateId
 */
export function previewFrogBuffImpact(
  currentMainId: string,
  candidateId: string,
  ownedFrogs: Record<string, FrogOwned>
): { currentBuffs: FrogBuff[]; previewBuffs: FrogBuff[] } {
  const currentBuffs = calculateActiveFrogBuffs(currentMainId, ownedFrogs);
  const previewBuffs = calculateActiveFrogBuffs(candidateId, ownedFrogs);
  return { currentBuffs, previewBuffs };
}


/**
 * Lấy loài ếch theo ID
 */
export function getFrogSpeciesById(id: string): FrogSpecies | undefined {
  return FROG_SPECIES_LIST.find((f) => f.id === id);
}
