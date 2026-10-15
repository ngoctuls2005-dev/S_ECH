import { FrogBuff } from './types';

export interface IdleConfig {
  offlineRate: number;        // Mặc định 0.5 (50%)
  maxOfflineSeconds: number;  // Mặc định 8 * 3600 = 28800s (8 giờ)
  minOfflineThresholdSeconds: number; // Mặc định 30s mới tính offline modal
}

export const DEFAULT_IDLE_CONFIG: IdleConfig = {
  offlineRate: 0.50,
  maxOfflineSeconds: 8 * 3600,
  minOfflineThresholdSeconds: 30,
};

export interface OfflineRewardResult {
  earnedPoints: number;
  elapsedSeconds: number;
  cappedSeconds: number;
  wasCapped: boolean;
  pointsPerSecond: number;
}

/**
 * Tính tổng điểm tự động mỗi giây (Points Per Second - PPS)
 */
export function calculatePointsPerSecond(
  upgradeLevels: Record<string, number>,
  activeFrogBuffs: FrogBuff[] = []
): number {
  let flatIdle = 0;
  // Máy sờ ếch (+1/giây)
  flatIdle += (upgradeLevels['frog_touch_machine'] || 0) * 1;
  // Đội sờ ếch (+10/giây)
  flatIdle += (upgradeLevels['frog_touch_team'] || 0) * 10;
  // Nhà máy sờ ếch (+100/giây)
  flatIdle += (upgradeLevels['frog_factory'] || 0) * 100;

  if (flatIdle <= 0) return 0;

  // Phép thuật ếch (+10% tổng điểm mỗi level)
  const magicLevel = upgradeLevels['frog_magic'] || 0;
  let bonusPercent = magicLevel * 10;

  // Buff từ ếch
  for (const buff of activeFrogBuffs) {
    if (buff.type === 'idle_points_percent' || buff.type === 'total_points_percent') {
      bonusPercent += Math.round(buff.value * 100);
    }
  }

  const multiplier = 1 + bonusPercent / 100;
  const result = flatIdle * multiplier;

  return Math.round(result * 10) / 10; // Giữ 1 chữ số thập phân nếu cần
}

/**
 * Tích lũy điểm theo delta time thực tế (chạy trong tick loop)
 * Trả về số điểm nguyên cần cộng và phần dư chưa đủ 1 điểm
 */
export function accumulateDeltaPoints(
  pps: number,
  deltaSeconds: number,
  currentAccumulator: number = 0
): { pointsToAdd: number; newAccumulator: number } {
  if (pps <= 0 || deltaSeconds <= 0) {
    return { pointsToAdd: 0, newAccumulator: currentAccumulator };
  }

  // Bảo vệ tab background throttle cực đại: giới hạn deltaSeconds tối đa 10s cho 1 tick đơn lẻ
  const safeDelta = Math.min(10, deltaSeconds);
  const total = currentAccumulator + pps * safeDelta;
  const pointsToAdd = Math.floor(total);
  const newAccumulator = total - pointsToAdd;

  return { pointsToAdd, newAccumulator };
}

/**
 * Tính toán phần thưởng offline khi mở lại game
 */
export function calculateOfflineReward(
  lastActiveTimestamp: number,
  nowTimestamp: number,
  pps: number,
  config: IdleConfig = DEFAULT_IDLE_CONFIG
): OfflineRewardResult | null {
  if (pps <= 0 || !lastActiveTimestamp || nowTimestamp <= lastActiveTimestamp) {
    return null;
  }

  const rawElapsedSeconds = Math.max(0, Math.floor((nowTimestamp - lastActiveTimestamp) / 1000));
  
  if (rawElapsedSeconds < config.minOfflineThresholdSeconds) {
    return null;
  }

  const wasCapped = rawElapsedSeconds > config.maxOfflineSeconds;
  const cappedSeconds = Math.min(rawElapsedSeconds, config.maxOfflineSeconds);

  // 50% thu nhập tự động
  const earnedPoints = Math.floor(cappedSeconds * pps * config.offlineRate);

  if (earnedPoints <= 0) {
    return null;
  }

  return {
    earnedPoints,
    elapsedSeconds: rawElapsedSeconds,
    cappedSeconds,
    wasCapped,
    pointsPerSecond: pps,
  };
}
