import urllib.request
import urllib.parse
import json

species_list = [
    {"id": "green_frog", "query": "Pelophylax ridibundus", "fallback": "Green frog"},
    {"id": "brown_frog", "query": "Rana temporaria", "fallback": "Common frog"},
    {"id": "tree_frog", "query": "Hyla arborea", "fallback": "Tree frog"},
    {"id": "red_eyed_frog", "query": "Agalychnis callidryas", "fallback": "Red eyed tree frog"},
    {"id": "tomato_frog", "query": "Dyscophus antongilii", "fallback": "Tomato frog"},
    {"id": "rain_frog", "query": "Breviceps macrops", "fallback": "Desert rain frog"},
    {"id": "pacman_frog", "query": "Ceratophrys cranwelli", "fallback": "Ceratophrys"},
    {"id": "blue_poison_frog", "query": "Dendrobates tinctorius azureus", "fallback": "Dendrobates azureus"},
    {"id": "glass_frog", "query": "Hyalinobatrachium", "fallback": "Centrolenidae"},
    {"id": "mossy_frog", "query": "Theloderma corticale", "fallback": "Vietnamese mossy frog"},
    {"id": "golden_frog", "query": "Atelopus zeteki", "fallback": "Panamanian golden frog"},
    {"id": "golden_dart_frog", "query": "Phyllobates terribilis", "fallback": "Golden poison frog"},
]

def search_wikimedia(query):
    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": f"{query} filetype:bitmap",
        "gsrlimit": 5,
        "prop": "imageinfo",
        "iiprop": "url|size|extmetadata|mime",
        "format": "json"
    }
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "SEchWebGame/1.0 (contact: student@gemini.dev)"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = data.get("query", {}).get("pages", {})
            results = []
            for page_id, info in pages.items():
                title = info.get("title", "")
                imageinfo = info.get("imageinfo", [{}])[0]
                img_url = imageinfo.get("url")
                thumb_url = imageinfo.get("thumburl", img_url)
                ext = imageinfo.get("extmetadata", {})
                artist = ext.get("Artist", {}).get("value", "Wikimedia Contributor")
                license_short = ext.get("LicenseShortName", {}).get("value", "CC")
                results.append({
                    "title": title,
                    "url": img_url,
                    "artist": artist,
                    "license": license_short,
                    "width": imageinfo.get("width"),
                    "height": imageinfo.get("height"),
                })
            return results
    except Exception as e:
        print(f"Error searching {query}: {e}")
        return []

for s in species_list:
    res = search_wikimedia(s["query"])
    if not res:
        res = search_wikimedia(s["fallback"])
    print(f"Species: {s['id']} ({s['query']}) -> Found {len(res)} results")
    if res:
        best = res[0]
        print(f"  Best: {best['title']} | License: {best['license']} | Artist: {best['artist'][:40] if best['artist'] else ''}")
