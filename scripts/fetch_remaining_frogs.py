import os
import sys
import time
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

TARGETS = [
    {
        "id": "rain_frog",
        "nameVi": "Ếch Mưa Sa Mạc",
        "scientificName": "Breviceps macrops",
        "search": "Breviceps adspersus",
    },
    {
        "id": "glass_frog",
        "nameVi": "Ếch Thủy Tinh",
        "scientificName": "Hyalinobatrachium dianae",
        "search": "Centrolene glass frog",
    },
    {
        "id": "mossy_frog",
        "nameVi": "Ếch Rêu Việt Nam",
        "scientificName": "Theloderma corticale",
        "search": "Theloderma corticale",
    },
    {
        "id": "golden_frog",
        "nameVi": "Ếch Vàng Panama",
        "scientificName": "Atelopus zeteki",
        "search": "Atelopus zeteki",
    },
    {
        "id": "golden_dart_frog",
        "nameVi": "Ếch Phi Tiêu Độc Vàng",
        "scientificName": "Phyllobates terribilis",
        "search": "Phyllobates terribilis",
    },
    {
        "id": "king_frog",
        "nameVi": "Ếch Vua Vương Giả",
        "scientificName": "Lithobates catesbeianus",
        "search": "American bullfrog Lithobates",
        "mythicEffect": "crown",
    },
    {
        "id": "galaxy_frog",
        "nameVi": "Ếch Ngân Hà Vũ Trụ",
        "scientificName": "Batrachia Celestia",
        "search": "Hyla tree frog",
        "mythicEffect": "galaxy",
    },
]

def clean_html(raw_html):
    if not raw_html:
        return "Unknown"
    cleanr = re.compile('<.*?>')
    return re.sub(cleanr, '', raw_html).strip()

def search_wikimedia_image(query):
    time.sleep(2.5) # Avoid rate limit
    params = {
        "action": "query",
        "list": "search",
        "srsearch": f"{query} filetype:bitmap",
        "srnamespace": "6",
        "srlimit": "8",
        "format": "json"
    }
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    headers = {"User-Agent": "SEchFrogBot/1.0 (educational nature game; contact: student@antigravity.dev)"}
    req = urllib.request.Request(url, headers=headers)
    
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            data = json.loads(r.read().decode('utf-8'))
            results = data.get("query", {}).get("search", [])
            valid_title = None
            for item in results:
                t = item["title"].lower()
                if any(t.endswith(ext) for ext in [".jpg", ".jpeg", ".png"]) and not any(bad in t for bad in ["map", "pdf", "range", "diagram"]):
                    valid_title = item["title"]
                    break
            
            if not valid_title and results:
                for item in results:
                    t = item["title"].lower()
                    if any(ext in t for ext in [".jpg", ".jpeg", ".png"]):
                        valid_title = item["title"]
                        break
            
            if not valid_title:
                return None
                
            time.sleep(1.5)
            detail_params = {
                "action": "query",
                "titles": valid_title,
                "prop": "imageinfo",
                "iiprop": "url|extmetadata",
                "iiurlwidth": "640",
                "format": "json"
            }
            detail_url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(detail_params)
            req2 = urllib.request.Request(detail_url, headers=headers)
            with urllib.request.urlopen(req2, timeout=12) as r2:
                detail_data = json.loads(r2.read().decode('utf-8'))
                pages = detail_data.get("query", {}).get("pages", {})
                page_info = list(pages.values())[0]
                imageinfo = page_info.get("imageinfo", [{}])[0]
                thumb_url = imageinfo.get("thumburl") or imageinfo.get("url")
                meta = imageinfo.get("extmetadata", {})
                artist = clean_html(meta.get("Artist", {}).get("value", "Wikimedia Contributor"))
                license_name = clean_html(meta.get("LicenseShortName", {}).get("value", "CC-BY-SA"))
                desc_url = imageinfo.get("descriptionurl", f"https://commons.wikimedia.org/wiki/{valid_title}")
                return {
                    "title": valid_title,
                    "url": thumb_url,
                    "artist": artist[:50],
                    "license": license_name,
                    "desc_url": desc_url
                }
    except Exception as e:
        print(f"Error fetching {query}: {e}")
        return None

def process_and_save(img_data, output_path, mythic_type=None):
    nparr = np.frombuffer(img_data, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        return False
        
    h, w = img_bgr.shape[:2]
    mask = np.zeros((h, w), np.uint8)
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)
    margin_x = max(10, int(w * 0.07))
    margin_y = max(10, int(h * 0.07))
    rect = (margin_x, margin_y, w - 2 * margin_x, h - 2 * margin_y)
    
    try:
        cv2.grabCut(img_bgr, mask, rect, bgdModel, fgdModel, 3, cv2.GC_INIT_WITH_RECT)
        fg_mask = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel)
        fg_mask_blurred = cv2.GaussianBlur(fg_mask * 255, (5, 5), 0)
    except Exception as e:
        fg_mask_blurred = np.full((h, w), 255, dtype=np.uint8)

    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(img_rgb).convert("RGBA")
    pil_img.putalpha(Image.fromarray(fg_mask_blurred))
    
    bbox = pil_img.getbbox()
    if bbox:
        pil_img = pil_img.crop(bbox)
        
    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    pil_img.thumbnail((450, 450), Image.Resampling.LANCZOS)
    offset_x = (512 - pil_img.width) // 2
    offset_y = (512 - pil_img.height) // 2
    canvas.paste(pil_img, (offset_x, offset_y), pil_img)
    
    if mythic_type == "crown":
        glow = canvas.filter(ImageFilter.GaussianBlur(15))
        enhancer = ImageEnhance.Color(glow)
        canvas = Image.alpha_composite(enhancer.enhance(2.5), canvas)
    elif mythic_type == "galaxy":
        enhancer = ImageEnhance.Color(canvas)
        canvas = enhancer.enhance(1.8)
        r, g, b, a = canvas.split()
        b = b.point(lambda p: min(255, int(p * 1.4)))
        r = r.point(lambda p: min(255, int(p * 1.3)))
        canvas = Image.merge("RGBA", (r, g, b, a))

    canvas.save(output_path, "WEBP", quality=90)
    return True

print("=== Fetching remaining species ===")
updated_credits = []

for t in TARGETS:
    frog_id = t["id"]
    output_path = os.path.join(OUTPUT_DIR, f"{frog_id}.webp")
    print(f"Fetching {t['nameVi']} ({t['scientificName']})...")
    info = search_wikimedia_image(t["search"])
    if info:
        print(f"  Got: {info['title']} by {info['artist']}")
        try:
            req = urllib.request.Request(info["url"], headers={"User-Agent": "SEchFrogBot/1.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                success = process_and_save(resp.read(), output_path, t.get("mythicEffect"))
                if success:
                    print(f"  ✓ Saved {output_path}")
                    updated_credits.append({
                        "id": frog_id,
                        "nameVi": t["nameVi"],
                        "scientificName": t["scientificName"],
                        "artist": info["artist"],
                        "license": info["license"],
                        "url": info["desc_url"]
                    })
        except Exception as e:
            print(f"  Download error: {e}")
    else:
        print(f"  Failed to find photo for {t['nameVi']}")

print("=== Finished fetching remaining species ===")
