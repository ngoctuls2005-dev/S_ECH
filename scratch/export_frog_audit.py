import os
import re
import json

with open('src/data/frogs.ts', 'r', encoding='utf-8') as f:
    content = f.read()

frog_blocks = re.split(r'\{\s*id:\s*', content)[1:]

results = []
for b in frog_blocks:
    id_match = re.search(r"^'([^']+)'", b)
    if not id_match:
        continue
    frog_id = id_match.group(1)
    
    name_vi = re.search(r"nameVi:\s*'([^']+)'", b).group(1) if re.search(r"nameVi:\s*'([^']+)'", b) else ''
    name_en = re.search(r"nameEn:\s*'([^']+)'", b).group(1) if re.search(r"nameEn:\s*'([^']+)'", b) else ''
    sci_name = re.search(r"scientificName:\s*'([^']+)'", b).group(1) if re.search(r"scientificName:\s*'([^']+)'", b) else ''
    rarity = re.search(r"rarity:\s*'([^']+)'", b).group(1) if re.search(r"rarity:\s*'([^']+)'", b) else ''
    img_url = re.search(r"image:\s*'([^']+)'", b).group(1) if re.search(r"image:\s*'([^']+)'", b) else ''
    source = re.search(r"source:\s*'([^']+)'", b).group(1) if re.search(r"source:\s*'([^']+)'", b) else ''
    author = re.search(r"author:\s*'([^']+)'", b).group(1) if re.search(r"author:\s*'([^']+)'", b) else ''
    license_val = re.search(r"license:\s*'([^']+)'", b).group(1) if re.search(r"license:\s*'([^']+)'", b) else ''
    url = re.search(r"url:\s*'([^']+)'", b).group(1) if re.search(r"url:\s*'([^']+)'", b) else ''
    
    local_path = os.path.join('public', img_url.lstrip('/'))
    exists = os.path.exists(local_path)
    size_kb = round(os.path.getsize(local_path) / 1024, 1) if exists else 0
    
    results.append({
        'id': frog_id,
        'nameVi': name_vi,
        'nameEn': name_en,
        'scientificName': sci_name,
        'rarity': rarity,
        'image': img_url,
        'exists': exists,
        'sizeKb': size_kb,
        'source': source,
        'author': author,
        'license': license_val,
        'url': url
    })

with open('scratch/frog_audit_data.json', 'w', encoding='utf-8') as out:
    json.dump(results, out, ensure_ascii=False, indent=2)

print(f"Exported {len(results)} frogs data to scratch/frog_audit_data.json successfully.")
