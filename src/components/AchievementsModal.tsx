import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { ACHIEVEMENTS_DEFINITIONS } from '../engine/achievements';
import { formatNumber } from '../engine/clicker';
import { Trophy, X, CheckCircle, Sparkles, Filter } from 'lucide-react';

export const AchievementsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements);
  const totalClicks = useGameStore((s) => s.totalClicks);
  const totalPointsEarned = useGameStore((s) => s.totalPointsEarned);
  const ownedFrogs = useGameStore((s) => s.ownedFrogs);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const unlockedSet = new Set(unlockedAchievements);
  const unlockedCount = unlockedSet.size;

  const filtered = ACHIEVEMENTS_DEFINITIONS.filter((a) => {
    if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-pond-600/30 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-heading text-white">Thành Tựu Ao Sen</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-500/40 text-amber-300 font-bold">
                  {unlockedCount} / {ACHIEVEMENTS_DEFINITIONS.length} Đã Mở
                </span>
              </div>
              <p className="text-xs text-slate-400">Các cột mốc vinh quang trong hành trình sờ ếch</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filters */}
        <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Danh mục:
          </span>
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'click', label: 'Cú Sờ' },
            { id: 'score', label: 'Điểm Số' },
            { id: 'gacha', label: 'Gacha' },
            { id: 'collection', label: 'Bộ Sưu Tập' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                categoryFilter === cat.id
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* List of achievements */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filtered.map((item) => {
            const isUnlocked = unlockedSet.has(item.id);
            const { current } = item.evalProgress({
              totalClicks,
              totalPointsEarned,
              points: 0,
              ownedFrogs,
              upgrades: {},
            });

            return (
              <div
                key={item.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  isUnlocked
                    ? 'bg-slate-800/80 border-amber-500/40 shadow-lg shadow-amber-500/10'
                    : 'bg-slate-900/40 border-slate-800/80 opacity-70'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                      isUnlocked
                        ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 border-amber-300 shadow-md'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}
                  >
                    <Trophy className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-white font-heading">
                        {item.name}
                      </h4>
                      {isUnlocked && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Đã Đạt
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{item.description}</p>

                    {/* Progress Bar */}
                    <div className="mt-2 flex items-center gap-2 max-w-xs">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isUnlocked ? 'bg-amber-400' : 'bg-slate-600'
                          }`}
                          style={{
                            width: `${Math.min(100, (current / item.target) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatNumber(current)}/{formatNumber(item.target)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
