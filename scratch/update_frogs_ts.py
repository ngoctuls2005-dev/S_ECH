import re

with open('src/data/frogs.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Danh sách 15 ID ban đầu
v1_real_ids = {
    'green_frog', 'brown_frog', 'tree_frog', 'red_eyed_frog', 'tomato_frog',
    'rain_frog', 'pacman_frog', 'blue_poison_frog', 'glass_frog', 'mossy_frog',
    'golden_frog', 'golden_dart_frog'
}
v1_mythic_ids = {'king_frog', 'galaxy_frog', 'lotus_guardian_frog'}

# Cập nhật các loài Mythic để không dùng danh pháp sinh học giả mạo
text = text.replace(
    "scientificName: 'Lithobates catesbeianus Rex',",
    "scientificName: 'Lithobates catesbeianus (Biến thể hư cấu Hoàng Gia)',"
)
text = text.replace(
    "scientificName: 'Batrachia Celestia',",
    "scientificName: 'Hyla intermedia (Biến thể hư cấu Ngân Hà)',"
)
text = text.replace(
    "scientificName: 'Pelophylax Sacrum',",
    "scientificName: 'Pelophylax cypriensis (Biến thể hư cấu Thần Ao Sen)',"
)
text = text.replace(
    "scientificName: 'Batrachia Ignis',",
    "scientificName: 'Sinh vật thần thoại (Mythic Fictional)',"
)
text = text.replace(
    "scientificName: 'Batrachia Temporis',",
    "scientificName: 'Sinh vật thần thoại (Mythic Fictional)',"
)

# Cập nhật credit cho các loài
# Pattern để nhận diện từng block frog
def update_frog_credit(match):
    block = match.group(0)
    frog_id = re.search(r"id:\s*'([^']+)'", block).group(1)
    
    if frog_id in v1_real_ids:
        # Giữ nguyên credit Wikimedia thật
        return block
    elif frog_id in v1_mythic_ids:
        # Cập nhật rõ là tác phẩm phái sinh
        block = re.sub(
            r"source:\s*'[^']+',",
            "source: 'Tác phẩm phái sinh nghệ thuật từ Wikimedia Commons (Creative Edit)',",
            block
        )
        return block
    else:
        # 25 loài v2: Đánh dấu là PLACEHOLDER trung thực
        block = re.sub(
            r"source:\s*'[^']+',",
            "source: 'Ảnh minh họa nội bộ tạm thời (PLACEHOLDER - In-Engine Pillow Vector)',",
            block
        )
        block = re.sub(
            r"license:\s*'[^']+',",
            "license: 'Proprietary / In-Engine Temporary Asset (Tham khảo tư liệu Wikimedia)',",
            block
        )
        return block

# Match individual frog objects
updated_text = re.sub(r"\{\s*id:\s*'[^']+',.*?credit:\s*\{[^}]+\}\s*,?\s*\}", update_frog_credit, text, flags=re.DOTALL)

with open('src/data/frogs.ts', 'w', encoding='utf-8') as f:
    f.write(updated_text)

print("Updated src/data/frogs.ts metadata successfully.")
