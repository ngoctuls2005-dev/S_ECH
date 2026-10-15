import os
import sys

report_path = os.path.join(os.getcwd(), "PROJECT_AUDIT_REPORT.md")

if not os.path.exists(report_path):
    print("LOI: File PROJECT_AUDIT_REPORT.md khong ton tai!")
    sys.exit(1)

with open(report_path, "r", encoding="utf-8") as f:
    content = f.read()

required_sections = [
    "1. Tóm tắt điều hành",
    "2. Trạng thái dự án hiện tại",
    "3. Những việc đã thực hiện",
    "4. Những việc chưa thực hiện",
    "5. Cách các hệ thống đã được xây dựng",
    "6. Cấu trúc và kiến trúc dự án",
    "7. Thống kê tính năng",
    "8. Thống kê bộ sưu tập và hình ảnh ếch",
    "9. Kết quả chạy thử và kiểm thử",
    "10. Đánh giá chất lượng code",
    "11. Danh sách lỗi và hạn chế",
    "12. Ước tính mức độ hoàn thành",
    "13. Những công việc cần thực hiện tiếp theo",
    "14. Kết luận về khả năng phát hành game",
]

missing = []
last_pos = -1
order_ok = True

for sec in required_sections:
    pos = content.find(sec)
    if pos == -1:
        missing.append(sec)
    else:
        if pos < last_pos:
            order_ok = False
        last_pos = pos

if missing:
    print(f"LOI: Thieu cac phan sau trong bao cao: {missing}")
    sys.exit(1)

if not order_ok:
    print("LOI: Thu tu cac phan khong dung quy dinh!")
    sys.exit(1)

print("[PASS] File PROJECT_AUDIT_REPORT.md hop le va day du 14 phan theo dung thu tu yeu cau.")
sys.exit(0)
