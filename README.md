# S ẾCH 🐸 — Web Game Idle Clicker + Gacha Ao Sen Thư Giãn

Chào mừng bạn đến với **S ẾCH** — trò chơi web game kết hợp giữa phong cách **Idle Clicker**, **Gacha Ấp Trứng** và **Bộ Sưu Tập 15 Loài Ếch Thực Tế** trong không gian ao sen yên bình và hài hước!

---

## 🌟 Điểm Nổi Bật

1. **Cơ Chế Sờ Ếch Đã Tay (Squishy Clicker Engine)**:
   - Tương tác chạm/click với hiệu ứng co giãn tự nhiên (Squash & Stretch).
   - Chuỗi Combo bùng nổ gia tăng hệ số nhân điểm thưởng.
   - Cú đánh Chí Mạng (Critical Touch) rực rỡ với âm thanh và số điểm phóng to.
   - Số điểm bay lên (Floating point numbers) trực tiếp tại vị trí chạm chuột/ngón tay.

2. **Hệ Thống 8 Nâng Cấp Kỹ Năng Đa Dạng**:
   - *Ngón tay thần* (+1 điểm/click)
   - *Găng tay mềm mại* (+5 điểm/click)
   - *Máy sờ ếch* (+1 điểm/giây)
   - *Đội sờ ếch* (+10 điểm/giây)
   - *Bàn tay may mắn* (+1% chí mạng)
   - *Combo ếch* (Tăng thưởng chuỗi combo)
   - *Nhà máy sờ ếch* (+100 điểm/giây)
   - *Phép thuật ếch* (+10% tổng điểm nhận)
   - Hỗ trợ chế độ mua linh hoạt: **x1**, **x10**, và **MAX** (tính toán chính xác theo ngân sách).

3. **15 Loài Ếch Thực Tế Tách Nền Chuẩn WebP**:
   - Sử dụng ảnh các loài ếch thật từ **Wikimedia Commons** (CC BY, CC BY-SA, Public Domain), tách nền trong suốt bằng thị giác máy tính OpenCV GrabCut.
   - Bao gồm đặc sản Việt Nam: **Ếch Rêu Việt Nam** (*Theloderma corticale*), cùng các loài nổi tiếng như Ếch Mắt Đỏ, Ếch Cà Chua, Ếch Pacman, Ếch Phi Tiêu Độc, Ếch Vàng Panama, Ếch Thần Thoại...
   - Toàn bộ ghi công và giấy phép được lưu minh bạch tại [CREDITS.md](CREDITS.md).

4. **Hồ Gacha & Cơ Chế Bảo Hiểm (Pity Mechanism)**:
   - Quay 1 lượt (500 điểm) và 10 lượt (5.000 điểm).
   - Tỉ lệ công khai minh bạch:
     - Thường (Common): 50%
     - Hiếm (Rare): 28%
     - Sử Thi (Epic): 15%
     - Huyền Thoại (Legendary): 6%
     - Thần Thoại (Mythic): 1%
   - Bảo hiểm kép: Đảm bảo ít nhất 1 Rare sau mỗi 10 lượt, Epic sau mỗi 30 lượt, Legendary sau mỗi 100 lượt.
   - Cơ chế trùng: Tự động chuyển đổi ếch trùng thành **Mảnh Ếch (Fragments)** để thăng cấp (+25% hiệu quả buff mỗi cấp).

5. **Hệ Thống Thu Nhập Tự Động & Offline Earnings**:
   - Tích lũy điểm theo delta time chính xác, không phụ thuộc FPS hay render.
   - Nhận 50% thu nhập tự động khi đóng game hoặc tắt máy (tối đa 8 giờ vắng mặt).

6. **Âm Thanh Web Audio Synthesizer 0-Latency**:
   - Tự động tạo âm thanh trực tiếp bằng Web Audio API (tiếng ộp ộp của ếch, tiếng bubble pop, tiếng chuông mua đồ, tiếng nứt trứng, tiếng fanfare thắng lớn).
   - Chạy 100% offline, không phụ thuộc server mạng ngoài.

7. **Lưu Trữ & Khôi Phục Dữ Liệu An Toàn**:
   - Tự động lưu trữ định kỳ mỗi 5 giây và khi đóng tab (`beforeunload`).
   - Hỗ trợ **Export Mã Lưu (Base64)** để backup hoặc chuyển thiết bị.
   - Hỗ trợ **Import** có bộ lọc validate an toàn chống corrupt dữ liệu.
   - Reset dữ liệu với hộp thoại xác nhận an toàn.

8. **Giao Diện Responsive Di Động (Cozy Frog Pond)**:
   - Màu sắc xanh lá thiên nhiên, pastel kem, ánh sáng dịu mắt.
   - Thanh điều hướng ngón tay cái dưới đáy màn hình (Bottom Navigation Bar) cho mobile.
   - `touch-action: manipulation` chống trễ 300ms và không bị zoom ngoài ý muốn khi chạm nhanh.
   - Hỗ trợ chế độ `prefers-reduced-motion`.

---

## 🛠 Công Nghệ Sử Dụng

- **Frontend**: React 18, TypeScript, Vite 6
- **Styling**: Tailwind CSS, CSS Animations, Keyframes
- **State Management**: Zustand 5
- **Audio**: Web Audio API Sound Synthesizer
- **Icons**: Lucide React
- **Celebration Effects**: Canvas Confetti
- **Testing**: Vitest 3

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Local

### 1. Cài đặt dependencies:
```bash
npm install
```

### 2. Khởi chạy môi trường phát triển (Dev Server):
```bash
npm run dev
```
Mở trình duyệt tại địa chỉ `http://localhost:5173` để bắt đầu chơi!

### 3. Chạy toàn bộ Unit Tests & Balance Simulations:
```bash
npm test
```

### 4. Đóng gói sản phẩm (Build Production):
```bash
npm run build
```
File đóng gói sẵn sàng triển khai sẽ nằm tại thư mục `dist/`.

---

## 🌐 Hướng Dẫn Triển Khai (Deploy)

### Triển khai lên Vercel:
1. Đẩy mã nguồn lên GitHub.
2. Đăng nhập Vercel và chọn **Import Project**.
3. Chọn Framework Preset: **Vite**.
4. Bấm **Deploy**.

### Triển khai lên Cloudflare Pages:
1. Kết nối kho lưu trữ GitHub với Cloudflare Pages.
2. Build command: `npm run build`
3. Build output directory: `dist`
4. Bấm **Save and Deploy**.

---

## 📜 Giấy Phép & Ghi Công

- Mã nguồn trò chơi được phát hành theo giấy phép **MIT**.
- Tài nguyên hình ảnh các loài ếch thực tế thuộc bản quyền của các tác giả trên Wikimedia Commons theo các giấy phép Creative Commons tương ứng. Chi tiết tra cứu tại [CREDITS.md](CREDITS.md).
