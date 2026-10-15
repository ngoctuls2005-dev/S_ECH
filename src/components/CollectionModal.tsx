import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { FROG_SPECIES_LIST } from '../data/frogs';
import {
  RARITY_CONFIG,
  getRequiredFragmentsForLevel,
  calculateFrogBuffValue,
  canLevelUpFrog,
} from '../engine/frogs';
import { Rarity } from '../engine/types';
import { X, Check, ArrowUpCircle, Filter, BookOpen } from 'lucide-react';

export const CollectionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const ownedFrogs = useGameStore((s) => s.ownedFrogs);
  const mainFrogId = useGameStore((s) => s.mainFrogId);
  const setMainFrog = useGameStore((s) => s.setMainFrog);
  const levelUpFrog = useGameStore((s) => s.levelUpFrog);

  const [rarityFilter, setRarityFilter] = useState<string>('all');

  const ownedCount = Object.keys(ownedFrogs).length;

  const filteredFrogs = FROG_SPECIES_LIST.filter((frog) => {
    if (rarityFilter !== 'all' && frog.rarity !== rarityFilter) {
      return false;
    }
    return true;
  });

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-pond-600/30 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-xl shadow-md">
              <BookOpen className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-heading text-white">Bộ Sưu Tập Ếch</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-pond-950 border border-pond-500/40 text-emerald-400 font-bold">
                  {ownedCount} / {FROG_SPECIES_LIST.length} Loài
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ếch chính nhận 100% buff, các ếch khác trong bộ sưu tập nhận 20% buff bị động
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

        {/* Filter Bar */}
        <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Lọc:
          </span>
          <button
            onClick={() => setRarityFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
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
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
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

        {/* Frog Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredFrogs.map((frog) => {
            const owned = ownedFrogs[frog.id];
            const isMain = mainFrogId === frog.id;
            const rarity = RARITY_CONFIG[frog.rarity];
            const reqFragments = owned ? getRequiredFragmentsForLevel(owned.level) : 5;
            const canLevel = owned ? canLevelUpFrog(owned) : false;
            const buffVal = owned ? calculateFrogBuffValue(frog.buff.value, owned.level) : frog.buff.value;

            return (
              <div
                key={frog.id}
                className={`p-4 rounded-3xl border flex flex-col justify-between transition-all relative overflow-hidden backdrop-blur-md ${
                  owned
                    ? `${rarity.borderGlow} bg-gradient-to-b ${rarity.bgGradient} shadow-md`
                    : 'border-slate-800 bg-slate-950/40 opacity-70'
                }`}
              >
                {/* Rarity & Status Badges */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${rarity.badgeBg}`}>
                    {rarity.nameVi}
                  </span>

                  {owned && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      Cấp {owned.level}
                    </span>
                  )}
                </div>

                {/* Frog Photo */}
                <div className="flex flex-col items-center my-2 relative">
                  <img
                    src={frog.image}
                    alt={frog.nameVi}
                    className={`w-28 h-28 sm:w-32 sm:h-32 object-contain transition-all duration-300 drop-shadow-lg ${
                      owned ? 'hover:scale-105' : 'brightness-[0.2] contrast-150 grayscale'
                    }`}
                  />
                  {!owned && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl">🔒</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div>
                  <h3 className="text-base font-bold text-white font-heading">{frog.nameVi}</h3>
                  <p className="text-[11px] text-slate-400 italic mb-2">
                    {frog.scientificName || frog.nameEn}
                  </p>
                  <p className="text-xs text-slate-300 line-clamp-2 mb-3">{frog.description}</p>

                  {/* Buff Box */}
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700/60 mb-3 text-xs">
                    <span className="text-[10px] text-slate-400 block">Hiệu quả buff:</span>
                    <span className="font-bold text-emerald-400">
                      +{Math.round(buffVal * 100)}%{' '}
                      {frog.buff.type === 'click_points_percent'
                        ? 'Điểm click'
                        : frog.buff.type === 'idle_points_percent'
                        ? 'Điểm tự động/s'
                        : frog.buff.type === 'crit_chance_bonus'
                        ? 'Tỉ lệ chí mạng'
                        : frog.buff.type === 'crit_multiplier_bonus'
                        ? 'Hệ số chí mạng'
                        : frog.buff.type === 'upgrade_discount_percent'
                        ? 'Giảm giá nâng cấp'
                        : frog.buff.type === 'combo_bonus_percent'
                        ? 'Thưởng combo'
                        : 'Tổng điểm'}
                    </span>
                  </div>

                  {/* Fragment Progress Bar */}
                  {owned && (
                    <div className="mb-3">
                      <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                        <span>Tiến trình mảnh:</span>
                        <span className="font-bold">
                          {owned.fragments} / {reqFragments}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pond-500 to-emerald-400 rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (owned.fragments / reqFragments) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-700/40 flex items-center gap-2">
                  {owned ? (
                    <>
                      {isMain ? (
                        <div className="flex-1 py-2 rounded-xl bg-pond-900/60 border border-pond-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Đang Sử Dụng</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => setMainFrog(frog.id)}
                          className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all active:scale-95"
                        >
                          Chọn Làm Ếch Chính
                        </button>
                      )}

                      {canLevel && (
                        <button
                          onClick={() => levelUpFrog(frog.id)}
                          className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold hover:brightness-110 shadow-md active:scale-95"
                          title="Thăng cấp ếch (+25% Buff)"
                        >
                          <ArrowUpCircle className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="w-full py-2 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl">
                      Chưa mở khóa (Quay tại Hồ Gacha)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
