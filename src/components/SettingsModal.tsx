import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  Settings,
  Volume2,
  Music2,
  Download,
  Upload,
  RotateCcw,
  X,
  Check,
  AlertTriangle,
  Info,
} from 'lucide-react';

export const SettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const settings = useGameStore((s) => s.settings);
  const setSettings = useGameStore((s) => s.setSettings);
  const exportSave = useGameStore((s) => s.exportSave);
  const importSave = useGameStore((s) => s.importSave);
  const resetGame = useGameStore((s) => s.resetGame);

  const [importInput, setImportInput] = useState('');
  const [copyStatus, setCopyStatus] = useState(false);
  const [importMessage, setImportMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleExport = () => {
    const code = exportSave();
    navigator.clipboard.writeText(code);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2500);
  };

  const handleImport = () => {
    if (!importInput.trim()) return;
    const res = importSave(importInput.trim());
    if (res.success) {
      setImportMessage({ text: 'Nhập dữ liệu lưu thành công!', isError: false });
      setImportInput('');
      setTimeout(() => setImportMessage(null), 3000);
    } else {
      setImportMessage({ text: res.message || 'Lỗi dữ liệu!', isError: true });
    }
  };

  const handleConfirmReset = () => {
    resetGame();
    setShowConfirmReset(false);
    onClose();
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-pond-600/30 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
              <Settings className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-heading text-white">Cài Đặt Game</h2>
              <p className="text-xs text-slate-400">Tùy chỉnh trải nghiệm và quản lý file lưu</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Sound & Audio */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-pond-300 font-heading">
              Âm Thanh
            </h3>
            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-sm text-slate-200 font-medium">
                  <Volume2 className="w-4 h-4 text-pond-300" /> Hiệu ứng âm thanh
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.soundEnabled}
                  aria-label="Bật hiệu ứng âm thanh"
                  onClick={() => setSettings({ soundEnabled: !settings.soundEnabled })}
                  className={`w-12 h-6 shrink-0 rounded-full transition-colors relative p-0.5 ${
                    settings.soundEnabled ? 'bg-pond-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-sm text-slate-200 font-medium">
                  <Music2 className="w-4 h-4 text-pond-300" /> Nhạc nền ao ếch
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.musicEnabled}
                  aria-label="Bật nhạc nền"
                  onClick={() => setSettings({ musicEnabled: !settings.musicEnabled })}
                  className={`w-12 h-6 shrink-0 rounded-full transition-colors relative p-0.5 ${
                    settings.musicEnabled ? 'bg-pond-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.musicEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                Nhạc được tạo ngay trong game và bắt đầu khi bạn bật hoặc chạm vào ếch.
              </p>

              {(settings.soundEnabled || settings.musicEnabled) && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Âm lượng chung</span>
                    <span>{Math.round(settings.volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.volume}
                    onChange={(e) => setSettings({ volume: parseFloat(e.target.value) })}
                    className="w-full accent-pond-500 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Backup & Restore */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-pond-300 font-heading">
              Sao Lưu & Nhập File Lưu
            </h3>
            <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 space-y-3">
              <p className="text-xs text-slate-300">
                Xuất file lưu để chuyển sang thiết bị khác hoặc lưu trữ an toàn:
              </p>

              <button
                onClick={handleExport}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {copyStatus ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
                <span>{copyStatus ? 'Đã sao chép mã lưu vào bộ nhớ tạm!' : 'Sao Chép Mã Lưu (Export)'}</span>
              </button>

              <div className="pt-2 border-t border-slate-700/50">
                <p className="text-xs text-slate-300 mb-2">Nhập mã lưu từ bản sao lưu trước đó:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={importInput}
                    onChange={(e) => setImportInput(e.target.value)}
                    placeholder="Dán mã bắt đầu bằng SECH_SAVE_..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pond-500 font-mono"
                  />
                  <button
                    onClick={handleImport}
                    className="px-4 py-2 bg-pond-600 hover:bg-pond-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Nhập</span>
                  </button>
                </div>

                {importMessage && (
                  <p
                    className={`text-xs mt-2 font-medium ${
                      importMessage.isError ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {importMessage.text}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Reset Progress Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-rose-400 font-heading">
              Vùng Nguy Hiểm
            </h3>
            <div className="bg-rose-950/20 p-4 rounded-2xl border border-rose-900/40">
              <p className="text-xs text-slate-300 mb-3">
                Xóa toàn bộ điểm số, nâng cấp và bộ sưu tập để bắt đầu lại từ đầu:
              </p>

              {showConfirmReset ? (
                <div className="p-3 bg-rose-950/60 border border-rose-600/50 rounded-xl space-y-2">
                  <p className="text-xs text-rose-200 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    Bạn có chắc chắn muốn xóa toàn bộ tiến trình không?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleConfirmReset}
                      className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-all"
                    >
                      Xác Nhận Xóa
                    </button>
                    <button
                      onClick={() => setShowConfirmReset(false)}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-all"
                    >
                      Hủy Bỏ
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirmReset(true)}
                  className="py-2.5 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 border border-rose-700/60 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-all w-full active:scale-95"
                >
                  <RotateCcw className="w-4 h-4 text-rose-400" />
                  <span>Xóa Dữ Liệu & Chơi Lại Từ Đầu</span>
                </button>
              )}
            </div>
          </div>

          {/* Credits info */}
          <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-pond-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-slate-200 font-semibold mb-0.5">Game S Ếch - Phiên bản 1.0.0</p>
              <p>
                Toàn bộ ảnh các loài ếch thực tế được cấp phép Creative Commons từ kho tư liệu mở{' '}
                <a
                  href="https://commons.wikimedia.org"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 underline"
                >
                  Wikimedia Commons
                </a>
                . Xem chi tiết tại tệp CREDITS.md trong mã nguồn.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
