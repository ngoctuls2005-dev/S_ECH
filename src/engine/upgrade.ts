import { UpgradeConfig, FrogBuff } from './types';

export const UPGRADES_CONFIG: UpgradeConfig[] = [
  {
    id: 'divine_finger',
    name: 'Ngón tay thần',
    description: 'Tăng +1 điểm nhận được mỗi lần sờ ếch',
    icon: 'Sparkles',
    basePrice: 50,
    category: 'click',
    effectType: 'click_flat',
    effectValue: 1,
  },
  {
    id: 'soft_glove',
    name: 'Găng tay mềm mại',
    description: 'Chạm êm ái hơn, tăng +5 điểm mỗi lần sờ',
    icon: 'Hand',
    basePrice: 250,
    category: 'click',
    effectType: 'click_flat',
    effectValue: 5,
  },
  {
    id: 'frog_touch_machine',
    name: 'Máy sờ ếch',
    description: 'Thiết bị tự động sờ ếch, tăng +1 điểm mỗi giây',
    icon: 'Cpu',
    basePrice: 100,
    category: 'idle',
    effectType: 'idle_flat',
    effectValue: 1,
  },
  {
    id: 'frog_touch_team',
    name: 'Đội sờ ếch',
    description: 'Thuê nhóm trợ lý sờ ếch chuyên nghiệp, tăng +10 điểm/giây',
    icon: 'Users',
    basePrice: 1000,
    category: 'idle',
    effectType: 'idle_flat',
    effectValue: 10,
  },
  {
    id: 'lucky_hand',
    name: 'Bàn tay may mắn',
    description: 'Tăng thêm +1% tỉ lệ xuất hiện cú sờ chí mạng',
    icon: 'Clover',
    basePrice: 2500,
    category: 'click',
    effectType: 'crit_chance_flat',
    effectValue: 0.01,
  },
  {
    id: 'frog_combo',
    name: 'Combo ếch',
    description: 'Gia tăng tốc độ tích lũy và giới hạn tối đa của combo',
    icon: 'Flame',
    basePrice: 5000,
    category: 'special',
    effectType: 'combo_bonus_flat',
    effectValue: 0.02,
  },
  {
    id: 'frog_factory',
    name: 'Nhà máy sờ ếch',
    description: 'Dây chuyền công nghiệp sờ ếch tự động, tăng +100 điểm/giây',
    icon: 'Factory',
    basePrice: 15000,
    category: 'idle',
    effectType: 'idle_flat',
    effectValue: 100,
  },
  {
    id: 'frog_magic',
    name: 'Phép thuật ếch',
    description: 'Cường hóa ma thuật ao sen, tăng 10% tổng điểm nhận được',
    icon: 'Wand2',
    basePrice: 50000,
    category: 'special',
    effectType: 'multiplier_percent',
    effectValue: 0.10,
  },
  // --- 10 NÂNG CẤP MỚI V2.0 ---
  {
    id: 'platinum_hand',
    name: 'Bàn tay bạch kim',
    description: 'Mạ kim loại quý vào bàn tay, tăng +100 điểm mỗi lần sờ',
    icon: 'Shield',
    basePrice: 80000,
    category: 'click',
    effectType: 'click_flat',
    effectValue: 100,
  },
  {
    id: 'conveyor_touch',
    name: 'Băng chuyền sờ ếch',
    description: 'Vận chuyển ếch liên tục qua trạm vuốt ve, tăng +500 điểm/giây',
    icon: 'Cog',
    basePrice: 150000,
    category: 'idle',
    effectType: 'idle_flat',
    effectValue: 500,
  },
  {
    id: 'precise_touch',
    name: 'Thuật sờ chuẩn xác',
    description: 'Nắm bắt huyệt đạo loài ếch, tăng +2% tỉ lệ chí mạng',
    icon: 'Target',
    basePrice: 300000,
    category: 'click',
    effectType: 'crit_chance_flat',
    effectValue: 0.02,
  },
  {
    id: 'legendary_handprint',
    name: 'Dấu tay huyền thoại',
    description: 'Để lại dấu ấn uy lực cổ xưa, tăng +500 điểm mỗi lần sờ',
    icon: 'Award',
    basePrice: 750000,
    category: 'click',
    effectType: 'click_flat',
    effectValue: 500,
  },
  {
    id: 'robot_touch',
    name: 'Robot sờ ếch',
    description: 'Công nghệ AI sinh học tự động sờ ếch siêu tốc, tăng +2.500 điểm/giây',
    icon: 'Bot',
    basePrice: 1000000,
    category: 'idle',
    effectType: 'idle_flat',
    effectValue: 2500,
  },
  {
    id: 'crit_mastery',
    name: 'Luyện sờ chí mạng',
    description: 'Bậc thầy cảm giác sờ ếch, tăng +0.15 hệ số nhân chí mạng',
    icon: 'Zap',
    basePrice: 2000000,
    category: 'click',
    effectType: 'crit_multiplier_flat',
    effectValue: 0.15,
  },
  {
    id: 'frog_ranch',
    name: 'Trại sờ ếch',
    description: 'Khu sinh thái quy mô lớn cho hàng ngàn chú ếch, tăng +12.000 điểm/giây',
    icon: 'Trees',
    basePrice: 6000000,
    category: 'idle',
    effectType: 'idle_flat',
    effectValue: 12000,
  },
  {
    id: 'cosmic_hand',
    name: 'Bàn tay vũ trụ',
    description: 'Hấp thu tinh hoa ngân hà để sờ ếch, tăng +3.000 điểm mỗi lần sờ',
    icon: 'Moon',
    basePrice: 12000000,
    category: 'click',
    effectType: 'click_flat',
    effectValue: 3000,
  },
  {
    id: 'frog_corporation',
    name: 'Tập đoàn sờ ếch',
    description: 'Tổ chức đa quốc gia chuyên nghiên cứu sờ ếch, tăng +80.000 điểm/giây',
    icon: 'Building2',
    basePrice: 40000000,
    category: 'idle',
    effectType: 'idle_flat',
    effectValue: 80000,
  },
  {
    id: 'frog_sanctuary',
    name: 'Thánh địa sờ ếch',
    description: 'Miền đất hứa nơi các thần ếch an cư, tăng +300.000 điểm/giây',
    icon: 'Crown',
    basePrice: 250000000,
    category: 'idle',
    effectType: 'idle_flat',
    effectValue: 300000,
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
