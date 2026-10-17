import { Achievement, FrogOwned } from './types';
import { FROG_SPECIES_LIST } from '../data/frogs';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'click' | 'score' | 'gacha' | 'collection' | 'upgrade' | 'special';
  target: number;
  rewardPoints: number;
  isSecret?: boolean;
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
  mainFrogId?: string;
  totalCrits?: number;
  totalGachaPulls?: number;
  lastClickCombo?: number;
}

export const ACHIEVEMENTS_DEFINITIONS: AchievementDefinition[] = [
  // ================= 1. SỜ ẾCH (CLICK) =================
  {
    id: 'first_touch',
    name: 'Cú Sờ Đầu Đời',
    description: 'Thực hiện lần sờ ếch đầu tiên trong đời bạn',
    icon: 'Hand',
    category: 'click',
    target: 1,
    rewardPoints: 20,
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
    rewardPoints: 500,
    evalProgress: (ctx) => ({
      current: Math.min(100, ctx.totalClicks),
      isCompleted: ctx.totalClicks >= 100,
    }),
  },
  {
    id: 'click_500',
    name: 'Sờ Không Mỏi Tay',
    description: 'Đạt mốc 500 cú sờ tràn đầy nhiệt huyết',
    icon: 'Flame',
    category: 'click',
    target: 500,
    rewardPoints: 2000,
    evalProgress: (ctx) => ({
      current: Math.min(500, ctx.totalClicks),
      isCompleted: ctx.totalClicks >= 500,
    }),
  },
  {
    id: 'click_1000',
    name: 'Bàn Tay Điêu Luyện',
    description: 'Sờ ếch đạt mốc 1.000 lần click',
    icon: 'Zap',
    category: 'click',
    target: 1000,
    rewardPoints: 5000,
    evalProgress: (ctx) => ({
      current: Math.min(1000, ctx.totalClicks),
      isCompleted: ctx.totalClicks >= 1000,
    }),
  },
  {
    id: 'click_5000',
    name: 'Đôi Tay Ma Thuật',
    description: 'Tích lũy 5.000 cú sờ thần thánh',
    icon: 'Sparkle',
    category: 'click',
    target: 5000,
    rewardPoints: 25000,
    evalProgress: (ctx) => ({
      current: Math.min(5000, ctx.totalClicks),
      isCompleted: ctx.totalClicks >= 5000,
    }),
  },
  {
    id: 'click_10000',
    name: 'Thần Sờ Ếch',
    description: 'Cán mốc 10.000 cú sờ rung chuyển ao sen',
    icon: 'Flame',
    category: 'click',
    target: 10000,
    rewardPoints: 50000,
    evalProgress: (ctx) => ({
      current: Math.min(10000, ctx.totalClicks),
      isCompleted: ctx.totalClicks >= 10000,
    }),
  },
  {
    id: 'click_50000',
    name: 'Tay Sờ Huyền Thoại',
    description: 'Đạt đỉnh cao tuyệt đối: 50.000 lần sờ ếch',
    icon: 'Award',
    category: 'click',
    target: 50000,
    rewardPoints: 250000,
    evalProgress: (ctx) => ({
      current: Math.min(50000, ctx.totalClicks),
      isCompleted: ctx.totalClicks >= 50000,
    }),
  },
  {
    id: 'combo_10',
    name: 'Vào Nhịp Sờ',
    description: 'Duy trì chuỗi sờ liên hoàn đạt combo 10',
    icon: 'Activity',
    category: 'click',
    target: 10,
    rewardPoints: 1000,
    evalProgress: (ctx) => ({
      current: Math.min(10, ctx.highestCombo || 0),
      isCompleted: (ctx.highestCombo || 0) >= 10,
    }),
  },
  {
    id: 'combo_25',
    name: 'Vũ Điệu Ao Sen',
    description: 'Thực hiện combo nhịp nhàng đạt 25 lần liên tiếp',
    icon: 'Zap',
    category: 'click',
    target: 25,
    rewardPoints: 5000,
    evalProgress: (ctx) => ({
      current: Math.min(25, ctx.highestCombo || 0),
      isCompleted: (ctx.highestCombo || 0) >= 25,
    }),
  },
  {
    id: 'combo_50',
    name: 'Bão Tố Sờ Ếch',
    description: 'Đạt combo 50 liên hoàn cực đỉnh',
    icon: 'Sparkles',
    category: 'click',
    target: 50,
    rewardPoints: 20000,
    evalProgress: (ctx) => ({
      current: Math.min(50, ctx.highestCombo || 0),
      isCompleted: (ctx.highestCombo || 0) >= 50,
    }),
  },

  // ================= 2. CHÍ MẠNG (CRIT) =================
  {
    id: 'crit_10',
    name: 'Tia Sét Đầu Tiên',
    description: 'Kích hoạt 10 lần cú sờ chí mạng lấp lánh',
    icon: 'Zap',
    category: 'click',
    target: 10,
    rewardPoints: 1000,
    evalProgress: (ctx) => {
      const crits = ctx.totalCrits ?? 0;
      return { current: Math.min(10, crits), isCompleted: crits >= 10 };
    },
  },
  {
    id: 'crit_100',
    name: 'Bậc Thầy Điểm Yếu',
    description: 'Kích hoạt thành công 100 lần chí mạng',
    icon: 'Flame',
    category: 'click',
    target: 100,
    rewardPoints: 10000,
    evalProgress: (ctx) => {
      const crits = ctx.totalCrits ?? 0;
      return { current: Math.min(100, crits), isCompleted: crits >= 100 };
    },
  },
  {
    id: 'crit_1000',
    name: 'Nhát Sờ Hủy Diệt',
    description: 'Đạt mốc 1.000 cú chạm chí mạng chấn động',
    icon: 'Award',
    category: 'click',
    target: 1000,
    rewardPoints: 100000,
    evalProgress: (ctx) => {
      const crits = ctx.totalCrits ?? 0;
      return { current: Math.min(1000, crits), isCompleted: crits >= 1000 };
    },
  },

  // ================= 3. ĐIỂM SỐ (SCORE) =================
  {
    id: 'score_100k',
    name: 'Nhà Đầu Tư Ao Sen',
    description: 'Tích lũy tổng cộng 100.000 Điểm Sờ Ếch',
    icon: 'Coins',
    category: 'score',
    target: 100000,
    rewardPoints: 5000,
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
    rewardPoints: 50000,
    evalProgress: (ctx) => ({
      current: Math.min(1000000, ctx.totalPointsEarned),
      isCompleted: ctx.totalPointsEarned >= 1000000,
    }),
  },
  {
    id: 'score_10m',
    name: 'Ếch Có Thể Làm Giàu',
    description: 'Tích lũy tổng tài sản 10.000.000 Điểm Sờ Ếch',
    icon: 'TrendingUp',
    category: 'score',
    target: 10000000,
    rewardPoints: 200000,
    evalProgress: (ctx) => ({
      current: Math.min(10000000, ctx.totalPointsEarned),
      isCompleted: ctx.totalPointsEarned >= 10000000,
    }),
  },
  {
    id: 'score_100m',
    name: 'Đại Gia Đầm Lầy',
    description: 'Gia nhập hàng ngũ thượng lưu với 100.000.000 Điểm Sờ Ếch',
    icon: 'Crown',
    category: 'score',
    target: 100000000,
    rewardPoints: 1000000,
    evalProgress: (ctx) => ({
      current: Math.min(100000000, ctx.totalPointsEarned),
      isCompleted: ctx.totalPointsEarned >= 100000000,
    }),
  },
  {
    id: 'score_1b',
    name: 'Tỷ Phú Ao Sen',
    description: 'Cán mốc 1.000.000.000 Điểm Sờ Ếch huyền thoại',
    icon: 'Sparkles',
    category: 'score',
    target: 1000000000,
    rewardPoints: 10000000,
    evalProgress: (ctx) => ({
      current: Math.min(1000000000, ctx.totalPointsEarned),
      isCompleted: ctx.totalPointsEarned >= 1000000000,
    }),
  },

  // ================= 4. NÂNG CẤP (UPGRADE) =================
  {
    id: 'upgrade_first',
    name: 'Bước Chân Tiến Hóa',
    description: 'Mua món nâng cấp đầu tiên trong cửa hàng',
    icon: 'ArrowUpCircle',
    category: 'upgrade',
    target: 1,
    rewardPoints: 200,
    evalProgress: (ctx) => {
      const totalLevels = Object.values(ctx.upgrades).reduce((acc, v) => acc + (v || 0), 0);
      return { current: Math.min(1, totalLevels), isCompleted: totalLevels >= 1 };
    },
  },
  {
    id: 'upgrade_magic_finger_10',
    name: 'Ngón Tay Thần Thánh',
    description: 'Sở hữu cấp 10 nâng cấp Ngón tay thần',
    icon: 'Zap',
    category: 'upgrade',
    target: 10,
    rewardPoints: 5000,
    evalProgress: (ctx) => {
      const lvl = ctx.upgrades['divine_finger'] || 0;
      return { current: Math.min(10, lvl), isCompleted: lvl >= 10 };
    },
  },
  {
    id: 'upgrade_factory',
    name: 'Công Nghiệp Hóa Sờ Ếch',
    description: 'Mở khóa và vận hành Nhà máy sờ ếch',
    icon: 'Factory',
    category: 'upgrade',
    target: 1,
    rewardPoints: 20000,
    evalProgress: (ctx) => {
      const lvl = ctx.upgrades['frog_factory'] || 0;
      return { current: Math.min(1, lvl), isCompleted: lvl >= 1 };
    },
  },
  {
    id: 'upgrade_sanctuary',
    name: 'Thánh Địa Ếch Chúa',
    description: 'Mở khóa nâng cấp tối thượng: Thánh địa sờ ếch',
    icon: 'Landmark',
    category: 'upgrade',
    target: 1,
    rewardPoints: 1000000,
    evalProgress: (ctx) => {
      const lvl = ctx.upgrades['frog_sanctuary'] || 0;
      return { current: Math.min(1, lvl), isCompleted: lvl >= 1 };
    },
  },
  {
    id: 'upgrade_total_50',
    name: 'Nhà Đầu Tư Toàn Diện',
    description: 'Sở hữu tổng cộng 50 cấp nâng cấp các loại',
    icon: 'Sliders',
    category: 'upgrade',
    target: 50,
    rewardPoints: 100000,
    evalProgress: (ctx) => {
      const total = Object.values(ctx.upgrades).reduce((acc, v) => acc + (v || 0), 0);
      return { current: Math.min(50, total), isCompleted: total >= 50 };
    },
  },
  {
    id: 'pps_1000',
    name: 'Ao Sen Tự Vận Hành',
    description: 'Đạt tốc độ sản sinh 1.000 điểm mỗi giây (PPS)',
    icon: 'Clock',
    category: 'upgrade',
    target: 1000,
    rewardPoints: 15000,
    evalProgress: (ctx) => {
      const pps = ctx.pointsPerSecond || 0;
      return { current: Math.min(1000, Math.floor(pps)), isCompleted: pps >= 1000 };
    },
  },
  {
    id: 'pps_50000',
    name: 'Cỗ Máy In Điểm',
    description: 'Đạt tốc độ thần tốc 50.000 điểm mỗi giây (PPS)',
    icon: 'TrendingUp',
    category: 'upgrade',
    target: 50000,
    rewardPoints: 300000,
    evalProgress: (ctx) => {
      const pps = ctx.pointsPerSecond || 0;
      return { current: Math.min(50000, Math.floor(pps)), isCompleted: pps >= 50000 };
    },
  },

  // ================= 5. GACHA =================
  {
    id: 'first_rare',
    name: 'Nhân Phẩm Khởi Sắc',
    description: 'Quay trúng con ếch cấp Hiếm (Rare) đầu tiên',
    icon: 'Sparkle',
    category: 'gacha',
    target: 1,
    rewardPoints: 1000,
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
    rewardPoints: 5000,
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
    rewardPoints: 50000,
    evalProgress: (ctx) => {
      const hasLegendary = Object.keys(ctx.ownedFrogs).some((id) => {
        const f = FROG_SPECIES_LIST.find((s) => s.id === id);
        return f && (f.rarity === 'legendary' || f.rarity === 'mythic');
      });
      return { current: hasLegendary ? 1 : 0, isCompleted: hasLegendary };
    },
  },
  {
    id: 'first_mythic',
    name: 'Thần Thoại Giáng Trần',
    description: 'Khai mở con ếch Thần Thoại (Mythic) tối cao',
    icon: 'Sparkles',
    category: 'gacha',
    target: 1,
    rewardPoints: 200000,
    evalProgress: (ctx) => {
      const hasMythic = Object.keys(ctx.ownedFrogs).some((id) => {
        const f = FROG_SPECIES_LIST.find((s) => s.id === id);
        return f && f.rarity === 'mythic';
      });
      return { current: hasMythic ? 1 : 0, isCompleted: hasMythic };
    },
  },
  {
    id: 'gacha_egg_changer',
    name: 'Một Quả Trứng Đổi Đời',
    description: 'Sở hữu ít nhất một loài Huyền Thoại hoặc Thần Thoại',
    icon: 'Award',
    category: 'gacha',
    target: 1,
    rewardPoints: 100000,
    evalProgress: (ctx) => {
      const hasHighTier = Object.keys(ctx.ownedFrogs).some((id) => {
        const f = FROG_SPECIES_LIST.find((s) => s.id === id);
        return f && (f.rarity === 'legendary' || f.rarity === 'mythic');
      });
      return { current: hasHighTier ? 1 : 0, isCompleted: hasHighTier };
    },
  },
  {
    id: 'gacha_multi_pull',
    name: 'Đại Gia Ấp Trứng',
    description: 'Thực hiện ít nhất 10 lượt mở trứng Gacha',
    icon: 'Layers',
    category: 'gacha',
    target: 10,
    rewardPoints: 5000,
    evalProgress: (ctx) => {
      const pulls = ctx.totalGachaPulls ?? 0;
      return { current: Math.min(10, pulls), isCompleted: pulls >= 10 };
    },
  },
  {
    id: 'gacha_100_pulls',
    name: 'Học Giả Ấp Trứng',
    description: 'Mở trọn vẹn 100 quả trứng Gacha tìm kiếm tri thức',
    icon: 'Trophy',
    category: 'gacha',
    target: 100,
    rewardPoints: 100000,
    evalProgress: (ctx) => {
      const pulls = ctx.totalGachaPulls ?? 0;
      return { current: Math.min(100, pulls), isCompleted: pulls >= 100 };
    },
  },

  // ================= 6. BỘ SƯU TẬP (COLLECTION) =================
  {
    id: 'collect_5',
    name: 'Người Bạn Loài Ếch',
    description: 'Sưu tầm 5 loài ếch khác nhau vào ao của bạn',
    icon: 'Grid',
    category: 'collection',
    target: 5,
    rewardPoints: 2000,
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
    rewardPoints: 10000,
    evalProgress: (ctx) => {
      const count = Object.keys(ctx.ownedFrogs).length;
      return { current: Math.min(10, count), isCompleted: count >= 10 };
    },
  },
  {
    id: 'collect_all',
    name: 'Bách Khoa Toàn Thư Ao Sen',
    description: 'Sưu tầm đủ 15 loài ếch (Mốc di sản ban đầu)',
    icon: 'Award',
    category: 'collection',
    target: 15,
    rewardPoints: 50000,
    evalProgress: (ctx) => {
      const count = Object.keys(ctx.ownedFrogs).length;
      return { current: Math.min(15, count), isCompleted: count >= 15 };
    },
  },
  {
    id: 'collect_20',
    name: 'Nhà Tự Nhiên Học',
    description: 'Mở rộng bộ sưu tập đạt mốc 20 loài ếch',
    icon: 'BookOpen',
    category: 'collection',
    target: 20,
    rewardPoints: 100000,
    evalProgress: (ctx) => {
      const count = Object.keys(ctx.ownedFrogs).length;
      return { current: Math.min(20, count), isCompleted: count >= 20 };
    },
  },
  {
    id: 'collect_30',
    name: 'Nhà Sinh Vật Học Ao Sen',
    description: 'Sưu tầm thành công 30 loài ếch đa dạng',
    icon: 'Compass',
    category: 'collection',
    target: 30,
    rewardPoints: 300000,
    evalProgress: (ctx) => {
      const count = Object.keys(ctx.ownedFrogs).length;
      return { current: Math.min(30, count), isCompleted: count >= 30 };
    },
  },
  {
    id: 'collect_40',
    name: 'Chúa Tể Đầm Lầy Bách Diệp',
    description: 'Hoàn thành trọn bộ sưu tập toàn năng 40 loài ếch v2.0',
    icon: 'Crown',
    category: 'collection',
    target: 40,
    rewardPoints: 2000000,
    evalProgress: (ctx) => {
      const count = Object.keys(ctx.ownedFrogs).length;
      return { current: Math.min(40, count), isCompleted: count >= 40 };
    },
  },
  {
    id: 'level_up_frog_5',
    name: 'Huấn Luyện Viên Ếch Cừ Khôi',
    description: 'Thăng cấp một loài ếch bất kỳ đạt Cấp 5',
    icon: 'ArrowUpCircle',
    category: 'collection',
    target: 5,
    rewardPoints: 50000,
    evalProgress: (ctx) => {
      const maxLvl = Math.max(0, ...Object.values(ctx.ownedFrogs).map((f) => f.level || 1));
      return { current: Math.min(5, maxLvl), isCompleted: maxLvl >= 5 };
    },
  },

  // ================= 7. THÀNH TỰU BÍ MẬT (SECRET) =================
  {
    id: 'secret_ribbit_master',
    name: 'Bí Mật Của Ếch Thần',
    description: 'Đạt chuỗi combo 20 khi đồng hành cùng Ếch Rêu hoặc Ếch Thần Ao Sen',
    icon: 'Sparkles',
    category: 'special',
    target: 1,
    rewardPoints: 100000,
    isSecret: true,
    evalProgress: (ctx) => {
      const isTargetMain = ctx.mainFrogId === 'mossy_frog' || ctx.mainFrogId === 'lotus_guardian_frog';
      const eventCombo = ctx.lastClickCombo !== undefined ? ctx.lastClickCombo : 0;
      const isCompleted = isTargetMain && eventCombo >= 20;
      return { current: isCompleted ? 1 : 0, isCompleted };
    },
  },
];

/**
 * Đánh giá toàn bộ thành tựu dựa trên trạng thái game hiện tại
 */
export function evaluateAchievements(
  context: AchievementEvaluationContext,
  currentlyUnlockedIds: string[] = []
): {
  achievements: Achievement[];
  newlyUnlockedIds: string[];
  totalRewardsEarned: number;
} {
  const unlockedSet = new Set(currentlyUnlockedIds);
  const newlyUnlockedIds: string[] = [];
  const achievements: Achievement[] = [];
  let totalRewardsEarned = 0;

  for (const def of ACHIEVEMENTS_DEFINITIONS) {
    const isAlreadyUnlocked = unlockedSet.has(def.id);
    const { current, isCompleted } = def.evalProgress(context);

    if (isCompleted && !isAlreadyUnlocked) {
      newlyUnlockedIds.push(def.id);
      unlockedSet.add(def.id);
      totalRewardsEarned += def.rewardPoints || 0;
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
      rewardPoints: def.rewardPoints,
      isSecret: def.isSecret,
    });
  }

  return { achievements, newlyUnlockedIds, totalRewardsEarned };
}
