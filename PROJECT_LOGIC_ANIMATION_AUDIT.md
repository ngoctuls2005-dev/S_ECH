# Rà soát logic và hoạt họa

**Ngày:** 16/10/2026  
**Phạm vi:** game state, nhập bản lưu, vòng đời timer và hiệu ứng ở ao/gacha.

## Kế hoạch

1. Đọc các hàm engine và luồng Zustand để tìm trường hợp dữ liệu hợp lệ một phần làm sai trạng thái hoặc gây lỗi khi chơi.
2. Rà vòng đời animation và timeout khi người chơi chạm nhanh hoặc đóng modal giữa chừng.
3. Sửa lỗi có thể tái hiện từ mã nguồn, thêm điều khiển giảm chuyển động và kiểm tra bản build.
4. Commit các thay đổi và đẩy lên `origin/main`.

## Phát hiện và xử lý

| Mức | Vấn đề | Xử lý |
|---|---|---|
| P1 | Bộ kiểm tra bản lưu chỉ kiểm tra một vài trường cấp cao. Bản lưu thiếu `pity`, `upgrades` hoặc một phần `settings` có thể được chấp nhận rồi khiến gacha, hiệu ứng âm thanh hoặc cài đặt hoạt động sai. Migration cũ cũng không bổ sung được một số trường vì validation từ chối trước khi gọi migration. | Chuẩn hóa trường thiếu theo mặc định; lọc dữ liệu ếch/nâng cấp; giới hạn âm lượng; kiểm tra số hữu hạn; từ chối bản lưu có version mới hơn. |
| P2 | Timeout cũ của hiệu ứng bóp ếch có thể kết thúc hiệu ứng của lần chạm mới; timer ripple còn tồn tại nếu rời màn hình khi hiệu ứng đang chạy. | Dùng một timer có thể thay thế cho hiệu ứng bóp, dọn timer khi component unmount và quản lý vòng đời timer ripple. |
| P2 | Gacha lên lịch tiếng trứng và hiển thị kết quả trễ. Đóng modal trong lúc nở vẫn có thể phát âm thanh/hiệu ứng sau khi rời màn hình. | Theo dõi và hủy timeout khi đóng modal. Kết quả gacha vẫn được xử lý đồng bộ tại thời điểm người chơi quay. |
| P3 | Cài đặt `reducedMotion` đã lưu nhưng chưa có giao diện hoặc tác dụng; ếch chính thiếu chuyển động nghỉ nhẹ. | Thêm công tắc giảm chuyển động; thêm nhịp nổi nhẹ cho ếch và vẫn tôn trọng cài đặt của hệ điều hành. |

## Kiểm tra

- `npm run build`: chạy sau khi hoàn tất sửa đổi.
- `git diff --check`: rà khoảng trắng và định dạng diff.
- Bộ test không chạy trong lượt rà soát này.
