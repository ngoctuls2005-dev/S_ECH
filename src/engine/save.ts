import { FrogOwned, GameSettings } from './types';
import { GachaPityState, INITIAL_PITY_STATE } from './gacha';
import { FROG_SPECIES_LIST } from '../data/frogs';

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

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeCounter(value: unknown, fallback: number = 0): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

/** Periodic snapshots must not move the offline checkpoint while the page is hidden. */
export function shouldSaveAutoSnapshot(visibilityState: string): boolean {
  return visibilityState === 'visible';
}

/**
 * Migration schema khi cập nhật phiên bản save
 */
export function migrateSaveData(raw: any): GameSaveData {
  const rawSettings = isRecord(raw.settings) ? raw.settings : {};
  const rawUpgrades = isRecord(raw.upgrades) ? raw.upgrades : {};
  const rawOwnedFrogs = isRecord(raw.ownedFrogs) ? raw.ownedFrogs : {};
  const validFrogIds = new Set(FROG_SPECIES_LIST.map((frog) => frog.id));
  const ownedFrogs: Record<string, FrogOwned> = {};

  for (const [frogId, rawFrog] of Object.entries(rawOwnedFrogs)) {
    if (!validFrogIds.has(frogId) || !isRecord(rawFrog)) continue;
    ownedFrogs[frogId] = {
      id: frogId,
      level: Math.max(1, normalizeCounter(rawFrog.level, 1)),
      fragments: normalizeCounter(rawFrog.fragments),
      unlockedAt: normalizeCounter(rawFrog.unlockedAt),
    };
  }

  if (Object.keys(ownedFrogs).length === 0) {
    ownedFrogs.green_frog = { ...DEFAULT_INITIAL_SAVE.ownedFrogs.green_frog };
  }

  const mainFrogId = typeof raw.mainFrogId === 'string' && ownedFrogs[raw.mainFrogId]
    ? raw.mainFrogId
    : ownedFrogs.green_frog
      ? 'green_frog'
      : Object.keys(ownedFrogs)[0];
  const rawPity = isRecord(raw.pity) ? raw.pity : {};
  const settings = {
    soundEnabled: typeof rawSettings.soundEnabled === 'boolean'
      ? rawSettings.soundEnabled
      : DEFAULT_INITIAL_SAVE.settings.soundEnabled,
    musicEnabled: typeof rawSettings.musicEnabled === 'boolean'
      ? rawSettings.musicEnabled
      : DEFAULT_INITIAL_SAVE.settings.musicEnabled,
    volume: typeof rawSettings.volume === 'number' && Number.isFinite(rawSettings.volume)
      ? Math.max(0, Math.min(1, rawSettings.volume))
      : DEFAULT_INITIAL_SAVE.settings.volume,
    reducedMotion: typeof rawSettings.reducedMotion === 'boolean'
      ? rawSettings.reducedMotion
      : DEFAULT_INITIAL_SAVE.settings.reducedMotion,
  };

  return {
    version: CURRENT_SAVE_VERSION,
    points: raw.points,
    totalPointsEarned: raw.totalPointsEarned,
    totalClicks: raw.totalClicks,
    upgrades: Object.fromEntries(
      Object.entries(rawUpgrades)
        .filter(([, level]) => typeof level === 'number' && Number.isFinite(level) && level >= 0)
        .map(([id, level]) => [id, Math.floor(level as number)])
    ),
    ownedFrogs,
    mainFrogId,
    pity: {
      sinceLastRare: normalizeCounter(rawPity.sinceLastRare, INITIAL_PITY_STATE.sinceLastRare),
      sinceLastEpic: normalizeCounter(rawPity.sinceLastEpic, INITIAL_PITY_STATE.sinceLastEpic),
      sinceLastLegendary: normalizeCounter(rawPity.sinceLastLegendary, INITIAL_PITY_STATE.sinceLastLegendary),
    },
    unlockedAchievements: Array.isArray(raw.unlockedAchievements)
      ? raw.unlockedAchievements.filter((id: unknown): id is string => typeof id === 'string')
      : [],
    settings,
    lastSavedTimestamp: typeof raw.lastSavedTimestamp === 'number'
      && Number.isFinite(raw.lastSavedTimestamp)
      && raw.lastSavedTimestamp > 0
      ? raw.lastSavedTimestamp
      : Date.now(),
  };
}

/**
 * Kiểm tra tính hợp lệ của dữ liệu trước khi nạp vào game
 */
export function validateSaveData(data: any): { valid: boolean; error?: string; cleanData?: GameSaveData } {
  if (!isRecord(data)) {
    return { valid: false, error: 'Dữ liệu không phải là đối tượng hợp lệ' };
  }

  if (typeof data.version === 'number' && data.version > CURRENT_SAVE_VERSION) {
    return { valid: false, error: 'Bản lưu được tạo bởi phiên bản game mới hơn' };
  }

  // Kiểm tra điểm số
  if (typeof data.points !== 'number' || !Number.isFinite(data.points) || data.points < 0) {
    return { valid: false, error: 'Điểm số không hợp lệ' };
  }

  if (typeof data.totalPointsEarned !== 'number' || !Number.isFinite(data.totalPointsEarned) || data.totalPointsEarned < 0) {
    return { valid: false, error: 'Tổng điểm kiếm được không hợp lệ' };
  }

  if (typeof data.totalClicks !== 'number' || !Number.isFinite(data.totalClicks) || data.totalClicks < 0) {
    return { valid: false, error: 'Tổng số lượt click không hợp lệ' };
  }

  const clean = migrateSaveData(data);
  return { valid: true, cleanData: clean };
}

/**
 * Tính toán checksum toàn vẹn dữ liệu để phát hiện chuỗi bị cắt cụt hoặc copy thiếu ký tự
 * LƯU Ý KỸ THUẬT:
 * - Đây là Checksum kiểm tra toàn vẹn (Data Integrity Verification / Corruption Detection)
 * - Base64 là kỹ thuật tuần tự hóa / biểu diễn chuỗi văn bản (Serialization Encoding), KHÔNG PHẢI mã hóa bảo mật
 * - Checksum không phải là chữ ký mật mã chống giả mạo (tamper-proofing cryptographic signature)
 */
export function calculateSaveChecksum(payload: string): string {
  let hash = 5381;
  for (let i = 0; i < payload.length; i++) {
    hash = ((hash << 5) + hash) + payload.charCodeAt(i);
    hash = hash & hash; // Ép kiểu 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Lưu vào LocalStorage / Storage (xử lý an toàn khi bộ nhớ đầy QuotaExceededError)
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
  } catch (e: any) {
    if (e?.name === 'QuotaExceededError' || e?.code === 22) {
      console.warn('Cảnh báo: Bộ nhớ lưu trữ trình duyệt đã đầy (QuotaExceededError)! Không thể lưu game mới.');
    } else {
      console.error('Lỗi khi lưu game vào storage:', e);
    }
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
 * Xuất file save ra chuỗi văn bản Base64 kèm Checksum toàn vẹn
 * Định dạng: SECH_SAVE_V1_<checksum>_<base64>
 */
export function exportSaveToString(data: GameSaveData): string {
  const jsonStr = JSON.stringify(data);
  const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
  const checksum = calculateSaveChecksum(base64);
  return `SECH_SAVE_V1_${checksum}_${base64}`;
}

/**
 * Nhập file save từ chuỗi văn bản Base64 (hỗ trợ cả định dạng v1 có checksum và định dạng cũ)
 */
export function importSaveFromString(rawString: string): { success: boolean; data?: GameSaveData; error?: string } {
  try {
    const trimmed = rawString.trim();
    let jsonStr = trimmed;

    // Định dạng mới v1: SECH_SAVE_V1_<checksum>_<base64>
    if (trimmed.startsWith('SECH_SAVE_V1_')) {
      const parts = trimmed.substring('SECH_SAVE_V1_'.length).split('_');
      if (parts.length < 2) {
        return { success: false, error: 'Mã lưu game thiếu phần checksum hoặc payload' };
      }
      const checksum = parts[0];
      const base64 = parts.slice(1).join('_');

      const expectedChecksum = calculateSaveChecksum(base64);
      if (checksum !== expectedChecksum) {
        return { success: false, error: 'Dữ liệu file lưu bị sai lệch hoặc thiếu ký tự (Lỗi Checksum)' };
      }

      jsonStr = decodeURIComponent(escape(atob(base64)));
    } else if (trimmed.startsWith('SECH_SAVE_')) {
      // Định dạng cũ tương thích ngược: SECH_SAVE_<base64>
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
    return { success: false, error: 'Chuỗi dữ liệu bị hỏng hoặc sai định dạng Base64/JSON' };
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
