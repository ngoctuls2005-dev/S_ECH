import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { FROG_SPECIES_LIST } from '../data/frogs';
import {
  RARITY_CONFIG,
  getRequiredFragmentsForLevel,
  calculateFrogBuffValue,
  canLevelUpFrog,
  calculateActiveFrogBuffs,
  MAX_FROG_LEVEL,
} from '../engine/frogs';
import { calculateClickPower } from '../engine/clicker';
import { calculatePointsPerSecond } from '../engine/idle';
import { Rarity, FrogSpecies } from '../engine/types';
import { 
  X, 
  Check, 
  ArrowUpCircle, 
  Filter, 
  BookOpen, 
  Search, 
  Star, 
  ArrowUpDown, 
  Info, 
  TrendingUp, 
  TrendingDown,
  Sparkles
} from 'lucide-react';

export const CollectionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const ownedFrogs = useGameStore((s) => s.ownedFrogs);
  const mainFrogId = useGameStore((s) => s.mainFrogId);
  const setMainFrog = useGameStore((s) => s.setMainFrog);
  const levelUpFrog = useGameStore((s) => s.levelUpFrog);
  const upgradeLevels = useGameStore((s) => s.upgradeLevels);

  const favoriteFrogIds = useGameStore((s) => s.favoriteFrogIds);
  const toggleFavorite = useGameStore((s) => s.toggleFavorite);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [buffFilter, setBuffFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rarity_desc' | 'rarity_asc' | 'level_desc' | 'name' | 'favorite_first'>('favorite_first');
  const [selectedDetailFrog, setSelectedDetailFrog] = useState<FrogSpecies | null>(null);

  const ownedCount = Object.keys(ownedFrogs).length;

  // Current baseline stats with active main frog
  const currentBuffs = useMemo(
    () => calculateActiveFrogBuffs(mainFrogId, ownedFrogs),
    [mainFrogId, ownedFrogs]
  );
  const currentClickPower = useMemo(
    () => calculateClickPower(1, upgradeLevels, currentBuffs),
    [upgradeLevels, currentBuffs]
  );
  const currentPPS = useMemo(
    () => calculatePointsPerSecond(upgradeLevels, currentBuffs),
    [upgradeLevels, currentBuffs]
  );

  // Rarity rank helper for sorting
  const rarityRank: Record<Rarity, number> = {
    mythic: 5,
    legendary: 4,
    epic: 3,
    rare: 2,
    common: 1,
  };

  // Filter and sort frogs
  const filteredAndSortedFrogs = useMemo(() => {
    return FROG_SPECIES_LIST.filter((frog) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = frog.nameVi.toLowerCase().includes(q) || frog.nameEn.toLowerCase().includes(q);
        const matchesSci = frog.scientificName ? frog.scientificName.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesSci) return false;
      }

      // Rarity
      if (rarityFilter !== 'all' && frog.rarity !== rarityFilter) {
        return false;
      }

      // Buff Type
      if (buffFilter !== 'all') {
        if (buffFilter === 'click' && frog.buff.type !== 'click_points_percent') return false;
        if (buffFilter === 'idle' && frog.buff.type !== 'idle_points_percent') return false;
        if (buffFilter === 'crit' && !frog.buff.type.startsWith('crit_')) return false;
        if (buffFilter === 'combo' && frog.buff.type !== 'combo_bonus_percent') return false;
        if (buffFilter === 'discount' && frog.buff.type !== 'upgrade_discount_percent') return false;
        if (buffFilter === 'total' && frog.buff.type !== 'total_points_percent') return false;
      }

      return true;
    }).sort((a, b) => {
      const isFavA = favoriteFrogIds.includes(a.id);
      const isFavB = favoriteFrogIds.includes(b.id);
      const ownedA = ownedFrogs[a.id];
      const ownedB = ownedFrogs[b.id];

      if (sortBy === 'favorite_first') {
        if (isFavA !== isFavB) return isFavA ? -1 : 1;
        // Then by rarity desc
        return rarityRank[b.rarity] - rarityRank[a.rarity];
      }

      if (sortBy === 'level_desc') {
        const lvlA = ownedA ? ownedA.level : 0;
        const lvlB = ownedB ? ownedB.level : 0;
        if (lvlA !== lvlB) return lvlB - lvlA;
        return rarityRank[b.rarity] - rarityRank[a.rarity];
      }

      if (sortBy === 'rarity_asc') {
        return rarityRank[a.rarity] - rarityRank[b.rarity];
      }

      if (sortBy === 'name') {
        return a.nameVi.localeCompare(b.nameVi);
      }

      // Default: rarity_desc
      return rarityRank[b.rarity] - rarityRank[a.rarity];
    });
  }, [searchQuery, rarityFilter, buffFilter, sortBy, favoriteFrogIds, ownedFrogs]);

  // Preview impact calculator when switching to target frog
  const getPreviewDelta = (targetFrogId: string) => {
    if (targetFrogId === mainFrogId) return null;
    const testBuffs = calculateActiveFrogBuffs(targetFrogId, ownedFrogs);
    const testClick = calculateClickPower(1, upgradeLevels, testBuffs);
    const testPPS = calculatePointsPerSecond(upgradeLevels, testBuffs);

    const deltaClick = testClick - currentClickPower;
    const deltaIdle = testPPS - currentPPS;

    return { deltaClick, deltaIdle };
  };


  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-pond-600/30 rounded-3xl max-w-6xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up"
      >
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-xl shadow-md">
              <BookOpen className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-heading text-white">Bộ Sưu Tập Ếch v2.0</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-pond-950 border border-pond-500/40 text-emerald-400 font-bold">
                  {ownedCount} / {FROG_SPECIES_LIST.length} Loài
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ếch chính nhận 100% buff, ếch bộ sưu tập nhận 20% buff bị động có cân bằng Soft-cap
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="p-3 bg-slate-950/70 border-b border-slate-800 flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo tên loài, tên khoa học..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/70 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pond-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/70 rounded-xl px-2.5 py-1 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
              >
                <option value="favorite_first" className="bg-slate-900 text-white">⭐ Ưu tiên Yêu thích</option>
                <option value="rarity_desc" className="bg-slate-900 text-white">Độ hiếm (Cao → Thấp)</option>
                <option value="rarity_asc" className="bg-slate-900 text-white">Độ hiếm (Thấp → Cao)</option>
                <option value="level_desc" className="bg-slate-900 text-white">Cấp độ (Cao → Thấp)</option>
                <option value="name" className="bg-slate-900 text-white">Tên (A → Z)</option>
              </select>
            </div>
          </div>

          {/* Rarity & Buff Tags */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-800/60">
            {/* Rarity buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
                <Filter className="w-3 h-3" /> Độ hiếm:
              </span>
              <button
                onClick={() => setRarityFilter('all')}
                className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  rarityFilter === 'all'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white'
                }`}
              >
                Tất cả
              </button>
              {(['common', 'rare', 'epic', 'legendary', 'mythic'] as Rarity[]).map((r) => {
                const conf = RARITY_CONFIG[r];
                return (
                  <button
                    key={r}
                    onClick={() => setRarityFilter(r)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      rarityFilter === r
                        ? `${conf.badgeBg} shadow-sm`
                        : 'bg-slate-900/80 text-slate-400 hover:text-white'
                    }`}
                  >
                    {conf.nameVi}
                  </button>
                );
              })}
            </div>

            {/* Buff Filter buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
                <Sparkles className="w-3 h-3 text-amber-400" /> Buff:
              </span>
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'click', label: 'Click' },
                { id: 'idle', label: 'Idle' },
                { id: 'crit', label: 'Chí mạng' },
                { id: 'combo', label: 'Combo' },
                { id: 'discount', label: 'Giảm giá' },
                { id: 'total', label: 'Tổng điểm' },
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBuffFilter(b.id)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    buffFilter === b.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Frog Cards Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 grid auto-rows-max grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredAndSortedFrogs.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-2xl">
                🔍
              </div>
              <p className="text-sm font-medium">Không tìm thấy loài ếch nào phù hợp với bộ lọc</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setRarityFilter('all');
                  setBuffFilter('all');
                }}
                className="px-4 py-1.5 rounded-xl bg-pond-600 hover:bg-pond-500 text-white text-xs font-bold transition-colors"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            filteredAndSortedFrogs.map((frog) => {
              const owned = ownedFrogs[frog.id];
              const isMain = mainFrogId === frog.id;
              const isFav = favoriteFrogIds.includes(frog.id);
              const rarity = RARITY_CONFIG[frog.rarity];
              const reqFragments = owned ? getRequiredFragmentsForLevel(owned.level) : 5;
              const canLevel = owned ? canLevelUpFrog(owned) : false;
              const buffVal = owned ? calculateFrogBuffValue(frog.buff.value, owned.level) : frog.buff.value;
              const preview = owned && !isMain ? getPreviewDelta(frog.id) : null;

              return (
                <div
                  key={frog.id}
                  className={`min-h-[410px] p-3 rounded-2xl border flex flex-col justify-between transition-all duration-200 relative overflow-hidden backdrop-blur-md hover:-translate-y-0.5 ${
                    owned
                      ? `${rarity.borderGlow} bg-gradient-to-b ${rarity.bgGradient} shadow-md`
                      : 'border-slate-800 bg-slate-950/40 opacity-70'
                  }`}
                >
                  {/* Card Top: Badges and Favorite Button */}
                  <div className="flex items-center justify-between mb-1.5 z-10">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${rarity.badgeBg}`}>
                        {rarity.nameVi}
                      </span>
                      {owned && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                          Lv.{owned.level}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDetailFrog(frog);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                        title="Xem hồ sơ chi tiết"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(frog.id);
                        }}
                        className={`p-1 rounded-md transition-colors ${
                          isFav ? 'text-amber-400 hover:text-amber-300' : 'text-slate-500 hover:text-slate-300'
                        }`}
                        title={isFav ? 'Bỏ yêu thích' : 'Đánh dấu yêu thích'}
                      >
                        <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Frog Photo */}
                  <div 
                    onClick={() => setSelectedDetailFrog(frog)}
                    className={`relative my-1 flex aspect-[4/3] max-h-[160px] items-center justify-center overflow-hidden rounded-xl border cursor-pointer group ${
                      owned ? 'border-white/10 bg-slate-950/35' : 'border-slate-800 bg-slate-950/70'
                    }`}
                  >
                    <div className={`absolute inset-0 opacity-25 ${rarity.bgGradient} bg-gradient-to-br`} />
                    <img
                      src={frog.image}
                      alt={frog.nameVi}
                      loading="lazy"
                      className={`relative z-10 h-full w-full p-2 object-contain transition-all duration-300 drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] group-hover:scale-105 ${
                        owned ? '' : 'brightness-[0.20] contrast-125 grayscale'
                      }`}
                    />
                    {!owned && (
                      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 bg-slate-950/20">
                        <span className="text-xl">🔒</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Chưa mở</span>
                      </div>
                    )}
                  </div>

                  {/* Frog Meta Info */}
                  <div className="mt-1">
                    <h3 className="text-sm font-bold leading-snug text-white font-heading truncate" title={frog.nameVi}>
                      {frog.nameVi}
                    </h3>
                    <p className="text-[10px] text-slate-400 italic truncate mb-1.5" title={frog.scientificName || frog.nameEn}>
                      {frog.scientificName || frog.nameEn}
                    </p>

                    {/* Buff Description */}
                    <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700/60 mb-2 text-xs">
                      <span className="text-[10px] text-slate-400 block">Hiệu lực buff {owned ? `(Cấp ${owned.level})` : ''}:</span>
                      <span className="font-bold text-emerald-400 text-xs">
                        +{Math.round(buffVal * 100)}%{' '}
                        {frog.buff.type === 'click_points_percent'
                          ? 'Điểm Click'
                          : frog.buff.type === 'idle_points_percent'
                          ? 'Điểm Idle/s'
                          : frog.buff.type === 'crit_chance_bonus'
                          ? 'Tỉ lệ Crit'
                          : frog.buff.type === 'crit_multiplier_bonus'
                          ? 'Hệ số Crit'
                          : frog.buff.type === 'upgrade_discount_percent'
                          ? 'Giảm giá Nâng cấp'
                          : frog.buff.type === 'combo_bonus_percent'
                          ? 'Thưởng Combo'
                          : 'Tổng điểm'}
                      </span>
                    </div>

                    {/* Preview Switch Impact (Click Power / PPS) */}
                    {preview && (
                      <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-1.5 mb-2 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-medium">Khi đổi chính:</span>
                        <div className="flex items-center gap-2">
                          <span className={`flex items-center gap-0.5 font-bold ${preview.deltaClick >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {preview.deltaClick >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            Click {preview.deltaClick >= 0 ? `+${preview.deltaClick}` : preview.deltaClick}
                          </span>
                          <span className={`flex items-center gap-0.5 font-bold ${preview.deltaIdle >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {preview.deltaIdle >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            PPS {preview.deltaIdle >= 0 ? `+${preview.deltaIdle}` : preview.deltaIdle}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Fragment Progress */}
                    {owned && (
                      <div className="mb-2">
                        <div className="flex justify-between text-[10px] text-slate-300 mb-0.5">
                          <span>Tiến trình mảnh:</span>
                          <span className="font-bold">
                            {owned.level >= MAX_FROG_LEVEL ? (
                              <span className="text-amber-400">Đạt Cấp Tối Đa ({Math.min(owned.level, MAX_FROG_LEVEL)})</span>
                            ) : (
                              `${owned.fragments} / ${reqFragments}`
                            )}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              owned.level >= MAX_FROG_LEVEL
                                ? 'bg-gradient-to-r from-amber-400 to-yellow-300 w-full'
                                : 'bg-gradient-to-r from-pond-500 to-emerald-400'
                            }`}
                            style={{
                              width: owned.level >= MAX_FROG_LEVEL ? '100%' : `${Math.min(100, (owned.fragments / reqFragments) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-700/40 flex items-center gap-1.5 mt-auto">
                    {owned ? (
                      <>
                        {isMain ? (
                          <div className="flex-1 py-1.5 rounded-xl bg-pond-900/60 border border-pond-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Đang dùng</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setMainFrog(frog.id)}
                            className="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all active:scale-95"
                          >
                            Chọn làm Ếch Chính
                          </button>
                        )}

                        {canLevel && (
                          <button
                            onClick={() => levelUpFrog(frog.id)}
                            className="p-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold hover:brightness-110 shadow-md active:scale-95 shrink-0"
                            title="Thăng cấp ếch (+25% Buff)"
                          >
                            <ArrowUpCircle className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="w-full py-1.5 text-center text-[11px] text-slate-400 bg-slate-900/40 rounded-xl">
                        Mở tại Hồ Gacha
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Detail Modal (Hồ Sơ Loài) */}
      {selectedDetailFrog && (
        <div 
          onClick={() => setSelectedDetailFrog(null)}
          className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-5 shadow-2xl relative"
          >
            <button
              onClick={() => setSelectedDetailFrog(null)}
              className="absolute right-4 top-4 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${RARITY_CONFIG[selectedDetailFrog.rarity].badgeBg}`}>
                {RARITY_CONFIG[selectedDetailFrog.rarity].nameVi}
              </span>
              <div>
                <h3 className="text-lg font-bold text-white font-heading">{selectedDetailFrog.nameVi}</h3>
                <p className="text-xs text-slate-400 italic">{selectedDetailFrog.scientificName}</p>
              </div>
            </div>

            <div className="relative aspect-video max-h-[220px] rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-center p-3 mb-4 overflow-hidden">
              <img
                src={selectedDetailFrog.image}
                alt={selectedDetailFrog.nameVi}
                className="max-h-full max-w-full object-contain drop-shadow-xl"
              />
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
              {selectedDetailFrog.description}
            </p>

            <div className="text-[11px] text-slate-400 space-y-1.5 border-t border-slate-800 pt-3">
              <p><span className="text-slate-300 font-semibold">Tên tiếng Anh:</span> {selectedDetailFrog.nameEn}</p>
              <p><span className="text-slate-300 font-semibold">Tên khoa học:</span> {selectedDetailFrog.scientificName}</p>
              <p><span className="text-slate-300 font-semibold">Bản quyền ảnh:</span> {selectedDetailFrog.credit.author} ({selectedDetailFrog.credit.license})</p>
              <p><span className="text-slate-300 font-semibold">Nguồn tài nguyên:</span> {selectedDetailFrog.credit.source}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
