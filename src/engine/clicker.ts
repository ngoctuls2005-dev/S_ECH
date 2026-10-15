import { ClickResult, FrogBuff } from './types';

export interface ClickerStateParams {
  baseClickPower: number; // Mặc định 1
  upgradeLevels: Record<string, number>;
  activeFrogBuffs: FrogBuff[];
  currentCombo: number;
  lastClickTimestamp: number;
  now?: number;
  rng?: () => number; // Để mock test
}

export const COMBO_TIMEOUT_MS = 1800; // Thời gian tối đa giữa 2 lần click để giữ combo

/**
 * Tính toán điểm click cơ bản trước khi tính crit và combo
 */
export function calculateClickPower(
  basePower: number,
  upgradeLevels: Record<string, number>,
  activeFrogBuffs: FrogBuff[]
): number {
  let flatBonus = 0;
  // Ngón tay thần (+1/click)
  flatBonus += (upgradeLevels['divine_finger'] || 0) * 1;
  // Găng tay mềm mại (+5/click)
  flatBonus += (upgradeLevels['soft_glove'] || 0) * 5;

  // Phép thuật ếch (+10% tổng điểm mỗi level)
  const magicLevel = upgradeLevels['frog_magic'] || 0;
  let bonusPercent = magicLevel * 10;

  // Buff từ ếch
  for (const buff of activeFrogBuffs) {
    if (buff.type === 'click_points_percent' || buff.type === 'total_points_percent') {
      bonusPercent += Math.round(buff.value * 100);
    }
  }

  const multiplier = 1 + bonusPercent / 100;
  const result = (basePower + flatBonus) * multiplier;
  return Math.max(1, Math.round(result));
}

/**
 * Tính toán tỉ lệ và hệ số chí mạng
 */
export function calculateCritStats(
  upgradeLevels: Record<string, number>,
  activeFrogBuffs: FrogBuff[]
): { critChance: number; critMultiplier: number } {
  // Mặc định 5% chí mạng, hệ số x2
  let critChance = 0.05;
  let critMultiplier = 2.0;

  // Bàn tay may mắn (+1% chí mạng mỗi level)
  const luckyLevel = upgradeLevels['lucky_hand'] || 0;
  critChance += luckyLevel * 0.01;

  for (const buff of activeFrogBuffs) {
    if (buff.type === 'crit_chance_bonus') {
      critChance += buff.value;
    }
    if (buff.type === 'crit_multiplier_bonus') {
      critMultiplier += buff.value;
    }
  }

  // Tỉ lệ chí mạng không vượt quá 95% để giữ tính ngẫu nhiên thú vị
  critChance = Math.min(0.95, Math.max(0.01, critChance));

  return { critChance, critMultiplier };
}

/**
 * Tính toán hệ số nhân của combo
 */
export function calculateComboMultiplier(
  comboCount: number,
  comboUpgradeLevel: number = 0,
  activeFrogBuffs: FrogBuff[] = []
): number {
  if (comboCount <= 0) return 1.0;

  // Mỗi 5 combo được tăng +0.1 vào hệ số nhân
  const baseStepBonus = 0.1;
  // Nâng cấp Combo ếch tăng thêm +0.02 mỗi level cho step
  const extraStep = comboUpgradeLevel * 0.02;
  
  let comboBonusPercent = 0;
  for (const buff of activeFrogBuffs) {
    if (buff.type === 'combo_bonus_percent') {
      comboBonusPercent += buff.value;
    }
  }

  const steps = Math.floor(comboCount / 5);
  const rawBonus = steps * (baseStepBonus + extraStep) * (1 + comboBonusPercent);
  
  // Cap combo: Mặc định x2.5, nâng cấp combo_frog tăng thêm 0.25 mỗi level
  const maxCap = 2.5 + comboUpgradeLevel * 0.25;

  return Math.min(maxCap, 1.0 + rawBonus);
}

/**
 * Xử lý sự kiện click sờ ếch
 */
export function processFrogClick(params: ClickerStateParams): {
  result: ClickResult;
  newCombo: number;
  newTimestamp: number;
} {
  const now = params.now ?? Date.now();
  const rng = params.rng ?? Math.random;

  // Cập nhật combo theo thời gian
  let newCombo = 1;
  if (params.lastClickTimestamp > 0 && now - params.lastClickTimestamp <= COMBO_TIMEOUT_MS) {
    newCombo = params.currentCombo + 1;
  }

  const comboLevel = params.upgradeLevels['frog_combo'] || 0;
  const comboMultiplier = calculateComboMultiplier(newCombo, comboLevel, params.activeFrogBuffs);

  // Tính điểm click cơ bản
  const basePower = calculateClickPower(
    params.baseClickPower,
    params.upgradeLevels,
    params.activeFrogBuffs
  );

  // Tính chí mạng
  const { critChance, critMultiplier } = calculateCritStats(
    params.upgradeLevels,
    params.activeFrogBuffs
  );

  const roll = rng();
  const isCritical = roll < critChance;
  const appliedCritMultiplier = isCritical ? critMultiplier : 1.0;

  // Tổng điểm nhận được
  const finalPoints = Math.max(1, Math.round(basePower * appliedCritMultiplier * comboMultiplier));

  return {
    result: {
      earnedPoints: finalPoints,
      isCritical,
      critMultiplier: appliedCritMultiplier,
      comboCount: newCombo,
      comboMultiplier: Number(comboMultiplier.toFixed(2)),
    },
    newCombo,
    newTimestamp: now,
  };
}

/**
 * Định dạng số hiển thị cho giao diện (hỗ trợ số hàng triệu, hàng tỉ)
 */
export function formatNumber(num: number): string {
  if (num === null || num === undefined || isNaN(num)) return '0';
  if (num < 0) return '0';

  if (num < 1000) {
    return Math.floor(num).toLocaleString('vi-VN');
  }

  const suffixes = [
    { value: 1e15, symbol: 'Q' },
    { value: 1e12, symbol: 'T' },
    { value: 1e9, symbol: 'B' },
    { value: 1e6, symbol: 'M' },
    { value: 1e3, symbol: 'K' },
  ];

  for (const s of suffixes) {
    if (num >= s.value) {
      const formatted = (num / s.value).toFixed(1);
      // Xóa .0 nếu có
      return `${formatted.replace(/\.0$/, '')} ${s.symbol}`;
    }
  }

  return Math.floor(num).toLocaleString('vi-VN');
}
