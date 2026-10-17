import { FrogOwned, GameSettings } from './types';
import { GachaPityState, INITIAL_PITY_STATE, GachaHistoryEntry } from './gacha';
import { FROG_SPECIES_LIST } from '../data/frogs';
import { UPGRADES_CONFIG } from './upgrade';
import { ACHIEVEMENTS_DEFINITIONS } from './achievements';

export const CURRENT_SAVE_VERSION = 2;
export const STORAGE_KEY = 's_ech_game_save_v2';
export const LEGACY_STORAGE_KEY = 's_ech_game_save_v1';
export const CORRUPTED_BACKUP_KEY = 's_ech_game_save_v2_corrupted_backup';
export const LEGACY_FAVORITES_KEY = 's_ech_favorite_frogs';
export const LEGACY_GACHA_HISTORY_KEY = 's_ech_gacha_history';

export interface GameSaveData {
  version: number;
  points: number;
  totalPointsEarned: number;
  totalClicks: number;
  highestCombo: number;
  totalCrits: number;
  totalGachaPulls: number;
  upgrades: Record<string, number>;
  ownedFrogs: Record<string, FrogOwned>;
  mainFrogId: string;
  pity: GachaPityState;
  unlockedAchievements: string[];
  settings: GameSettings;
  favoriteFrogIds: string[];
  gachaHistory: GachaHistoryEntry[];
  lastSavedTimestamp: number;
}

export const DEFAULT_INITIAL_SAVE: GameSaveData = {
  version: CURRENT_SAVE_VERSION,
  points: 0,
  totalPointsEarned: 0,
  totalClicks: 0,
  highestCombo: 0,
  totalCrits: 0,
  totalGachaPulls: 0,
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
  favoriteFrogIds: [],
  gachaHistory: [],
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
 * Thuật toán DJB2 Checksum cho Save Format V1 (seed 5381)
 */
export function calculateSaveChecksumV1(payload: string): string {
  let hash = 5381;
  for (let i = 0; i < payload.length; i++) {
    hash = ((hash << 5) + hash) + payload.charCodeAt(i);
    hash = hash & hash; // Ép kiểu 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Thuật toán Checksum cho Save Format V2 (seed 0)
 */
export function calculateSaveChecksumV2(payload: string): string {
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

export const calculateSaveChecksum = calculateSaveChecksumV2;

/**
 * Migration schema khi cập nhật phiên bản save (Hỗ trợ migrate từ v1 lên v2)
 */
export function migrateSaveData(raw: any): GameSaveData {
  const rawSettings = isRecord(raw.settings) ? raw.settings : {};
  const rawUpgrades = isRecord(raw.upgrades) ? raw.upgrades : {};
  const rawOwnedFrogs = isRecord(raw.ownedFrogs) ? raw.ownedFrogs : {};
  const validFrogIds = new Set(FROG_SPECIES_LIST.map((frog) => frog.id));
  const validUpgradeIds = new Set(UPGRADES_CONFIG.map((u) => u.id));
  const validAchievementIds = new Set(ACHIEVEMENTS_DEFINITIONS.map((a) => a.id));

  const now = Date.now();
  const maxFutureTimestamp = now + 60_000;

  // 1. Owned Frogs Sanitization
  const MAX_SAVED_FROG_LEVEL = 50;
  const MAX_FROG_FRAGMENTS = 10_000_000;
  const ownedFrogs: Record<string, FrogOwned> = {};

  for (const [frogId, rawFrog] of Object.entries(rawOwnedFrogs)) {
    if (!validFrogIds.has(frogId) || !isRecord(rawFrog)) continue;
    const rawUnlockedAt = normalizeCounter(rawFrog.unlockedAt);
    ownedFrogs[frogId] = {
      id: frogId,
      level: Math.max(1, Math.min(MAX_SAVED_FROG_LEVEL, normalizeCounter(rawFrog.level, 1))),
      fragments: Math.max(0, Math.min(MAX_FROG_FRAGMENTS, normalizeCounter(rawFrog.fragments))),
      unlockedAt: rawUnlockedAt > maxFutureTimestamp ? now : rawUnlockedAt,
    };
  }

  if (Object.keys(ownedFrogs).length === 0) {
    ownedFrogs.green_frog = { ...DEFAULT_INITIAL_SAVE.ownedFrogs.green_frog };
  }

  // 2. Main Frog
  const mainFrogId = typeof raw.mainFrogId === 'string' && ownedFrogs[raw.mainFrogId]
    ? raw.mainFrogId
    : ownedFrogs.green_frog
      ? 'green_frog'
      : Object.keys(ownedFrogs)[0];

  // 3. Upgrades Sanitization (lọc ID rác, clamp level âm / maxLevel)
  const upgrades: Record<string, number> = {};
  for (const [id, level] of Object.entries(rawUpgrades)) {
    if (!validUpgradeIds.has(id)) continue;
    if (typeof level === 'number' && Number.isFinite(level) && level >= 0) {
      const config = UPGRADES_CONFIG.find((u) => u.id === id);
      const normalizedLevel = Math.floor(level);
      const safeLevel = config?.maxLevel ? Math.min(config.maxLevel, normalizedLevel) : normalizedLevel;
      upgrades[id] = safeLevel;
    }
  }

  // 4. Gacha Pity Sanitization (không âm, không vượt trần pity)
  const rawPity = isRecord(raw.pity) ? raw.pity : {};
  const pity: GachaPityState = {
    sinceLastRare: Math.min(10, Math.max(0, normalizeCounter(rawPity.sinceLastRare, INITIAL_PITY_STATE.sinceLastRare))),
    sinceLastEpic: Math.min(30, Math.max(0, normalizeCounter(rawPity.sinceLastEpic, INITIAL_PITY_STATE.sinceLastEpic))),
    sinceLastLegendary: Math.min(100, Math.max(0, normalizeCounter(rawPity.sinceLastLegendary, INITIAL_PITY_STATE.sinceLastLegendary))),
  };

  // 5. Settings Sanitization
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

  // 6. Favorite Frog IDs (loại trừ trùng lặp và ID rác)
  let favoriteFrogIds: string[] = [];
  if (Array.isArray(raw.favoriteFrogIds)) {
    const valid = raw.favoriteFrogIds.filter((id: unknown): id is string => typeof id === 'string' && validFrogIds.has(id));
    favoriteFrogIds = Array.from(new Set(valid));
  } else if (typeof window !== 'undefined') {
    try {
      const legacyFav = localStorage.getItem(LEGACY_FAVORITES_KEY);
      if (legacyFav) {
        const parsed = JSON.parse(legacyFav);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter((id: unknown): id is string => typeof id === 'string' && validFrogIds.has(id));
          favoriteFrogIds = Array.from(new Set(valid));
        }
      }
    } catch {
      // Bỏ qua lỗi parse legacy
    }
  }

  // 7. Gacha History Sanitization (chuẩn hóa đầy đủ schema và kiểu dữ liệu)
  const parseHistoryEntry = (entry: any, index: number): GachaHistoryEntry | null => {
    if (!isRecord(entry)) return null;
    if (typeof entry.frogId !== 'string' || !validFrogIds.has(entry.frogId)) return null;
    const species = FROG_SPECIES_LIST.find((f) => f.id === entry.frogId);
    const ts = typeof entry.timestamp === 'number' && Number.isFinite(entry.timestamp) && entry.timestamp > 0
      ? (entry.timestamp > maxFutureTimestamp ? now : entry.timestamp)
      : now;
    return {
      id: typeof entry.id === 'string' && entry.id ? entry.id : `hist_${ts}_${index}`,
      timestamp: ts,
      poolId: (entry.poolId === 'rung_mua' || entry.poolId === 'dem_trang') ? entry.poolId : 'ao_sen',
      frogId: entry.frogId,
      frogNameVi: typeof entry.frogNameVi === 'string' && entry.frogNameVi ? entry.frogNameVi : (species?.nameVi || 'Ếch'),
      rarity: (entry.rarity && ['common', 'rare', 'epic', 'legendary', 'mythic'].includes(entry.rarity))
        ? entry.rarity
        : (species?.rarity || 'common'),
      isNew: Boolean(entry.isNew),
      fragmentsAdded: normalizeCounter(entry.fragmentsAdded, 0),
    };
  };

  let gachaHistory: GachaHistoryEntry[] = [];
  if (Array.isArray(raw.gachaHistory)) {
    gachaHistory = raw.gachaHistory
      .map(parseHistoryEntry)
      .filter((entry: GachaHistoryEntry | null): entry is GachaHistoryEntry => entry !== null)
      .slice(0, 20);
  } else if (typeof window !== 'undefined') {
    try {
      const legacyHistory = localStorage.getItem(LEGACY_GACHA_HISTORY_KEY);
      if (legacyHistory) {
        const parsed = JSON.parse(legacyHistory);
        if (Array.isArray(parsed)) {
          gachaHistory = parsed
            .map(parseHistoryEntry)
            .filter((entry: GachaHistoryEntry | null): entry is GachaHistoryEntry => entry !== null)
            .slice(0, 20);
        }
      }
    } catch {
      // Bỏ qua lỗi parse legacy
    }
  }

  // 8. Achievements (loại bỏ ID rác và triệt tiêu trùng lặp)
  let unlockedAchievements: string[] = [];
  if (Array.isArray(raw.unlockedAchievements)) {
    const valid = raw.unlockedAchievements.filter((id: unknown): id is string => typeof id === 'string' && validAchievementIds.has(id));
    unlockedAchievements = Array.from(new Set(valid));
  }

  // 9. Last Saved Timestamp (không cho phép nằm ở tương lai quá xa)
  let lastSavedTimestamp = now;
  if (typeof raw.lastSavedTimestamp === 'number' && Number.isFinite(raw.lastSavedTimestamp) && raw.lastSavedTimestamp > 0) {
    lastSavedTimestamp = raw.lastSavedTimestamp > maxFutureTimestamp ? now : raw.lastSavedTimestamp;
  }

  return {
    version: CURRENT_SAVE_VERSION,
    points: raw.points,
    totalPointsEarned: raw.totalPointsEarned,
    totalClicks: raw.totalClicks,
    highestCombo: normalizeCounter(raw.highestCombo, 0),
    totalCrits: normalizeCounter(raw.totalCrits, 0),
    totalGachaPulls: normalizeCounter(raw.totalGachaPulls, 0),
    upgrades,
    ownedFrogs,
    mainFrogId,
    pity,
    unlockedAchievements,
    settings,
    favoriteFrogIds,
    gachaHistory,
    lastSavedTimestamp,
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

  // Kiểm tra điểm số và giới hạn an toàn hệ thống
  if (typeof data.points !== 'number' || !Number.isFinite(data.points) || data.points < 0) {
    return { valid: false, error: 'Điểm số không hợp lệ' };
  }
  if (data.points > Number.MAX_SAFE_INTEGER) {
    return { valid: false, error: 'Điểm số vượt quá giới hạn an toàn tối đa của hệ thống (MAX_SAFE_INTEGER)' };
  }

  if (typeof data.totalPointsEarned !== 'number' || !Number.isFinite(data.totalPointsEarned) || data.totalPointsEarned < 0) {
    return { valid: false, error: 'Tổng điểm kiếm được không hợp lệ' };
  }
  if (data.totalPointsEarned > Number.MAX_SAFE_INTEGER) {
    return { valid: false, error: 'Tổng điểm kiếm được vượt quá giới hạn an toàn tối đa (MAX_SAFE_INTEGER)' };
  }

  if (typeof data.totalClicks !== 'number' || !Number.isFinite(data.totalClicks) || data.totalClicks < 0) {
    return { valid: false, error: 'Tổng số lượt click không hợp lệ' };
  }
  if (data.totalClicks > Number.MAX_SAFE_INTEGER) {
    return { valid: false, error: 'Tổng số lượt click vượt quá giới hạn an toàn tối đa (MAX_SAFE_INTEGER)' };
  }

  const cleanData = migrateSaveData(data);
  return { valid: true, cleanData };
}

export type SaveRecoveryStatus = 'healthy' | 'recovered-from-v1' | 'recovery-pending' | 'quarantine-failed';

export interface SaveRecoveryInfo {
  status: SaveRecoveryStatus;
  reason?: string;
  corruptedRaw?: string | null;
  quarantineKey?: string | null;
  timestamp: number;
}

export interface SaveSessionContext {
  isAutoSaveBlocked: boolean;
  recoveryInfo: SaveRecoveryInfo;
}

export function createDefaultSaveSessionContext(): SaveSessionContext {
  return {
    isAutoSaveBlocked: false,
    recoveryInfo: {
      status: 'healthy',
      timestamp: Date.now(),
    },
  };
}

let globalSaveSessionContext: SaveSessionContext = createDefaultSaveSessionContext();

export function getGlobalSaveSessionContext(): SaveSessionContext {
  return globalSaveSessionContext;
}

export function resetGlobalSaveSessionContext(): void {
  globalSaveSessionContext = createDefaultSaveSessionContext();
}

export function isSaveStorageBlocked(context?: SaveSessionContext): boolean {
  return (context ?? globalSaveSessionContext).isAutoSaveBlocked;
}

export function resetSaveStorageBlock(context?: SaveSessionContext): void {
  const ctx = context ?? globalSaveSessionContext;
  ctx.isAutoSaveBlocked = false;
  ctx.recoveryInfo = { status: 'healthy', timestamp: Date.now() };
}

export function getSaveRecoveryInfo(context?: SaveSessionContext): SaveRecoveryInfo {
  return (context ?? globalSaveSessionContext).recoveryInfo;
}

export function getCorruptedSaveRaw(customStorage?: Storage, context?: SaveSessionContext): string | null {
  const ctx = context ?? globalSaveSessionContext;
  if (ctx.recoveryInfo.corruptedRaw) {
    return ctx.recoveryInfo.corruptedRaw;
  }
  const storage = customStorage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!storage) return null;
  if (ctx.recoveryInfo.quarantineKey) {
    return storage.getItem(ctx.recoveryInfo.quarantineKey);
  }
  return storage.getItem(CORRUPTED_BACKUP_KEY);
}

export interface SaveStorageOptions {
  isManualUserResolution?: boolean;
}

/**
 * Lưu vào LocalStorage / Storage
 */
export function saveGameStateToStorage(
  state: GameSaveData,
  customStorage?: Storage,
  context?: SaveSessionContext,
  options?: SaveStorageOptions
): boolean {
  try {
    const storage = customStorage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!storage) return false;

    const ctx = context ?? globalSaveSessionContext;
    if (ctx.isAutoSaveBlocked && !options?.isManualUserResolution) {
      console.warn('Ghi lưu trữ bị khóa để bảo vệ bản sao lưu hoặc phiên phục hồi đang chờ:', ctx.recoveryInfo.status);
      return false;
    }

    // Bảo vệ xung đột đa tab: Không ghi đè nếu storage đang chứa bản lưu mới hơn từ tab khác (trừ khi là manual user resolution)
    if (!options?.isManualUserResolution) {
      try {
        const currentRaw = storage.getItem(STORAGE_KEY);
        if (currentRaw !== null) {
          const currentParsed = JSON.parse(currentRaw);
          if (
            typeof currentParsed?.lastSavedTimestamp === 'number' &&
            currentParsed.lastSavedTimestamp > (state.lastSavedTimestamp ?? 0)
          ) {
            console.warn('Phát hiện bản lưu trên storage mới hơn phiên hiện tại (đa tab), bỏ qua lần ghi tự động cũ.');
            return false;
          }
        }
      } catch {
        // Bỏ qua lỗi parse của currentRaw để logic phục hồi xử lý
      }
    }

    const toSave: GameSaveData = {
      ...state,
      version: CURRENT_SAVE_VERSION,
      lastSavedTimestamp: Date.now(),
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(toSave));

    // Nếu đây là giải quyết thủ công hợp lệ từ người dùng, gỡ bỏ khóa an toàn
    if (options?.isManualUserResolution) {
      ctx.isAutoSaveBlocked = false;
      ctx.recoveryInfo = { status: 'healthy', timestamp: Date.now() };
    }

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
 * Nạp từ LocalStorage / Storage (Hỗ trợ fallback v1 sang v2 khi v2 hỏng)
 */
export function loadGameStateFromStorage(
  customStorage?: Storage,
  context?: SaveSessionContext
): GameSaveData {
  const ctx = context ?? globalSaveSessionContext;
  try {
    const storage = customStorage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!storage) {
      ctx.isAutoSaveBlocked = false;
      ctx.recoveryInfo = { status: 'healthy', timestamp: Date.now() };
      return DEFAULT_INITIAL_SAVE;
    }

    let v2CorruptedRaw: string | null = null;
    let v2CorruptedReason: string | undefined = undefined;

    // 1. Thử nạp bản lưu v2 (kiểm tra rawV2 !== null để bao quát cả chuỗi rỗng)
    const rawV2 = storage.getItem(STORAGE_KEY);
    if (rawV2 !== null) {
      try {
        const parsedV2 = JSON.parse(rawV2);
        const validationV2 = validateSaveData(parsedV2);
        if (validationV2.valid && validationV2.cleanData) {
          ctx.isAutoSaveBlocked = false;
          ctx.recoveryInfo = { status: 'healthy', timestamp: Date.now() };
          return validationV2.cleanData;
        }
        console.warn('Dữ liệu save V2 không hợp lệ, thử khôi phục từ legacy V1...', validationV2.error);
        v2CorruptedRaw = rawV2;
        v2CorruptedReason = validationV2.error;
      } catch (e) {
        console.warn('Lỗi phân tích JSON save V2, thử khôi phục từ legacy V1...', e);
        v2CorruptedRaw = rawV2;
        v2CorruptedReason = (e as Error)?.message || 'Lỗi phân tích cú pháp JSON';
      }
    }

    // Nếu V2 có dữ liệu nhưng bị hỏng -> QUARANTINE NGAY LẬP TỨC TRƯỚC KHI XÉT V1
    let quarantineKey: string | null = null;
    let quarantineSucceeded = false;
    if (v2CorruptedRaw !== null) {
      try {
        let targetBackupKey = CORRUPTED_BACKUP_KEY;
        const existingBackup = storage.getItem(CORRUPTED_BACKUP_KEY);
        // Kiểm tra existingBackup !== null để không bỏ sót chuỗi rỗng ""
        if (existingBackup !== null && existingBackup !== v2CorruptedRaw) {
          let counter = 0;
          do {
            targetBackupKey = `${CORRUPTED_BACKUP_KEY}_${Date.now()}${counter ? `_${counter}` : ''}`;
            counter++;
          } while (
            storage.getItem(targetBackupKey) !== null &&
            storage.getItem(targetBackupKey) !== v2CorruptedRaw
          );
        }
        storage.setItem(targetBackupKey, v2CorruptedRaw);
        if (storage.getItem(targetBackupKey) === v2CorruptedRaw) {
          quarantineKey = targetBackupKey;
          quarantineSucceeded = true;
        }
      } catch (backupErr) {
        console.warn('Không thể tạo quarantine backup cho V2 hỏng:', backupErr);
        quarantineSucceeded = false;
      }
    }

    // 2. Fallback nạp legacy v1 nếu v2 không có hoặc bị hỏng
    let v1ValidData: GameSaveData | null = null;
    let rawV1: string | null = null;
    try {
      rawV1 = storage.getItem(LEGACY_STORAGE_KEY);
    } catch (e) {
      console.warn('Lỗi khi đọc LEGACY_STORAGE_KEY:', e);
    }

    if (rawV1 !== null) {
      try {
        const parsedV1 = JSON.parse(rawV1);
        const validationV1 = validateSaveData(parsedV1);
        if (validationV1.valid && validationV1.cleanData) {
          v1ValidData = validationV1.cleanData;
        }
      } catch (e) {
        console.error('Lỗi khi phân tích legacy V1:', e);
      }
    }

    // 3. Phân nhánh xử lý phục hồi
    if (v1ValidData) {
      console.info('Khôi phục thành công từ bản lưu Legacy V1, tự động nâng cấp lên V2.');
      if (v2CorruptedRaw !== null) {
        if (quarantineSucceeded) {
          // Kiểm tra lại STORAGE_KEY trước khi ghi đè để tránh race condition với tab khác
          const recheckV2 = storage.getItem(STORAGE_KEY);
          if (recheckV2 !== v2CorruptedRaw) {
            console.warn('STORAGE_KEY đã bị thay đổi bởi phiên khác trước khi nâng cấp V1, dừng ghi đè.');
            ctx.isAutoSaveBlocked = true;
            return v1ValidData;
          }

          // Đã sao lưu an toàn V2 hỏng, an tâm nâng cấp V1 lên STORAGE_KEY
          ctx.isAutoSaveBlocked = false;
          ctx.recoveryInfo = {
            status: 'recovered-from-v1',
            reason: v2CorruptedReason,
            corruptedRaw: v2CorruptedRaw,
            quarantineKey,
            timestamp: Date.now(),
          };
          saveGameStateToStorage(v1ValidData, storage, ctx);
          return v1ValidData;
        } else {
          // Quarantine thất bại: KHÔNG ghi đè STORAGE_KEY, khóa autosave
          ctx.isAutoSaveBlocked = true;
          ctx.recoveryInfo = {
            status: 'quarantine-failed',
            reason: 'V2 bị hỏng và không thể tạo bản sao lưu cách ly do lỗi storage.',
            corruptedRaw: v2CorruptedRaw,
            quarantineKey: null,
            timestamp: Date.now(),
          };
          return v1ValidData;
        }
      } else {
        // Không có V2 nào tồn tại từ trước, nâng cấp V1 lên V2 bình thường
        ctx.isAutoSaveBlocked = false;
        ctx.recoveryInfo = { status: 'recovered-from-v1', timestamp: Date.now() };
        saveGameStateToStorage(v1ValidData, storage, ctx);
        return v1ValidData;
      }
    }

    // 4. Nếu V1 cũng hỏng hoặc không tồn tại:
    if (v2CorruptedRaw !== null) {
      // V2 hỏng và không có bản lưu V1 hợp lệ -> CHẾ ĐỘ PHỤC HỒI CHỜ XỬ LÝ (RECOVERY PENDING)
      ctx.isAutoSaveBlocked = true;
      if (quarantineSucceeded) {
        ctx.recoveryInfo = {
          status: 'recovery-pending',
          reason: v2CorruptedReason || 'Bản lưu V2 bị hỏng và không tìm thấy bản lưu V1 hợp lệ.',
          corruptedRaw: v2CorruptedRaw,
          quarantineKey,
          timestamp: Date.now(),
        };
      } else {
        ctx.recoveryInfo = {
          status: 'quarantine-failed',
          reason: v2CorruptedReason || 'Bản lưu V2 bị hỏng và không thể tạo sao lưu cách ly an toàn.',
          corruptedRaw: v2CorruptedRaw,
          quarantineKey: null,
          timestamp: Date.now(),
        };
      }
      return DEFAULT_INITIAL_SAVE;
    }

    // 5. Cài đặt game mới hoàn toàn (fresh install)
    ctx.isAutoSaveBlocked = false;
    ctx.recoveryInfo = { status: 'healthy', timestamp: Date.now() };
    return DEFAULT_INITIAL_SAVE;
  } catch (e: any) {
    console.error('Lỗi khi nạp dữ liệu lưu game:', e);
    // Khi có ngoại lệ cấp cao (SecurityError, etc.), fail closed: khóa ghi
    ctx.isAutoSaveBlocked = true;
    ctx.recoveryInfo = {
      status: 'quarantine-failed',
      reason: e?.message || 'Lỗi truy cập bộ nhớ lưu trữ',
      timestamp: Date.now(),
    };
    return DEFAULT_INITIAL_SAVE;
  }
}

/**
 * Xuất file save ra chuỗi văn bản Base64 kèm Checksum toàn vẹn
 * Định dạng: SECH_SAVE_V2_<checksum>_<base64>
 */
export function exportSaveToString(data: GameSaveData): string {
  const jsonStr = JSON.stringify({
    ...data,
    version: CURRENT_SAVE_VERSION,
  });
  const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
  const checksum = calculateSaveChecksumV2(base64);
  return `SECH_SAVE_V2_${checksum}_${base64}`;
}

/**
 * Nhập file save từ chuỗi văn bản Base64 (hỗ trợ cả định dạng V2, V1 có checksum và JSON thuần)
 */
export function importSaveFromString(rawString: string): { success: boolean; data?: GameSaveData; error?: string } {
  try {
    const trimmed = rawString.trim();
    let jsonStr = trimmed;

    if (trimmed.startsWith('SECH_SAVE_V2_')) {
      const parts = trimmed.substring('SECH_SAVE_V2_'.length).split('_');
      if (parts.length < 2) {
        return { success: false, error: 'Mã lưu game thiếu phần checksum hoặc payload' };
      }
      const checksum = parts[0];
      const base64 = parts.slice(1).join('_');

      const expectedChecksum = calculateSaveChecksumV2(base64);
      if (checksum !== expectedChecksum) {
        return { success: false, error: 'Dữ liệu file lưu bị sai lệch hoặc thiếu ký tự (Lỗi Checksum)' };
      }

      try {
        jsonStr = decodeURIComponent(escape(atob(base64)));
      } catch {
        return { success: false, error: 'Không thể giải mã dữ liệu Base64' };
      }
    } else if (trimmed.startsWith('SECH_SAVE_V1_')) {
      const parts = trimmed.substring('SECH_SAVE_V1_'.length).split('_');
      if (parts.length < 2) {
        return { success: false, error: 'Mã lưu game thiếu phần checksum hoặc payload' };
      }
      const checksum = parts[0];
      const base64 = parts.slice(1).join('_');

      const expectedChecksum = calculateSaveChecksumV1(base64);
      if (checksum !== expectedChecksum) {
        return { success: false, error: 'Dữ liệu file lưu bị sai lệch hoặc thiếu ký tự (Lỗi Checksum)' };
      }

      try {
        jsonStr = decodeURIComponent(escape(atob(base64)));
      } catch {
        return { success: false, error: 'Không thể giải mã dữ liệu Base64' };
      }
    } else if (trimmed.startsWith('SECH_SAVE_')) {
      // Định dạng cũ không có checksum
      const base64 = trimmed.substring('SECH_SAVE_'.length);
      try {
        jsonStr = decodeURIComponent(escape(atob(base64)));
      } catch {
        return { success: false, error: 'Không thể giải mã dữ liệu Base64' };
      }
    } else {
      // Thử giải mã Base64 thuần nếu không có tiền tố
      try {
        jsonStr = decodeURIComponent(escape(atob(trimmed)));
      } catch {
        jsonStr = trimmed;
      }
    }

    const parsed = JSON.parse(jsonStr);
    const validation = validateSaveData(parsed);

    if (!validation.valid || !validation.cleanData) {
      return { success: false, error: validation.error || 'Dữ liệu lưu game không hợp lệ' };
    }

    return { success: true, data: validation.cleanData };
  } catch (e: any) {
    return { success: false, error: 'Định dạng file lưu không đúng hoặc bị hỏng' };
  }
}

export interface ClearSaveOptions {
  preserveQuarantineBackup?: boolean;
}

/**
 * Xóa dữ liệu lưu game khỏi Storage (Mặc định bảo toàn quarantine backup để chống mất dữ liệu)
 */
export function clearSavedGame(customStorage?: Storage, options?: ClearSaveOptions): boolean {
  const preserveQuarantine = options?.preserveQuarantineBackup ?? true;
  try {
    const storage = customStorage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!storage) return false;

    storage.removeItem(STORAGE_KEY);
    storage.removeItem(LEGACY_STORAGE_KEY);

    if (!preserveQuarantine) {
      storage.removeItem(CORRUPTED_BACKUP_KEY);
      for (let i = storage.length - 1; i >= 0; i--) {
        const key = storage.key(i);
        if (key && key.startsWith(CORRUPTED_BACKUP_KEY)) {
          storage.removeItem(key);
        }
      }
    }

    storage.removeItem(LEGACY_FAVORITES_KEY);
    storage.removeItem(LEGACY_GACHA_HISTORY_KEY);
    return true;
  } catch (e) {
    console.error('Lỗi khi xóa dữ liệu lưu game:', e);
    return false;
  }
}

/**
 * Xóa toàn bộ các bản sao lưu cách ly khi người chơi đã chủ động xác nhận xóa
 */
export function clearQuarantineBackups(customStorage?: Storage): boolean {
  try {
    const storage = customStorage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
    if (!storage) return false;

    storage.removeItem(CORRUPTED_BACKUP_KEY);
    for (let i = storage.length - 1; i >= 0; i--) {
      const key = storage.key(i);
      if (key && key.startsWith(CORRUPTED_BACKUP_KEY)) {
        storage.removeItem(key);
      }
    }
    return true;
  } catch (e) {
    console.error('Lỗi khi xóa bản sao lưu cách ly:', e);
    return false;
  }
}
