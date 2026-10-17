Bạn là Senior Code Reviewer và Data Safety Specialist cho dự án S ếch (Web Game Idle Clicker + Gacha).
Chúng tôi đang tiến hành Task D01: BẢO VỆ SAVE KHI CẢ V1 VÀ V2 ĐỀU HỎNG HOẶC V1 KHÔNG TỒN TẠI.

Vấn đề kiểm toán phát hiện trong `src/engine/save.ts` và `src/store/gameStore.ts`:
1. Khi `storage.getItem(STORAGE_KEY)` (V2) có dữ liệu nhưng bị lỗi (JSON syntax error hoặc validation failed), biến `v2CorruptedRaw` được gán chuỗi đó.
2. Hệ thống kiểm tra fallback `rawV1` (`s_ech_game_save_v1`).
3. NẾU `rawV1` không tồn tại HOẶC `rawV1` cũng bị hỏng:
   - `loadGameStateFromStorage()` nhảy thẳng xuống cuối và trả về `DEFAULT_INITIAL_SAVE`.
   - Chuỗi `v2CorruptedRaw` KHÔNG hề được quarantine backup.
   - Cờ `isAutoSaveBlockedDueToFailedQuarantine` KHÔNG được bật.
   - Trình duyệt/Zustand nạp `DEFAULT_INITIAL_SAVE`.
   - Sau 5 giây, vòng lặp autosave định kỳ (`setInterval(..., 5000)`) trong `App.tsx` gọi `saveGame()` -> `saveGameStateToStorage()`.
   - Kết quả: `storage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_SAVE))` ghi đè xóa sạch chuỗi V2 hỏng ban đầu của người chơi! Người chơi mất hoàn toàn cơ hội phục hồi dữ liệu.

Hãy phân tích và đưa ra giải pháp toàn diện:
1. Nguyên tắc bảo vệ:
   - Khi phát hiện V2 hỏng (kể cả khi V1 hỏng hoặc không có V1), có nên cố gắng quarantine backup chuỗi V2 hỏng đó sang `s_ech_game_save_v2_corrupted_backup` (hoặc timestamped backup) ngay lập tức hay không?
   - Nếu quarantine thành công, việc chạy game với state mặc định có nên cho phép autosave ghi vào `STORAGE_KEY` không, hay cần đánh dấu đây là phiên phục hồi chưa lưu (unpersisted recovery session)?
   - Nếu quarantine thất bại (ví dụ QuotaExceededError, SecurityError), cơ chế khóa autosave cần hoạt động thế nào?
   - Làm thế nào để thông báo cho người chơi (qua Zustand state / UI banner) biết rằng dữ liệu lưu đang gặp sự cố, game đang chạy ở trạng thái tạm thời, và cung cấp phương án an toàn (xuất bản lưu hỏng để báo lỗi, hoặc reset có xác nhận)?
2. Về mặt kiến trúc API giữa `src/engine/save.ts` và `src/store/gameStore.ts`:
   - Làm thế nào để trạng thái khóa save / recovery không bị rò rỉ giữa các test runner (module-level static variable) mà vẫn hoạt động xuyên suốt app?
   - Đề xuất chữ ký hàm hoặc state mở rộng tối thiểu, sạch sẽ, không breaking change.
3. Các test cases cần có để chứng minh khả năng bảo vệ dữ liệu chống ghi đè khi autosave chạy sau 5s, 10s, 30s.

Chỉ phân tích, không sửa file, không commit.
