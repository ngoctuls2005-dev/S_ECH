import { FrogOwned, GameSettings } from './types';
import { GachaPityState, INITIAL_PITY_STATE } from './gacha';

export const CURRENT_SAVE_VERSION = 1;
export const STORAGE_KEY = 's_ech_game_save_v1';

export interface GameSaveData {
  version: number;
  points: number;
  totalPointsEarned: number;
  totalClicks: number;
  upgrades: Record<string, number>;
  ownedFrogs: Record<string, FrogOwned>;
  mainFrogId: string;
  pity: GachaPityState;
  unlockedAchievements: string[];
  settings: GameSettings;
  lastSavedTimestamp: number;
}

export const DEFAULT_INITIAL_SAVE: GameSaveData = {
  version: CURRENT_SAVE_VERSION,
  points: 0,
  totalPointsEarned: 0,
  totalClicks: 0,
  upgrades: {},
  ownedFrogs: {
    green_frog: {
      id: 'green_frog',
      level: 1,
      fragments: 0,
      unlockedAt: 0,
    },
  },
  mainFrogId: 'green_frog',
  pity: INITIAL_PITY_STATE,
  unlockedAchievements: [],
  settings: {
    soundEnabled: true,
    musicEnabled: true,
    volume: 0.7,
    reducedMotion: false,
  },
  lastSavedTimestamp: Date.now(),
};

/**
 * Migration schema khi cập nhật phiên bản save
 */
export function migrateSaveData(raw: any): GameSaveData {
  const version = typeof raw.version === 'number' ? raw.version : 0;
  let migrated = { ...raw };

  if (version < 1) {
    // Migration logic từ version 0 lên version 1
    migrated.version = 1;
    if (!migrated.ownedFrogs) migrated.ownedFrogs = DEFAULT_INITIAL_SAVE.ownedFrogs;
    if (!migrated.mainFrogId) migrated.mainFrogId = 'green_frog';
    if (!migrated.pity) migrated.pity = INITIAL_PITY_STATE;
    if (!migrated.unlockedAchievements) migrated.unlockedAchievements = [];
    if (!migrated.settings) migrated.settings = DEFAULT_INITIAL_SAVE.settings;
  }

  return migrated as GameSaveData;
}

/**
 * Kiểm tra tính hợp lệ của dữ liệu trước khi nạp vào game
 */
export function validateSaveData(data: any): { valid: boolean; error?: string; cleanData?: GameSaveData } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Dữ liệu không phải là đối tượng hợp lệ' };
  }

  // Kiểm tra điểm số
  if (typeof data.points !== 'number' || isNaN(data.points) || data.points < 0) {
    return { valid: false, error: 'Điểm số không hợp lệ' };
  }

  if (typeof data.totalPointsEarned !== 'number' || isNaN(data.totalPointsEarned) || data.totalPointsEarned < 0) {
    return { valid: false, error: 'Tổng điểm kiếm được không hợp lệ' };
  }

  if (typeof data.totalClicks !== 'number' || isNaN(data.totalClicks) || data.totalClicks < 0) {
    return { valid: false, error: 'Tổng số lượt click không hợp lệ' };
  }

  // Kiểm tra ếch
  if (!data.ownedFrogs || typeof data.ownedFrogs !== 'object') {
    return { valid: false, error: 'Danh sách ếch không hợp lệ' };
  }

  // Kiểm tra mainFrogId
  if (typeof data.mainFrogId !== 'string' || !data.mainFrogId) {
    return { valid: false, error: 'Ếch chính không hợp lệ' };
  }

  const clean = migrateSaveData(data);
  return { valid: true, cleanData: clean };
}

/**
 * Lưu vào LocalStorage / Storage
 */
export function saveGameStateToStorage(state: GameSaveData, customStorage?: Storage): boolean {
  try {
    const storage = customStorage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!storage) return false;

    const toSave: GameSaveData = {
      ...state,
      lastSavedTimestamp: Date.now(),
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    return true;
  } catch (e) {
    console.error('Lỗi khi lưu game:', e);
    return false;
  }
}

/**
 * Nạp từ LocalStorage / Storage
 */
export function loadGameStateFromStorage(customStorage?: Storage): GameSaveData {
  try {
    const storage = customStorage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!storage) return DEFAULT_INITIAL_SAVE;

    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_INITIAL_SAVE;

    const parsed = JSON.parse(raw);
    const validation = validateSaveData(parsed);
    if (validation.valid && validation.cleanData) {
      return validation.cleanData;
    }
    return DEFAULT_INITIAL_SAVE;
  } catch (e) {
    console.error('Lỗi khi nạp dữ liệu lưu game:', e);
    return DEFAULT_INITIAL_SAVE;
  }
}

/**
 * Xuất file save ra chuỗi JSON Base64 kèm Header
 */
export function exportSaveToString(data: GameSaveData): string {
  const jsonStr = JSON.stringify(data);
  const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
  return `SECH_SAVE_${base64}`;
}

/**
 * Nhập file save từ chuỗi Base64
 */
export function importSaveFromString(rawString: string): { success: boolean; data?: GameSaveData; error?: string } {
  try {
    const trimmed = rawString.trim();
    let jsonStr = trimmed;

    if (trimmed.startsWith('SECH_SAVE_')) {
      const base64 = trimmed.substring('SECH_SAVE_'.length);
      jsonStr = decodeURIComponent(escape(atob(base64)));
    }

    const parsed = JSON.parse(jsonStr);
    const validation = validateSaveData(parsed);

    if (!validation.valid || !validation.cleanData) {
      return { success: false, error: validation.error || 'Dữ liệu file lưu không hợp lệ' };
    }

    return { success: true, data: validation.cleanData };
  } catch (e) {
    return { success: false, error: 'Chuỗi dữ liệu bị hỏng hoặc sai định dạng' };
  }
}

/**
 * Xóa trắng dữ liệu game (Reset)
 */
export function clearSavedGame(customStorage?: Storage): void {
  try {
    const storage = customStorage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (storage) {
      storage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.error('Lỗi khi reset game:', e);
  }
}
