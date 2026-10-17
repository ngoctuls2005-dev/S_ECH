## Kết luận

Bản hiện tại **chưa đáp ứng Task D02**. Có hai vấn đề nghiêm trọng: reset gameplay có thể xóa bản duy nhất giữ dữ liệu lỗi, còn import hợp lệ lại bị chặn khi phiên đang khóa.

## Phát hiện

- **P1 — Reset xóa quarantine backup và vẫn mở khóa nếu thao tác xóa lỗi.** [`clearSavedGame`](<D:/New folder/S ếch/src/engine/save.ts:666>) xóa `CORRUPTED_BACKUP_KEY`. Khi backup nằm ở key này, reset làm mất bản sao cách ly; khi quarantine thất bại, reset có thể xóa luôn chuỗi hỏng duy nhất còn ở `STORAGE_KEY`. Sau đó [`resetGame`](<D:/New folder/S ếch/src/store/gameStore.ts:729>) vẫn gọi `resetSaveStorageBlock()` vô điều kiện. `clearSavedGame` nuốt lỗi và không báo thành công/thất bại, nên store cũng không thể biết có an toàn để mở khóa hay không.

- **P1 — Import save hợp lệ không thể thoát trạng thái khóa.** [`importSave`](<D:/New folder/S ếch/src/store/gameStore.ts:679>) ghi dữ liệu bằng `saveGameStateToStorage` trước, nhưng hàm này từ chối mọi lần ghi khi context đang bị khóa. `resetSaveStorageBlock()` chỉ được gọi sau khi ghi thành công, nên import bị kẹt ở `recovery-pending` hoặc `quarantine-failed`. Cần chỉ mở khóa sau khi đã bảo vệ được chuỗi cũ, ghi save nhập thành công, rồi mới cập nhật RAM. Nếu không thể bảo vệ hoặc ghi, phải giữ nguyên dữ liệu và khóa.

- **P1 — Context chưa thực sự độc lập giữa store/test.** [`SaveSessionContext`](<D:/New folder/S ếch/src/engine/save.ts:328>) hỗ trợ truyền context riêng, nhưng store chính và các điểm autosave không truyền context; chúng dùng biến toàn cục ở [`save.ts`](<D:/New folder/S ếch/src/engine/save.ts:343>). Vì vậy một lần load bằng custom Storage có thể khóa thao tác lưu ở Storage khác. `resetGlobalSaveSessionContext()` cũng chưa được dùng trong các test liên quan, và không thay thế được việc cấp context riêng cho từng store/test.

- **P2 — Có đường mở khóa không kèm kiểm tra an toàn.** `acknowledgeRecoveryReset()` chỉ xóa cờ khóa và đặt trạng thái recovery thành `healthy` tại [`gameStore.ts`](<D:/New folder/S ếch/src/store/gameStore.ts:145>); nó không xác nhận backup đã được ghi hoặc save hỏng đã được bảo vệ. Dù hiện chưa thấy UI gọi action này, không nên dùng nó làm lối thoát chung khỏi trạng thái recovery.

## Các ca biên nên có trong kiểm thử

- Reset khi `recovery-pending`: backup ở key gốc và các key có hậu tố timestamp vẫn nguyên byte; reset tạo được save mới và reload đúng phiên mới.
- Reset khi `quarantine-failed`: thử lại cách ly; nếu backup hoặc thao tác storage vẫn thất bại, giữ nguyên chuỗi hỏng và tiếp tục khóa.
- Import hợp lệ ở cả `recovery-pending` và `quarantine-failed`: chỉ mở khóa sau khi backup cần thiết được xác minh và save nhập được ghi; reload phải nạp save vừa nhập.
- Import sai checksum/định dạng và lỗi ghi storage: RAM, save cũ, backup và trạng thái khóa không bị thay đổi.
- Hai context riêng trên cùng hoặc khác Storage: khóa/reset context A không ảnh hưởng context B; `resetGlobalSaveSessionContext()` chỉ tác động luồng dùng context mặc định.
- Backup hiện có là chuỗi rỗng, đã có backup khác, hoặc có nhiều key hậu tố timestamp; reset gameplay phải giữ tất cả. Hiện kiểm tra backup ở [`save.ts`](<D:/New folder/S ếch/src/engine/save.ts:461>) dùng điều kiện truthy, nên backup rỗng có thể bị xem như chưa tồn tại.

Tôi chỉ đọc mã nguồn và test hiện có; không sửa file và không chạy test.