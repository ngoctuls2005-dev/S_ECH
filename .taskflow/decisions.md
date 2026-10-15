# Nhật ký quyết định & Kiểm chứng (.taskflow/decisions.md)

## Khởi tạo dự án: Web Game S ech (2026-10-15T13:58:31Z)
- **Mục tiêu:** Xay dung web game Idle Clicker + Gacha + Frog Collection S ech hoan chinh co kiem chung

### [T01] Ghi chú quyết định (2026-10-15T14:02:18Z)
- **Vì sao (Why):** Thiet lap bo khung du an theo yeu cau ky thuat gom React Vite TypeScript Tailwind Zustand Lucide Vitest
- **Thay đổi & Tác động (Change):** Tao package.json, vite.config.ts, tsconfig.json, tailwind.config.js, index.html, index.css, smoke.test.ts va chay cai dat dependencies thanh cong

### [T01] VERIFIED (2026-10-15T14:02:25Z)
- **Test tự động:** 1 lệnh PASS

### [T02] Ghi chú quyết định (2026-10-15T14:04:00Z)
- **Vì sao (Why):** Xay dung game economy va core clicker engine voi cong thuc click crit combo format number doc lap voi UI
- **Thay đổi & Tác động (Change):** Tao types.ts, clicker.ts va bo 17 test cases clicker.test.ts kiem tra toan dien co che clicker

### [T02] VERIFIED (2026-10-15T14:04:09Z)
- **Test tự động:** 1 lệnh PASS

### [T03] Ghi chú quyết định (2026-10-15T14:05:03Z)
- **Vì sao (Why):** Cai dat logic 8 loai nang cap theo yeu cau, cong thuc gia ceil(base*1.15^lvl), mua x1 x10 MAX va giam gia tu buff
- **Thay đổi & Tác động (Change):** Tao upgrade.ts voi UPGRADES_CONFIG va ham tinh gia/mua, bo test upgrade.test.ts voi 11 test cases pass 100%

### [T03] VERIFIED (2026-10-15T14:05:11Z)
- **Test tự động:** 1 lệnh PASS

### [T04] Ghi chú quyết định (2026-10-15T14:05:59Z)
- **Vì sao (Why):** Trien khai Idle Engine voi tich luy delta time chong drift va thu nhap offline 50 percent gioi han 8h theo dung yeu cau
- **Thay đổi & Tác động (Change):** Tao idle.ts voi ham tinh PPS, accumulateDeltaPoints va calculateOfflineReward kem bo 10 unit test idle.test.ts pass 100%

### [T04] VERIFIED (2026-10-15T14:06:06Z)
- **Test tự động:** 1 lệnh PASS

### [T05] Ghi chú quyết định (2026-10-15T14:13:50Z)
- **Vì sao (Why):** Thu thap va tach nen 15 loai ech that tu Wikimedia Commons voi OpenCV GrabCut, tao CREDITS.md va he thong buff collection manh
- **Thay đổi & Tác động (Change):** Tao 15 file webp trong public/assets/frogs, viet CREDITS.md, frogs.ts, frogs engine va bo test frogs.test.ts pass 100%

### [T05] VERIFIED (2026-10-15T14:14:00Z)
- **Test tự động:** 1 lệnh PASS

### [T06] Ghi chú quyết định (2026-10-15T14:15:04Z)
- **Vì sao (Why):** Xay dung he thong Gacha voi chi phi 500 va 5000, ti le 100 percent, co che pity 10 30 100 va quy doi manh khi trung
- **Thay đổi & Tác động (Change):** Tao gacha.ts va bo test gacha.test.ts voi 8 test cases bao gom simulation 10,000 lan quay pass 100%

### [T06] VERIFIED (2026-10-15T14:15:13Z)
- **Test tự động:** 1 lệnh PASS

### [T07] Ghi chú quyết định (2026-10-15T14:16:19Z)
- **Vì sao (Why):** Xay dung he thong luu tru save load export import json base64 an toan co migration va validate chong crash
- **Thay đổi & Tác động (Change):** Tao save.ts va bo test save.test.ts voi 8 test cases kiem tra storage persistence, corrupt handling va export import pass 100%

### [T07] VERIFIED (2026-10-15T14:16:28Z)
- **Test tự động:** 1 lệnh PASS

### [T08] Ghi chú quyết định (2026-10-15T14:17:27Z)
- **Vì sao (Why):** Cai dat danh muc 12 thanh tuu phong phu voi co che evaluate tien do tu dong va trigger newlyUnlockedIds
- **Thay đổi & Tác động (Change):** Tao achievements.ts va achievements.test.ts voi 4 test suites pass 100%

### [T08] VERIFIED (2026-10-15T14:17:36Z)
- **Test tự động:** 1 lệnh PASS

### [T09] Ghi chú quyết định (2026-10-15T14:18:43Z)
- **Vì sao (Why):** Xay dung he thong am thanh offline Web Audio synthesizer cho tieng ech ribbit, click, crit, upgrade, egg crack va fanfare
- **Thay đổi & Tác động (Change):** Tao audio.ts voi SoundManager throttle va audio.test.ts voi 5 test cases pass 100%

### [T09] VERIFIED (2026-10-15T14:18:51Z)
- **Test tự động:** 1 lệnh PASS

### [T10] Ghi chú quyết định (2026-10-15T14:20:48Z)
- **Vì sao (Why):** Xay dung giao dien trung tam Cozy Pond con ech to tuong tac squash stretch, floating text, Header va game loop tick
- **Thay đổi & Tác động (Change):** Tao Header.tsx, PondArea.tsx, gameStore.ts va cap nhat App.tsx voi loop requestAnimationFrame, auto save va offline modal, build pass 100%

### [T10] VERIFIED (2026-10-15T14:20:59Z)
- **Test tự động:** 1 lệnh PASS

### [T11] Ghi chú quyết định (2026-10-15T14:23:38Z)
- **Vì sao (Why):** Xay dung day du cac man hinh UpgradePanel mua x1 x10 max, GachaModal voi trung no va hao quang, CollectionModal luoi 15 loai ech va thang cap manh, AchievementsModal va SettingsModal
- **Thay đổi & Tác động (Change):** Tao UpgradePanel.tsx, GachaModal.tsx, CollectionModal.tsx, AchievementsModal.tsx, SettingsModal.tsx va cap nhat App.tsx, build pass 100%

### [T11] VERIFIED (2026-10-15T14:23:50Z)
- **Test tự động:** 1 lệnh PASS

### [T12] Ghi chú quyết định (2026-10-15T14:24:43Z)
- **Vì sao (Why):** Toi uu hoa giao dien di dong voi BottomNav, badge thong bao nang cap, touch-action manipulation chong delay zoom va prefers-reduced-motion
- **Thay đổi & Tác động (Change):** Tao BottomNav.tsx, cap nhat index.css va App.tsx, build pass 100%

### [T12] VERIFIED (2026-10-15T14:24:54Z)
- **Test tự động:** 1 lệnh PASS

### [T13] Ghi chú quyết định (2026-10-15T14:32:55Z)
- **Vì sao (Why):** Kiem thu tich hop toan dien, mo phong can bang kinh te 5m 15m 30m 1h, toi uu backdrop dismiss va hoan thien README.md
- **Thay đổi & Tác động (Change):** Tao balance.test.ts, README.md, toi uu cac modal va chay toan bo 76 tests cung nhu build production thanh cong

### [T13] VERIFIED (2026-10-15T14:33:09Z)
- **Test tự động:** 1 lệnh PASS

### [A01] Ghi chú quyết định (2026-10-15T14:44:47Z)
- **Vì sao (Why):** Khao sat toan dien workspace, thong ke tap tin, runtimes, dependencies, trang thai git va baseline test
- **Thay đổi & Tác động (Change):** Tao survey_project.py, thu thap thong ke 61 file voi 9697 dong code, xac nhan git chua khoi tao va toan bo 76 tests baseline pass

### [A01] VERIFIED (2026-10-15T14:44:56Z)
- **Test tự động:** 1 lệnh PASS

### [A02] Ghi chú quyết định (2026-10-15T14:45:39Z)
- **Vì sao (Why):** Kiem toan chi tiet 9 he thong tinh nang, cong thuc toan, luong du lieu va file ham lien quan, doi chieu yeu cau goc
- **Thay đổi & Tác động (Change):** Xac minh clicker, upgrade, idle, gacha, frogs, save, achievements, audio va chay pass 71 unit tests tren 8 suites

### [A02] VERIFIED (2026-10-15T14:45:49Z)
- **Test tự động:** 1 lệnh PASS

### [A03] Ghi chú quyết định (2026-10-15T14:46:40Z)
- **Vì sao (Why):** Tham dinh chi tiet 15 anh ech that, kiem tra kich thuoc 512x512, dung luong 538KB tong cong, alpha RGBA tach nen that va doi chieu ban quyen Wikimedia
- **Thay đổi & Tác động (Change):** Tao audit_assets.py, kiem tra toan ven 15 file webp, xac nhan khong co placeholder nao, ban quyen CC va Public Domain minh bach

### [A03] VERIFIED (2026-10-15T14:47:37Z)
- **Test tự động:** 1 lệnh PASS

### [A04] Ghi chú quyết định (2026-10-15T14:48:16Z)
- **Vì sao (Why):** Danh gia chat luong code, phan loai cac van de tu P0 den P3 va kiem tra build production thanh cong
- **Thay đổi & Tác động (Change):** Phan tich type safety, modularization, race conditions, phan loai loi P0 (0 loi), P1 (3 van de), P2 (4 van de), P3 (3 cai tien) va build production pass 100%

### [A04] VERIFIED (2026-10-15T14:48:47Z)
- **Test tự động:** 1 lệnh PASS

### [A05] Ghi chú quyết định (2026-10-15T14:50:36Z)
- **Vì sao (Why):** Xuat ban bao cao kiem toan toan dien PROJECT_AUDIT_REPORT.md day du 14 phan theo yeu cau, co so lieu bang chung thuc te khong suy doan
- **Thay đổi & Tác động (Change):** Tao PROJECT_AUDIT_REPORT.md va script verify_audit_report.py xac minh hop le 14 phan thu tu chuan

### [A05] VERIFIED (2026-10-15T14:50:41Z)
- **Test tự động:** 1 lệnh PASS

### [F01] Ghi chú quyết định (2026-10-15T14:57:05Z)
- **Vì sao (Why):** Xac minh toan dien cac diem mau thuan trong bao cao audit: giai trinh toan hoc phep tinh 94 percent, thong nhat so lieu loi P1 P2 P3 va xac nhan 76 tests pass 100 percent
- **Thay đổi & Tác động (Change):** Cap nhat PROJECT_AUDIT_REPORT.md giai trinh phep tinh 94 percent minh bach, dong bo so dem loi thuc te va xac minh toan bo test suite

### [F01] VERIFIED (2026-10-15T14:57:14Z)
- **Test tự động:** 1 lệnh PASS

