import os
import sys
import json
import urllib.request
import urllib.parse
import re

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

import numpy as np
import cv2
from PIL import Image, ImageEnhance, ImageFilter

OUTPUT_DIR = os.path.join(os.getcwd(), "public", "assets", "frogs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

FROGS_METADATA = [
    {
        "id": "green_frog",
        "nameVi": "Ếch Xanh Cơ Bản",
        "nameEn": "Common Green Frog",
        "scientificName": "Pelophylax ridibundus",
        "rarity": "common",
        "search": "Pelophylax ridibundus",
        "description": "Chú ếch thân thiện nhảy nhót quanh bờ ao sen. Mỗi cú sờ đều tràn ngập năng lượng thiên nhiên.",
        "buff": { "type": "click_points_percent", "value": 0.10 },
        "defaultOwned": True,
    },
    {
        "id": "brown_frog",
        "nameVi": "Ếch Nâu Đồng",
        "nameEn": "Common Brown Frog",
        "scientificName": "Rana temporaria",
        "rarity": "common",
        "search": "Rana temporaria",
        "description": "Bậc thầy ngụy trang giữa đám lá khô, chăm chỉ tích lũy điểm sờ ếch cho bạn.",
        "buff": { "type": "idle_points_percent", "value": 0.15 },
        "defaultOwned": False,
    },
    {
        "id": "tree_frog",
        "nameVi": "Ếch Cây Châu Âu",
        "nameEn": "European Tree Frog",
        "scientificName": "Hyla arborea",
        "rarity": "common",
        "search": "Hyla arborea",
        "description": "Đôi chân dính chặt vào cành lá, hỗ trợ bạn duy trì nhịp độ sờ ếch ổn định.",
        "buff": { "type": "combo_bonus_percent", "value": 0.15 },
        "defaultOwned": False,
    },
    {
        "id": "red_eyed_frog",
        "nameVi": "Ếch Mắt Đỏ",
        "nameEn": "Red-eyed Tree Frog",
        "scientificName": "Agalychnis callidryas",
        "rarity": "rare",
        "search": "Agalychnis callidryas",
        "description": "Đôi mắt đỏ rực sắc sảo giúp bạn dễ dàng tìm thấy điểm yếu, tăng tỉ lệ chí mạng.",
        "buff": { "type": "crit_chance_bonus", "value": 0.04 },
        "defaultOwned": False,
    },
    {
        "id": "tomato_frog",
        "nameVi": "Ếch Cà Chua",
        "nameEn": "Tomato Frog",
        "scientificName": "Dyscophus antongilii",
        "rarity": "rare",
        "search": "Dyscophus antongilii",
        "description": "Tròn trĩnh và đỏ mọng như một quả cà chua chín. Tăng mạnh giá trị điểm sờ mỗi click.",
        "buff": { "type": "click_points_percent", "value": 0.25 },
        "defaultOwned": False,
    },
    {
        "id": "rain_frog",
        "nameVi": "Ếch Mưa Sa Mạc",
        "nameEn": "Desert Rain Frog",
        "scientificName": "Breviceps macrops",
        "rarity": "rare",
        "search": "Breviceps macrops",
        "description": "Sinh vật tròn xoe cáu kỉnh phát ra tiếng kêu dễ thương nhất hành tinh.",
        "buff": { "type": "idle_points_percent", "value": 0.30 },
        "defaultOwned": False,
    },
    {
        "id": "pacman_frog",
        "nameVi": "Ếch Pacman",
        "nameEn": "Pacman Frog",
        "scientificName": "Ceratophrys cranwelli",
        "rarity": "epic",
        "search": "Ceratophrys cranwelli",
        "description": "Cái miệng khổng lồ có thể nuốt chửng cả thế giới. Giúp đàm phán giảm giá nâng cấp.",
        "buff": { "type": "upgrade_discount_percent", "value": 0.15 },
        "defaultOwned": False,
    },
    {
        "id": "blue_poison_frog",
        "nameVi": "Ếch Phi Tiêu Độc Xanh",
        "nameEn": "Blue Poison Dart Frog",
        "scientificName": "Dendrobates tinctorius azureus",
        "rarity": "epic",
        "search": "Dendrobates tinctorius azureus",
        "description": "Sắc xanh lam mê hoặc và nọc độc chết người. Khiến mỗi cú đánh chí mạng phát nổ uy lực.",
        "buff": { "type": "crit_multiplier_bonus", "value": 1.0 },
        "defaultOwned": False,
    },
    {
        "id": "glass_frog",
        "nameVi": "Ếch Thủy Tinh",
        "nameEn": "Glass Frog",
        "scientificName": "Hyalinobatrachium dianae",
        "rarity": "epic",
        "search": "Centrolenidae glass frog",
        "description": "Lớp da trong suốt nhìn thấu nội tạng, mang lại sự tinh tế và khuếch đại tổng điểm.",
        "buff": { "type": "total_points_percent", "value": 0.35 },
        "defaultOwned": False,
    },
    {
        "id": "mossy_frog",
        "nameVi": "Ếch Rêu Việt Nam",
        "nameEn": "Vietnamese Mossy Frog",
        "scientificName": "Theloderma corticale",
        "rarity": "epic",
        "search": "Theloderma corticale",
        "description": "Đặc sản tự hào từ núi rừng Việt Nam với lớp da ngụy trang rêu đá tuyệt mỹ.",
        "buff": { "type": "total_points_percent", "value": 0.45 },
        "defaultOwned": False,
    },
    {
        "id": "golden_frog",
        "nameVi": "Ếch Vàng Panama",
        "nameEn": "Panamanian Golden Frog",
        "scientificName": "Atelopus zeteki",
        "rarity": "legendary",
        "search": "Atelopus zeteki",
        "description": "Biểu tượng của tài lộc và sự thịnh vượng, mang lại vận may chí mạng cực lớn.",
        "buff": { "type": "crit_chance_bonus", "value": 0.12 },
        "defaultOwned": False,
    },
    {
        "id": "golden_dart_frog",
        "nameVi": "Ếch Phi Tiêu Độc Vàng",
        "nameEn": "Golden Poison Dart Frog",
        "scientificName": "Phyllobates terribilis",
        "rarity": "legendary",
        "search": "Phyllobates terribilis",
        "description": "Loài ếch chứa độc tố tự nhiên mạnh nhất Trái Đất. Khuếch đại sát thương sờ ếch lên tầm cao mới.",
        "buff": { "type": "crit_multiplier_bonus", "value": 2.5 },
        "defaultOwned": False,
    },
    {
        "id": "king_frog",
        "nameVi": "Ếch Vua Vương Giả",
        "nameEn": "King Frog",
        "scientificName": "Lithobates catesbeianus Rex",
        "rarity": "mythic",
        "search": "Bullfrog Lithobates catesbeianus",
        "description": "Vua tối cao của loài ếch, đội vương miện hoàng gia và ra lệnh cho toàn bộ ao sen.",
        "buff": { "type": "total_points_percent", "value": 0.80 },
        "defaultOwned": False,
        "mythicEffect": "crown",
    },
    {
        "id": "galaxy_frog",
        "nameVi": "Ếch Ngân Hà Vũ Trụ",
        "nameEn": "Cosmic Galaxy Frog",
        "scientificName": "Batrachia Celestia",
        "rarity": "mythic",
        "search": "Agalychnis callidryas",
        "description": "Thực thể vũ trụ hấp thu tinh tú, mỗi lần sờ là một chòm sao sinh ra.",
        "buff": { "type": "click_points_percent", "value": 1.20 },
        "defaultOwned": False,
        "mythicEffect": "galaxy",
    },
    {
        "id": "lotus_guardian_frog",
        "nameVi": "Ếch Thần Ao Sen",
        "nameEn": "Lotus Guardian Frog",
        "scientificName": "Pelophylax Sacrum",
        "rarity": "mythic",
        "search": "Pelophylax",
        "description": "Thần hộ mệnh ngàn năm của Ao Sen Bách Diệp, ban phước lành vô tận.",
        "buff": { "type": "idle_points_percent", "value": 1.50 },
        "defaultOwned": False,
        "mythicEffect": "lotus",
    },
]

def clean_html(raw_html):
    if not raw_html:
        return "Unknown"
    cleanr = re.compile('<.*?>')
    return re.sub(cleanr, '', raw_html).strip()

def fetch_wikimedia_photo(search_term):
    params = {
        "action": "query",
        "list": "search",
        "srsearch": search_term,
        "srnamespace": "6",
        "format": "json"
    }
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "SEchGame/1.0 (educational/game project)"})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read().decode('utf-8'))
            results = data.get("query", {}).get("search", [])
            if not results:
                return None
            title = results[0]["title"]
            
            # Get image details and thumbnail
            detail_params = {
                "action": "query",
                "titles": title,
                "prop": "imageinfo",
                "iiprop": "url|extmetadata",
                "iiurlwidth": "640",
                "format": "json"
            }
            detail_url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(detail_params)
            req2 = urllib.request.Request(detail_url, headers={"User-Agent": "SEchGame/1.0"})
            with urllib.request.urlopen(req2, timeout=10) as r2:
                detail_data = json.loads(r2.read().decode('utf-8'))
                pages = detail_data.get("query", {}).get("pages", {})
                page_info = list(pages.values())[0]
                imageinfo = page_info.get("imageinfo", [{}])[0]
                thumb_url = imageinfo.get("thumburl") or imageinfo.get("url")
                meta = imageinfo.get("extmetadata", {})
                artist = clean_html(meta.get("Artist", {}).get("value", "Wikimedia Contributor"))
                license_name = clean_html(meta.get("LicenseShortName", {}).get("value", "CC-BY-SA"))
                desc_url = imageinfo.get("descriptionurl", f"https://commons.wikimedia.org/wiki/{title}")
                return {
                    "title": title,
                    "url": thumb_url,
                    "artist": artist[:50],
                    "license": license_name,
                    "desc_url": desc_url
                }
    except Exception as e:
        print(f"Error fetching for {search_term}: {e}")
        return None

def process_frog_image(img_data, output_path, mythic_type=None):
    # Decode image buffer to OpenCV BGR
    nparr = np.frombuffer(img_data, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        return False

    h, w = img_bgr.shape[:2]
    
    # GrabCut segmentation
    mask = np.zeros((h, w), np.uint8)
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)
    # Bounding box with 6% border margin
    margin_x = max(10, int(w * 0.06))
    margin_y = max(10, int(h * 0.06))
    rect = (margin_x, margin_y, w - 2 * margin_x, h - 2 * margin_y)
    
    try:
        cv2.grabCut(img_bgr, mask, rect, bgdModel, fgdModel, 3, cv2.GC_INIT_WITH_RECT)
        fg_mask = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')
        
        # Smooth mask edges
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel)
        fg_mask_blurred = cv2.GaussianBlur(fg_mask * 255, (5, 5), 0)
    except Exception as e:
        print(f"GrabCut fallback: {e}")
        fg_mask_blurred = np.full((h, w), 255, dtype=np.uint8)

    # Convert BGR to RGB
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    
    # Create PIL image with transparent Alpha
    pil_img = Image.fromarray(img_rgb).convert("RGBA")
    alpha_img = Image.fromarray(fg_mask_blurred)
    pil_img.putalpha(alpha_img)
    
    # Crop to bounding box of frog content
    bbox = pil_img.getbbox()
    if bbox:
        pil_img = pil_img.crop(bbox)
        
    # Resize to standard size (512x512) centered with padding
    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    pil_img.thumbnail((450, 450), Image.Resampling.LANCZOS)
    offset_x = (512 - pil_img.width) // 2
    offset_y = (512 - pil_img.height) // 2
    canvas.paste(pil_img, (offset_x, offset_y), pil_img)
    
    # Artistic effects for Mythic frogs
    if mythic_type == "crown":
        # Add royal golden glow
        glow = canvas.filter(ImageFilter.GaussianBlur(12))
        enhancer = ImageEnhance.Color(glow)
        glow = enhancer.enhance(2.0)
        canvas = Image.alpha_composite(glow, canvas)
    elif mythic_type == "galaxy":
        # Cosmic purple/blue tint and star shimmer
        enhancer = ImageEnhance.Color(canvas)
        canvas = enhancer.enhance(1.8)
        # Shift colors to celestial violet
        r, g, b, a = canvas.split()
        b = b.point(lambda p: min(255, int(p * 1.35)))
        r = r.point(lambda p: min(255, int(p * 1.25)))
        canvas = Image.merge("RGBA", (r, g, b, a))
    elif mythic_type == "lotus":
        # Lotus green and golden emerald radiance
        enhancer = ImageEnhance.Brightness(canvas)
        canvas = enhancer.enhance(1.15)
        glow = canvas.filter(ImageFilter.GaussianBlur(10))
        canvas = Image.alpha_composite(glow, canvas)

    # Save as transparent WebP
    canvas.save(output_path, "WEBP", quality=90)
    return True

print("=== Starting Frog Image Fetching and Processing ===")
credits_list = []

for frog in FROGS_METADATA:
    frog_id = frog["id"]
    output_path = os.path.join(OUTPUT_DIR, f"{frog_id}.webp")
    print(f"Processing [{frog['rarity'].upper()}] {frog['nameVi']} ({frog['scientificName']})...")
    
    photo_info = fetch_wikimedia_photo(frog["search"])
    if not photo_info:
        # Fallback query
        photo_info = fetch_wikimedia_photo(frog["nameEn"])

    if photo_info:
        print(f"  Found: {photo_info['title']} by {photo_info['artist']} ({photo_info['license']})")
        try:
            req = urllib.request.Request(photo_info["url"], headers={"User-Agent": "SEchGame/1.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                img_data = resp.read()
                success = process_frog_image(img_data, output_path, frog.get("mythicEffect"))
                if success:
                    print(f"  ✓ Saved to: public/assets/frogs/{frog_id}.webp")
                    credits_list.append({
                        "id": frog_id,
                        "nameVi": frog["nameVi"],
                        "scientificName": frog["scientificName"],
                        "file": f"/assets/frogs/{frog_id}.webp",
                        "artist": photo_info["artist"],
                        "license": photo_info["license"],
                        "sourceUrl": photo_info["desc_url"],
                    })
                else:
                    print("  Failed to process image")
        except Exception as e:
            print(f"  Download error: {e}")
    else:
        print(f"  Could not find photo for {frog['nameVi']}")

# Save CREDITS.md
credits_md_path = os.path.join(os.getcwd(), "CREDITS.md")
with open(credits_md_path, "w", encoding="utf-8") as f:
    f.write("# BẢN QUYỀN VÀ NGUỒN TÀI NGUYÊN HÌNH ẢNH ẾCH THẬT 🐸\n\n")
    f.write("Dự án **S ếch** cam kết sử dụng hình ảnh thực tế được cấp phép hợp pháp (Creative Commons / Public Domain) từ **Wikimedia Commons**.\n\n")
    f.write("| Tên tiếng Việt | Tên khoa học | Tác giả (Artist) | Giấy phép (License) | Nguồn (Source) |\n")
    f.write("|---|---|---|---|---|\n")
    for c in credits_list:
        f.write(f"| {c['nameVi']} | *{c['scientificName']}* | {c['artist']} | {c['license']} | [Wikimedia Link]({c['sourceUrl']}) |\n")
    f.write("\n> Quy trình xử lý: Ảnh được trích xuất từ nguồn Wikimedia Commons, tách nền trong suốt bằng OpenCV GrabCut, chuẩn hóa kích thước 512x512 và tối ưu định dạng WebP chất lượng cao.\n")

print(f"Credits saved to {credits_md_path}")

# Write frogs.ts data
frogs_ts_path = os.path.join(os.getcwd(), "src", "data", "frogs.ts")
os.makedirs(os.path.dirname(frogs_ts_path), exist_ok=True)

with open(frogs_ts_path, "w", encoding="utf-8") as f:
    f.write("import { FrogSpecies } from '../engine/types';\n\n")
    f.write("export const FROG_SPECIES_LIST: FrogSpecies[] = [\n")
    credit_map = {c["id"]: c for c in credits_list}
    for frog in FROGS_METADATA:
        c = credit_map.get(frog["id"], {
            "artist": "Wikimedia Commons Contributor",
            "license": "CC-BY-SA",
            "sourceUrl": "https://commons.wikimedia.org"
        })
        f.write("  {\n")
        f.write(f"    id: '{frog['id']}',\n")
        f.write(f"    nameVi: '{frog['nameVi']}',\n")
        f.write(f"    nameEn: '{frog['nameEn']}',\n")
        f.write(f"    scientificName: '{frog['scientificName']}',\n")
        f.write(f"    rarity: '{frog['rarity']}',\n")
        f.write(f"    description: '{frog['description']}',\n")
        f.write(f"    image: '/assets/frogs/{frog['id']}.webp',\n")
        f.write(f"    buff: {{ type: '{frog['buff']['type']}', value: {frog['buff']['value']} }},\n")
        f.write(f"    credit: {{\n")
        f.write(f"      source: 'Wikimedia Commons',\n")
        f.write(f"      author: '{c['artist']}',\n")
        f.write(f"      license: '{c['license']}',\n")
        f.write(f"      url: '{c['sourceUrl']}',\n")
        f.write("    },\n")
        f.write("  },\n")
    f.write("];\n")

print("Generated src/data/frogs.ts successfully!")
