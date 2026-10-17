# BÁO CÁO KIỂM TOÁN CHUYÊN SÂU VÀ PHỤC HỒI CHẤT LƯỢNG S ẾCH V3.0
**Dự án:** S ếch (Web Game Idle Clicker + Gacha + Frog Collection)  
**Thời gian hoàn thành:** 2026-10-17  
**Chi nhánh Git triển khai:** `fix/v2-quality-recovery`  
**Commit SHA cơ sở (Baseline HEAD):** `96b910ca28a2c38f1cc30874f59830da5a93896a`  
**Phương pháp áp dụng:** Quy trình kiểm chứng từng bước `@skill:stepwise-verified` (Task V01 $\rightarrow$ V09)

---

## 1. TỔNG QUAN VÀ BẢNG TRẠNG THÁI VẤN ĐỀ

Báo cáo này tổng hợp toàn bộ kết quả kiểm toán kỹ thuật, phát hiện sai lệch và các biện pháp khắc phục triệt để đã được thực hiện trên dự án Web Game "S ếch" ở chu kỳ nâng cấp v3.0.

### Bảng Tổng Hợp Trạng Thái Vấn Đề

| ID | Vấn Đề Được Kiểm Toán | Phân Loại Ban Đầu | Trạng Thái Sau Xử Lý | Biện Pháp Khắc Phục & Kiểm Chứng |
| :---: | :--- | :---: | :---: | :--- |
| **B01** | Lỗi Checksum từ chối Save v1 khi import | Reproducible Bug (P0) | **FIXED** | Bổ sung hàm nhận diện format `SECH_SAVE_V1_` và tính lại Checksum bằng thuật toán DJB2 (seed 5381); giữ thuật toán hash 32-bit cho `SECH_SAVE_V2_`. Đã kiểm chứng 15/15 tests trong `save.test.ts`. |
| **B02** | Phân mảnh dữ liệu LocalStorage (`s_ech_favorite_frogs`, `s_ech_gacha_history`) | Architecture Flaw (P1) | **FIXED** | Tích hợp trực tiếp `favoriteFrogIds` và `gachaHistory` vào Save State v2. `CollectionModal.tsx` và `GachaModal.tsx` sử dụng Zustand store. `clearSavedGame` dọn sạch toàn bộ keys legacy. |
| **B03** | Sai ID nâng cấp trong thành tựu `upgrade_magic_finger_10` (`magic_finger` thay vì `divine_finger`) | Reproducible Bug (P1) | **FIXED** | Sửa `achievements.ts` trỏ đúng vào `ctx.upgrades['divine_finger'] >= 10`. Loại bỏ mock ID giả trong unit test, kiểm chứng thành công với `UPGRADES_CONFIG`. |
| **B04** | Đếm số lần Chí mạng (Crits) và lượt Gacha bằng ước lượng `Math.floor` | Data Inaccuracy (P1) | **FIXED** | Theo dõi trực tiếp `totalCrits` và `totalGachaPulls` trong Zustand store và Save State v2. `achievements.ts` sử dụng `ctx.totalCrits ?? 0` và `ctx.totalGachaPulls ?? 0`, loại bỏ ước tính 10%. |
| **B05** | Logic thành tựu bí mật `secret_ribbit_master` cho phép gian lận đổi ếch sau khi cày combo | Logic Bug (P2) | **FIXED** | Yêu cầu bằng chứng sự kiện đồng thời: `lastClickCombo >= 20` diễn ra khi đang chọn ếch bí mật (`mossy_frog` hoặc `lotus_guardian_frog`). Đảm bảo thưởng 1 lần duy nhất. |
| **B06** | Sai lệch tài nguyên và bản quyền ảnh ếch v2 (dùng code Pillow nhưng ghi nhãn Wikimedia) | Asset & Compliance (P1) | **FIXED** | Phân loại toàn bộ 40 ảnh WebP trong `CREDITS.md`: 12 ảnh thật tách nền Wikimedia, 3 ảnh Thần thoại phái sinh chất lượng cao, 25 ảnh vector Pillow đánh dấu `PLACEHOLDER` trung thực. Chuẩn hóa danh pháp sinh học. |
| **B07** | Bảng tỷ lệ Gacha không phản ánh trạng thái kích hoạt bảo đảm (Pity) của lượt kế tiếp | UI/UX & Transparency (P2) | **FIXED** | Thêm tab chuyển đổi "Tỉ Lệ Cơ Bản" và "Tỉ Lệ Lượt Tiếp Theo (Theo Pity)", hiển thị banner bảo đảm (Rare+, Epic+, Legendary+) và chú thích minh bạch Rate-up x3, New Frog Priority x1.4. |
| **B08** | Lệch thời gian Combo Timeout giữa clicker engine (1800ms) và store tick (2000ms) | Logic & Feel (P2) | **FIXED** | Đồng bộ hằng số `COMBO_TIMEOUT_MS = 1800ms` vào `gameStore.ts`, loại bỏ 200ms "combo zombie". Kiểm chứng chéo 18 nâng cấp đều có tác động thực tế. |
| **B09** | Mất cân bằng Pacing ban đầu do `first_touch` thưởng 100 điểm ngay sau 1 click | Economy Balance (P2) | **FIXED** | Điều chỉnh `first_touch` thưởng 20 điểm. Người chơi click tích lũy 20-30 lần (~15-30s) để mua nâng cấp đầu tiên. Mở rộng `balance.test.ts` mô phỏng 5 player archetypes an toàn đến 24h. |

---

## 2. KẾT QUẢ KIỂM THỬ VÀ BUILD TOÀN DIỆN

- **Tổng số Test Suites:** 10 / 10 passed (100%).
- **Tổng số Unit Tests:** 128 / 128 passed (100%), tăng từ 105 tests ở baseline v2 lên 128 tests ở v3.0:
  - `clicker.test.ts`: 22 tests passed.
  - `idle.test.ts`: 19 tests passed.
  - `frogs.test.ts`: 14 tests passed.
  - `upgrade.test.ts`: 14 tests passed.
  - `gacha.test.ts`: 15 tests passed.
  - `save.test.ts`: 15 tests passed.
  - `achievements.test.ts`: 12 tests passed.
  - `balance.test.ts`: 10 tests passed (mô phỏng kinh tế chuyên sâu).
  - `audio.test.ts`: 5 tests passed.
  - `smoke.test.ts`: 2 tests passed.
- **Production Build:** `tsc && vite build` hoàn thành trong 4.40s không phát sinh bất kỳ lỗi TypeScript nào:
  - `dist/index.html`: 1.18 kB (gzip: 0.69 kB).
  - `dist/assets/index-DN2Bf6tz.css`: 56.84 kB (gzip: 9.67 kB).
  - `dist/assets/index-DEv2-taJ.js`: 338.21 kB (gzip: 95.95 kB).

---

## 3. CHI TIẾT TỪNG HẠNG MỤC PHỤC HỒI CHẤT LƯỢNG

### A. Hệ Thống Lưu Trữ và Khôi Phục Dữ Liệu (Save Engine)
1. **Khắc phục Checksum:**
   - Trong `save.ts`, `importSaveFromString` kiểm tra tiền tố chuỗi lưu.
   - Nếu bắt đầu bằng `SECH_SAVE_V1_`: Sử dụng thuật toán DJB2 với seed `5381` (`hash = (hash * 33) ^ charCode; hash >>>= 0;`).
   - Nếu bắt đầu bằng `SECH_SAVE_V2_`: Sử dụng thuật toán Hash 32-bit seed `0` (`hash = ((hash << 5) - hash) + charCode; hash |= 0;`).
   - Người chơi từ bản v1 hoặc v2 có thể copy chuỗi save cũ và dán vào game mà không bị báo lỗi "Mã kiểm tra tính toàn vẹn (checksum) không hợp lệ!".
2. **Hợp nhất Nguồn Lưu Trữ (Single Source of Truth):**
   - Loại bỏ hoàn toàn việc đọc/ghi trực tiếp vào LocalStorage từ `CollectionModal.tsx` (`s_ech_favorite_frogs`) và `gameStore.ts` (`s_ech_gacha_history`).
   - `favoriteFrogIds` và `gachaHistory` hiện là các trường chính thức trong `GameStateV2`.
   - Hàm `clearSavedGame()` được nâng cấp để xóa cả `s_ech_save_game_v2`, `s_ech_save_game` (legacy v1), `s_ech_favorite_frogs`, và `s_ech_gacha_history`, ngăn ngừa tình trạng dữ liệu rác còn sót lại khi reset.

### B. Hệ Thống Thành Tựu Minh Bạch và Đúng Logic
1. **Sửa ID nâng cấp:** Thay thế `magic_finger` bằng ID cấu hình thực tế `divine_finger` trong `upgrade_magic_finger_10`.
2. **Loại bỏ đếm ước lượng:**
   - Trường `totalCrits` và `totalGachaPulls` được ghi nhận theo từng cú click chí mạng và từng lượt mở trứng Gacha.
   - Xóa bỏ công thức ước lượng `Math.floor(ctx.totalClicks * 0.1)` vốn gây mở khóa sai lệch thành tựu.
3. **Thành tựu Bí Mật:**
   - `secret_ribbit_master` kiểm tra sự kiện đồng thời: `(ctx.mainFrogId === 'mossy_frog' || ctx.mainFrogId === 'lotus_guardian_frog') && (ctx.lastClickCombo ?? 0) >= 20`.
   - Ngăn chặn triệt để hành vi cày combo 20 bằng ếch thường rồi đổi sang ếch bí mật để nhận thành tựu.
4. **Bảo đảm Thưởng 1 Lần:**
   - Lưu trữ danh sách `unlockedAchievements` trong save state, chỉ cộng thưởng điểm sờ ếch cho các thành tựu mới mở khóa trong phiên hiện tại (`newlyUnlockedIds`).

### C. Tài Nguyên Hình Ảnh Ếch và Quyền Tác Giả
1. **Phân loại trung thực:**
   - 12 loài ếch thực tế tách nền từ ảnh chụp Wikimedia Commons (giấy phép CC BY, CC BY-SA, Public Domain).
   - 3 loài Thần Thoại phái sinh nghệ thuật chất lượng cao (`king_frog`, `galaxy_frog`, `lotus_guardian_frog`).
   - 23 loài thật bổ sung ở đợt v2 vẽ minh họa vector bằng script Python Pillow: Đánh dấu trạng thái `PLACEHOLDER` minh bạch, không ghi nhầm tác giả Wikimedia Commons.
   - 2 loài Thần Thoại mới ở v2 (`phoenix_frog`, `chronos_frog`): Đánh dấu trạng thái `PLACEHOLDER_MYTHIC`.
2. **Chuẩn hóa Taxonomy:**
   - Các loài Thần Thoại không bị gắn tên khoa học Latinh giả mạo loài sinh học công nhận, mà được ghi chú rõ ràng là sinh vật truyền thuyết ao sen hư cấu.
   - Cập nhật bảng kiểm kê 40 loài chi tiết trong [CREDITS.md](CREDITS.md).

### D. Minh Bạch Tỉ Lệ Rơi Gacha và Cơ Chế Pity
1. **Tính toán Tỉ lệ theo Pity:**
   - Nâng cấp hàm `getSpeciesDropRates(poolType, ownedFrogs, currentPity, considerPity)`.
   - Khi `considerPity = true`, nếu người chơi đang ở ngưỡng bảo đảm (ví dụ lượt 10 bảo đảm Rare+), tỉ lệ rơi của nhóm loài Common tự động về 0%, và phân bổ lại 100% tỉ lệ cho các bậc độ hiếm từ Rare trở lên.
2. **Giao diện Gacha trực quan:**
   - Thêm tab chuyển đổi trong `GachaModal`: "Tỉ Lệ Cơ Bản Chuẩn" vs "Tỉ Lệ Lượt Tiếp Theo (Theo Pity)".
   - Banner bảo hiểm Pity thông báo rõ ràng cho người chơi biết lượt quay tiếp theo có kích hoạt bảo đảm Rare, Epic hay Legendary.
   - Ghi chú minh bạch về trọng số Rate-Up x3 cho các loài thuộc hồ và trọng số Ưu tiên x1.4 cho các loài chưa sở hữu.

### E. Cân Bằng Kinh Tế, Pacing Ban Đầu và Không Deadlock
1. **Khắc phục Pacing Early-Game:**
   - Phần thưởng thành tựu `first_touch` được cân chỉnh từ 100 điểm xuống 20 điểm.
   - Người chơi sau cú click đầu tiên nhận 21 điểm (hoặc 22 điểm nếu nổ crit), chưa đủ 50 điểm mua nâng cấp đầu tiên `divine_finger`.
   - Người chơi cần tiếp tục click tự nhiên khoảng 20-30 lần kết hợp với combo multiplier để đạt 50 điểm, tái hiện đúng cảm giác tiến trình tích lũy của thể loại Clicker.
2. **Mô Phỏng 5 Archetypes (Phong cách chơi):**
   - Đã kiểm chứng trong `balance.test.ts`:
     - *Click Specialist*: Tăng trưởng mạnh mẽ với nâng cấp ngón tay và găng tay.
     - *Idle Specialist*: Khởi động máy sờ và mở rộng đội ngũ idle, thu nhập ổn định.
     - *Hybrid Player*: Phối hợp click và idle nhịp nhàng, tối ưu hóa tốc độ.
     - *Gacha Enthusiast*: Tái đầu tư điểm vào trứng Gacha để tích lũy buff bị động 40 loài.
     - *Upgrade Optimizer*: Tự động mua nâng cấp có ROI tốt nhất.
   - Cả 5 phong cách đều tăng trưởng ổn định, không phong cách nào bị kẹt hoặc deadlock tài nguyên.
3. **An Toàn Số Lớn & Trần Offline:**
   - Trần thu nhập ngoại tuyến (Offline Reward) được giới hạn ở 8 giờ (`DEFAULT_IDLE_CONFIG.maxOfflineSeconds = 28800s`), đảm bảo phần thưởng ở mốc 12h và 24h bằng nhau, chống lạm phát điểm quá mức.
   - Toàn bộ chỉ số PPS và điểm số ở late game (18 nâng cấp lv50, 40 loài ếch lv5) được kiểm chứng luôn nằm trong khoảng an toàn nhỏ hơn `Number.MAX_SAFE_INTEGER / 1000`.

---

## 4. BẢO VỆ DỮ LIỆU NGƯỜI CHƠI & KHÔNG PHÁ SAVE CŨ

- Tuyệt đối không xóa bỏ hoặc đổi tên các ID nâng cấp hoặc ID loài ếch cũ.
- Khi người chơi mở game bằng bản save v1 cũ:
  - Hệ thống nhận diện `SECH_SAVE_V1_`, kiểm tra checksum DJB2 hợp lệ.
  - Tự động bổ sung các trường mặc định của v2: `version: 2`, `favoriteFrogIds: []`, `gachaHistory: []`, `highestCombo: 0`, `totalCrits: 0`, `totalGachaPulls: 0`.
  - Không làm giảm điểm số, không làm mất bất kỳ con ếch hay nâng cấp nào của người chơi.

---

## 5. THỰC HIỆN GIT VÀ KIỂM SOÁT NHÁNH

- Nhánh triển khai: `fix/v2-quality-recovery`.
- Các thay đổi đã được đóng gói cẩn thận, không làm ảnh hưởng đến nhánh `main` khi chưa có chỉ định của người dùng.
- Toàn bộ 9/9 tasks trong quy trình `@skill:stepwise-verified` đã hoàn thành và vượt qua cổng kiểm chứng tự động.

---

## 6. KẾT LUẬN

Dự án Web Game "S ếch" v3.0 đã đạt mức độ hoàn thiện kỹ thuật cao nhất từ trước đến nay:
1. **100% Bugs P0 và P1 được khắc phục tận gốc kèm unit tests bảo vệ**.
2. **Độ tương thích ngược của hệ thống Save đạt 100% với cả save v1 và save v2**.
3. **Tính trung thực tài nguyên được khôi phục trọn vẹn và minh bạch**.
4. **Nhịp độ chơi và hệ sinh thái kinh tế được cân bằng khoa học**.
5. **Codebase đạt 128 tests pass và build production hoàn toàn sạch lỗi**.
