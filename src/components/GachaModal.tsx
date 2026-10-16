import React, { useEffect, useRef, useState } from 'react';
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [skipAnim, setSkipAnim] = useState(false);
  const [showOdds, setShowOdds] = useState(false);
  const [showTenPullConfirm, setShowTenPullConfirm] = useState(false);
  const [confirmTenPullSetting, setConfirmTenPullSetting] = useState(true);
  const [results, setResults] = useState<GachaPullResult[] | null>(null);
  const animationTimersRef = useRef<number[]>([]);

  useEffect(() => () => {
    animationTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    animationTimersRef.current = [];
  }, []);

  const scheduleAnimationTimeout = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      animationTimersRef.current = animationTimersRef.current.filter((pending) => pending !== timer);
      callback();
    }, delay);
    animationTimersRef.current.push(timer);
  };

  const executePull = (count: 1 | 10) => {
    const cost = count === 1 ? GACHA_COST_SINGLE : GACHA_COST_TEN;
    if (points < cost || isProcessing || isHatching) return;

    setIsProcessing(true);
    const session = pullGacha(count);
    if (!session) {
      setIsProcessing(false);
      return;
    }

    // Tìm độ hiếm cao nhất trong lần quay này để chọn hiệu ứng
    const highestRarity = session.pulls.reduce((highest, pull) => {
      const order = ['common', 'rare', 'epic', 'legendary', 'mythic'];
      return order.indexOf(pull.species.rarity) > order.indexOf(highest)
        ? pull.species.rarity
        : highest;
    }, 'common' as any);

    if (skipAnim) {
      triggerResultView(session, highestRarity);
      setIsProcessing(false);
    } else {
      setIsHatching(true);
      soundManager.playEggCrack();

      scheduleAnimationTimeout(() => {
        soundManager.playEggCrack();
      }, 500);

      scheduleAnimationTimeout(() => {
        setIsHatching(false);
        setIsProcessing(false);
        triggerResultView(session, highestRarity);
      }, 1200);
    }
  };

  const handlePullClick = (count: 1 | 10) => {
    if (count === 10 && confirmTenPullSetting) {
      setShowTenPullConfirm(true);
    } else {
      executePull(count);
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
              <h3 className="text-center font-heading text-xl font-bold text-pond-300 mb-2">
                🎉 Bạn Nhận Được:
              </h3>

              {/* Summary Stats Banner for 10x Pull / Results */}
              <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-pond-950/80 via-slate-900/90 to-purple-950/80 border border-pond-500/30 flex flex-wrap items-center justify-around gap-2 text-xs shadow-md">
                <span className="text-white font-medium flex items-center gap-1.5">
                  <span>Khám phá:</span>
                  <strong className="text-emerald-400 font-bold">
                    {results.filter((p) => p.isNew).length} loài mới
                  </strong>
                  <span>✨</span>
                </span>
                <span className="text-slate-600 hidden sm:inline">|</span>
                <span className="text-white font-medium flex items-center gap-1.5">
                  <span>Mảnh quy đổi trùng:</span>
                  <strong className="text-yellow-300 font-bold">
                    +{results.reduce((acc, p) => acc + p.fragmentsAdded, 0)} mảnh
                  </strong>
                  <span>🧩</span>
                </span>
              </div>

              <div
                className={`grid gap-3 max-h-[48vh] overflow-y-auto p-2 ${
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
                      className={`p-3 rounded-2xl border flex flex-col items-center text-center relative overflow-hidden backdrop-blur-md shadow-lg transition-transform hover:scale-105 ${
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

              <div className="mt-5 flex justify-center">
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold flex items-center gap-2 transition-all active:scale-95 shadow-md"
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
                  onClick={() => handlePullClick(1)}
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
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={skipAnim}
                onChange={(e) => setSkipAnim(e.target.checked)}
                className="w-4 h-4 accent-pond-500 rounded cursor-pointer"
              />
              <span>Bỏ qua hoạt ảnh</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmTenPullSetting}
                onChange={(e) => setConfirmTenPullSetting(e.target.checked)}
                className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
              />
              <span>Xác nhận quay 10 lượt</span>
            </label>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Quay 1 Lượt */}
            <button
              disabled={points < GACHA_COST_SINGLE || isHatching || isProcessing}
              onClick={() => handlePullClick(1)}
              className={`flex-1 sm:flex-initial px-5 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                points >= GACHA_COST_SINGLE && !isHatching && !isProcessing
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-md'
                  : 'bg-slate-800/50 text-slate-500 border border-slate-800 cursor-not-allowed'
              }`}
            >
              <span>Quay 1 Lần</span>
              <span className="text-xs text-emerald-400">({formatNumber(GACHA_COST_SINGLE)} đ)</span>
            </button>

            {/* Quay 10 Lượt */}
            <button
              disabled={points < GACHA_COST_TEN || isHatching || isProcessing}
              onClick={() => handlePullClick(10)}
              className={`flex-1 sm:flex-initial px-6 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 ${
                points >= GACHA_COST_TEN && !isHatching && !isProcessing
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

      {/* Confirmation Modal for 10x Pull (D1 Chống bấm nhầm) */}
      {showTenPullConfirm && (
        <div 
          onClick={() => setShowTenPullConfirm(false)}
          className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-purple-500/50 p-6 rounded-3xl max-w-sm w-full text-center shadow-2xl animate-scale-up space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-400/30 flex items-center justify-center text-3xl mx-auto shadow-inner">
              🥚✨
            </div>
            <div>
              <h3 className="text-lg font-bold font-heading text-white">Xác Nhận Quay 10 Lượt</h3>
              <p className="text-xs text-slate-400 mt-1">
                Bạn có chắc chắn muốn sử dụng 5.000 điểm để ấp 10 trứng liên tiếp?
              </p>
            </div>

            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Số lượt quay:</span>
                <span className="font-bold text-white">10 Lượt</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Chi phí:</span>
                <span className="font-bold text-yellow-300">-{formatNumber(GACHA_COST_TEN)} điểm</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Số điểm hiện tại:</span>
                <span className="font-bold text-emerald-400">{points.toLocaleString('vi-VN')} điểm</span>
              </div>
              <div className="flex justify-between text-slate-400 border-t border-slate-800/80 pt-2">
                <span>Điểm sau khi quay:</span>
                <span className="font-bold text-cyan-300">
                  {Math.max(0, points - GACHA_COST_TEN).toLocaleString('vi-VN')} điểm
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                disabled={isProcessing}
                onClick={() => setShowTenPullConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-all active:scale-95"
              >
                Hủy Bỏ
              </button>
              <button
                disabled={isProcessing}
                onClick={() => {
                  setShowTenPullConfirm(false);
                  executePull(10);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-bold text-xs shadow-lg shadow-purple-500/30 transition-all active:scale-95"
              >
                Xác Nhận Quay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
