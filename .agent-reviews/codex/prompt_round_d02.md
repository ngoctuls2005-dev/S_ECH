Bạn là Senior Code Reviewer và Data Safety Specialist cho dự án S ếch.
Chúng tôi đang tiến hành Task D02: SỬA VÒNG ĐỜI CỦA SAVE LOCK VÀ PHÂN BIỆT RESET GAMEPLAY VỚI XÓA BACKUP.

Vấn đề cần giải quyết:
1. Trước đây, `clearSavedGame()` xóa thẳng tay `CORRUPTED_BACKUP_KEY` khi người chơi reset game.
   Yêu cầu: Phân biệt giữa reset gameplay (xóa tiến trình game để chơi lại) và xóa bản sao lưu cách ly (quarantine backup). Không được xóa quarantine backup khi chưa có yêu cầu/xác nhận xóa backup rõ ràng.
2. Vòng đời của save lock (`isSaveStorageBlocked`):
   - Khi đang ở trạng thái khóa do quarantine thất bại hoặc đang chờ phục hồi (`recovery-pending` / `quarantine-failed`), người chơi cần có quy trình hợp lệ để bắt đầu phiên mới hoặc nhập save mới mà không bị mắc kẹt vĩnh viễn trong trạng thái không thể lưu.
   - Khi người chơi thực hiện `resetGame()` hoặc `importSave()` hợp lệ, cờ khóa phải được giải phóng và phiên mới phải lưu được bình thường (cả autosave và manual save).
   - Nhưng không được tự động mở khóa nếu điều đó dẫn đến việc ghi đè một chuỗi save hỏng chưa được bảo vệ.
3. Tránh rò rỉ trạng thái khóa giữa các test và giữa các Storage instance:
   - Cơ chế `SaveSessionContext` cho phép mỗi store / test sở hữu context riêng, đồng thời có `resetGlobalSaveSessionContext()` để đảm bảo tính cô lập tuyệt đối.

Hãy review thiết kế này:
- Tính an toàn của việc bảo toàn `CORRUPTED_BACKUP_KEY` khi reset gameplay.
- Đảm bảo phiên mới sau reset/import lưu và reload bình thường.
- Các góc cạnh biên (edge cases) cần kiểm thử.

Chỉ phân tích và review, không sửa file, không commit.
