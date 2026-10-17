## Kết luận

Nên quarantine ngay khi phát hiện V2 hỏng, kể cả khi V1 không tồn tại hoặc cũng hỏng. Nếu game phải chạy bằng state mặc định, hãy coi đó là **phiên phục hồi chưa lưu** và khóa mọi lần ghi tự động cho đến khi người chơi chọn cách xử lý. Quarantine thành công bảo vệ bản sao, nhưng không đồng nghĩa người chơi đã đồng ý lưu một game mới lên save chính.

## Hiện trạng trong mã

Trong [`save.ts`](<D:/New folder/S ếch/src/engine/save.ts:361>), bản V2 hỏng được đưa vào quarantine chỉ bên trong nhánh V1 hợp lệ. Nếu V1 thiếu hoặc không hợp lệ, hàm trả `DEFAULT_INITIAL_SAVE` mà không bật khóa. Vì vậy, autosave 5 giây trong [`App.tsx`](<D:/New folder/S ếch/src/App.tsx:97>) có thể ghi state mặc định lên `STORAGE_KEY`.

Có thêm hai điểm cần tính đến:

- `saveGameStateToStorage` được gọi ngoài autosave: trong `handleVisibilityChange` và `importSave` ở [`gameStore.ts`](<D:/New folder/S ếch/src/store/gameStore.ts:239>). Khóa phải bảo vệ mọi đường ghi, không chỉ interval.
- Cờ khóa hiện là biến module trong [`save.ts`](<D:/New folder/S ếch/src/engine/save.ts:318>). Nó không gắn với một lượt load hoặc một store cụ thể; `clearSavedGame` cũng không reset cờ này. Ngược lại, test chạy sau một test khác có thể nhận trạng thái khóa cũ.

## Chính sách đề xuất

| Tình huống khi load | Xử lý save chính | Cho phép autosave? |
|---|---|---|
| V2 hợp lệ | Nạp V2 | Có |
| V2 hỏng, V1 hợp lệ | Quarantine và xác minh chính xác chuỗi V2 trước; sau đó có thể nâng cấp V1 lên V2 | Có, nếu backup và lần ghi nâng cấp thành công |
| V2 hỏng, V1 thiếu hoặc hỏng; quarantine thành công | Giữ game ở state tạm trong RAM, giữ raw V2 trong backup và chưa thay `STORAGE_KEY` | Không, chờ người chơi chọn cách xử lý |
| V2 hỏng, V1 thiếu hoặc hỏng; quarantine thất bại | Giữ nguyên raw V2 ở `STORAGE_KEY`; đánh dấu recovery lỗi | Không |
| Không có save V1 hoặc V2 | Nạp game mới | Có |

Quarantine nên chạy ngay sau khi xác định V2 không hợp lệ, trước khi fallback V1. Hãy xử lý `rawV2 !== null` thay vì kiểm tra truthy để chuỗi rỗng cũng được coi là dữ liệu hỏng. Nếu khóa backup đã chứa chuỗi khác, chọn một key timestamped chưa tồn tại; nếu đã có đúng chuỗi cần backup thì có thể coi là thành công. Sau khi xác minh backup, đọc lại `STORAGE_KEY` ngay trước khi thay nó để tránh ghi đè nếu dữ liệu đã đổi. Storage không cung cấp giao dịch compare-and-swap, nên vẫn có giới hạn race giữa nhiều tab.

Nếu backup thất bại do `QuotaExceededError`, `SecurityError`, hoặc không xác minh được nội dung, phải fail closed: giữ nguyên chuỗi V2, khóa ghi V2 cho cả autosave, lưu lúc ẩn tab, `beforeunload` và import thông thường. Nếu đọc storage cũng ném lỗi, không thể xác nhận trạng thái save hiện tại; lượt đó cũng nên khóa ghi và báo trạng thái storage không khả dụng.

## Trạng thái UI và lựa chọn phục hồi

Thêm một trạng thái recovery có thể quan sát trong Zustand, chẳng hạn `saveRecovery` gồm:

- `status`: `healthy`, `recovered-from-v1`, `recovery-pending` hoặc `quarantine-failed`.
- `reason`: lỗi JSON, validation, quota hoặc storage access.
- `backupStatus` và thời điểm phát hiện.

Banner cần nói rõ game đang chạy tạm thời, tiến trình mới có thể chưa được lưu, và autosave đang bị khóa. Cung cấp các lựa chọn:

1. **Xuất dữ liệu V2 hỏng nguyên bản** để người chơi lưu hoặc gửi báo lỗi. Phải xuất raw string từ storage/backup; `exportSave()` hiện xuất state trong store, nên ở phiên mặc định nó sẽ xuất state tạm, không phải dữ liệu hỏng.
2. **Nhập một save hợp lệ** để khôi phục. Chỉ gỡ khóa sau khi lần ghi save mới thành công.
3. **Reset và bắt đầu mới**, có xác nhận nêu rõ dữ liệu nào sẽ bị xóa.

`SettingsModal` đã có bước xác nhận reset, nhưng [`resetGame`](<D:/New folder/S ếch/src/store/gameStore.ts:707>) gọi `clearSavedGame`, hàm này xóa backup chính. Xác nhận trong trạng thái recovery nên nêu rõ việc bỏ bản sao phục hồi. Ngoài ra, `clearSavedGame` hiện không xóa các key backup timestamped, nên cần xác định rõ reset sẽ giữ hay xóa chúng.

## API và cô lập trạng thái

Không nên giữ cờ khóa trong `save.ts`. Cách thay đổi ít phá vỡ nhất là thêm một **context/session tường minh** làm tham số tùy chọn cuối các API hiện có:

```ts
loadGameStateFromStorage(storage?, saveContext?)
saveGameStateToStorage(state, storage?, saveContext?)
```

Giữ kiểu trả về hiện tại để không làm hỏng caller cũ. `saveContext` do mỗi game store sở hữu, giữ recovery status và raw V2 cần xuất. Tạo context trong factory tạo store, rồi truyền cùng context qua load và mọi đường ghi. Để `App.tsx` cũng dùng đúng context, chuyển autosave sang một action của Zustand như `saveCurrentGame()` thay vì gọi trực tiếp hàm engine.

Nên có `createGameStore(storage?)` để mỗi test tạo store và context riêng; ứng dụng tiếp tục export singleton hiện có. Đây là điểm quan trọng để tránh trạng thái recovery rò rỉ giữa test runner. Không nên dựa vào `resetSaveStorageBlock()` như cách cô lập chính: nó vẫn là thao tác trên state global và không tự gắn với storage hay lượt load cụ thể.

## Test cần bổ sung

Dùng fake timers và storage mock có thể ghi nhận hoặc chặn `setItem`:

- Với V2 lỗi cú pháp, V1 không tồn tại: load state mặc định, backup chứa chính xác raw V2; tại mốc **5, 10 và 30 giây**, `STORAGE_KEY` vẫn giữ nguyên và không có lần ghi autosave.
- Lặp lại với V2 parse được nhưng validation thất bại, V1 lỗi cú pháp, và V1 parse được nhưng validation thất bại.
- Khi quarantine ném quota hoặc security error: raw V2 vẫn còn ở key chính; autosave ở cả ba mốc bị chặn, kể cả sau khi mock cho phép ghi backup trở lại.
- Khi quarantine thành công nhưng không có save dùng được: vẫn giữ trạng thái `recovery-pending`; backup thành công không tự cho phép ghi state mặc định.
- Khi V1 hợp lệ và backup V2 thành công: V1 được phục hồi, backup giữ raw V2; chỉ state V1 đã xác minh mới được ghi lên V2.
- Khi có bản backup khác từ trước: bản cũ không bị ghi đè; bản V2 hiện tại có key riêng duy nhất.
- Test clean install, V2 hợp lệ, import để giải quyết recovery, reset đã xác nhận, và storage `getItem` bị lỗi.
- Dùng context/store mới cho từng test để xác minh kết quả không phụ thuộc thứ tự chạy.

Trong phạm vi yêu cầu, mình chỉ đọc mã và phân tích; không sửa file, commit hoặc chạy test.