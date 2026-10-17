import os
import re

with open('src/data/frogs.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to extract frog items
frog_blocks = re.split(r'\{\s*id:\s*', content)[1:]

print(f"Total blocks found: {len(frog_blocks)}")
for b in frog_blocks:
    id_match = re.search(r"^'([^']+)'", b)
    if not id_match:
        continue
    frog_id = id_match.group(1)
    
    img_match = re.search(r"image:\s*'([^']+)'", b)
    img_url = img_match.group(1) if img_match else 'MISSING'
    
    sci_match = re.search(r"scientificName:\s*'([^']+)'", b)
    sci_name = sci_match.group(1) if sci_match else 'N/A'
    
    rarity_match = re.search(r"rarity:\s*'([^']+)'", b)
    rarity = rarity_match.group(1) if rarity_match else 'N/A'
    
    author_match = re.search(r"author:\s*'([^']+)'", b)
    author = author_match.group(1) if author_match else 'N/A'
    
    local_path = os.path.join('public', img_url.lstrip('/'))
    exists = os.path.exists(local_path)
    size_kb = (os.path.getsize(local_path) / 1024) if exists else 0
    
    print(f"[{frog_id}] ({rarity}) - sci: {sci_name} - img: {img_url} (exists: {exists}, {size_kb:.1f} KB) - author: {author}")
