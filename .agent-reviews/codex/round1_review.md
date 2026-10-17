# Báo cáo review độc lập

Đã kiểm tra workspace trên nhánh `fix/v2-quality-recovery`, HEAD `74c8a7a7222e0300354aa8c0f1d72a45a2137eaf`. Không sửa file và không chạy test; đây là đánh giá code và đề xuất test. Workspace có thay đổi ngoài phạm vi ở `.taskflow/state.json` và `.agent-reviews/`; tôi không đụng đến chúng.

| Vấn đề | Severity | Nhận định |
|---|---|---|
| C01 – Import Save | **P1** | Import vẫn báo thành công và đổi state trong RAM khi ghi storage thất bại. |
| C02 – V2 hỏng, fallback V1 | **P0 có điều kiện** | Có thể ghi đè vĩnh viễn phần V2 hỏng còn cứu được bằng một bản V1 cũ hơn. |
| C03 – Level và fragments | **P1** | Với giới hạn hiện tại, nâng cấp bị chặn ở cấp 22; hai hàm leveling không có hard cap. |

## C01 — Import Save và lỗi LocalStorage

**Bằng chứng.** Mô tả cho rằng store cập nhật state trước khi lưu; code hiện tại làm ngược lại: gọi `saveGameStateToStorage(d)` ở [gameStore.ts](<D:/New folder/S ếch/src/store/gameStore.ts:665>), rồi cập nhật âm thanh và Zustand state. Tuy nhiên, kết quả boolean bị bỏ qua: dù lưu thất bại, store vẫn đổi state và trả `{ success: true }`. `SettingsModal` dựa vào kết quả đó để hiện “Nhập dữ liệu lưu thành công!” ở [SettingsModal.tsx](<D:/New folder/S ếch/src/components/SettingsModal.tsx:36>).

`saveGameStateToStorage` bắt lỗi và trả `false`; nó ghi bằng một lần `storage.setItem(...)` ở [save.ts](<D:/New folder/S ếch/src/engine/save.ts:320>). Với `localStorage` chuẩn, nếu `setItem` ném lỗi quota thì thao tác không thay giá trị cũ. Rủi ro chính ở đây là save vừa nhập không được lưu, nhưng UI và RAM lại xác nhận thành công.

**Giải pháp tối thiểu, an toàn.**

- Kiểm tra kết quả lưu ngay sau khi gọi hàm. Nếu là `false`, trả lỗi trước khi đổi sound settings hoặc Zustand state.
- Không cần rollback Zustand theo thứ tự hiện tại vì state chưa bị sửa. Cách an toàn nhất là chỉ cập nhật state sau khi lưu thành công; nếu cập nhật trước rồi rollback, subscribers có thể đã quan sát state tạm và phải khôi phục cả runtime state lẫn âm thanh.
- Không xóa key cũ trước khi ghi. Khi ghi thất bại, giữ nguyên save hiện hành và để người dùng thử lại.
- Gợi ý thông báo: **“Không thể lưu bản nhập vào bộ nhớ trình duyệt. Tiến trình hiện tại chưa thay đổi; hãy giải phóng dung lượng hoặc bật quyền lưu rồi thử lại.”**

**Test nên viết.**

1. Seed một save cũ vào storage; cho `setItem` ném lỗi `QuotaExceededError`. Kỳ vọng import trả `success: false`, state persistent và runtime không đổi, setting âm thanh không đổi, dữ liệu cũ trong storage vẫn nguyên.
2. Lặp lại với lỗi kiểu `SecurityError` hoặc storage không khả dụng.
3. Kiểm tra `saveGameStateToStorage` trả `false` khi storage ném lỗi. API `Storage.setItem` thực tế trả `void`; “false” là kết quả của helper, nên test ở tầng store có thể mock helper trả `false`.
4. Kiểm tra import thành công vẫn ghi storage, đổi state và trả `success: true`.

## C02 — Khôi phục an toàn khi V2 hỏng

**Bằng chứng.** Khi V2 không parse được hoặc validation thất bại, `loadGameStateFromStorage` thử V1 rồi ghi save V1 đã migrate thẳng vào `STORAGE_KEY` ở [save.ts](<D:/New folder/S ếch/src/engine/save.ts:350>). Trước khi ghi, code không giữ lại chuỗi V2 gốc hay so sánh độ mới. Test hiện có còn xác nhận hành vi ghi đè đó ở [save_validation.test.ts](<D:/New folder/S ếch/src/engine/__tests__/save_validation.test.ts:260>).

Điều này có thể xóa dấu vết V2 mới hơn V1, kể cả khi chuỗi lỗi chỉ hỏng một phần và còn khả năng phục hồi thủ công.

**Giải pháp tối thiểu, an toàn.**

- Khi V2 tồn tại nhưng không hợp lệ, chép nguyên chuỗi sang key quarantine, ví dụ `s_ech_game_save_v2_corrupted_backup`, **trước** khi nâng V1 lên V2. Đọc lại để xác nhận bản backup giống chuỗi nguồn rồi mới thay `STORAGE_KEY`.
- Nếu key backup đã có dữ liệu, không ghi đè backup cũ; dùng key mới có timestamp hoặc dừng bước thay thế.
- Nếu chép backup thất bại do quota, không thay V2 bằng V1. Có thể dùng V1 cho phiên hiện tại, nhưng cần khóa các lần autosave tiếp theo vào `STORAGE_KEY` cho đến khi người dùng export hoặc xử lý phục hồi. Nếu chỉ bỏ qua lần migrate, autosave sau đó vẫn có thể xóa V2 gốc.
- Timestamp chỉ là tín hiệu phụ. Nếu V2 parse được, `lastSavedTimestamp` có thể giúp cảnh báo V2 có vẻ mới hơn V1; nếu JSON lỗi cú pháp thì timestamp không đáng tin. Không nên dùng timestamp để cho phép ghi đè mà không quarantine.

**Test nên viết.**

1. V2 lỗi cú pháp, V1 hợp lệ: backup phải giữ nguyên chuỗi V2; V2 mới chỉ được thay sau khi backup thành công; kết quả load là save V1 đã migrate.
2. V2 parse được nhưng thiếu trường bắt buộc: cũng quarantine trước khi thay. Lưu ý validation yêu cầu `points`, `totalPointsEarned` và `totalClicks`; các trường tùy chọn như `ownedFrogs` có thể được migrate thành giá trị mặc định, nên thiếu trường tùy chọn không nhất thiết là save không hợp lệ.
3. Reload sau recovery: lần load tiếp theo lấy V2 đã migrate, và backup V2 lỗi vẫn còn.
4. Backup key đã tồn tại: bảo toàn backup cũ và không làm mất chuỗi V2 hiện tại.
5. Quarantine thất bại do quota: không thay V2; kiểm tra autosave sau đó cũng không ghi đè chuỗi gốc.
6. V2 lỗi và V1 cũng lỗi: giữ nguyên cả hai chuỗi, không tự ghi save mặc định đè lên chúng.
7. V2 hợp lệ và mới hơn V1: tiếp tục ưu tiên V2, không quarantine.

## C03 — Cấp ếch và số mảnh

**Bằng chứng.** Công thức và hai hàm leveling ở [frogs.ts](<D:/New folder/S ếch/src/engine/frogs.ts:66>) không giới hạn cấp. `canLevelUpFrog` được dùng để hiển thị khả năng nâng cấp, còn store gọi `levelUpFrog` để thực hiện hành động; vì vậy cần chặn ở cả hai nơi.

Giới hạn save hiện nằm cục bộ trong `migrateSaveData`: cấp tối đa 50 và fragments tối đa 10.000.000 ở [save.ts](<D:/New folder/S ếch/src/engine/save.ts:118>). Với công thức hiện tại:

- Nâng 21 → 22 cần **5.242.880** mảnh, vẫn dưới giới hạn.
- Nâng 22 → 23 cần **10.485.760** mảnh, vượt giới hạn lưu. Vì vậy cấp 22 là trần tiến triển hiệu dụng với các giới hạn hiện tại.
- Cần phân biệt cost để nâng 49 → 50 là `5 × 2^48 ≈ 1,407 × 10^15`; con số `5 × 2^49` là cost từ cấp 50 → 51.
- Không có overflow thực tế ở cấp 50: cost vẫn dưới `Number.MAX_SAFE_INTEGER`. Vấn đề chính là dead end ở cấp 22 và thiếu hard cap trong logic, không phải crash ở cấp 50.

**Đề xuất tối thiểu, an toàn.**

Với công thức và fragment cap hiện tại, **22 là trần gameplay suy ra từ code**, nhưng không nên dùng 22 để hạ cấp save đã được validator chấp nhận đến cấp 50.

- Khai báo trần nâng cấp ở `frogs.ts` và kiểm tra nó trong cả `canLevelUpFrog` lẫn `levelUpFrog`.
- Để giữ tương thích, giữ trần cấp lưu ở **50** trong `save.ts` dưới tên riêng như `MAX_SAVED_FROG_LEVEL`. Như vậy save cấp 23–50 đã tồn tại được giữ nguyên thay vì bị hạ xuống, dù không thể nâng cấp thêm theo trần gameplay mới.
- Nếu sản phẩm muốn nâng cấp đến cấp 50, cần chọn một thay đổi cân bằng riêng: giảm tốc độ tăng cost sao cho cost mỗi cấp không vượt 10 triệu (chẳng hạn một đường cong `ceil(5 × 1.34^(level - 1))`), hoặc tăng fragment cap lên ít nhất cost của cấp 49 → 50. Cả hai đều ảnh hưởng gameplay; lựa chọn cấp tối đa không thể suy ra chắc chắn chỉ từ code.

**Test nên viết.**

1. Với trần gameplay 22: cấp 21 đủ `5.242.880` mảnh nâng được lên 22; cấp 22 không nâng được, kể cả khi truyền số mảnh lớn trực tiếp vào helper.
2. `canLevelUpFrog` và `levelUpFrog` phải nhất quán; helper không được cho phép vượt trần khi UI báo không thể nâng cấp.
3. Validation và load/migrate giữ nguyên ếch cấp 22 và cấp 50; cấp vượt giới hạn lưu hiện hành vẫn được xử lý theo quy tắc hiện có.
4. Nếu chọn trần 50 và đổi công thức, kiểm tra cost mọi cấp 1–49 không vượt fragment cap, cấp 49 lên 50 thành công, cấp 50 dừng đúng trần, và save hợp lệ không bị hạ cấp.