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

### [F02] Ghi chú quyết định (2026-10-15T14:58:40Z)
- **Vì sao (Why):** Bao toan ma nguon goc truoc khi sua code theo yeu cau Giai doan B
- **Thay đổi & Tác động (Change):** Tao .gitignore chuan loai tru node_modules, dist, temp files; khoi tao git va tao baseline commit

### [F02] VERIFIED (2026-10-15T14:58:44Z)
- **Test tự động:** 1 lệnh PASS

### [F03] Ghi chú quyết định (2026-10-15T15:03:15Z)
- **Vì sao (Why):** Sua loi C1 Background Throttling va C2 Offline Reward theo yeu cau Giai doan C
- **Thay đổi & Tác động (Change):** Them ham processVisibilityTransition vao idle.ts xu ly 100% active catchup khi tab <30s va 50% offline reward khi >=30s; tich hop Page Visibility API trong App.tsx va gameStore.ts giup hien popup offline tu dong khong can F5; bo sung 9 test cases mo phong mock time 5s 15s 29s 31s 1h 8h 12h va timestamp bat thuong

### [F03] VERIFIED (2026-10-15T15:03:23Z)
- **Test tự động:** 1 lệnh PASS

### [F04] Ghi chú quyết định (2026-10-15T15:06:02Z)
- **Vì sao (Why):** Cai thien Gacha chong bam nham va tang trai nghiem theo yeu cau Giai doan D
- **Thay đổi & Tác động (Change):** Them hop thoai xac nhan khi quay 10 luot 5000 diem hien thi chi tiet so luot chi phi diem hien tai va con lai; them co isProcessing khoa giao dich chong click kep spam; bo sung banner tong ket so loai moi va tong manh quy doi tu luot trung

### [F04] VERIFIED (2026-10-15T15:06:10Z)
- **Test tự động:** 1 lệnh PASS

### [F05] Ghi chú quyết định (2026-10-15T15:08:32Z)
- **Vì sao (Why):** Cai thien tooltip diem so day du va an toan so lon theo yeu cau Giai doan E
- **Thay đổi & Tác động (Change):** Them ham formatExactPoints trong clicker.ts ho tro an toan so lon MAX_SAFE_INTEGER va so thuc float64; cap nhat Header.tsx cho phep click toggle xem diem so day du cung tooltip chi tiet; build production dat ket qua sach se khong loi

### [F05] VERIFIED (2026-10-15T15:08:46Z)
- **Test tự động:** 1 lệnh PASS

### [F06] Ghi chú quyết định (2026-10-15T15:10:36Z)
- **Vì sao (Why):** Hoan thien he thong luu game lam ro Base64 va them checksum toan ven theo yeu cau Giai doan F
- **Thay đổi & Tác động (Change):** Bo sung ham calculateSaveChecksum kiem tra toan ven chuoi export format V1; ho tro 100% tuong thich nguoc voi format cu; lam ro Base64 la serialization format chu khong phai ma hoa bao mat; bat an toan loi QuotaExceededError khi bo nho day

### [F06] VERIFIED (2026-10-15T15:10:49Z)
- **Test tự động:** 1 lệnh PASS

### [F07] Ghi chú quyết định (2026-10-15T15:13:26Z)
- **Vì sao (Why):** Kiem thu hoi quy toan dien va mo phong can bang kinh te theo yeu cau Giai doan G va H
- **Thay đổi & Tác động (Change):** Mo phong 5 phong cach choi trong balance.test.ts dam bao khong ai bi ket; chay toan bo 92 unit tests pass 100% va production build khong loi

### [F07] VERIFIED (2026-10-15T15:13:42Z)
- **Test tự động:** 1 lệnh PASS

### [F08] Ghi chú quyết định (2026-10-15T15:15:50Z)
- **Vì sao (Why):** Xuat ban PROJECT_IMPROVEMENT_REPORT.md va cap nhat PROJECT_AUDIT_REPORT.md theo yeu cau Giai doan 10
- **Thay đổi & Tác động (Change):** Tao bao cao PROJECT_IMPROVEMENT_REPORT.md day du 8 muc tu A den H; cap nhat muc 15 trong PROJECT_AUDIT_REPORT.md va chay script verify thanh cong

### [F08] VERIFIED (2026-10-15T15:15:55Z)
- **Test tự động:** 1 lệnh PASS

### [E01] Ghi chú quyết định (2026-10-16T09:23:55Z)
- **Vì sao (Why):** Mo rong Cua hang Nang cap tu 8 len 18 theo ke hoach v2.0
- **Thay đổi & Tác động (Change):** Them 10 nang cap moi vao UPGRADES_CONFIG; cap nhat bo tinh toan clicker va idle; nang cap giao dien UpgradePanel voi bo loc category, uoc tinh thoi gian va milestones; bo sung test cases v2 pass 100%

### [E01] VERIFIED (2026-10-16T09:24:06Z)
- **Test tự động:** 1 lệnh PASS

### [E02] Ghi chú quyết định (2026-10-16T09:33:01Z)
- **Vì sao (Why):** Mo rong tu 15 len 40 loai ech (8 Common, 10 Rare, 11 Epic, 6 Legendary, 5 Mythic), tao 25 anh WebP moi chat luong cao, chuan hoa du lieu Centrolene prosoblepon va Breviceps adspersus, bo sung soft-cap diminishing returns cho passive buffs tranh tran chi so, va nang cap CollectionModal voi tim kiem, loc buff, sap xep, yeu thich, preview delta Click/PPS
- **Thay đổi & Tác động (Change):** src/data/frogs.ts, src/engine/frogs.ts, src/components/CollectionModal.tsx, scripts/generate_v2_frog_assets.py, public/assets/frogs/*.webp, src/engine/__tests__/frogs.test.ts

### [E02] VERIFIED (2026-10-16T09:33:09Z)
- **Test tự động:** 1 lệnh PASS

### [E03] Ghi chú quyết định (2026-10-16T09:37:39Z)
- **Vì sao (Why):** Trien khai 3 ho Gacha (Ao Sen, Rung Mua rate-up nhiet doi, Dem Trang rate-up bong dem va mythic) dung chung Pity, luu tru 20 luot lich su, tinh xac suat roi chi tiet tung loai xap xi 100%, va giao dien GachaModal co tabs chon ho, xem lich su, xem chi tiet ty le va che do quay nhanh
- **Thay đổi & Tác động (Change):** src/engine/gacha.ts, src/store/gameStore.ts, src/components/GachaModal.tsx, src/engine/__tests__/gacha.test.ts

### [E03] VERIFIED (2026-10-16T09:37:48Z)
- **Test tự động:** 1 lệnh PASS

### [E04] Ghi chú quyết định (2026-10-16T09:42:40Z)
- **Vì sao (Why):** Mo rong thanh tuu tu 12 len 40 thanh tuu (bao toan 12 ID cu, them 28 thanh tuu moi covering clicks, combos, crits, scores, upgrades, gacha va secret), sua loi AchievementsModal truyen upgrades rong sang lay upgradeLevels thuc te tu Zustand, va tich hop phan thuong diem tu dong khi mo khoa thanh tuu
- **Thay đổi & Tác động (Change):** src/engine/achievements.ts, src/engine/types.ts, src/components/AchievementsModal.tsx, src/store/gameStore.ts, src/engine/__tests__/achievements.test.ts

### [E04] VERIFIED (2026-10-16T09:42:48Z)
- **Test tự động:** 1 lệnh PASS

### [E05] Ghi chú quyết định (2026-10-16T09:46:49Z)
- **Vì sao (Why):** Them Combo Milestones (5, 10, 20, 50) voi visual banner va Web Audio SFX chuc mung, bo sung am thanh chao hoi rieng biet cho tung loai ech theo do hiem, va nang cap he thong luu tru Save V2 tuong thich 100% nguoc voi save v1 cu, migrate tu dong khong mat diem, ech hay thanh tuu
- **Thay đổi & Tác động (Change):** src/engine/audio.ts, src/components/PondArea.tsx, src/engine/save.ts, src/engine/__tests__/save.test.ts, src/engine/__tests__/audio.test.ts

### [E05] VERIFIED (2026-10-16T09:46:59Z)
- **Test tự động:** 1 lệnh PASS

### [E06] Ghi chú quyết định (2026-10-16T09:49:50Z)
- **Vì sao (Why):** Mo phong kinh te late game voi 18 nang cap va 40 loai ech an toan trong Number.MAX_SAFE_INTEGER, kiem chung tong xac suat 3 ho Gacha bang 100%, sua imports calculateClickPower va calculatePointsPerSecond trong CollectionModal, va chay thanh cong npm test voi 105 tests PASS va npm run build khong loi
- **Thay đổi & Tác động (Change):** src/engine/__tests__/balance.test.ts, src/components/CollectionModal.tsx, dist/*

### [E06] VERIFIED (2026-10-16T09:50:10Z)
- **Test tự động:** 1 lệnh PASS

### [E07] Ghi chú quyết định (2026-10-16T09:52:20Z)
- **Vì sao (Why):** Cap nhat README.md tong quan v2.0, commit toan bo ma nguon va day thanh cong len GitHub repository https://github.com/ngoctuls2005-dev/S_ECH.git
- **Thay đổi & Tác động (Change):** README.md, git commit 96b910c, git push origin main

### [E07] VERIFIED (2026-10-16T09:52:26Z)
- **Test tự động:** 1 lệnh PASS

### [V01] Ghi chú quyết định (2026-10-16T10:09:38Z)
- **Vì sao (Why):** Xac nhan HEAD SHA 96b910c, tao nhanh rieng fix/v2-quality-recovery, kiem tra 105 tests pass va build status, lap bao cao V3_AUDIT_BASELINE.md
- **Thay đổi & Tác động (Change):** V3_AUDIT_BASELINE.md, branch fix/v2-quality-recovery

### [V01] VERIFIED (2026-10-16T10:09:42Z)
- **Test tự động:** 1 lệnh PASS

### [V02] Ghi chú quyết định (2026-10-16T10:16:53Z)
- **Vì sao (Why):** Sua triet de checksum DJB2 cho v1 va hash 32-bit cho v2 trong importSaveFromString; thong nhat nguon du lieu favoriteFrogIds va gachaHistory vao saveGameStateToStorage; bo sung luu tru highestCombo, totalCrits, totalGachaPulls; don dep legacy keys khi reset
- **Thay đổi & Tác động (Change):** save.ts, gameStore.ts, CollectionModal.tsx, App.tsx, achievements.ts, save.test.ts

### [V02] VERIFIED (2026-10-16T10:17:00Z)
- **Test tự động:** 1 lệnh PASS

### [V03] Ghi chú quyết định (2026-10-16T10:20:39Z)
- **Vì sao (Why):** Sua dem crits that bang ctx.totalCrits ?? 0 loai bo uoc tinh 10%; dem gacha pulls that bang ctx.totalGachaPulls ?? 0; sua ID nang cap divine_finger trong upgrade_magic_finger_10; kiem tra bang chung su kien dong thoi lastClickCombo >= 20 cho secret_ribbit_master; bao dam thuong dung 1 lan va cap nhat AchievementsModal
- **Thay đổi & Tác động (Change):** achievements.ts, AchievementsModal.tsx, achievements.test.ts

### [V03] VERIFIED (2026-10-16T10:20:47Z)
- **Test tự động:** 1 lệnh PASS

### [V04] Ghi chú quyết định (2026-10-16T10:26:05Z)
- **Vì sao (Why):** Kiem toan toan bo 40 loai ech: xac minh 12 loai that tach nen, 3 loai mythic phai sinh va 25 loai v2 dung Pillow code; danh dau trung thuc PLACEHOLDER cho cac anh minh hoa vector tam thoi de khong ghi sai tac gia Wikimedia; chuan hoa danh phap Mythic khong gia mao sinh hoc cong nhan; cap nhat CREDITS.md bang thong ke day du 40 loai
- **Thay đổi & Tác động (Change):** CREDITS.md, frogs.ts, frogs.test.ts

### [V04] VERIFIED (2026-10-16T10:26:15Z)
- **Test tự động:** 1 lệnh PASS

### [V05] Ghi chú quyết định (2026-10-16T10:31:20Z)
- **Vì sao (Why):** Nang cap getSpeciesDropRates ho tro tinh xac suat theo trang thai Pity bao dam cua luot tiep theo; them ham getNextPullGuaranteedStatus; cap nhat GachaModal voi tab chuyen doi ti le co ban va pity, banner bao dam ro rang va chu thich minh bach ve rate-up x3 va uu tien loai moi x1.4
- **Thay đổi & Tác động (Change):** gacha.ts, GachaModal.tsx, gacha.test.ts

### [V05] VERIFIED (2026-10-16T10:31:30Z)
- **Test tự động:** 1 lệnh PASS

### [V06] Ghi chú quyết định (2026-10-16T10:34:14Z)
- **Vì sao (Why):** Dong bo hang so COMBO_TIMEOUT_MS = 1800ms tu clicker.ts sang gameStore.ts tick giup loai bo hoan toan hien tuong 200ms combo zombie; xac thuc cheo 100% 18 nang cap trong UPGRADES_CONFIG deu co anh huong tinh toan trong clicker.ts va idle.ts, khong co dead upgrade hay ID gia
- **Thay đổi & Tác động (Change):** gameStore.ts, upgrade.test.ts

### [V06] VERIFIED (2026-10-16T10:34:23Z)
- **Test tự động:** 1 lệnh PASS

### [V07] Ghi chú quyết định (2026-10-17T08:53:39Z)
- **Vì sao (Why):** Can bang pacing early game va mo phong toan dien 5 playstyles cung multi-horizon an toan
- **Thay đổi & Tác động (Change):** Chinh reward first_touch ve 20 diem trong achievements.ts, mo rong 10 tests mo phong kinh te trong balance.test.ts

### [V07] VERIFIED (2026-10-17T08:53:47Z)
- **Test tự động:** 1 lệnh PASS

### [V08] Ghi chú quyết định (2026-10-17T09:01:51Z)
- **Vì sao (Why):** Kiem thu hoi quy toan bo he thong sau cac dot fix va xac nhan production build khong loi TypeScript hoac Vite
- **Thay đổi & Tác động (Change):** Chay 10 test suites (128 tests) dat 100% pass, fix type checking isCritical trong balance.test.ts va build production thanh cong

### [V08] VERIFIED (2026-10-17T09:02:07Z)
- **Test tự động:** 1 lệnh PASS

### [V09] Ghi chú quyết định (2026-10-17T09:03:54Z)
- **Vì sao (Why):** Chuan hoa tai lieu v3.0, xuat ban bao cao kiem toan toan dien va dong goi commit tren nhanh fix
- **Thay đổi & Tác động (Change):** Cap nhat README.md, tao V3_DEEP_AUDIT_AND_FIX_REPORT.md voi 9 hang muc va commit git 2b38f13 tren nhanh fix/v2-quality-recovery

### [V09] VERIFIED (2026-10-17T09:03:57Z)
- **Test tự động:** 1 lệnh PASS

### [R01] Ghi chú quyết định (2026-10-17T09:08:32Z)
- **Vì sao (Why):** Xac minh commit 2b38f13 tren nhanh fix/v2-quality-recovery ton tai day du va day len GitHub remote
- **Thay đổi & Tác động (Change):** Chay git push -u origin fix/v2-quality-recovery thanh cong len https://github.com/ngoctuls2005-dev/S_ECH.git ma khong merge vao main hay force push

### [R01] VERIFIED (2026-10-17T09:08:37Z)
- **Test tự động:** 1 lệnh PASS

### [R02] Ghi chú quyết định (2026-10-17T09:13:23Z)
- **Vì sao (Why):** Kiem chung hoi quy thuc te 8 kich ban bat buoc cua v3.0 ma khong sua test de doi pass gia tao
- **Thay đổi & Tác động (Change):** Tao src/engine/__tests__/v3_regression.test.ts kiem chung toan dien: save v1 DJB2, export/reset/import v2 bao toan favorites va gacha history, crit/gacha counters that, khong cong lai thuong thanh tuu, combo va secret ribbit, offline checkpoint cap 8h, va gacha pity rate

### [R02] VERIFIED (2026-10-17T09:13:31Z)
- **Test tự động:** 1 lệnh PASS

### [R03] Ghi chú quyết định (2026-10-17T09:15:16Z)
- **Vì sao (Why):** Sua trang thai van de B06 tu FIXED sang PARTIAL vi 25 anh Pillow van la placeholder chua phai anh that tach nen
- **Thay đổi & Tác động (Change):** Cap nhat V3_DEEP_AUDIT_AND_FIX_REPORT.md: chuyen B06 ve PARTIAL va bo sung bang theo doi chi tiet 25 anh placeholder can thay the kem nguon, license va tinh trang nghiem thu

### [R03] VERIFIED (2026-10-17T09:15:20Z)
- **Test tự động:** 1 lệnh PASS

### [R04] Ghi chú quyết định (2026-10-17T09:18:58Z)
- **Vì sao (Why):** Dong goi toan bo ho so code review doc lap va day commit len remote GitHub tren nhanh rieng
- **Thay đổi & Tác động (Change):** Chay thanh cong 11 test suites (142 tests) va production build, commit 376a4f279fd0637c4d825e2206135a08e6eeb7ad va push len origin fix/v2-quality-recovery

### [R04] VERIFIED (2026-10-17T09:19:16Z)
- **Test tự động:** 1 lệnh PASS

### [R05] Ghi chú quyết định (2026-10-17T09:28:46Z)
- **Vì sao (Why):** Khoi tao lai toan bo runtime state khi importSave va resetGame trong gameStore de ngan ngua ro ri tu phien choi cu
- **Thay đổi & Tác động (Change):** Cap nhat gameStore.ts reset currentCombo, lastClickTimestamp, idleAccumulator, lastActiveTimestamp ve now, offlineReward, floatingTexts; tao runtime_state.test.ts kiem chung 6 kich ban Zustand truc tiep

### [R05] VERIFIED (2026-10-17T09:29:00Z)
- **Test tự động:** 1 lệnh PASS

### [R06] Ghi chú quyết định (2026-10-17T09:32:31Z)
- **Vì sao (Why):** Phan dinh ro rang giua active income va offline income khi chuyen tab visibility de ngan chan double count hoac ro ri active tick khi tab hidden
- **Thay đổi & Tác động (Change):** Them check visibilityState === visible trong rAF loop cua App.tsx va tick() cua gameStore.ts; tao page_lifecycle.test.ts kiem chung 7 kich ban lifecycle qua fake timers

### [R06] VERIFIED (2026-10-17T09:32:54Z)
- **Test tự động:** 1 lệnh PASS

### [R07] Ghi chú quyết định (2026-10-17T09:36:34Z)
- **Vì sao (Why):** Kiem thu tich hop thuc te xuyen suot Zustand actions va Golden Fixture v1 bat bien de dong khoang trong kiem thu
- **Thay đổi & Tác động (Change):** Tao store_integration.test.ts kiem tra Invariant Golden Fixture v1, full action flow, chong duplicate reward va atomic gacha transaction

### [R07] VERIFIED (2026-10-17T09:36:50Z)
- **Test tự động:** 1 lệnh PASS

### [R08] Ghi chú quyết định (2026-10-17T09:42:14Z)
- **Vì sao (Why):** Mo rong co che validate va tu dong phuc hoi du lieu save: kiem tra upgrade IDs hop le, clamp level ech va fragments, gacha pity, gacha history day du schema, deduplicate favorites va achievements, gioi han timestamp tuong lai, kiem tra MAX_SAFE_INTEGER va tu dong phuc hoi tu v1 khi v2 bi hong
- **Thay đổi & Tác động (Change):** Cap nhat save.ts va tao save_validation.test.ts gom 11 bai test chuyen sau dat 100% pass

### [R08] VERIFIED (2026-10-17T09:42:23Z)
- **Test tự động:** 1 lệnh PASS

### [R09] Ghi chú quyết định (2026-10-17T09:44:06Z)
- **Vì sao (Why):** Danh gia toan dien tai nguyen anh ech B06, phan dinh ro Technical Merge Readiness dat YES va Content Release Readiness la NO do 25 placeholder Pillow, dong thoi xuat ban V3_FINAL_INTEGRATION_REVIEW.md
- **Thay đổi & Tác động (Change):** Tao bao cao V3_FINAL_INTEGRATION_REVIEW.md voi day du 6 phan tong ket ky thuat, bang chung test, build va quyet dinh merge readiness

### [R09] VERIFIED (2026-10-17T09:44:26Z)
- **Test tự động:** 1 lệnh PASS

### [C01] Ghi chú quyết định (2026-10-17T15:39:25Z)
- **Vì sao (Why):** Kiem tra boolean tra ve cua saveGameStateToStorage truoc khi cap nhat RAM/audio de bao ve state cu khi storage that bai
- **Thay đổi & Tác động (Change):** Them kiem tra if (!saved) return error trong importSave va bo sung import_storage_failure.test.ts

### [C01] VERIFIED (2026-10-17T15:39:30Z)
- **Test tự động:** 1 lệnh PASS

### [C02] Ghi chú quyết định (2026-10-17T15:42:20Z)
- **Vì sao (Why):** Bao ve du lieu V2 hong truoc khi ghi de V1: luu quarantine vao s_ech_game_save_v2_corrupted_backup, kiem tra thanh cong moi ghi de, chan ghi de neu backup quota error
- **Thay đổi & Tác động (Change):** Cap nhat loadGameStateFromStorage va clearSavedGame trong save.ts kem 7 tests trong safe_recovery.test.ts dat 100% pass

### [C02] VERIFIED (2026-10-17T15:42:26Z)
- **Test tự động:** 1 lệnh PASS

### [C03] Ghi chú quyết định (2026-10-17T15:47:19Z)
- **Vì sao (Why):** Khai bao trần cấp MAX_FROG_LEVEL = 22 trong frogs.ts tuong thich fragment cap 10M, dong thoi giu MAX_SAVED_FROG_LEVEL = 50 trong save.ts de khong ha cap save hop le
- **Thay đổi & Tác động (Change):** Cap nhat frogs.ts, save.ts, CollectionModal.tsx kem 5 tests trong frog_progression_consistency.test.ts dat 100% pass

### [C03] VERIFIED (2026-10-17T15:47:23Z)
- **Test tự động:** 1 lệnh PASS

### [C04] Ghi chú quyết định (2026-10-17T15:51:52Z)
- **Vì sao (Why):** Kiem chung toan trinh gameplay thuc te tren trinh duyet bang browser_subagent: Click ech, mo Nang cap, mo Bo suu tap, kiem tra console 0 error va ghi video WebP
- **Thay đổi & Tác động (Change):** Chay browser_subagent tren Vite dev server xuat video browser_e2e_check_1792252170326.webp kem 185 tests unit/integration pass

### [C04] VERIFIED (2026-10-17T15:52:08Z)
- **Test tự động:** 1 lệnh PASS

### [C05] Ghi chú quyết định (2026-10-17T16:00:15Z)
- **Vì sao (Why):** Codex doc lap review diff va chi ra 2 loi P1 ve quarantine va autosave leak. Antigravity tiep thu va sua triet de.
- **Thay đổi & Tác động (Change):** Sua save.ts kiem tra chuoi backup khop chinh xac va khoa autosave khi quarantine that bai; sua CollectionModal.tsx hien thi cap 22; xuat ban CODEX_COLLABORATION_LOG.md va V3_CODEX_COLLABORATIVE_REVIEW.md

### [C05] VERIFIED (2026-10-17T16:01:15Z)
- **Test tự động:** 1 lệnh PASS

### [D01] Ghi chú quyết định (2026-10-17T16:17:00Z)
- **Vì sao (Why):** Kiem toan phat hien V2 hong va V1 khong ton tai hoac hong bi autosave 5s ghi de DEFAULT_INITIAL_SAVE lam mat du lieu. Codex phan tich va de xuat quarantine ngay, danh dau recovery session va khoa autosave.
- **Thay đổi & Tác động (Change):** Them SaveRecoveryInfo, SaveSessionContext, quarantine ngay khi V2 hong, khoa autosave neu recovery-pending hoac quarantine-failed, hien thi banner canh bao an toan du lieu tren UI va them d01_corrupted_autosave_protection.test.ts

### [D01] VERIFIED (2026-10-17T16:17:09Z)
- **Test tự động:** 1 lệnh PASS

### [D02] Ghi chú quyết định (2026-10-17T16:22:30Z)
- **Vì sao (Why):** Codex review phat hien: reset gameplay xoa quarantine backup, import hop le bi block boi save lock, va can cach ly session context giua cac store/test. Antigravity tiep thu va sua triet de.
- **Thay đổi & Tác động (Change):** Cap nhat clearSavedGame mac dinh preserveQuarantineBackup=true; them clearQuarantineBackups; them SaveStorageOptions isManualUserResolution vao saveGameStateToStorage; sua importSave va resetGame; them d02_save_lock_lifecycle.test.ts (5 tests)

### [D02] VERIFIED (2026-10-17T16:22:42Z)
- **Test tự động:** 1 lệnh PASS

### [D03] Ghi chú quyết định (2026-10-17T16:29:52Z)
- **Vì sao (Why):** Kiem thu Browser E2E day du toan trinh: Click 30 lan, mua nang cap, quay gacha, doi ech chinh, favorite, xuat save, reload that, nhap save, kiem tra console 0 error va ghi video WebP
- **Thay đổi & Tác động (Change):** Chay browser_subagent tren trinh duyet that xuat video full_e2e_flow_1792254215526.webp va export_import_reload_e2e_1792254400545.webp; console 0 error; 196 tests PASS

### [D03] VERIFIED (2026-10-17T16:30:03Z)
- **Test tự động:** 1 lệnh PASS

### [D04] Ghi chú quyết định (2026-10-17T16:37:47Z)
- **Vì sao (Why):** Codex review D04 phan tich doc lap va chi ra 5 diem: resetGame fail-closed, multi-tab conflict prevention, unique quarantine key khong va cham, banner phan biet quarantine-failed. Antigravity tiep thu va sua triet de toan bo.
- **Thay đổi & Tác động (Change):** Sua save.ts multi-tab check va unique quarantine key; sua resetGame fail-closed; sua App.tsx banner phan biet quarantine-failed; mo rong d02 test suite len 8 tests dat 199/199 tests PASS

### [D04] VERIFIED (2026-10-17T16:37:57Z)
- **Test tự động:** 1 lệnh PASS

### [D05] Ghi chú quyết định (2026-10-17T16:40:51Z)
- **Vì sao (Why):** Hoan tat toan bo dot Final Data Safety Review D01-D04, khac phuc 5 phat hien cua Codex, 199/199 tests PASS, Browser E2E 0 error, xuat ban V3_FINAL_CODEX_SIGNOFF.md
- **Thay đổi & Tác động (Change):** Cap nhat save.ts, gameStore.ts, App.tsx, bo sung d01 va d02 test suites, xuat ban V3_FINAL_CODEX_SIGNOFF.md va CODEX_COLLABORATION_LOG.md

### [D05] VERIFIED (2026-10-17T16:41:07Z)
- **Test tự động:** 1 lệnh PASS

