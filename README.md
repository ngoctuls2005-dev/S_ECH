# S ẾCH 🐸 — Web Game Idle Clicker + Gacha Ao Sen v3.0 (Deep Audit & Quality Recovery)

Chào mừng bạn đến với **S ẾCH v3.0** — phiên bản khôi phục chất lượng chuyên sâu, chuẩn hóa dữ liệu, cân bằng kinh tế và kiểm chứng toàn diện cho trò chơi web game kết hợp giữa phong cách **Idle Clicker**, **Gacha Ấp Trứng** và **Bộ Sưu Tập 40 Loài Ếch** trong không gian ao sen yên bình, ấm cúng và tràn ngập niềm vui!

---

## 🚀 Điểm Nhấn Bản Phục Hồi Chất Lượng Chuyên Sâu v3.0

| Hạng Mục | Trạng Thái Trước Kiểm Toán | Nâng Cấp Hoàn Thiện v3.0 | Lợi Ích & Bảo Đảm |
| :--- | :--- | :--- | :--- |
| 💾 **Hệ Thống Lưu Trữ** | Checksum sai lệch giữa v1 và v2; phân mảnh localStorage (`s_ech_favorite_frogs`, `s_ech_gacha_history`). | Thống nhất dữ liệu vào 1 nguồn Save State v2; Checksum tự động nhận diện version (DJB2 cho v1, 32-bit hash cho v2); Dọn sạch toàn bộ legacy keys khi Reset. | Tương thích ngược 100% không mất dữ liệu người chơi cũ; đồng bộ hoàn hảo khi Export/Import chuỗi Save Base64. |
| 🏆 **Hệ Thống Thành Tựu** | Đếm chí mạng (crit) và lượt quay Gacha bằng ước lượng `Math.floor`; Sai ID nâng cấp `magic_finger` thay vì `divine_finger`; Lỗi logic combo bí mật. | Theo dõi chỉ số thực tế `totalCrits` và `totalGachaPulls`; Sửa chuẩn ID `divine_finger` trong `upgrade_magic_finger_10`; Kiểm tra đồng thời sự kiện combo với ếch bí mật; Thưởng điểm duy nhất 1 lần. | Loại bỏ hoàn toàn gian lận vô thức và thành tựu không thể mở khóa; bảo đảm độ chính xác của bảng thành tựu. |
| 🖼️ **Tài Nguyên Ảnh Ếch** | Mô tả không chính xác về nguồn gốc của 25 loài thêm mới v2 (vốn được tạo từ script vector Python Pillow). | Phân loại rõ ràng 40 ảnh WebP trong `CREDITS.md`: 12 loài thật tách nền Wikimedia, 3 loài Mythic phái sinh chất lượng cao, 25 loài vẽ vector minh họa có gắn cờ `PLACEHOLDER` trung thực. | Minh bạch bản quyền tác giả Wikimedia Commons và chuẩn hóa danh pháp sinh học không giả mạo loài hư cấu. |
| 🥚 **Minh Bạch Tỉ Lệ Gacha** | Chỉ hiển thị tỉ lệ cơ bản tĩnh, không phản ánh trạng thái kích hoạt bảo đảm (Pity) của lượt kế tiếp. | Bổ sung tab chuyển đổi "Tỉ Lệ Cơ Bản" vs "Tỉ Lệ Lượt Tiếp Theo (Theo Pity)"; Hiển thị trực quan banner bảo đảm (Rare+, Epic+, Legendary+); Chú thích Rate-up x3 và Ưu tiên loài mới x1.4. | Người chơi nắm bắt chính xác 100% cơ hội rơi của từng loài theo đúng quy tắc Gacha minh bạch. |
| ⏱️ **Combo & Nâng Cấp** | Bất đồng bộ thời gian combo timeout (1800ms vs 2000ms), tạo hiện tượng 200ms "combo zombie". | Đồng bộ hằng số `COMBO_TIMEOUT_MS = 1800ms` xuyên suốt Clicker Engine và GameStore tick; Kiểm chứng chéo 100% 18 nâng cấp liên kết hiệu ứng Click/Idle thật. | Cảm giác sờ ếch nhất quán, nhạy bén và không có nâng cấp "rác" hay ID giả. |
| ⚖️ **Cân Bằng Kinh Tế & Pacing** | Nhận 100 điểm ngay cú click đầu tiên từ `first_touch`, bỏ qua trải nghiệm tích lũy đầu game. | Cân chỉnh phần thưởng `first_touch` về 20 điểm; Người chơi trải nghiệm 20-30 clicks tự nhiên để đạt nâng cấp đầu tiên; Mô phỏng 5 phong cách chơi (Click, Idle, Hybrid, Gacha, Optimizer) từ 1 phút đến 24 giờ không deadlock. | Giữ trọn vẹn nhịp độ (pacing) kinh điển của dòng game Idle Clicker; an toàn số lớn và trần offline 8h hoạt động chuẩn xác. |

---

## 🌟 Các Hệ Thống Cốt Lõi Chi Tiết

### 1. Cơ Chế Sờ Ếch & Combo Bùng Nổ (Squishy Clicker Engine)
- Tương tác chạm/click với hiệu ứng co giãn mượt mà (Squash & Stretch).
- **Combo Milestones**: Đạt các mốc 5, 10, 20, 50 liên hoàn kích hoạt âm thanh Web Audio riêng biệt và huy hiệu hiệu ứng thị giác rực rỡ.
- Đòn **Chí Mạng (Critical Touch)** phóng to điểm số kèm hiệu ứng ánh sáng.
- Điểm thưởng bay lên (Floating numbers) tại chính xác vị trí chạm chuột hoặc ngón tay.
- Tự động ngắt combo chính xác sau **1.800ms** không click.

### 2. Bộ Sưu Tập 40 Loài Ếch & Cân Bằng Buff Bị Động
- Toàn bộ 40 loài ếch sở hữu ảnh minh họa WebP tách nền chất lượng cao, tên tiếng Việt, tên khoa học, mô tả hài hước và hiệu ứng buff độc nhất:
  - **8 Thường (Common)**: Ếch Xanh, Ếch Nâu, Ếch Cây Châu Âu, Ếch Cây Xanh Úc, Ếch Cây Xám, Ếch Gỗ Bắc Mỹ, Ếch Đầm Lầy Âu Á, Cóc Bụng Lửa.
  - **10 Hiếm (Rare)**: Ếch Mắt Đỏ, Ếch Cà Chua, Ếch Mưa Bụi Rậm, Ếch Sữa Amazon, Ếch Cây Môi Trắng, Ếch Bò Châu Phi, Cóc Hề Costa Rica, Ếch Khổng Lồ Goliath, Ếch Cây Chú Hề, Ếch Đốm Báo.
  - **11 Sử Thi (Epic)**: Ếch Pacman, Ếch Phi Tiêu Độc Xanh, Ếch Thủy Tinh Ngọc Lục Bảo (*Centrolene prosoblepon*), Ếch Rêu Việt Nam (*Theloderma corticale*), Ếch Sừng Hoa Văn, Ếch Phi Tiêu Dâu Tây, Ếch Phi Tiêu Vàng Đen, Ếch Lá Khổng Lồ, Ếch Lá Chân Hổ, Ếch Lá Rực Rỡ, Ếch Tai Bờm Borneo.
  - **6 Huyền Thoại (Legendary)**: Ếch Vàng Panama, Ếch Phi Tiêu Độc Vàng, Ếch Bay Wallace, Ếch Mưa Đen Hắc Ám, Ếch Phi Tiêu Sần Granular, Ếch Sừng Lá Mã Lai.
  - **5 Thần Thoại (Mythic)**: Ếch Vua Vương Giả, Ếch Ngân Hà Vũ Trụ, Ếch Thần Ao Sen, Ếch Phượng Hoàng Lửa, Ếch Thời Gian Vĩnh Cửu.
- **Quy tắc cân bằng Buff**: Ếch chính hưởng 100% buff, các ếch phụ nhận 20% passive collection buff. Khi mở rộng lên 40 loài, cơ chế **Soft-cap Diminishing Returns** tự động kích hoạt bảo vệ an toàn chỉ số (tổng giảm giá không vượt quá 70%, tỉ lệ chí mạng không vượt quá 95%).
- **Giao diện bộ sưu tập**: Tìm kiếm tên realtime, lọc theo 6 loại buff, sắp xếp theo độ hiếm/level/tên, đánh dấu ếch yêu thích ⭐ (được lưu đồng bộ trong file Save State), xem trước chênh lệch Click Power và PPS khi đổi ếch chính.

### 3. Cửa Hàng 18 Nâng Cấp Kinh Tế
1. Ngón tay thần (+1/click)
2. Găng tay mềm mại (+5/click)
3. Máy sờ ếch (+1/giây)
4. Đội sờ ếch (+10/giây)
5. Bàn tay may mắn (+1% crit)
6. Combo ếch (Tăng thưởng combo)
7. Nhà máy sờ ếch (+100/giây)
8. Phép thuật ếch (+10% tổng điểm)
9. Bàn tay bạch kim (+100/click)
10. Băng chuyền sờ ếch (+500/giây)
11. Thuật sờ chuẩn xác (+2% crit)
12. Dấu tay huyền thoại (+500/click)
13. Robot sờ ếch (+2.500/giây)
14. Luyện sờ chí mạng (+0.15 hệ số crit)
15. Trại sờ ếch (+12.000/giây)
16. Bàn tay vũ trụ (+3.000/click)
17. Tập đoàn sờ ếch (+80.000/giây)
18. Thánh địa sờ ếch (+300.000/giây)
- Hỗ trợ mua linh hoạt x1, x10, MAX; lọc theo danh mục Click / Idle / Đặc biệt; hiển thị ước tính thời gian tích lũy điểm ở PPS hiện tại.

### 4. Hệ Thống 3 Hồ Gacha & Bảng Tỉ Lệ Minh Bạch
- **Hồ Ao Sen**: Pool thường trực cân bằng toàn bộ 40 loài.
- **Hồ Rừng Mưa**: Tăng mạnh trọng số rơi các loài nhiệt đới & rừng mưa Amazon.
- **Hồ Đêm Trăng**: Tập trung các loài bóng đêm, huyền bí và biến thể Thần Thoại.
- **Dùng chung bảo hiểm Pity**: Đảm bảo tối thiểu Rare sau 10 lượt, Epic sau 30 lượt, Legendary sau 100 lượt.
- **Bảng tỉ lệ trực quan**: Chuyển đổi giữa Tỉ lệ Cơ bản và Tỉ lệ Lượt tiếp theo có tính Pity; lưu lịch sử 20 lượt quay gần nhất trực tiếp trong save state; chế độ xem nhanh 10 lượt tức thì.

### 5. Hệ Thống 40 Thành Tựu & Phần Thưởng Minh Bạch
- 40 cột mốc thử thách phong phú (Cú sờ, Chuỗi combo, Chí mạng, Điểm số, Nâng cấp, Hồ Gacha, Bộ sưu tập và Thành tựu bí mật).
- Tự động cộng phần thưởng điểm sờ ếch trực tiếp khi mở khóa thành tựu và bảo đảm chỉ nhận thưởng đúng 1 lần duy nhất.
- Đã khắc phục triệt để lỗi đếm ước lượng số lần crit và lượt gacha.

### 6. Lưu Trữ Game Save V2 An Toàn & Toàn Vẹn
- Tự động lưu mỗi 5 giây vào LocalStorage.
- Nhận diện và hỗ trợ song song thuật toán Checksum DJB2 (v1) và Hash 32-bit (v2), cho phép import mọi bản save từ trước tới nay.
- Tích hợp toàn diện `favoriteFrogIds`, `gachaHistory`, `highestCombo`, `totalCrits`, `totalGachaPulls`.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend Core**: React 18, TypeScript, Vite 6
- **Styling**: TailwindCSS, Lucide React Icons
- **State Management**: Zustand
- **Audio Engine**: Web Audio API (0-latency, 100% client-side synthesis)
- **Testing & QA**: Vitest 3.2.7 (**128 unit & balance tests passing 100% trên 10 test files**)

---

## 📦 Hướng Dẫn Cài Đặt & Chạy Cục Bộ

```bash
# Clone repository
git clone https://github.com/ngoctuls2005-dev/S_ECH.git
cd S_ECH

# Chuyển sang nhánh khôi phục chất lượng chuyên sâu v3.0
git checkout fix/v2-quality-recovery

# Cài đặt thư viện dependencies
npm install

# Khởi chạy server phát triển
npm run dev

# Chạy toàn bộ kiểm thử tự động (128 tests)
npm test

# Build phiên bản production
npm run build
```

---

## 📄 Bản Quyền & Giấy Phép

Dự án được xây dựng phục vụ mục đích giải trí và giáo dục phi thương mại. Toàn bộ thông tin nguồn gốc ảnh thực tế từ Wikimedia Commons (giấy phép CC BY, CC BY-SA, Public Domain) và trạng thái tài nguyên của 40 loài ếch được lưu giữ minh bạch và chi tiết tại [CREDITS.md](CREDITS.md).
