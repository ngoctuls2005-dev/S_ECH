# KẾ HOẠCH TRIỂN KHAI DỰ ÁN WEB GAME “S ẾCH” 🐸

## 1. TỔNG QUAN KIẾN TRÚC
Dự án được xây dựng theo mô hình Module hóa cao, tách biệt hoàn toàn giữa Game Engine/Business Logic và UI Layer:

- **Game Engine (`src/engine/`)**:
  - `clicker.ts`: Logic tính toán điểm click, critical hit, combo streak, combo multiplier.
  - `upgrade.ts`: Logic tính giá (x1, x10, MAX), mua nâng cấp, cộng dồn stats.
  - `idle.ts`: Logic tích lũy điểm tự động theo delta time, tính toán offline earnings (50% max 8h).
  - `frogs.ts`: Dữ liệu loài ếch, buff active/passive, level up từ mảnh (fragments).
  - `gacha.ts`: Pool gacha, pity counter (10 Rare, 30 Epic, 100 Legendary), gacha trùng.
  - `save.ts`: Quản lý lưu trữ IndexedDB/LocalStorage, export/import JSON an toàn có checksum, migration schema.
  - `achievements.ts`: Danh mục thành tựu, listener kiểm tra điều kiện tự động.
  - `audio.ts`: Web Audio API Sound Synthesizer (croak, click, bell, chime, egg crack, jackpot fanfare) không phụ thuộc external network.
- **Game State (`src/store/`)**:
  - Zustand store liên kết toàn bộ engine, hỗ trợ reactive selectors chống rerender thừa.
- **UI & Presentation (`src/components/`, `src/theme/`)**:
  - `PondArea`: Khu vực ao sen trung tâm, tương tác chạm ếch, squash & stretch animation, floating numbers, combo meter.
  - `Header`: Điểm sờ ếch, Điểm mỗi giây (DPS), Âm thanh, Cài đặt.
  - `UpgradePanel`: Danh sách nâng cấp x1, x10, MAX, hiển thị giá và hiệu quả.
  - `GachaModal`: Hồ gacha thần bí, hiệu ứng rung nứt trứng, hào quang độ hiếm, màn hình kết quả 1x / 10x, nút Skip.
  - `CollectionModal`: Danh mục các loài ếch với ảnh thật tách nền WebP, độ hiếm, chỉ số buff, nâng cấp sao/mảnh, chọn Ếch Chính.
  - `AchievementsModal`: Danh sách huân chương và tiến trình thành tựu.
  - `SettingsModal`: Âm lượng, Export/Import file Save, Reset game.
  - `OfflineModal`: Thông báo điểm kiếm được khi rời game.
- **Assets (`src/assets/frogs/`)**:
  - Tối thiểu 12-15 hình ảnh ếch thật tách nền chuẩn WebP từ Wikimedia Commons / Openverse với file ghi công `CREDITS.md` đầy đủ.

---

## 2. DANH SÁCH NHIỆM VỤ (TASKFLOW & VERIFICATION)

| Task ID | Tiêu đề | Tiêu chí chấp nhận | Lệnh kiểm chứng |
|---|---|---|---|
| **T01** | Khởi tạo project React Vite TypeScript Tailwind Zustand Vitest | Cài đặt dependencies, Vite + Vitest chạy tốt, test mẫu pass | `npm test` |
| **T02** | Game Economy & Core Clicker Engine Logic | Tính điểm click, crit, combo, không bị điểm âm, logic test pass | `npx vitest run src/engine/__tests__/clicker.test.ts` |
| **T03** | Hệ thống Nâng cấp Upgrade System | 8 loại nâng cấp, công thức giá chuẩn, mua x1 x10 MAX, test pass | `npx vitest run src/engine/__tests__/upgrade.test.ts` |
| **T04** | Idle Engine & Offline Income System | Tự động cộng điểm delta time, tính offline 50% max 8h chuẩn xác | `npx vitest run src/engine/__tests__/idle.test.ts` |
| **T05** | Bộ sưu tập ếch & Assets hình ảnh thực tế | 12-15 loài ếch thật, ảnh tách nền kèm license ghi công, buff test pass | `npx vitest run src/engine/__tests__/frogs.test.ts` |
| **T06** | Hệ thống Gacha & Pity Mechanism | Tỉ lệ 100%, bảo hiểm 10/30/100, đổi mảnh khi trùng, test pass | `npx vitest run src/engine/__tests__/gacha.test.ts` |
| **T07** | Hệ thống Lưu trữ Game Save/Load/Export/Import | Auto-save, restore, export/import JSON validate an toàn | `npx vitest run src/engine/__tests__/save.test.ts` |
| **T08** | Hệ thống Thành tựu Achievement System | Tự động cập nhật tiến độ và mở khóa khi đạt điều kiện | `npx vitest run src/engine/__tests__/achievements.test.ts` |
| **T09** | Hệ thống Âm thanh Web Audio SFX | Web Audio engine cho click, croak, gacha, upgrade, volume/mute | `npx vitest run src/engine/__tests__/audio.test.ts` |
| **T10** | Giao diện Trung tâm Cozy Pond Con ếch & Floating Text | Ao sen, con ếch to, squash-stretch, floating text mượt mà | `npm run build` |
| **T11** | Giao diện Nâng cấp, Gacha Animation, Bộ sưu tập, Thành tựu | Đầy đủ panel Nâng cấp, Gacha trứng nở, Thẻ bộ sưu tập, Thành tựu | `npm run build` |
| **T12** | Responsive Mobile Navigation & Touch Optimization | Bottom navigation điện thoại, touch không delay, responsive mượt mà | `npm run build` |
| **T13** | Kiểm thử Tích hợp Toàn diện, Cân bằng Kinh tế & README | Toàn bộ test suites pass 100%, build production thành công, README hoàn chỉnh | `npm test` & `npm run build` |

---

## 3. NGUYÊN TẮC THỰC HIỆN
- Tuân thủ quy trình `stepwise-verified`: Thực hiện từng task độc lập, chạy test kiểm chứng, ghi note lý do thay đổi trước khi chuyển sang task kế tiếp.
- Tuyệt đối không nhảy cóc hoặc đánh dấu hoàn thành khi chưa chạy test thực tế.
