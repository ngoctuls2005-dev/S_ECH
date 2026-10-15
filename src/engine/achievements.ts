import { Achievement, FrogOwned } from './types';
import { FROG_SPECIES_LIST } from '../data/frogs';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'click' | 'score' | 'gacha' | 'collection' | 'upgrade';
  target: number;
  evalProgress: (context: AchievementEvaluationContext) => { current: number; isCompleted: boolean };
}

export interface AchievementEvaluationContext {
  totalClicks: number;
  totalPointsEarned: number;
  points: number;
  ownedFrogs: Record<string, FrogOwned>;
  upgrades: Record<string, number>;
  highestCombo?: number;
  pointsPerSecond?: number;
}

export const ACHIEVEMENTS_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'first_touch',
    name: 'Cú Sờ Đầu Đời',
    description: 'Thực hiện lần sờ ếch đầu tiên trong đời bạn',
    icon: 'Hand',
    category: 'click',
    target: 1,
    evalProgress: (ctx) => ({
      current: Math.min(1, ctx.totalClicks),
      isCompleted: ctx.totalClicks >= 1,
    }),
  },
  {
    id: 'click_100',
    name: 'Đôi Tay Khởi Động',
    description: 'Sờ ếch tích cực đạt 100 lần click',
    icon: 'Sparkles',
    category: 'click',
    target: 100,
    evalProgress: (ctx) => ({
      current: Math.min(100, ctx.totalClicks),
      isCompleted: ctx.totalClicks >= 100,
    }),
  },
  {
    id: 'click_1000',
    name: 'Bàn Tay Điêu Luyện',
    description: 'Sờ ếch đạt mốc 1.000 lần click',
    icon: 'Zap',
    category: 'click',
    target: 1000,
    evalProgress: (ctx) => ({
      current: Math.min(1000, ctx.totalClicks),
      isCompleted: ctx.totalClicks >= 1000,
    }),
  },
  {
    id: 'click_10000',
    name: 'Thần Sờ Ếch',
    description: 'Cán mốc 10.000 cú sờ thần thánh',
    icon: 'Flame',
    category: 'click',
    target: 10000,
    evalProgress: (ctx) => ({
      current: Math.min(10000, ctx.totalClicks),
      isCompleted: ctx.totalClicks >= 10000,
    }),
  },
  {
    id: 'score_100k',
    name: 'Nhà Đầu Tư Ao Sen',
    description: 'Tích lũy tổng cộng 100.000 Điểm Sờ Ếch',
    icon: 'Coins',
    category: 'score',
    target: 100000,
    evalProgress: (ctx) => ({
      current: Math.min(100000, ctx.totalPointsEarned),
      isCompleted: ctx.totalPointsEarned >= 100000,
    }),
  },
  {
    id: 'score_1m',
    name: 'Triệu Phú Sờ Ếch',
    description: 'Đạt cột mốc vĩ đại: Kiếm được 1.000.000 Điểm Sờ Ếch',
    icon: 'Trophy',
    category: 'score',
    target: 1000000,
    evalProgress: (ctx) => ({
      current: Math.min(1000000, ctx.totalPointsEarned),
      isCompleted: ctx.totalPointsEarned >= 1000000,
    }),
  },
  {
    id: 'first_rare',
    name: 'Nhân Phẩm Khởi Sắc',
    description: 'Quay trúng con ếch cấp Hiếm (Rare) đầu tiên',
    icon: 'Sparkle',
    category: 'gacha',
    target: 1,
    evalProgress: (ctx) => {
      const hasRare = Object.keys(ctx.ownedFrogs).some((id) => {
        const f = FROG_SPECIES_LIST.find((s) => s.id === id);
        return f && (f.rarity === 'rare' || f.rarity === 'epic' || f.rarity === 'legendary' || f.rarity === 'mythic');
      });
      return { current: hasRare ? 1 : 0, isCompleted: hasRare };
    },
  },
  {
    id: 'first_epic',
    name: 'Hào Quang Sử Thi',
    description: 'Sở hữu ít nhất 1 con ếch Sử Thi (Epic)',
    icon: 'ShieldCheck',
    category: 'gacha',
    target: 1,
    evalProgress: (ctx) => {
      const hasEpic = Object.keys(ctx.ownedFrogs).some((id) => {
        const f = FROG_SPECIES_LIST.find((s) => s.id === id);
        return f && (f.rarity === 'epic' || f.rarity === 'legendary' || f.rarity === 'mythic');
      });
      return { current: hasEpic ? 1 : 0, isCompleted: hasEpic };
    },
  },
  {
    id: 'first_legendary',
    name: 'Huyền Thoại Xuất Thế',
    description: 'Sở hữu con ếch Huyền Thoại (Legendary) sáng chói',
    icon: 'Crown',
    category: 'gacha',
    target: 1,
    evalProgress: (ctx) => {
      const hasLegendary = Object.keys(ctx.ownedFrogs).some((id) => {
        const f = FROG_SPECIES_LIST.find((s) => s.id === id);
        return f && (f.rarity === 'legendary' || f.rarity === 'mythic');
      });
      return { current: hasLegendary ? 1 : 0, isCompleted: hasLegendary };
    },
  },
  {
    id: 'collect_5',
    name: 'Người Bạn Loài Ếch',
    description: 'Sưu tầm 5 loài ếch khác nhau vào ao của bạn',
    icon: 'Grid',
    category: 'collection',
    target: 5,
    evalProgress: (ctx) => {
      const count = Object.keys(ctx.ownedFrogs).length;
      return { current: Math.min(5, count), isCompleted: count >= 5 };
    },
  },
  {
    id: 'collect_10',
    name: 'Bảo Tàng Lưỡng Cư',
    description: 'Sưu tầm thành công 10 loài ếch khác nhau',
    icon: 'Library',
    category: 'collection',
    target: 10,
    evalProgress: (ctx) => {
      const count = Object.keys(ctx.ownedFrogs).length;
      return { current: Math.min(10, count), isCompleted: count >= 10 };
    },
  },
  {
    id: 'collect_all',
    name: 'Bách Khoa Toàn Thư Ao Sen',
    description: 'Sưu tầm trọn vẹn toàn bộ 15 loài ếch trong game',
    icon: 'Award',
    category: 'collection',
    target: 15,
    evalProgress: (ctx) => {
      const count = Object.keys(ctx.ownedFrogs).length;
      return { current: Math.min(15, count), isCompleted: count >= 15 };
    },
  },
];

/**
 * Đánh giá toàn bộ thành tựu dựa trên trạng thái game hiện tại
 * Trả về danh sách achievements đầy đủ tiến trình và danh sách các ID vừa mới mở khóa
 */
export function evaluateAchievements(
  context: AchievementEvaluationContext,
  currentlyUnlockedIds: string[] = []
): {
  achievements: Achievement[];
  newlyUnlockedIds: string[];
} {
  const unlockedSet = new Set(currentlyUnlockedIds);
  const newlyUnlockedIds: string[] = [];
  const achievements: Achievement[] = [];

  for (const def of ACHIEVEMENTS_DEFINITIONS) {
    const isAlreadyUnlocked = unlockedSet.has(def.id);
    const { current, isCompleted } = def.evalProgress(context);

    if (isCompleted && !isAlreadyUnlocked) {
      newlyUnlockedIds.push(def.id);
      unlockedSet.add(def.id);
    }

    achievements.push({
      id: def.id,
      name: def.name,
      description: def.description,
      icon: def.icon,
      category: def.category,
      target: def.target,
      progress: current,
      isUnlocked: isAlreadyUnlocked || isCompleted,
    });
  }

  return { achievements, newlyUnlockedIds };
}
