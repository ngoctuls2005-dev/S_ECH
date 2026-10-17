// Định nghĩa các kiểu dữ liệu cốt lõi cho Game S Ếch

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface FrogBuff {
  type: 
    | 'click_points_percent'   // Tăng % điểm mỗi click
    | 'idle_points_percent'    // Tăng % điểm tự động/giây
    | 'crit_chance_bonus'      // Tăng % tỉ lệ chí mạng (cộng thẳng, ví dụ 0.05 = +5%)
    | 'crit_multiplier_bonus'  // Tăng hệ số nhân chí mạng
    | 'total_points_percent'   // Tăng % tổng điểm nhận được
    | 'upgrade_discount_percent' // Giảm giá nâng cấp
    | 'combo_bonus_percent';   // Tăng thưởng combo
  value: number; // Ví dụ 0.10 là +10%
}

export interface FrogSpecies {
  id: string;
  nameVi: string;
  nameEn: string;
  scientificName?: string;
  rarity: Rarity;
  description: string;
  image: string;
  buff: FrogBuff;
  credit: {
    source: string;
    author: string;
    license: string;
    url?: string;
  };
}

export interface FrogOwned {
  id: string; // tương ứng frogId
  level: number;
  fragments: number;
  unlockedAt: number;
}

export interface UpgradeConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  basePrice: number;
  category?: 'click' | 'idle' | 'special';
  effectType: 
    | 'click_flat'         // +X điểm mỗi click
    | 'idle_flat'          // +X điểm mỗi giây
    | 'crit_chance_flat'   // +X% tỉ lệ chí mạng
    | 'crit_multiplier_flat' // +X hệ số nhân chí mạng
    | 'combo_bonus_flat'   // Tăng hiệu quả combo
    | 'multiplier_percent';// Tăng % tổng điểm nhận
  effectValue: number;
  maxLevel?: number;
}

export interface ClickResult {
  earnedPoints: number;
  isCritical: boolean;
  critMultiplier: number;
  comboCount: number;
  comboMultiplier: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'click' | 'score' | 'gacha' | 'collection' | 'upgrade' | 'special';
  target: number;
  progress: number;
  isUnlocked: boolean;
  unlockedAt?: number;
  rewardPoints?: number;
  isSecret?: boolean;
}


export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  volume: number; // 0 to 1
  reducedMotion: boolean;
}
