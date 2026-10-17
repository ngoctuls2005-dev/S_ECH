# Kết luận audit D04

**Technical Merge Readiness: NO.** Tôi thấy còn đường dẫn có thể làm mất save hoặc khiến save mới không được lưu mà UI vẫn báo bình thường. Chưa thể sign-off merge.

**Content Release Readiness: NO.** `CREDITS.md` vẫn ghi nhận 25/40 ảnh là placeholder Pillow: 23 ảnh minh họa và 2 ảnh Mythic ([CREDITS.md](<D:/New folder/S ếch/CREDITS.md:16>)).

HEAD đúng là `56bec0b2650083777405af4ba5f64b410909df7e`; các sửa D01/D02 và hai test mới hiện nằm trong working tree, chưa commit. Tôi không sửa file, commit hay đổi nhánh.

### Phát hiện cần xử lý trước khi merge

1. **P1 — `resetGame()` không fail-closed khi lưu save mới thất bại.** Hàm xóa `STORAGE_KEY` và V1 trước, rồi gọi lưu save mặc định nhưng bỏ qua kết quả. Sau đó nó luôn đặt `saveRecovery` thành `healthy` ([gameStore.ts](<D:/New folder/S ếch/src/store/gameStore.ts:721>), [save.ts](<D:/New folder/S ếch/src/engine/save.ts:682>)). Nếu quarantine trước đó thất bại và thao tác ghi mới cũng thất bại, chuỗi V2 gốc đã bị xóa; UI lại ẩn cảnh báo, trong khi khóa autosave có thể vẫn bật. Nếu quarantine thành công nhưng save mới không ghi được, bản cũ còn trong backup, nhưng tiến trình người chơi tạo tiếp có thể không được lưu. Reset chỉ nên được coi là hoàn tất khi save mới ghi thành công.

2. **P1 — Các tab có thể ghi đè save mới bằng snapshot cũ.** Autosave chạy mỗi 5 giây ([App.tsx](<D:/New folder/S ếch/src/App.tsx:101>)); `saveGameStateToStorage()` ghi thẳng vào cùng key mà không kiểm tra key hiện chứa save nào ([save.ts](<D:/New folder/S ếch/src/engine/save.ts:387>)). Hai tab có thể cùng mở một snapshot, rồi tab lưu sau ghi đè tiến trình của tab kia. Khóa recovery cũng chỉ tồn tại trong context của tab đó. Chưa có cơ chế một tab làm writer duy nhất hoặc phát hiện save đã đổi.

3. **P2 — Key quarantine hậu tố thời gian chưa bảo đảm duy nhất.** Khi key backup chính đã khác, code dùng `${CORRUPTED_BACKUP_KEY}_${Date.now()}` rồi ghi trực tiếp, không kiểm tra key hậu tố đã tồn tại hay chưa ([save.ts](<D:/New folder/S ếch/src/engine/save.ts:472>)). Va chạm có thể ghi đè backup trước. Điều kiện `if (existingBackup ...)` cũng coi chuỗi rỗng là không có backup. Ngoài ra, sau khi quarantine và trước khi ghi V1 lên key chính, code không kiểm tra lại `STORAGE_KEY` có bị tab khác thay đổi không ([save.ts](<D:/New folder/S ếch/src/engine/save.ts:523>)).

4. **P2 — `SaveSessionContext` chưa được dùng để cô lập store.** Các API mặc định quay về `globalSaveSessionContext` ([save.ts](<D:/New folder/S ếch/src/engine/save.ts:343>)); store thật nạp dữ liệu và lấy recovery status qua context mặc định ([gameStore.ts](<D:/New folder/S ếch/src/store/gameStore.ts:114>)). Test D02 tạo hai context rồi gọi trực tiếp helper, nhưng không tạo hai store hoặc kiểm tra context được truyền qua toàn bộ luồng store ([d02_save_lock_lifecycle.test.ts](<D:/New folder/S ếch/src/engine/__tests__/d02_save_lock_lifecycle.test.ts:197>)). Vì ứng dụng hiện dùng singleton, đây chủ yếu là lỗ hổng cô lập và độ tin cậy của test, nhưng tuyên bố D02 đã loại bỏ trạng thái module dùng chung chưa đúng với code hiện tại.

5. **P2 — Banner báo sai khi quarantine thất bại.** Cả `recovery-pending` lẫn `quarantine-failed` đều hiển thị rằng save “đã được cách ly bảo vệ” ([App.tsx](<D:/New folder/S ếch/src/App.tsx:149>)). Với `quarantine-failed`, thông điệp này có thể khiến người chơi tưởng rằng đã có bản backup an toàn trước khi chọn reset.

### Round 5 và chất lượng kiểm thử

- **Quarantine so khớp chính xác:** Đã sửa ở luồng thông thường bằng phép so sánh chuỗi sau khi ghi. Tuy nhiên, xử lý key timestamped và cạnh tranh giữa các tab vẫn để hở như trên.
- **Autosave sau quarantine thất bại:** Đã khóa các lần ghi đi qua `saveGameStateToStorage()` trong cùng một session. Đây là sửa đúng cho lỗi 5 giây của Round 5; khóa này không bảo vệ tab khác và `resetGame()` vẫn có vấn đề khi thao tác lưu lỗi.
- Các test save, migration, validation, import lỗi storage, lifecycle và gameplay có kiểm tra logic thực chất. Nhưng D01 gọi trực tiếp hàm lưu ba lần; vòng lặp gắn nhãn “5/10/30 giây” không dùng fake timer hay chạy interval thật ([d01_corrupted_autosave_protection.test.ts](<D:/New folder/S ếch/src/engine/__tests__/d01_corrupted_autosave_protection.test.ts:80>)). D02 cũng mô phỏng thủ công chuỗi `clearSavedGame` rồi lưu, không kiểm tra `resetGame()` thật khi xóa hoặc ghi thất bại ([d02_save_lock_lifecycle.test.ts](<D:/New folder/S ếch/src/engine/__tests__/d02_save_lock_lifecycle.test.ts:64>)). Còn thiếu test cho reset thất bại, va chạm key, save đồng thời giữa tab và migration khi key chính đổi giữa chừng.
- Workspace ghi nhận **196/196 test, 20/20 suite**. Tôi không chạy lại test hoặc build trong lượt review chỉ đọc, nên đây là kết quả đã ghi trong workspace, không phải kết quả tôi xác minh độc lập.

**Trước khi merge:** sửa reset để không xóa save hiện tại trước khi xác nhận save thay thế ghi thành công; quyết định và bảo vệ trường hợp nhiều tab; cấp key quarantine chưa tồn tại và kiểm tra lại key chính trước khi migration; sau đó thêm test ở cấp `gameStore` cho các nhánh lỗi này. Ngưỡng sign-off hiện chưa đạt.