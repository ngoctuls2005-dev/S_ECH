import { UpgradeConfig, FrogBuff } from './types';

export const UPGRADES_CONFIG: UpgradeConfig[] = [
  {
    id: 'divine_finger',
    name: 'Ngón tay thần',
    description: 'Tăng +1 điểm nhận được mỗi lần sờ ếch',
    icon: 'Sparkles',
    basePrice: 50,
    effectType: 'click_flat',
    effectValue: 1,
  },
  {
    id: 'soft_glove',
    name: 'Găng tay mềm mại',
    description: 'Chạm êm ái hơn, tăng +5 điểm mỗi lần sờ',
    icon: 'Hand',
    basePrice: 250,
    effectType: 'click_flat',
    effectValue: 5,
  },
  {
    id: 'frog_touch_machine',
    name: 'Máy sờ ếch',
    description: 'Thiết bị tự động sờ ếch, tăng +1 điểm mỗi giây',
    icon: 'Cpu',
    basePrice: 100,
    effectType: 'idle_flat',
    effectValue: 1,
  },
  {
    id: 'frog_touch_team',
    name: 'Đội sờ ếch',
    description: 'Thuê nhóm trợ lý sờ ếch chuyên nghiệp, tăng +10 điểm/giây',
    icon: 'Users',
    basePrice: 1000,
    effectType: 'idle_flat',
    effectValue: 10,
  },
  {
    id: 'lucky_hand',
    name: 'Bàn tay may mắn',
    description: 'Tăng thêm +1% tỉ lệ xuất hiện cú sờ chí mạng',
    icon: 'Clover',
    basePrice: 2500,
    effectType: 'crit_chance_flat',
    effectValue: 0.01,
  },
  {
    id: 'frog_combo',
    name: 'Combo ếch',
    description: 'Gia tăng tốc độ tích lũy và giới hạn tối đa của combo',
    icon: 'Flame',
    basePrice: 5000,
    effectType: 'combo_bonus_flat',
    effectValue: 0.02,
  },
  {
    id: 'frog_factory',
    name: 'Nhà máy sờ ếch',
    description: 'Dây chuyền công nghiệp sờ ếch tự động, tăng +100 điểm/giây',
    icon: 'Factory',
    basePrice: 15000,
    effectType: 'idle_flat',
    effectValue: 100,
  },
  {
    id: 'frog_magic',
    name: 'Phép thuật ếch',
    description: 'Cường hóa ma thuật ao sen, tăng 10% tổng điểm nhận được',
    icon: 'Wand2',
    basePrice: 50000,
    effectType: 'multiplier_percent',
    effectValue: 0.10,
  },
];

/**
 * Tính giá mua 1 cấp tiếp theo
 * price = ceil(basePrice * 1.15 ^ currentLevel)
 */
export function getSingleUpgradePrice(
  basePrice: number,
  currentLevel: number,
  discountPercent: number = 0
): number {
  const rawPrice = Math.ceil(basePrice * Math.pow(1.15, currentLevel));
  if (discountPercent <= 0) return rawPrice;
  const discounted = Math.ceil(rawPrice * (1 - Math.min(0.8, discountPercent)));
  return Math.max(1, discounted);
}

/**
 * Tính tổng chi phí để mua N cấp (ví dụ x1, x10)
 */
export function calculateBatchUpgradeCost(
  basePrice: number,
  currentLevel: number,
  count: number,
  discountPercent: number = 0
): number {
  if (count <= 0) return 0;
  let total = 0;
  for (let i = 0; i < count; i++) {
    total += getSingleUpgradePrice(basePrice, currentLevel + i, discountPercent);
  }
  return total;
}

/**
 * Tính số cấp tối đa (MAX) có thể mua được dựa trên số điểm hiện có
 */
export function calculateMaxAffordableUpgrades(
  basePrice: number,
  currentLevel: number,
  availablePoints: number,
  discountPercent: number = 0
): { count: number; totalCost: number } {
  if (availablePoints <= 0) return { count: 0, totalCost: 0 };

  let count = 0;
  let totalCost = 0;
  const hardLimit = 500; // Tránh loop quá lớn trong 1 lần mua

  while (count < hardLimit) {
    const nextPrice = getSingleUpgradePrice(basePrice, currentLevel + count, discountPercent);
    if (totalCost + nextPrice > availablePoints) {
      break;
    }
    totalCost += nextPrice;
    count++;
  }

  return { count, totalCost };
}

/**
 * Lấy tỉ lệ giảm giá từ danh sách buff của ếch
 */
export function getUpgradeDiscount(frogBuffs: FrogBuff[]): number {
  let discount = 0;
  for (const buff of frogBuffs) {
    if (buff.type === 'upgrade_discount_percent') {
      discount += buff.value;
    }
  }
  return Math.min(0.75, discount); // Giảm tối đa 75%
}

/**
 * Thực hiện mua nâng cấp
 */
export function purchaseUpgrade(
  upgradeId: string,
  mode: 'x1' | 'x10' | 'max',
  currentPoints: number,
  upgradeLevels: Record<string, number>,
  frogBuffs: FrogBuff[] = []
): {
  success: boolean;
  newPoints: number;
  newLevels: Record<string, number>;
  levelsBought: number;
  cost: number;
} {
  const config = UPGRADES_CONFIG.find((u) => u.id === upgradeId);
  if (!config) {
    return {
      success: false,
      newPoints: currentPoints,
      newLevels: upgradeLevels,
      levelsBought: 0,
      cost: 0,
    };
  }

  const currentLevel = upgradeLevels[upgradeId] || 0;
  const discount = getUpgradeDiscount(frogBuffs);

  let levelsToBuy = 0;
  let cost = 0;

  if (mode === 'x1') {
    levelsToBuy = 1;
    cost = calculateBatchUpgradeCost(config.basePrice, currentLevel, 1, discount);
  } else if (mode === 'x10') {
    levelsToBuy = 10;
    cost = calculateBatchUpgradeCost(config.basePrice, currentLevel, 10, discount);
  } else if (mode === 'max') {
    const maxInfo = calculateMaxAffordableUpgrades(
      config.basePrice,
      currentLevel,
      currentPoints,
      discount
    );
    levelsToBuy = maxInfo.count;
    cost = maxInfo.totalCost;
  }

  // Kiểm tra đủ điểm
  if (levelsToBuy <= 0 || currentPoints < cost) {
    return {
      success: false,
      newPoints: currentPoints,
      newLevels: upgradeLevels,
      levelsBought: 0,
      cost: 0,
    };
  }

  const newPoints = currentPoints - cost;
  const newLevels = {
    ...upgradeLevels,
    [upgradeId]: currentLevel + levelsToBuy,
  };

  return {
    success: true,
    newPoints,
    newLevels,
    levelsBought: levelsToBuy,
    cost,
  };
}
