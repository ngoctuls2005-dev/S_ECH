import os
import math
from PIL import Image, ImageDraw, ImageFilter

FROGS_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'frogs')
os.makedirs(FROGS_DIR, exist_ok=True)

FROG_SPECS = {
    'australian_green_tree_frog': {
        'body_color': (82, 178, 100),
        'belly_color': (220, 245, 210),
        'spot_color': (240, 255, 240),
        'eye_color': (212, 160, 23),
        'glow': (100, 200, 120, 70),
        'pupil_h': True,
        'features': 'chubby'
    },
    'gray_tree_frog': {
        'body_color': (140, 150, 142),
        'belly_color': (215, 220, 215),
        'spot_color': (85, 95, 88),
        'eye_color': (190, 175, 70),
        'glow': (160, 170, 160, 50),
        'pupil_h': True,
        'features': 'lichen'
    },
    'wood_frog': {
        'body_color': (165, 115, 80),
        'belly_color': (235, 220, 200),
        'spot_color': (50, 35, 25),
        'eye_color': (210, 160, 60),
        'glow': (180, 130, 90, 50),
        'pupil_h': True,
        'features': 'mask'
    },
    'marsh_frog': {
        'body_color': (90, 135, 70),
        'belly_color': (210, 230, 195),
        'spot_color': (45, 75, 35),
        'eye_color': (200, 170, 40),
        'glow': (110, 160, 80, 60),
        'pupil_h': True,
        'features': 'spotted'
    },
    'fire_bellied_toad': {
        'body_color': (60, 95, 60),
        'belly_color': (245, 85, 25),
        'spot_color': (25, 35, 25),
        'eye_color': (210, 150, 40),
        'glow': (240, 90, 30, 80),
        'pupil_h': False,
        'features': 'fire'
    },
    'amazon_milk_frog': {
        'body_color': (145, 195, 195),
        'belly_color': (230, 245, 245),
        'spot_color': (70, 50, 45),
        'eye_color': (220, 215, 190),
        'glow': (150, 210, 210, 90),
        'pupil_h': False,
        'features': 'cross_eyes'
    },
    'white_lipped_tree_frog': {
        'body_color': (50, 170, 85),
        'belly_color': (225, 250, 225),
        'spot_color': (255, 255, 255),
        'eye_color': (215, 180, 50),
        'glow': (60, 190, 100, 80),
        'pupil_h': True,
        'features': 'white_lip'
    },
    'african_bullfrog': {
        'body_color': (110, 130, 65),
        'belly_color': (230, 210, 130),
        'spot_color': (65, 80, 40),
        'eye_color': (195, 140, 40),
        'glow': (130, 150, 80, 70),
        'pupil_h': True,
        'features': 'massive'
    },
    'harlequin_toad': {
        'body_color': (25, 25, 30),
        'belly_color': (240, 100, 30),
        'spot_color': (250, 130, 30),
        'eye_color': (255, 200, 50),
        'glow': (255, 120, 30, 100),
        'pupil_h': True,
        'features': 'harlequin'
    },
    'goliath_frog': {
        'body_color': (85, 105, 75),
        'belly_color': (220, 225, 180),
        'spot_color': (50, 65, 45),
        'eye_color': (180, 150, 50),
        'glow': (100, 130, 90, 80),
        'pupil_h': True,
        'features': 'giant'
    },
    'clown_tree_frog': {
        'body_color': (220, 140, 45),
        'belly_color': (250, 230, 180),
        'spot_color': (70, 30, 20),
        'eye_color': (240, 190, 60),
        'glow': (240, 150, 50, 90),
        'pupil_h': False,
        'features': 'clown_bands'
    },
    'spotted_salamander_frog': {
        'body_color': (45, 50, 55),
        'belly_color': (190, 200, 185),
        'spot_color': (235, 195, 55),
        'eye_color': (215, 185, 45),
        'glow': (230, 190, 50, 90),
        'pupil_h': True,
        'features': 'leopard_spots'
    },
    'ornate_horned_frog': {
        'body_color': (95, 140, 70),
        'belly_color': (230, 225, 185),
        'spot_color': (160, 45, 40),
        'eye_color': (220, 180, 60),
        'glow': (170, 80, 60, 100),
        'pupil_h': True,
        'features': 'horns'
    },
    'strawberry_poison_frog': {
        'body_color': (235, 40, 55),
        'belly_color': (245, 90, 100),
        'spot_color': (35, 75, 170),
        'eye_color': (30, 30, 40),
        'glow': (250, 60, 80, 120),
        'pupil_h': False,
        'features': 'strawberry_bluelegs'
    },
    'yellow_banded_poison_frog': {
        'body_color': (30, 30, 35),
        'belly_color': (245, 200, 35),
        'spot_color': (250, 210, 40),
        'eye_color': (240, 190, 40),
        'glow': (255, 215, 45, 120),
        'pupil_h': False,
        'features': 'yellow_bands'
    },
    'giant_monkey_frog': {
        'body_color': (65, 165, 90),
        'belly_color': (220, 245, 220),
        'spot_color': (240, 255, 255),
        'eye_color': (215, 205, 175),
        'glow': (100, 220, 140, 110),
        'pupil_h': True,
        'features': 'waxy'
    },
    'tiger_leg_monkey_frog': {
        'body_color': (50, 155, 90),
        'belly_color': (245, 140, 40),
        'spot_color': (30, 30, 35),
        'eye_color': (235, 215, 140),
        'glow': (245, 150, 50, 110),
        'pupil_h': True,
        'features': 'tiger_stripes'
    },
    'splendid_leaf_frog': {
        'body_color': (55, 130, 95),
        'belly_color': (240, 175, 40),
        'spot_color': (140, 65, 150),
        'eye_color': (240, 110, 40),
        'glow': (180, 80, 220, 120),
        'pupil_h': True,
        'features': 'splendid_webbing'
    },
    'borneo_eared_frog': {
        'body_color': (195, 155, 80),
        'belly_color': (235, 220, 180),
        'spot_color': (85, 55, 30),
        'eye_color': (215, 170, 55),
        'glow': (210, 170, 90, 110),
        'pupil_h': True,
        'features': 'crested_ears'
    },
    'wallace_flying_frog': {
        'body_color': (45, 175, 95),
        'belly_color': (245, 235, 160),
        'spot_color': (245, 195, 35),
        'eye_color': (230, 205, 75),
        'glow': (70, 220, 130, 130),
        'pupil_h': True,
        'features': 'huge_webbed_parachutes'
    },
    'black_rain_frog': {
        'body_color': (35, 35, 40),
        'belly_color': (60, 60, 65),
        'spot_color': (20, 20, 25),
        'eye_color': (140, 140, 155),
        'glow': (80, 80, 110, 120),
        'pupil_h': True,
        'features': 'grumpy_spherical'
    },
    'granular_poison_frog': {
        'body_color': (230, 75, 40),
        'belly_color': (40, 80, 150),
        'spot_color': (30, 65, 130),
        'eye_color': (25, 25, 30),
        'glow': (245, 95, 50, 130),
        'pupil_h': False,
        'features': 'granular_red_blue'
    },
    'malayan_horned_frog': {
        'body_color': (145, 105, 65),
        'belly_color': (210, 185, 150),
        'spot_color': (70, 45, 25),
        'eye_color': (190, 145, 70),
        'glow': (170, 120, 80, 120),
        'pupil_h': True,
        'features': 'dead_leaf_horns'
    },
    'phoenix_frog': {
        'body_color': (245, 80, 30),
        'belly_color': (255, 215, 60),
        'spot_color': (255, 240, 120),
        'eye_color': (255, 255, 220),
        'glow': (255, 100, 30, 170),
        'pupil_h': False,
        'features': 'phoenix_flames'
    },
    'chronos_frog': {
        'body_color': (60, 40, 115),
        'belly_color': (140, 215, 255),
        'spot_color': (235, 190, 70),
        'eye_color': (120, 235, 255),
        'glow': (100, 180, 255, 170),
        'pupil_h': False,
        'features': 'cosmic_chronos'
    }
}

def render_frog(name, spec):
    W, H = 512, 512
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Glow layer
    glow_img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)
    glow_col = spec['glow']
    glow_draw.ellipse([80, 120, 432, 440], fill=glow_col)
    glow_img = glow_img.filter(ImageFilter.GaussianBlur(30))
    img = Image.alpha_composite(img, glow_img)
    draw = ImageDraw.Draw(img)

    body_col = spec['body_color']
    belly_col = spec['belly_color']
    spot_col = spec['spot_color']
    eye_col = spec['eye_color']
    features = spec['features']

    # Special features background (wings, webs, flames)
    if features == 'huge_webbed_parachutes':
        # Webbed parachute feet
        draw.polygon([(70, 340), (20, 440), (130, 470), (140, 390)], fill=(30, 40, 35, 230))
        draw.polygon([(442, 340), (492, 440), (382, 470), (372, 390)], fill=(30, 40, 35, 230))
        draw.line([(70, 340), (20, 440), (75, 455), (130, 470), (140, 390)], fill=spot_col, width=4)
        draw.line([(442, 340), (492, 440), (437, 455), (382, 470), (372, 390)], fill=spot_col, width=4)
    elif features == 'phoenix_flames':
        # Flaming aura feathers
        for angle in range(-45, 230, 25):
            rad = math.radians(angle)
            x1 = 256 + int(math.cos(rad) * 150)
            y1 = 260 + int(math.sin(rad) * 130)
            x2 = 256 + int(math.cos(rad) * 230)
            y2 = 260 + int(math.sin(rad) * 200)
            draw.line([(x1, y1), (x2, y2)], fill=(255, 140, 20, 180), width=12)
            draw.line([(x1, y1), (x2, y2)], fill=(255, 220, 80, 220), width=5)
    elif features == 'cosmic_chronos':
        # Clock ring
        draw.ellipse([60, 60, 452, 452], outline=(100, 220, 255, 120), width=4)
        for d in range(12):
            rad = math.radians(d * 30)
            cx = 256 + int(math.cos(rad) * 185)
            cy = 256 + int(math.sin(rad) * 185)
            draw.ellipse([cx-5, cy-5, cx+5, cy+5], fill=(240, 210, 80, 220))

    # Back legs
    draw.ellipse([70, 270, 190, 430], fill=body_col, outline=(30, 30, 30, 80), width=3)
    draw.ellipse([322, 270, 442, 430], fill=body_col, outline=(30, 30, 30, 80), width=3)

    if features == 'tiger_stripes':
        # Tiger leg stripes
        for y in range(290, 410, 22):
            draw.line([(85, y), (170, y+8)], fill=spot_col, width=6)
            draw.line([(427, y), (342, y+8)], fill=spot_col, width=6)
    elif features == 'strawberry_bluelegs':
        draw.ellipse([70, 270, 190, 430], fill=(40, 85, 180), outline=(20, 40, 100, 100), width=3)
        draw.ellipse([322, 270, 442, 430], fill=(40, 85, 180), outline=(20, 40, 100, 100), width=3)

    # Feet
    draw.ellipse([50, 410, 150, 460], fill=body_col)
    draw.ellipse([362, 410, 462, 460], fill=body_col)

    # Main Body
    body_box = [110, 150, 402, 430]
    if features in ('massive', 'grumpy_spherical', 'chubby'):
        body_box = [95, 140, 417, 440]
    draw.ellipse(body_box, fill=body_col, outline=(25, 25, 25, 70), width=3)

    # Belly
    draw.ellipse([145, 220, 367, 420], fill=belly_col)

    # Spots / Patterns
    if features == 'spotted' or features == 'leopard_spots':
        spots = [(170, 210, 18), (340, 210, 16), (220, 260, 22), (290, 270, 20), (160, 330, 25), (350, 330, 22), (256, 350, 24)]
        for (sx, sy, sr) in spots:
            draw.ellipse([sx-sr, sy-sr, sx+sr, sy+sr], fill=spot_col)
            if features == 'leopard_spots':
                draw.ellipse([sx-sr+3, sy-sr+3, sx+sr-3, sy+sr-3], fill=(245, 205, 50))
    elif features == 'yellow_bands' or features == 'clown_bands':
        for by in (190, 270, 340):
            draw.arc([115, by, 397, by+70], start=200, end=340, fill=spot_col, width=16)
    elif features == 'lichen':
        for (lx, ly) in [(180, 200), (320, 220), (200, 310), (310, 330), (256, 260)]:
            draw.polygon([(lx, ly-15), (lx+18, ly), (lx+10, ly+18), (lx-14, ly+12)], fill=spot_col)
    elif features == 'mask':
        # Robber mask through eyes
        draw.polygon([(110, 160), (390, 160), (410, 200), (330, 225), (170, 225), (90, 200)], fill=(40, 25, 20, 220))
    elif features == 'white_lip':
        draw.arc([140, 220, 372, 280], start=20, end=160, fill=(255, 255, 255), width=8)

    # Front arms / hands
    draw.ellipse([120, 320, 180, 420], fill=body_col)
    draw.ellipse([332, 320, 392, 420], fill=body_col)

    # Head & Eyeballs
    eye_l_box = [130, 110, 220, 200]
    eye_r_box = [292, 110, 382, 200]

    # Horns / Crests
    if features == 'horns' or features == 'dead_leaf_horns':
        draw.polygon([(160, 115), (145, 60), (185, 105)], fill=body_col, outline=(30, 30, 30, 90))
        draw.polygon([(352, 115), (367, 60), (327, 105)], fill=body_col, outline=(30, 30, 30, 90))
        if features == 'dead_leaf_horns':
            # Pointy leaf nose
            draw.polygon([(240, 220), (256, 175), (272, 220)], fill=body_col, outline=(30, 30, 30, 90))
    elif features == 'crested_ears':
        draw.polygon([(135, 120), (95, 80), (145, 100)], fill=body_col)
        draw.polygon([(377, 120), (417, 80), (367, 100)], fill=body_col)

    draw.ellipse(eye_l_box, fill=body_col)
    draw.ellipse(eye_r_box, fill=body_col)

    # Eye irises
    draw.ellipse([142, 122, 208, 188], fill=eye_col)
    draw.ellipse([304, 122, 370, 188], fill=eye_col)

    # Pupils
    if spec.get('pupil_h', True):
        draw.ellipse([152, 147, 198, 163], fill=(15, 15, 20))
        draw.ellipse([314, 147, 360, 163], fill=(15, 15, 20))
    else:
        draw.ellipse([167, 132, 183, 178], fill=(15, 15, 20))
        draw.ellipse([329, 132, 345, 178], fill=(15, 15, 20))

    # Eye reflections (cute sparkle)
    draw.ellipse([156, 134, 168, 146], fill=(255, 255, 255, 230))
    draw.ellipse([318, 134, 330, 146], fill=(255, 255, 255, 230))

    # Mouth expression
    if features in ('massive', 'grumpy_spherical'):
        # Grumpy frown
        draw.arc([190, 240, 322, 300], start=210, end=330, fill=(40, 30, 30), width=4)
    else:
        # Happy frog smile
        draw.arc([195, 215, 317, 265], start=30, end=150, fill=(40, 30, 30), width=4)
        # Rosy cheeks
        draw.ellipse([150, 225, 185, 245], fill=(255, 130, 140, 80))
        draw.ellipse([327, 225, 362, 245], fill=(255, 130, 140, 80))

    # Nostrils
    draw.ellipse([240, 195, 246, 202], fill=(40, 30, 30))
    draw.ellipse([266, 195, 272, 202], fill=(40, 30, 30))

    out_path = os.path.join(FROGS_DIR, f"{name}.webp")
    img.save(out_path, 'WEBP', quality=90)
    print(f"Generated {name}.webp ({os.path.getsize(out_path)} bytes)")

def main():
    for name, spec in FROG_SPECS.items():
        render_frog(name, spec)
    print(f"Successfully generated {len(FROG_SPECS)} frog species images.")

if __name__ == '__main__':
    main()

