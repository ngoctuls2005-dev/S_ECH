import os
import sys

def verify_improvement_report():
    report_path = "PROJECT_IMPROVEMENT_REPORT.md"
    audit_path = "PROJECT_AUDIT_REPORT.md"
    
    if not os.path.exists(report_path):
        print("ERROR: PROJECT_IMPROVEMENT_REPORT.md does not exist.")
        sys.exit(1)
        
    with open(report_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    required_sections = [
        "## A. TÌNH TRẠNG TRƯỚC KHI SỬA",
        "## B. NHỮNG THAY ĐỔI ĐÃ THỰC HIỆN",
        "## C. GIẢI PHÁP KỸ THUẬT CHI TIẾT",
        "## D. KẾT QUẢ KIỂM THỬ THỰC TẾ",
        "## E. DANH SÁCH LỖI ĐÃ KHẮC PHỤC",
        "## F. NHỮNG ĐIỂM CÒN TỒN TẠI",
        "## G. ĐÁNH GIÁ MỨC HOÀN THIỆN MỚI",
        "## H. ĐỀ XUẤT PHÁT TRIỂN TIẾP THEO"
    ]
    
    for sec in required_sections:
        if sec not in content:
            print(f"ERROR: Missing section: {sec}")
            sys.exit(1)
            
    with open(audit_path, "r", encoding="utf-8") as f:
        audit_content = f.read()
        
    if "PROJECT_IMPROVEMENT_REPORT.md" not in audit_content:
        print("ERROR: PROJECT_AUDIT_REPORT.md does not reference improvement report.")
        sys.exit(1)
        
    print("SUCCESS: PROJECT_IMPROVEMENT_REPORT.md verified with all 8 sections A-H and referenced in audit report.")
    sys.exit(0)

if __name__ == "__main__":
    verify_improvement_report()
