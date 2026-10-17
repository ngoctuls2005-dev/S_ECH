# BÁO CÁO THIẾT LẬP BASELINE KIỂM TOÁN VÀ KHÔI PHỤC CHẤT LƯỢNG V3.0
**Dự án:** S ếch (Web Game Idle Clicker + Gacha + Frog Collection)  
**Thời điểm lập:** 2026-10-16  
**Chi nhánh Git đang thực hiện:** `fix/v2-quality-recovery`  
**Commit SHA gốc (HEAD ban đầu):** `96b910ca28a2c38f1cc30874f59830da5a93896a`

---

## 1. THÔNG SỐ VÀ TRẠNG THÁI HIỆN TẠI

- **Git Status:** Sạch sẽ (`working tree clean`), không có uncommitted changes.
- **Git Branch:** Đã tạo và chuyển sang nhánh riêng `fix/v2-quality-recovery` từ HEAD `96b910ca28a2c38f1cc30874f59830da5a93896a`.
- **Tổng số Test Suites:** 10 / 10 passed.
- **Tổng số Unit Tests:** 105 / 105 passed.
- **Trạng thái Build:** `tsc && vite build` hoàn thành trong 3.88s, không có cảnh báo/lỗi biên dịch TypeScript.

---

## 2. HẠN CHẾ CỦA MÔI TRƯỜNG THỰC THI

1. **Hệ điều hành:** Windows (PowerShell shell, đường dẫn phân cách `\`).
2. **Web Audio & DOM Context:** Môi trường Node.js / Vitest chạy jsdom, các API như `AudioContext`, `requestAnimationFrame` và Page Visibility API chạy giả lập (mocked).
3. **Thao tác Headless Browser:** Việc kiểm tra native tab background throttling trên browser thực tế phụ thuộc vào cơ chế tiết kiệm tài nguyên của OS và trình duyệt, cần kết hợp cả kiểm thử tự động giả lập clock và kiểm tra giao diện bằng browser subagent.

---

## 3. DANH SÁCH LỖI VÀ SAI LỆCH XÁC MINH BAN ĐẦU

### A. Lỗi có thể tái hiện bằng Test (Reproducible Bugs)
1. **Lỗi Checksum Save v1/v2:**
   - `save.ts` v2 sử dụng thuật toán hash bắt đầu từ 0 (`hash = (hash << 5) - hash + char; hash |= 0;`), trong khi bản v1 sử dụng thuật toán DJB2 với seed 5381.
   - Khi import một chuỗi save v1 thực tế (`SECH_SAVE_V1_...`), hàm kiểm tra checksum của v2 tính lại theo thuật toán mới dẫn đến mismatch $\rightarrow$ người chơi cũ bị từ chối file save hợp lệ.
2. **Lỗi ID Nâng cấp sai trong Thành tựu:**
   - Thành tựu `upgrade_magic_finger_10` kiểm tra `ctx.upgrades['magic_finger'] >= 10`.
   - Trong `UPGRADES_CONFIG`, ID nâng cấp chính xác là `divine_finger`. Do đó, người chơi nâng cấp `divine_finger` lên cấp 10 trong game thực tế sẽ không bao giờ nhận được thành tựu này. Bài test cũ truyền mock object `{ magic_finger: 10 }` nên test vẫn pass dù logic game sai.
3. **Lỗi Đếm Số lần Chí mạng (Crits) bằng Ước lượng:**
   - Trong `achievements.ts`, bộ đếm crit đang sử dụng: `ctx.totalCrits || Math.floor(ctx.totalClicks * 0.1)`.
   - Điều này dẫn đến việc người chơi click 100 lần không có lần nào nổ crit vẫn bị tự động tính là 10 crits và mở khóa thành tựu. Ngược lại, nếu người chơi có 0 crits thực sự, toán tử `||` sẽ ép lấy ước tính 10%.
4. **Lỗi Đếm Số lượt Gacha bằng Ước lượng:**
   - Bộ đếm lượt Gacha cho các mốc 10 và 100 lượt đang ước lượng từ số loài và mảnh sở hữu thay vì theo dõi `totalGachaPulls` thực tế.
5. **Lỗi Thành tựu Bí mật `secret_ribbit_master`:**
   - Chỉ kiểm tra `mainFrogId` hiện tại và `highestCombo >= 20` trong quá khứ. Người chơi có thể dùng ếch thường cày combo lên 20, sau đó đổi sang ếch bí mật là nhận ngay thành tựu mà không cần đạt combo cùng ếch đó.

### B. Lỗi phát hiện bằng Phân tích Tĩnh (Static Analysis)
1. **Phân mảnh Nguồn Lưu Trữ (State Fragmentation):**
   - `CollectionModal.tsx` lưu danh sách ếch yêu thích vào key riêng `s_ech_favorite_frogs`.
   - `gameStore.ts` lưu lịch sử quay vào key riêng `s_ech_gacha_history`.
   - Hai key này không được tích hợp đồng bộ vào cơ chế Save/Load/Export/Import/Reset chính, gây mất dữ liệu khi chuyển thiết bị hoặc reset không sạch.
2. **Sai lệch Tài nguyên Ảnh ếch (Frog Assets Integrity):**
   - 25 ảnh ếch bổ sung trong đợt v2 được tạo bằng script `generate_v2_frog_assets.py` sử dụng thư viện Python Pillow vẽ hình học (ellipse, polygon).
   - Tuy nhiên, `src/data/frogs.ts` lại ghi công tác giả Wikimedia Commons và README mô tả như ảnh chụp thật tách nền. Cần phân loại rõ ràng, trung thực và cập nhật tài liệu chính xác.
3. **Mất cân bằng Pacing Ban đầu (Economic Imbalance):**
   - Thành tựu `first_touch` thưởng ngay 100 điểm sau cú click đầu tiên, trong khi nâng cấp đầu tiên chỉ có giá 50 điểm (`divine_finger`) và 100 điểm (`frog_machine`), làm mất giai đoạn trải nghiệm tích lũy 1-2 phút đầu của thể loại clicker.
4. **Bảng Tỷ lệ Gacha không phản ánh Trạng thái Pity:**
   - `getSpeciesDropRates` chỉ tính tỷ lệ cơ bản tĩnh, không nhận tham số Pity hiện tại để hiển thị cho người chơi biết lượt quay tiếp theo có được bảo đảm tỷ lệ độ hiếm cao hay không.

---

## 4. DANH SÁCH RỦI RO ẢNH HƯỞNG DỮ LIỆU NGƯỜI CHƠI

1. **Rủi ro mất dữ liệu save v1:** Nếu không hỗ trợ checksum v1, người chơi cũ cập nhật lên v3 sẽ không thể import save cũ.
2. **Rủi ro desync localStorage:** Việc reset hoặc load save không xóa các key legacy `s_ech_favorite_frogs` và `s_ech_gacha_history` có thể gây lẫn lộn dữ liệu giữa các phiên chơi.
3. **Rủi ro lạm phát điểm / nhận thưởng trùng:** Nếu việc kiểm tra thành tựu được kích hoạt lại khi reload/import mà không đánh dấu cờ đã nhận thưởng, người chơi có thể nhận điểm thưởng nhiều lần.

---

## 5. KẾ HOẠCH BẢO VỆ VÀ PHỤC HỒI

- Tuyệt đối không xóa bỏ các trường dữ liệu của save cũ.
- Áp dụng migration tự động với giá trị mặc định rõ ràng cho các trường mới (`totalCrits`, `totalGachaPulls`, `favoriteFrogIds`, `gachaHistory`).
- Mọi thay đổi đều được kiểm chứng bằng unit test và test hồi quy trước khi chuyển task.
