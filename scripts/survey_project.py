import os
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

root_dir = os.getcwd()
file_stats = []

for dirpath, dirnames, filenames in os.walk(root_dir):
    # Skip node_modules, dist, .git, .taskflow
    if any(skip in dirpath for skip in ['node_modules', 'dist', '.git', '.taskflow']):
        continue
    for f in filenames:
        full_path = os.path.join(dirpath, f)
        rel_path = os.path.relpath(full_path, root_dir)
        size = os.path.getsize(full_path)
        lines = 0
        ext = os.path.splitext(f)[1].lower()
        if ext in ['.ts', '.tsx', '.js', '.jsx', '.css', '.html', '.json', '.md', '.py']:
            try:
                with open(full_path, 'r', encoding='utf-8', errors='ignore') as fp:
                    lines = sum(1 for _ in fp)
            except Exception:
                pass
        file_stats.append({
            "path": rel_path.replace('\\', '/'),
            "size": size,
            "lines": lines,
            "ext": ext
        })

print(f"=== TỔNG HỢP CẤU TRÚC WORKSPACE: {root_dir} ===")
print(f"Tổng số tệp (loại trừ node_modules, dist, .taskflow): {len(file_stats)}")

by_ext = {}
total_loc = 0
for f in file_stats:
    by_ext[f['ext']] = by_ext.get(f['ext'], 0) + 1
    total_loc += f['lines']

print("\nThống kê theo định dạng:")
for ext, count in sorted(by_ext.items(), key=lambda x: -x[1]):
    print(f"  {ext or '(no ext)'}: {count} tệp")
print(f"Tổng số dòng mã nguồn (LOC): {total_loc} dòng")

print("\nDanh sách chi tiết các file:")
for f in sorted(file_stats, key=lambda x: x['path']):
    print(f"  - {f['path']} ({f['lines']} dòng, {f['size']} bytes)")
