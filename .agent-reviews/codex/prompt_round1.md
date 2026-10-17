Bạn là independent senior code reviewer và technical consultant cho dự án Web Game S Ếch.
Repository: D:\New folder\S ếch
Nhánh hiện tại: fix/v2-quality-recovery
Commit HEAD: 74c8a7a

Hãy kiểm tra mã nguồn thực tế trong workspace và đưa ra đánh giá độc lập về 3 vấn đề kỹ thuật sau:

---
### VẤN ĐỀ 1: [Task C01] Import Save và Xử lý Lỗi LocalStorage
- **File**: `src/store/gameStore.ts` (hàm `importSave`) và `src/engine/save.ts` (hàm `saveGameStateToStorage`).
- **Hiện trạng code**:
  Trong `gameStore.ts`, action `importSave(code)` thực hiện:
  1. Giải mã và validate `importSaveFromString(code)`.
  2. Nạp dữ liệu vào Zustand state qua `set(...)`.
  3. Gọi `saveGameStateToStorage(saveData)`.
  Tuy nhiên, `saveGameStateToStorage()` trả về boolean (`true` nếu lưu thành công, `false` nếu QuotaExceededError hoặc lỗi Storage). Hiện tại `importSave` hoàn toàn bỏ qua giá trị trả về này!
- **Hậu quả**: Nếu storage đầy hoặc bị chặn (private browsing), UI chuyển sang dữ liệu mới trong RAM nhưng đĩa không lưu. Khi người chơi F5/reload, tiến trình mới nhập biến mất hoặc quay lại save cũ.
- **Yêu cầu Codex phân tích**:
  1. Nếu `saveGameStateToStorage` trả về `false`, store có nên rollback về trạng thái trước khi import không? Làm sao rollback sạch sẽ không để rò rỉ runtime state?
  2. Làm sao đảm bảo bản save cũ trong localStorage không bị mất hoặc bị hỏng?
  3. Cần thông báo lỗi gì cho người dùng (message trả về từ `importSave`)?
  4. Đề xuất test case cụ thể (mocking Storage.setItem ném QuotaExceededError hoặc trả false)?

---
### VẤN ĐỀ 2: [Task C02] Safe Legacy Recovery từ Save V2 Bị Hỏng
- **File**: `src/engine/save.ts` (hàm `loadGameStateFromStorage`).
- **Hiện trạng code**:
  Trong `loadGameStateFromStorage()`:
  - Nếu `STORAGE_KEY` (v2) parse JSON lỗi hoặc validation thất bại, hàm fallback tìm nạp `LEGACY_STORAGE_KEY` (v1).
  - Nếu V1 hợp lệ, code lập tức gọi: `saveGameStateToStorage(validationV1.cleanData, storage)`.
- **Hậu quả / Rủi ro**: Nếu V2 mới hơn V1 (ví dụ V2 đã chơi 50 giờ nhưng bị tắt máy đột ngột khiến chuỗi JSON bị đứt đoạn cuối), việc ghi đè V1 ngay lập tức lên `STORAGE_KEY` sẽ xóa vĩnh viễn dữ liệu V2 còn sót lại, tước đi cơ hội phục hồi thủ công hoặc cứu dữ liệu.
- **Yêu cầu Codex phân tích**:
  1. Rủi ro mất dữ liệu khi tự động ghi đè V1 lên V2 mà không lưu trữ cách ly (quarantine).
  2. Đề xuất cơ chế backup/quarantine V2 hỏng (ví dụ: chuyển chuỗi V2 hỏng sang key `s_ech_game_save_v2_corrupted_backup` trước khi ghi dữ liệu V1 phục hồi).
  3. So sánh timestamp hoặc cơ chế an toàn nào giúp phân biệt V2 là dữ liệu cũ hay dữ liệu mới hơn V1?
  4. Đề xuất test cases cho các kịch bản: V2 hỏng cú pháp nhưng có backup, V2 thiếu trường, V1 cũng hỏng, reload sau recovery.

---
### VẤN ĐỀ 3: [Task C03] Sự Nhất Quán Cấp Độ Ếch và Số Mảnh
- **File**: `src/engine/frogs.ts`, `src/engine/save.ts`, và `src/store/gameStore.ts`.
- **Hiện trạng code**:
  - Trong `save.ts`: `MAX_FROG_LEVEL = 50`, `MAX_FROG_FRAGMENTS = 10_000_000`.
  - Trong `frogs.ts`: `getRequiredFragmentsForLevel(currentLevel) = 5 * Math.pow(2, currentLevel - 1)`.
  - Hàm `canLevelUpFrog` và `levelUpFrog` trong `frogs.ts` không kiểm tra `MAX_FROG_LEVEL`.
- **Hậu quả / Rủi ro**:
  1. Với công thức lũy thừa $5 \times 2^{\text{level}-1}$:
     - Cấp 1 $\rightarrow$ 2 cần: $5 \times 2^0 = 5$ mảnh.
     - Cấp 21 $\rightarrow$ 22 cần: $5 \times 2^{20} = 5.242.880$ mảnh.
     - Cấp 22 $\rightarrow$ 23 cần: $5 \times 2^{21} = 10.485.760$ mảnh (VƯỢT QUÁ `MAX_FROG_FRAGMENTS = 10.000.000`!).
     - Do đó, từ cấp 22 trở lên người chơi KHÔNG BAO GIỜ có thể tích đủ mảnh để nâng cấp vì save data clamp ở 10 triệu mảnh!
     - Nếu cấp 50: $5 \times 2^{49} \approx 2.81 \times 10^{15}$.
  2. Trong `frogs.ts` chưa có hằng số `MAX_FROG_LEVEL`. Nếu người chơi tiếp tục bấm nâng cấp ở cấp cao, liệu có bị tràn số hoặc gây bất nhất quán không?
- **Yêu cầu Codex phân tích**:
  1. Cấp độ tối đa hợp lý cho một con ếch trong game Idle/Collection này nên là bao nhiêu (ví dụ cấp 10, cấp 20 hay cấp 50)? Nếu giữ cấp 50, công thức mảnh phải điều chỉnh ra sao? Hay nên đặt `MAX_FROG_LEVEL` trong `frogs.ts` (ví dụ 10 hoặc 20) và đồng bộ với `save.ts`?
  2. Bổ sung kiểm tra `canLevelUpFrog`: nếu đã đạt `MAX_FROG_LEVEL` thì trả về `false`, không cho bấm nâng cấp tiếp.
  3. Đảm bảo save validation không hạ cấp bất hợp lý những con ếch hợp lệ.

---
Vui lòng xuất báo cáo phản hồi chi tiết:
- **Severity** cho từng vấn đề (P0: Mất dữ liệu/Crash; P1: Sai logic gameplay; P2: Tối ưu).
- **Phân tích nguyên nhân & bằng chứng mã nguồn**.
- **Giải pháp tối thiểu, an toàn nhất (Minimal & Safe Fix)**.
- **Các bài test kiểm chứng cần viết**.
