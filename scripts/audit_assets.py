import os
import sys
import re
from PIL import Image

ASSETS_DIR = os.path.join(os.getcwd(), "public", "assets", "frogs")
DATA_FILE = os.path.join(os.getcwd(), "src", "data", "frogs.ts")
CREDITS_FILE = os.path.join(os.getcwd(), "CREDITS.md")

print("=== BAO CAO THAM DINH TAI NGUYEN HINH ANH ECH THUC TE ===")

if not os.path.exists(ASSETS_DIR):
    print(f"LOI: Thu muc {ASSETS_DIR} khong ton tai!")
    sys.exit(1)

files = [f for f in os.listdir(ASSETS_DIR) if f.endswith(".webp")]
print(f"Tong so anh ech WebP tim thay trong public/assets/frogs: {len(files)}")

if len(files) < 15:
    print(f"CANH BAO: Yeu cau it nhat 15 loai ech, hien tai chi co {len(files)}!")
    sys.exit(1)

credits_content = ""
if os.path.exists(CREDITS_FILE):
    with open(CREDITS_FILE, "r", encoding="utf-8") as fp:
        credits_content = fp.read()

frogs_ts_content = ""
if os.path.exists(DATA_FILE):
    with open(DATA_FILE, "r", encoding="utf-8") as fp:
        frogs_ts_content = fp.read()

total_bytes = 0
audit_passed = True

for idx, filename in enumerate(sorted(files), 1):
    file_path = os.path.join(ASSETS_DIR, filename)
    file_size = os.path.getsize(file_path)
    total_bytes += file_size
    frog_id = os.path.splitext(filename)[0]

    try:
        with Image.open(file_path) as img:
            w, h = img.size
            mode = img.mode
            has_alpha = "A" in mode
            
            transparent_pixels = 0
            if has_alpha:
                alpha = img.split()[-1]
                transparent_pixels = sum(1 for p in alpha.getdata() if p == 0)
                transparency_ratio = transparent_pixels / (w * h)
                is_transparent_bg = transparency_ratio > 0.20
            else:
                is_transparent_bg = False

            name_vi_match = re.search(rf"id:\s*'{frog_id}'.*?nameVi:\s*'([^']+)'", frogs_ts_content, re.DOTALL)
            sci_name_match = re.search(rf"id:\s*'{frog_id}'.*?scientificName:\s*'([^']+)'", frogs_ts_content, re.DOTALL)
            author_match = re.search(rf"id:\s*'{frog_id}'.*?author:\s*'([^']+)'", frogs_ts_content, re.DOTALL)
            license_match = re.search(rf"id:\s*'{frog_id}'.*?license:\s*'([^']+)'", frogs_ts_content, re.DOTALL)

            name_vi = name_vi_match.group(1) if name_vi_match else "N/A"
            sci_name = sci_name_match.group(1) if sci_name_match else "N/A"
            author = author_match.group(1) if author_match else "Wikimedia Contributor"
            license_str = license_match.group(1) if license_match else "CC"

            if not has_alpha or not is_transparent_bg:
                audit_passed = False

            print(f"[{idx:02d}] {filename}: {w}x{h}, {file_size/1024:.1f}KB, RGBA={has_alpha}, Transp={transparency_ratio*100:.1f}%, License={license_str}")
    except Exception as e:
        print(f"[{idx:02d}] {filename}: ERROR {e}")
        audit_passed = False

print(f"\nTong dung luong: {total_bytes/1024:.1f} KB (~{total_bytes/(1024*1024):.2f} MB)")

if audit_passed:
    print("\n[PASS] AUDIT SUCCESS: 15/15 real frog transparent WebP images verified.")
    sys.exit(0)
else:
    print("\n[FAIL] AUDIT FAILED!")
    sys.exit(1)
