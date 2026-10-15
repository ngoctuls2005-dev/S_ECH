import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  GACHA_COST_SINGLE,
  GACHA_COST_TEN,
  GachaSessionResult,
  GachaPullResult,
} from '../engine/gacha';
import { RARITY_CONFIG } from '../engine/frogs';
import { formatNumber } from '../engine/clicker';
import { soundManager } from '../engine/audio';
import confetti from 'canvas-confetti';
import { Sparkles, HelpCircle, X, ChevronRight, RotateCcw } from 'lucide-react';

export const GachaModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const points = useGameStore((s) => s.points);
  const pity = useGameStore((s) => s.pity);
  const pullGacha = useGameStore((s) => s.pullGacha);

  const [isHatching, setIsHatching] = useState(false);
  const [skipAnim, setSkipAnim] = useState(false);
  const [showOdds, setShowOdds] = useState(false);
  const [results, setResults] = useState<GachaPullResult[] | null>(null);

  const handlePull = (count: 1 | 10) => {
    const cost = count === 1 ? GACHA_COST_SINGLE : GACHA_COST_TEN;
    if (points < cost) return;

    const session = pullGacha(count);
    if (!session) return;

    // Tìm độ hiếm cao nhất trong lần quay này để chọn hiệu ứng
    const highestRarity = session.pulls.reduce((highest, pull) => {
      const order = ['common', 'rare', 'epic', 'legendary', 'mythic'];
      return order.indexOf(pull.species.rarity) > order.indexOf(highest)
        ? pull.species.rarity
        : highest;
    }, 'common' as any);

    if (skipAnim) {
      triggerResultView(session, highestRarity);
    } else {
      setIsHatching(true);
      soundManager.playEggCrack();

      setTimeout(() => {
        soundManager.playEggCrack();
      }, 500);

      setTimeout(() => {
        setIsHatching(false);
        triggerResultView(session, highestRarity);
      }, 1200);
    }
  };

  const triggerResultView = (session: GachaSessionResult, highestRarity: any) => {
    soundManager.playGachaReveal(highestRarity);
    setResults(session.pulls);

    if (highestRarity === 'legendary' || highestRarity === 'mythic') {
      try {
        confetti({
          particleCount: highestRarity === 'mythic' ? 120 : 70,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }
  };

  const handleReset = () => {
    setResults(null);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-pond-600/30 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-xl shadow-md">
              🥚
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading text-white">Hồ Gacha Ếch Thần Bí</h2>
              <p className="text-xs text-slate-400">Ấp trứng sen nhiệm màu để sưu tầm những loài ếch quý</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOdds(!showOdds)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1 border border-slate-700"
              title="Tỉ lệ Gacha"
            >
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Tỉ lệ</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pity Progress Bars */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 grid grid-cols-3 gap-2 text-center text-[11px]">
          <div className="bg-slate-900/80 p-1.5 rounded-xl border border-blue-900/30">
            <span className="text-blue-400 font-bold block">Bảo hiểm Hiếm</span>
            <span className="text-slate-300 font-medium">
              Còn {Math.max(0, 10 - pity.sinceLastRare)} lượt
            </span>
          </div>

          <div className="bg-slate-900/80 p-1.5 rounded-xl border border-purple-900/30">
            <span className="text-purple-400 font-bold block">Bảo hiểm Sử Thi</span>
            <span className="text-slate-300 font-medium">
              Còn {Math.max(0, 30 - pity.sinceLastEpic)} lượt
            </span>
          </div>

          <div className="bg-slate-900/80 p-1.5 rounded-xl border border-amber-900/30">
            <span className="text-amber-400 font-bold block">Huyền Thoại</span>
            <span className="text-slate-300 font-medium">
              Còn {Math.max(0, 100 - pity.sinceLastLegendary)} lượt
            </span>
          </div>
        </div>

        {/* Odds Dropdown */}
        {showOdds && (
          <div className="p-4 bg-slate-800/90 border-b border-slate-700 text-xs text-slate-300 grid grid-cols-2 sm:grid-cols-5 gap-2 animate-fade-in">
            {Object.entries(RARITY_CONFIG).map(([key, info]) => (
              <div key={key} className="p-2 rounded-xl bg-slate-900/60 border border-slate-700 text-center">
                <span className={`font-bold block ${info.color}`}>{info.nameVi}</span>
                <span className="text-sm font-extrabold text-white">{info.gachaWeight}%</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Trùng: +{info.duplicateFragments} mảnh</span>
              </div>
            ))}
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col items-center justify-center min-h-[300px]">
          {results ? (
            /* Result Cards Screen */
            <div className="w-full">
              <h3 className="text-center font-heading text-xl font-bold text-pond-300 mb-4">
                🎉 Bạn Nhận Được:
              </h3>
              <div
                className={`grid gap-3 max-h-[50vh] overflow-y-auto p-2 ${
                  results.length === 1
                    ? 'grid-cols-1 max-w-xs mx-auto'
                    : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'
                }`}
              >
                {results.map((pull, idx) => {
                  const rarity = RARITY_CONFIG[pull.species.rarity];
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-2xl border flex flex-col items-center text-center relative overflow-hidden backdrop-blur-md shadow-lg ${
                        pull.species.rarity === 'mythic'
                          ? 'border-rose-400 bg-rose-950/40 shadow-rose-500/30'
                          : pull.species.rarity === 'legendary'
                          ? 'border-amber-400 bg-amber-950/40 shadow-amber-400/30'
                          : pull.species.rarity === 'epic'
                          ? 'border-purple-400 bg-purple-950/30'
                          : pull.species.rarity === 'rare'
                          ? 'border-blue-400 bg-blue-950/30'
                          : 'border-slate-700 bg-slate-800/40'
                      }`}
                    >
                      {/* Badge status: MỚI hoặc +MẢNH */}
                      <div className="absolute top-2 right-2">
                        {pull.isNew ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                            MỚI!
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-emerald-400 border border-emerald-500/30">
                            +{pull.fragmentsAdded} Mảnh
                          </span>
                        )}
                      </div>

                      <img
                        src={pull.species.image}
                        alt={pull.species.nameVi}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-contain my-2 drop-shadow-md"
                      />

                      <span className={`text-[10px] font-bold uppercase ${rarity.color}`}>
                        {rarity.nameVi}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-white font-heading mt-0.5 line-clamp-1">
                        {pull.species.nameVi}
                      </h4>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold flex items-center gap-2 transition-all active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  Tiếp Tục Quay
                </button>
              </div>
            </div>
          ) : (
            /* Egg Stage Screen */
            <div className="flex flex-col items-center justify-center my-6">
              <div className="relative">
                {/* Hào quang nền trứng */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500/20 to-pond-400/20 blur-3xl animate-pulse" />

                {/* Trứng Ếch Gacha */}
                <div
                  className={`text-8xl sm:text-9xl cursor-pointer select-none transition-transform duration-200 ${
                    isHatching ? 'animate-egg-wobble scale-110' : 'hover:scale-105'
                  }`}
                  onClick={() => handlePull(1)}
                >
                  {isHatching ? '✨🥚✨' : '🥚'}
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                {isHatching ? 'Đang nở... chuẩn bị đón ếch mới!' : 'Chọn số lượt mở bên dưới'}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={skipAnim}
              onChange={(e) => setSkipAnim(e.target.checked)}
              className="w-4 h-4 accent-pond-500 rounded cursor-pointer"
            />
            <span>Bỏ qua hoạt ảnh nở trứng</span>
          </label>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Quay 1 Lượt */}
            <button
              disabled={points < GACHA_COST_SINGLE || isHatching}
              onClick={() => handlePull(1)}
              className={`flex-1 sm:flex-initial px-5 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                points >= GACHA_COST_SINGLE && !isHatching
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-md'
                  : 'bg-slate-800/50 text-slate-500 border border-slate-800 cursor-not-allowed'
              }`}
            >
              <span>Quay 1 Lần</span>
              <span className="text-xs text-emerald-400">({formatNumber(GACHA_COST_SINGLE)} đ)</span>
            </button>

            {/* Quay 10 Lượt */}
            <button
              disabled={points < GACHA_COST_TEN || isHatching}
              onClick={() => handlePull(10)}
              className={`flex-1 sm:flex-initial px-6 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                points >= GACHA_COST_TEN && !isHatching
                  ? 'bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-slate-800/50 text-slate-500 border border-slate-800 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Quay 10 Lần</span>
              <span className="text-xs text-yellow-200">({formatNumber(GACHA_COST_TEN)} đ)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
