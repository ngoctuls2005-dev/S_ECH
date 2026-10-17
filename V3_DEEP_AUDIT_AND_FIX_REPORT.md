# BÁO CÁO KIỂM TOÁN CHUYÊN SÂU VÀ PHỤC HỒI CHẤT LƯỢNG S ẾCH V3.0
**Dự án:** S ếch (Web Game Idle Clicker + Gacha + Frog Collection)  
**Thời gian lập & cập nhật:** 2026-10-17  
**Chi nhánh Git triển khai:** [`fix/v2-quality-recovery`](https://github.com/ngoctuls2005-dev/S_ECH/tree/fix/v2-quality-recovery)  
**Commit SHA cơ sở (Baseline HEAD):** `96b910ca28a2c38f1cc30874f59830da5a93896a`  
**Commit SHA sửa đổi v3.0 ban đầu:** `2b38f13`  
**Phương pháp áp dụng:** Quy trình kiểm chứng từng bước `@skill:stepwise-verified` (Task V01 $\rightarrow$ V09, R01 $\rightarrow$ R04)

---

## 1. TỔNG QUAN VÀ BẢNG PHÂN LOẠI TRẠNG THÁI VẤN ĐỀ

Báo cáo này phân định rành mạch các vấn đề kỹ thuật đã được khắc phục hoàn chỉnh, các vấn đề xử lý một phần (minh bạch hóa nhưng chưa thay thế đủ tài nguyên thực tế) và các giới hạn kỹ thuật cần được review độc lập trước khi merge vào nhánh `main`.

### Bảng Tổng Hợp Trạng Thái Kiểm Toán Kỹ Thuật

| ID | Vấn Đề Được Kiểm Toán | Phân Loại Ban Đầu | Trạng Thái Sau v3.0 | Biện Pháp Khắc Phục & Bằng Chứng Kiểm Chứng |
| :---: | :--- | :---: | :---: | :--- |
| **B01** | Lỗi Checksum từ chối Save v1 khi import | Reproducible Bug (P0) | **FIXED** | [save.ts](file:///d:/New%20folder/S%20%E1%BA%BFch/src/engine/save.ts): Nhận diện format `SECH_SAVE_V1_` và tính lại Checksum bằng thuật toán DJB2 (seed 5381); giữ thuật toán hash 32-bit cho `SECH_SAVE_V2_`. Đã kiểm chứng trong `save.test.ts` và `v3_regression.test.ts`. |
| **B02** | Phân mảnh dữ liệu LocalStorage (`s_ech_favorite_frogs`, `s_ech_gacha_history`) | Architecture Flaw (P1) | **FIXED** | [gameStore.ts](file:///d:/New%20folder/S%20%E1%BA%BFch/src/store/gameStore.ts): Tích hợp trực tiếp `favoriteFrogIds` và `gachaHistory` vào Save State v2. `clearSavedGame` dọn sạch cả legacy keys khi reset. Đã kiểm chứng qua chu kỳ Export $\rightarrow$ Reset $\rightarrow$ Import. |
| **B03** | Sai ID nâng cấp trong thành tựu `upgrade_magic_finger_10` (`magic_finger` thay vì `divine_finger`) | Reproducible Bug (P1) | **FIXED** | [achievements.ts](file:///d:/New%20folder/S%20%E1%BA%BFch/src/engine/achievements.ts): Sửa `achievements.ts` trỏ đúng vào `ctx.upgrades['divine_finger'] >= 10`. Loại bỏ mock ID giả, kiểm chứng thành công với `UPGRADES_CONFIG`. |
| **B04** | Đếm số lần Chí mạng (Crits) và lượt Gacha bằng ước lượng `Math.floor` | Data Inaccuracy (P1) | **FIXED** | [gameStore.ts](file:///d:/New%20folder/S%20%E1%BA%BFch/src/store/gameStore.ts): Theo dõi trực tiếp `totalCrits` và `totalGachaPulls` thực tế. `achievements.ts` dùng `ctx.totalCrits ?? 0` và `ctx.totalGachaPulls ?? 0`, xóa bỏ hoàn toàn ước tính 10%. |
| **B05** | Logic thành tựu bí mật `secret_ribbit_master` cho phép gian lận đổi ếch sau khi cày combo | Logic Bug (P2) | **FIXED** | [achievements.ts](file:///d:/New%20folder/S%20%E1%BA%BFch/src/engine/achievements.ts): Yêu cầu bằng chứng sự kiện đồng thời `lastClickCombo >= 20` diễn ra khi đang sờ ếch bí mật (`mossy_frog` hoặc `lotus_guardian_frog`). Đảm bảo thưởng 1 lần duy nhất. |
| **B06** | Sai lệch tài nguyên và bản quyền ảnh ếch v2 (dùng code Pillow nhưng ghi nhãn Wikimedia) | Asset & Compliance (P1) | **PARTIAL** | **ĐÃ XỬ LÝ:** Minh bạch hóa nguồn gốc và phân loại ảnh trong [CREDITS.md](file:///d:/New%20folder/S%20%E1%BA%BFch/CREDITS.md) & [frogs.ts](file:///d:/New%20folder/S%20%E1%BA%BFch/src/data/frogs.ts), gắn nhãn `PLACEHOLDER` trung thực.<br>**CHƯA XỬ LÝ XONG:** Nội dung ảnh thực tế của 25 loài vẫn là ảnh vector do Pillow vẽ, chưa phải ảnh chụp sinh học thật tách nền đạt chuẩn. Cần thay thế theo Bảng Theo Dõi ở Mục 4. |
| **B07** | Bảng tỷ lệ Gacha không phản ánh trạng thái kích hoạt bảo đảm (Pity) của lượt kế tiếp | UI/UX & Transparency (P2) | **FIXED** | [GachaModal.tsx](file:///d:/New%20folder/S%20%E1%BA%BFch/src/components/GachaModal.tsx) & [gacha.ts](file:///d:/New%20folder/S%20%E1%BA%BFch/src/engine/gacha.ts): Bổ sung tab chuyển đổi "Tỉ Lệ Cơ Bản" và "Tỉ Lệ Lượt Tiếp Theo (Theo Pity)", hiển thị banner bảo đảm (Rare+, Epic+, Legendary+) và chú thích Rate-up x3, New Frog Priority x1.4. |
| **B08** | Lệch thời gian Combo Timeout giữa clicker engine (1800ms) và store tick (2000ms) | Logic & Feel (P2) | **FIXED** | Đồng bộ hằng số `COMBO_TIMEOUT_MS = 1800ms` vào `gameStore.ts`, loại bỏ 200ms "combo zombie". Kiểm chứng chéo 100% 18 nâng cấp có effect tương ứng trong clicker/idle. |
| **B09** | Mất cân bằng Pacing ban đầu do `first_touch` thưởng 100 điểm ngay sau 1 click | Economy Balance (P2) | **FIXED** | [achievements.ts](file:///d:/New%20folder/S%20%E1%BA%BFch/src/engine/achievements.ts): Cân chỉnh `first_touch` thưởng 20 điểm. Người chơi trải qua 20-30 clicks ban đầu tự nhiên để đạt nâng cấp đầu tiên. Mô phỏng 5 phong cách chơi không deadlock đến 24h. |

---

## 2. KẾT QUẢ KIỂM THỬ VÀ PRODUCTION BUILD

- **Tổng số Test Suites:** **11 / 11 passed (100%)**.
- **Tổng số Unit & Regression Tests:** **142 / 142 passed (100%)**:
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
  - `v3_regression.test.ts`: **14 tests passed (xác minh thực tế 8 kịch bản hồi quy bắt buộc)**.
- **Production Build:** `tsc && vite build` hoàn thành không có lỗi biên dịch TypeScript:
  - `dist/index.html`: 1.18 kB (gzip: 0.69 kB).
  - `dist/assets/index-DN2Bf6tz.css`: 56.84 kB (gzip: 9.67 kB).
  - `dist/assets/index-DEv2-taJ.js`: 338.21 kB (gzip: 95.95 kB).

---

## 3. KIỂM CHỨNG THỰC TẾ 8 KỊCH BẢN HỒI QUY BẮT BUỘC

Trong file test [src/engine/__tests__/v3_regression.test.ts](file:///d:/New%20folder/S%20%E1%BA%BFch/src/engine/__tests__/v3_regression.test.ts), 8 kịch bản nghiệp vụ thực tế được kiểm chứng nghiêm ngặt mà không nới lỏng hay sửa assertion sai lệch:

1. **Import Save v1 cũ:** Chuỗi lưu `SECH_SAVE_V1_` tạo bởi DJB2 checksum (seed 5381) nạp thành công, bảo toàn 100% điểm và ếch cũ, đồng thời tự động gán giá trị mặc định cho schema v2 (`favoriteFrogIds: []`, `gachaHistory: []`, `totalCrits: 0`, `totalGachaPulls: 0`).
2. **Chu kỳ Export $\rightarrow$ Reset $\rightarrow$ Import v2:** Dữ liệu xuất dạng `SECH_SAVE_V2_` được bảo toàn nguyên vẹn sau khi gọi `clearSavedGame()`.
3. **Bảo tồn Danh sách yêu thích và Lịch sử Gacha:** `favoriteFrogIds` và `gachaHistory` không còn bị phân mảnh ở key ngoài, được phục hồi đầy đủ khi import chuỗi save.
4. **Bộ đếm Crit và Gacha số liệu thật:** Người chơi click 150 lần nhưng `totalCrits = 0` tuyệt đối không được mở khóa thành tựu `crit_10`. Người chơi có nhiều mảnh nhưng `totalGachaPulls = 3` (< 10) tuyệt đối không được mở khóa `gacha_multi_pull`.
5. **Tính Idempotent của Phần thưởng Thành tựu:** Đánh giá lại thành tựu sau reload trang hoặc tick lặp lại trả về `newlyUnlockedIds: []` và `totalRewardsEarned: 0`, ngăn ngừa lạm phát điểm trùng lặp.
6. **Điều kiện đồng thời của Thành tựu Bí mật:** Người chơi cày combo 25 bằng `green_frog` rồi đổi sang `mossy_frog` mà không duy trì combo với chính ếch đó sẽ bị từ chối thành tựu `secret_ribbit_master`.
7. **Offline Checkpoint & An toàn Chuyển tab:** Chuyển tab nhanh (< 30s) không kích hoạt popup offline; thời gian offline chỉ được tính một lần duy nhất cho mỗi khoảng trôi qua; trần an toàn 8 giờ (`28,800s`) hoạt động chính xác (phần thưởng 10h và 24h bằng nhau).
8. **Khớp xác suất Gacha với Pity Bảo đảm:** Khi lượt tiếp theo chạm mốc Pity bảo đảm Rare/Epic/Legendary, tỷ lệ của các bậc thấp hơn tự động ép về đúng 0%, và phân bổ lại 100% cho các bậc hợp lệ.

---

## 4. BẢNG THEO DÕI 25 ẢNH PLACEHOLDER CẦN THAY THẾ (ACTION TRACKER CHO B06)

> [!WARNING]
> **Vấn đề B06 được phân loại là PARTIAL:** Bản v3.0 đã hoàn thành việc ghi nhận trung thực và loại bỏ mạo danh bản quyền Wikimedia trong code và tài liệu. Tuy nhiên, về mặt asset hình ảnh thực tế, **25 loài dưới đây hiện vẫn đang sử dụng ảnh vẽ vector tạm thời (Pillow script)** và CHƯA ĐẠT tiêu chuẩn ảnh chụp thật tách nền tự nhiên.

| STT | ID Loài (`frog_id`) & Tệp WebP | Tên Tiếng Việt | Tên Khoa Học | Phân Loại Hiện Tại | Nguồn Hợp Pháp Đề Xuất (Tham Khảo) | Giấy Phép Đề Xuất | Tình Trạng Tải Gốc | Tách Nền Alpha | Tiêu Chuẩn Kỹ Thuật | Trạng Thái Nghiệm Thu |
|:---:|:---|:---|:---|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| 1 | `australian_green_tree_frog.webp` | Ếch Cây Xanh Úc | *Ranoidea caerulea* | PLACEHOLDER | [Wikimedia Commons: LiquidGhoul](https://commons.wikimedia.org) | Public Domain | Chờ tải | Chờ tách nền | 512x512, Alpha > 50%, < 60KB | **CHƯA ĐẠT (Chờ asset thật)** |
| 2 | `gray_tree_frog.webp` | Ếch Cây Xám | *Dryophytes versicolor* | PLACEHOLDER | [Wikimedia Commons: Ltshears](https://commons.wikimedia.org) | CC BY-SA 3.0 | Chờ tải | Chờ tách nền | 512x512, Alpha > 50%, < 60KB | **CHƯA ĐẠT (Chờ asset thật)** |
| 3 | `wood_frog.webp` | Ếch Gỗ Bắc Mỹ | *Lithobates sylvaticus* | PLACEHOLDER | [Wikimedia Commons: Dave Huth](https://commons.wikimedia.org) | CC BY 2.0 | Chờ tải | Chờ tách nền | 512x512, Alpha > 50%, < 60KB | **CHƯA ĐẠT (Chờ asset thật)** |
| 4 | `marsh_frog.webp` | Ếch Đầm Lầy | *Pelophylax ridibundus* | PLACEHOLDER | [Wikimedia Commons: Marek Szczepanek](https://commons.wikimedia.org) | CC BY-SA 3.0 | Chờ tải | Chờ tách nền | 512x512, Alpha > 50%, < 60KB | **CHƯA ĐẠT (Chờ asset thật)** |
| 5 | `fire_bellied_toad.webp` | Cóc Bụng Lửa Đông Dương | *Bombina orientalis* | PLACEHOLDER | [Wikimedia Commons: Christian Fischer](https://commons.wikimedia.org) | CC BY-SA 3.0 | Chờ tải | Chờ tách nền | 512x512, Alpha > 50%, < 60KB | **CHƯA ĐẠT (Chờ asset thật)** |
| 6 | `amazon_milk_frog.webp` | Ếch Sữa Amazon | *Trachycephalus resinifictrix* | PLACEHOLDER | [Wikimedia Commons: H. Zell](https://commons.wikimedia.org) | CC BY-SA 3.0 | Chờ tải | Chờ tách nền | 512x512, Alpha > 50%, < 60KB | **CHƯA ĐẠT (Chờ asset thật)** |
| 7 | `white_lipped_tree_frog.webp` | Ếch Cây Môi Trắng | *Nyctimystes infrafrenatus* | PLACEHOLDER | [Wikimedia Commons: Benjamint444](https://commons.wikimedia.org) | GFDL / CC BY-SA | Chờ tải | Chờ tách nền | 512x512, Alpha > 50%, < 60KB | **CHƯA ĐẠT (Chờ asset thật)** |
| 8 | `african_bullfrog.webp` | Ếch Bò Châu Phi | *Pyxicephalus adspersus* | PLACEHOLDER | [Wikimedia Commons: Paul Cools](https://commons.wikimedia.org) | CC BY-SA 4.0 | Chờ tải | Chờ tách nền | 512x512, Alpha > 50%, < 60KB | **CHƯA ĐẠT (Chờ asset thật)** |
| 9 | `harlequin_toad.webp` | Cóc Chú Hề Biến Màu | *Atelopus varius* | PLACEHOLDER | [Wikimedia Commons: Brian Gratwicke](https://commons.wikimedia.org) | CC BY 2.0 | Chờ tải | Chờ tách nền | 512x512, Alpha > 50%, < 60KB | **CHƯA ĐẠT (Chờ asset thật)** |
| 10 | `goliath_frog.webp` | Ếch Khổng Lồ Goliath | *Conraua goliath* | PLACEHOLDER | [Wikimedia Commons: Benny Trapp](https://commons.wikimedia.org) | CC BY-SA 3.0 | Chờ tải | Chờ tách nền | 512x512, Alpha > 50%, < 60KB | **CHƯA ĐẠT (Chờ asset thật)** |
| 11 | `clown_tree_frog.webp` | Ếch Cây Hề Sarayacu | *Dendropsophus sarayacuensis* | PLACEHOLDER | [Wikimedia Commons: Geoff Gallice](https://commons.wikimedia.org) | CC BY 2.0 | Chờ tải | Chờ tách nền | 512x512, Alpha > 50%, < 60KB | **CHƯA ĐẠT (Chờ asset thật)** |
| 12 | `spotted_salamander_frog.webp` | Ếch Chạy Đốm Kassina | *Kassina senegalensis* | PLACEHOLDER | [Wikimedia Commons: Bernard DUPONT](https://commons.wikimedia.org) | CC BY-SA 2.0 | Chờ tải | Chờ tách nền | 512x512, Alpha > 50%, < 60KB | **CHƯA ĐẠT (Chờ asset thật)** |
| 13 | `ornate_horned_frog.webp` | Ếch Sừng Hoa Văn | *Ceratophrys ornata* | PLACEHOLDER | [Wikimedia Commons: Gerd A.T. Müller](https://commons.wikimedia.org) | CC BY-SA 3.0 | Chờ tải | Chờ tách nền | 512x512, Alpha > 50%, < 60KB | **CHƯA ĐẠT (Chờ asset thật)** |
| 14 | `strawberry_poison_frog.webp` | Ếch Phi Tiêu Dâu Tây | *Oophaga pumilio* | PLACEHOLDER | [Wikimedia Commons: Arturo de Frias](https://commons.wikimedia.org) | CC BY-SA 4.0 | Chờ tải | Chờ tách nền | 512x512, Alpha > 50%, < 60KB | **CHƯA ĐẠT (Chờ asset thật)** |
| 15 | `yellow_banded_poison_frog.webp` | Ếch Phi Tiêu Vàng Đen | *Dendrobates leucomelas* | PLACEHOLDER | [Wikimedia Commons: H. Zell](https://commons.wikimedia.org) | CC BY-SA 3.0 | Chờ tải | Chờ tách nền | 512x512, Alpha > 50%, < 60KB | **CHƯA ĐẠT (Chờ asset thật)** |
| 16 | `giant_monkey_frog.webp` | Ếch Khỉ Khổng Lồ | *Phyllomedusa bicolor* | PLACEHOLDER | [Wikimedia Commons: Tim Vickers](https://commons.wikimedia.org) | Public Domain | Chờ tải | Chờ tách nền | 512x512, Alpha > 50%, < 60KB | **CHƯA ĐẠT (Chờ asset thật)** |
| 17 | `tiger_leg_monkey_frog.webp` | Ếch Khỉ Chân Hổ | *Phyllomedusa hypochondrialis* | PLACEHOLDER | [Wikimedia Commons: Vassil](https://commons.wikimedia.org) | CC0 / Public Domain | Chờ tải | Chờ tách nền | 512x512, Alpha > 50%, < 60KB | **CHƯA ĐẠT (Chờ asset thật)** |
| 18 | `splendid_leaf_frog.webp` | Ếch Lá Lộng Lẫy | *Cruziohyla calcarifer* | PLACEHOLDER | [Wikimedia Commons: Brian Gratwicke](https://commons.wikimedia.org) | CC BY 2.0 | Chờ tải | Chờ tách nền | 512x512, Alpha > 50%, < 60KB | **CHƯA ĐẠT (Chờ asset thật)** |
| 19 | `borneo_eared_frog.webp` | Ếch Tai Borneo | *Polypedates otilophus* | PLACEHOLDER | [Wikimedia Commons: Chien C. Lee](https://commons.wikimedia.org) | CC BY-SA 4.0 | Chờ tải | Chờ tách nền | 512x512, Alpha > 50%, < 60KB | **CHƯA ĐẠT (Chờ asset thật)** |
| 20 | `wallace_flying_frog.webp` | Ếch Bay Wallace | *Rhacophorus nigropalmatus* | PLACEHOLDER | [Wikimedia Commons: Tim Laman](https://commons.wikimedia.org) | CC BY-SA 4.0 | Chờ tải | Chờ tách nền | 512x512, Alpha > 50%, < 60KB | **CHƯA ĐẠT (Chờ asset thật)** |
| 21 | `black_rain_frog.webp` | Ếch Mưa Đen Hắc Ám | *Breviceps fuscus* | PLACEHOLDER | [Wikimedia Commons: Alan Manson](https://commons.wikimedia.org) | CC BY-SA 4.0 | Chờ tải | Chờ tách nền | 512x512, Alpha > 50%, < 60KB | **CHƯA ĐẠT (Chờ asset thật)** |
| 22 | `granular_poison_frog.webp` | Ếch Phi Tiêu Hạt Sần | *Oophaga granulifera* | PLACEHOLDER | [Wikimedia Commons: Brian Gratwicke](https://commons.wikimedia.org) | CC BY 2.0 | Chờ tải | Chờ tách nền | 512x512, Alpha > 50%, < 60KB | **CHƯA ĐẠT (Chờ asset thật)** |
| 23 | `malayan_horned_frog.webp` | Ếch Sừng Mã Lai | *Megophrys nasuta* | PLACEHOLDER | [Wikimedia Commons: Bernard Dupont](https://commons.wikimedia.org) | CC BY-SA 2.0 | Chờ tải | Chờ tách nền | 512x512, Alpha > 50%, < 60KB | **CHƯA ĐẠT (Chờ asset thật)** |
| 24 | `phoenix_frog.webp` | Ếch Phượng Hoàng Lửa | *Sinh vật Thần Thoại (Mythic Lore)* | PLACEHOLDER_MYTHIC | Sáng tác đồ họa nghệ thuật phái sinh | CC BY-SA 4.0 Derivative | Chờ thiết kế | Chờ tách nền | 512x512, Alpha > 50%, < 60KB | **CHƯA ĐẠT (Chờ asset mythic thật)** |
| 25 | `chronos_frog.webp` | Ếch Thời Gian Vĩnh Cửu | *Sinh vật Thần Thoại (Mythic Lore)* | PLACEHOLDER_MYTHIC | Sáng tác đồ họa nghệ thuật phái sinh | CC BY-SA 4.0 Derivative | Chờ thiết kế | Chờ tách nền | 512x512, Alpha > 50%, < 60KB | **CHƯA ĐẠT (Chờ asset mythic thật)** |

---

## 5. PHÂN ĐỊNH RANH GIỚI VÀ GIỚI HẠN PHỤC VỤ CODE REVIEW ĐỘC LẬP

Để phục vụ quá trình Code Review khách quan và minh bạch, nhóm phát triển tuyên bố rõ:

### A. Những gì ĐÃ HOÀN THÀNH và CÓ BẰNG CHỨNG KIỂM THỬ:
- Đã khắc phục 8/9 vấn đề kỹ thuật cốt lõi (B01, B02, B03, B04, B05, B07, B08, B09).
- Bổ sung 14 bài test hồi quy thực tế trong `v3_regression.test.ts`.
- 100% test suites (142 unit & regression tests) chạy thành công không có test nào bị vô hiệu hóa (`skip` hay `todo`).
- Production build sạch lỗi `tsc && vite build`.

### B. Những gì MỚI ĐƯỢC XỬ LÝ MỘT PHẦN (PARTIAL):
- **Vấn đề B06 (Tài nguyên ảnh):** Đã phân loại và ghi nhận nguồn gốc trung thực trong `CREDITS.md` và `frogs.ts`, nhưng **25 asset ảnh WebP vẫn là hình vẽ vector Pillow**, chưa có ảnh chụp tự nhiên tách nền.

### C. Giới hạn của Môi trường Kiểm Thử (Test Environment Limitations):
- **Web Audio:** Chạy trên môi trường Node.js/jsdom nên các giao diện `AudioContext`, `OscillatorNode`, `GainNode` được mock giả lập tần số và thời gian, chưa thể nghe thực tế âm thanh phát qua màng loa phần cứng.
- **Background Tab Throttling thực tế:** Trình duyệt thực tế (Chrome, Edge, Firefox) trên Windows/macOS có thể đóng băng hoặc giảm tần số `setInterval` xuống 1 lần/phút hoặc suspend tab khi hết RAM. Kiểm thử hiện tại mô phỏng chênh lệch delta thời gian (`calculateOfflineReward`), nhưng việc kiểm thử hành vi thực tế của OS memory compressor cần sự quan sát trực tiếp trên browser thật.

### D. Thông Tin Git & Đường Dẫn Repository:
- **Repository URL:** [https://github.com/ngoctuls2005-dev/S_ECH.git](https://github.com/ngoctuls2005-dev/S_ECH.git)
- **Nhánh triển khai (Branch):** [`fix/v2-quality-recovery`](https://github.com/ngoctuls2005-dev/S_ECH/tree/fix/v2-quality-recovery)
- **Trạng thái nhánh:** Đã push lên GitHub remote, **tuyệt đối KHÔNG tự ý merge vào `main`**, sẵn sàng để tạo Pull Request và Code Review độc lập.
- **Commit SHA cơ sở:** `96b910ca28a2c38f1cc30874f59830da5a93896a`
- **Tệp báo cáo trong repo:** [V3_DEEP_AUDIT_AND_FIX_REPORT.md](file:///d:/New%20folder/S%20%E1%BA%BFch/V3_DEEP_AUDIT_AND_FIX_REPORT.md)
