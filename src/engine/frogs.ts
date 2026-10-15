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
 * Số mảnh cần thiết để nâng cấp lên cấp tiếp theo
 */
export function getRequiredFragmentsForLevel(currentLevel: number): number {
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
  const req = getRequiredFragmentsForLevel(frogOwned.level);
  return frogOwned.fragments >= req;
}

/**
 * Thăng cấp ếch bằng mảnh
 */
export function levelUpFrog(frogOwned: FrogOwned): { success: boolean; newFrog: FrogOwned } {
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
 * Tính toán toàn bộ buff đang hoạt động:
 * - Ếch Chính (Main Frog): 100% hiệu lực buff theo level
 * - Tất cả các ếch khác đã sở hữu: 20% passive collection buff (thưởng sưu tầm)
 */
export function calculateActiveFrogBuffs(
  mainFrogId: string,
  ownedFrogs: Record<string, FrogOwned>
): FrogBuff[] {
  const speciesMap = new Map<string, FrogSpecies>();
  for (const s of FROG_SPECIES_LIST) {
    speciesMap.set(s.id, s);
  }

  const activeBuffs: FrogBuff[] = [];

  for (const [frogId, owned] of Object.entries(ownedFrogs)) {
    const species = speciesMap.get(frogId);
    if (!species) continue;

    const baseBuff = species.buff;
    const scaledValue = calculateFrogBuffValue(baseBuff.value, owned.level);

    if (frogId === mainFrogId) {
      // Ếch chính: 100%
      activeBuffs.push({
        type: baseBuff.type,
        value: scaledValue,
      });
    } else {
      // Passive collection buff: 20% của scaledValue
      activeBuffs.push({
        type: baseBuff.type,
        value: Number((scaledValue * 0.20).toFixed(4)),
      });
    }
  }

  return activeBuffs;
}

/**
 * Lấy loài ếch theo ID
 */
export function getFrogSpeciesById(id: string): FrogSpecies | undefined {
  return FROG_SPECIES_LIST.find((f) => f.id === id);
}
