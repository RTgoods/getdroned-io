"""Build the GET DRONED YouTube channel graphics from the art in ./source.

    pip install pillow numpy
    python3 youtube/make_graphics.py

Outputs land in ./export next to this script.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = Path(__file__).parent
SRC = HERE / "source"
OUT = HERE / "export"

BLUE = (38, 118, 235)
YELLOW = (250, 200, 30)
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

rng = np.random.default_rng(7)


def load(name):
    return Image.open(SRC / f"{name}.png").convert("RGBA")


def fit(im, w=None, h=None):
    s = min(w / im.width if w else 9e9, h / im.height if h else 9e9)
    return im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)


def glow(im, color, radius, strength=1.0):
    """Coloured halo shaped like the sprite's alpha, same size as im plus padding."""
    pad = radius * 3
    a = Image.new("L", (im.width + pad * 2, im.height + pad * 2), 0)
    a.paste(im.getchannel("A"), (pad, pad))
    a = a.filter(ImageFilter.GaussianBlur(radius)).point(lambda v: min(255, int(v * strength)))
    g = Image.new("RGBA", a.size, color + (0,))
    g.putalpha(a)
    return g, pad


def paste_glow(canvas, im, xy, color, radius, strength=1.0):
    g, pad = glow(im, color, radius, strength)
    canvas.alpha_composite(g, (xy[0] - pad, xy[1] - pad))
    canvas.alpha_composite(im, xy)


def radial(w, h, cx, cy, rx, ry):
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2)
    return np.clip(1 - d, 0, 1) ** 2


def background(w, h, focus_y=None):
    """Dark battlefield backdrop: gradient, flag-coloured haze, HUD grid, embers, grain."""
    focus_y = h / 2 if focus_y is None else focus_y
    y = np.linspace(0, 1, h, dtype=np.float32)[:, None, None]
    top, bot = np.array([6, 8, 13], np.float32), np.array([18, 20, 26], np.float32)
    img = np.broadcast_to(top + (bot - top) * y, (h, w, 3)).copy()

    # blue haze above the centre line, yellow below -- a nod to the wordmark
    s = max(w, h)
    img += radial(w, h, w / 2, focus_y - h * 0.12, s * 0.42, h * 0.55)[..., None] * np.array(BLUE) * 0.34
    img += radial(w, h, w / 2, focus_y + h * 0.28, s * 0.38, h * 0.40)[..., None] * np.array(YELLOW) * 0.20

    # faint HUD grid
    step = max(24, s // 40)
    grid = np.zeros((h, w), np.float32)
    grid[::step, :] = 1
    grid[:, ::step] = 1
    grid *= radial(w, h, w / 2, focus_y, s * 0.7, h * 0.9) * 0.9 + 0.1
    img += grid[..., None] * 9

    # grain
    img += rng.normal(0, 5, (h, w, 1)).astype(np.float32)

    # vignette
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    v = np.sqrt(((xx - w / 2) / (w * 0.62)) ** 2 + ((yy - h / 2) / (h * 0.75)) ** 2)
    img *= np.clip(1.15 - v * 0.55, 0.35, 1)[..., None]

    base = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert("RGBA")
    embers(base, count=int(w * h / 9000))
    return base


def embers(canvas, count):
    w, h = canvas.size
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(count):
        x = rng.uniform(0, w)
        y = h * (1 - rng.beta(1.3, 2.2))  # denser toward the bottom
        r = rng.choice([1, 1, 1.5, 2, 2.5, 3.5]) * max(w, h) / 2560
        c = [(255, 170, 40), (255, 210, 90), (255, 120, 30), (120, 180, 255)][rng.integers(0, 4)]
        a = int(rng.uniform(60, 220))
        d.ellipse([x - r, y - r, x + r, y + r], fill=c + (a,))
    halo = layer.filter(ImageFilter.GaussianBlur(max(w, h) / 500))
    canvas.alpha_composite(halo)
    canvas.alpha_composite(layer)


def text(canvas, xy, s, size, fill, anchor="mm", spacing=0.18, shadow=True):
    font = ImageFont.truetype(FONT, size)
    # manual tracking so the caps breathe like stencil lettering
    widths = [font.getlength(ch) for ch in s]
    total = sum(widths) + size * spacing * (len(s) - 1)
    x = xy[0] - total / 2 if anchor == "mm" else xy[0]
    y = xy[1]
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    cx = x
    for ch, cw in zip(s, widths):
        d.text((cx, y), ch, font=font, fill=fill, anchor="lm")
        cx += cw + size * spacing
    if shadow:
        sh = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
        sh.putalpha(layer.getchannel("A").filter(ImageFilter.GaussianBlur(size / 6)))
        canvas.alpha_composite(sh, (0, size // 12))
    canvas.alpha_composite(layer)
    return total


def ground_shadow(canvas, cx, y, w, h):
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse([cx - w / 2, y - h / 2, cx + w / 2, y + h / 2], fill=(0, 0, 0, 150))
    canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(h / 3)))


def drone_body():
    """Close crop of the drone's armoured body + glowing eye (no props, no wordmark)."""
    logo = load("drone-logo")
    body = logo.crop((560, 60, 1330, 480))
    # feather the crop with a soft ellipse so cut-off rotor arms fade out
    w, h = body.size
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h * 0.45) / (h * 0.62)) ** 2)
    feather = np.clip((1 - d) / 0.25, 0, 1)
    a = np.asarray(body.getchannel("A")).astype(np.float32) * feather
    body.putalpha(Image.fromarray(a.astype(np.uint8)))
    return body.crop(body.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox())


# --------------------------------------------------------------------------- banner

def banner(guide=False):
    W, H = 2560, 1440
    SX0, SY0, SW, SH = (W - 1546) // 2, (H - 423) // 2, 1546, 423  # all-device safe area
    cv = background(W, H)

    logo = fit(load("drone-logo"), h=340)
    lx, ly = (W - logo.width) // 2, SY0 + 4
    paste_glow(cv, logo, (lx, ly), BLUE, 40, 0.9)

    text(cv, (W // 2, SY0 + SH - 30), "AERIAL COMBAT  •  NO INSTALLS  •  NO MERCY",
         26, (235, 235, 240, 255), spacing=0.12)

    feet = SY0 + SH - 6
    squad = [
        # name, height, centre x, mirror
        ("soldier-4", 330, SX0 - 250, False),          # desktop / TV only
        ("soldier-1", 360, SX0 + 180, False),          # in safe area
        ("soldier-3", 360, SX0 + SW - 150, False),     # in safe area
        ("soldier-5", 330, SX0 + SW + 250, False),     # desktop / TV only
    ]
    for name, h, cx, mirror in squad:
        s = fit(load(name), h=h)
        if mirror:
            s = s.transpose(Image.FLIP_LEFT_RIGHT)
        paste_glow(cv, s, (int(cx - s.width / 2), feet - s.height), (0, 0, 0), 14, 0.8)

    # TV-only extras: domain up top, flag bars along the bottom
    text(cv, (W // 2, 200), "GETDRONED.IO", 64, YELLOW + (255,), spacing=0.3)
    bar = Image.new("RGBA", (W, 14), BLUE + (255,))
    cv.alpha_composite(bar, (0, H - 28))
    cv.alpha_composite(Image.new("RGBA", (W, 14), YELLOW + (255,)), (0, H - 14))

    if guide:
        d = ImageDraw.Draw(cv)
        for (w, h), c, label in [((2560, 423), (255, 80, 80), "desktop max 2560x423"),
                                 ((1855, 423), (255, 200, 0), "tablet 1855x423"),
                                 ((1546, 423), (60, 255, 120), "SAFE AREA 1546x423 (all devices)")]:
            box = [(W - w) // 2, (H - h) // 2, (W + w) // 2 - 1, (H + h) // 2 - 1]
            d.rectangle(box, outline=c + (255,), width=4)
            d.text((box[0] + 12, box[1] - 34 - 36 * [2560, 1855, 1546].index(w)), label, fill=c + (255,), font=ImageFont.truetype(FONT, 26))
        d.text((24, 24), "TV: full 2560x1440", fill=(255, 255, 255, 255), font=ImageFont.truetype(FONT, 30))
    return cv.convert("RGB")


# --------------------------------------------------------------------------- profile

def profile_lockup():
    S = 800
    cv = background(S, S, focus_y=S * 0.5)
    logo = fit(load("drone-logo"), w=690)
    paste_glow(cv, logo, ((S - logo.width) // 2, (S - logo.height) // 2 + 10), BLUE, 26, 0.9)
    return cv.convert("RGB")


def profile_drone():
    S = 800
    cv = background(S, S, focus_y=S * 0.45)
    body = fit(drone_body(), w=600)
    paste_glow(cv, body, ((S - body.width) // 2, (S - body.height) // 2 + 20), BLUE, 40, 1.1)
    return cv.convert("RGB")


def circle_preview(img, size=240):
    """How YouTube will show it: a circle, on light and dark UI."""
    small = img.resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size * 4, size * 4), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size * 4 - 1, size * 4 - 1], fill=255)
    mask = mask.resize((size, size), Image.LANCZOS)
    sheet = Image.new("RGB", (size * 2 + 60, size + 40), (255, 255, 255))
    ImageDraw.Draw(sheet).rectangle([size + 30, 0, size * 2 + 60, size + 40], fill=(15, 15, 15))
    sheet.paste(small, (20, 20), mask)
    sheet.paste(small, (size + 40, 20), mask)
    return sheet


# --------------------------------------------------------------------------- watermark

def watermark():
    S = 150
    body = fit(drone_body(), w=138)
    cv = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    # thin dark keyline keeps it legible over bright footage
    g, pad = glow(body, (0, 0, 0), 3, 2.5)
    x, y = (S - body.width) // 2, (S - body.height) // 2
    cv.alpha_composite(g, (x - pad, y - pad))
    cv.alpha_composite(body, (x, y))
    return cv


# --------------------------------------------------------------------------- thumbnail

def thumbnail(title=None):
    W, H = 1280, 720
    cv = background(W, H, focus_y=H * 0.45)
    s = fit(load("soldier-2"), h=560)
    ground_shadow(cv, W - 330, H - 70, 420, 50)
    paste_glow(cv, s, (W - 330 - s.width // 2, H - 60 - s.height), YELLOW, 30, 0.55)

    wm = fit(load("wordmark"), w=440)
    paste_glow(cv, wm, (40, H - wm.height - 36), (0, 0, 0), 10, 1.0)

    if title:
        y = 150
        for line in title:
            text(cv, (60, y), line, 92, (255, 255, 255, 255), anchor="lm", spacing=0.02)
            y += 118
    return cv.convert("RGB")


# --------------------------------------------------------------------------- shared bits

# which way each soldier's gun points in the source art
FACING = {"soldier-1": "right", "soldier-2": "right", "soldier-3": "left",
          "soldier-4": "right", "soldier-5": "left"}


def soldier(name, h, face=None):
    s = fit(load(name), h=h)
    if face and FACING[name] != face:
        s = s.transpose(Image.FLIP_LEFT_RIGHT)
    return s


def drone_only():
    """The drone half of the lockup, without the wordmark."""
    logo = load("drone-logo")
    d = logo.crop((0, 0, logo.width, 440))
    a = np.asarray(d.getchannel("A")).astype(np.float32)
    a[-30:] *= np.linspace(1, 0, 30)[:, None]
    d.putalpha(Image.fromarray(a.astype(np.uint8)))
    return d.crop(d.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox())


def reticle(canvas, cx, cy, r, color=(255, 70, 60), width=None):
    """HUD target-lock brackets + crosshair ticks."""
    width = width or max(2, r // 40)
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    c = color + (230,)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color + (120,), width=width)
    for sx in (-1, 1):
        for sy in (-1, 1):
            x0, y0, L = cx + sx * r * 1.15, cy + sy * r * 1.15, r * 0.35
            d.line([(x0, y0), (x0 - sx * L, y0)], fill=c, width=width * 2)
            d.line([(x0, y0), (x0, y0 - sy * L)], fill=c, width=width * 2)
    for ang in range(4):
        dx, dy = [(1, 0), (0, 1), (-1, 0), (0, -1)][ang]
        d.line([(cx + dx * r * 0.82, cy + dy * r * 0.82), (cx + dx * r * 1.08, cy + dy * r * 1.08)],
               fill=c, width=width)
    canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(width * 2)))
    canvas.alpha_composite(layer)


def flag_bars(canvas, h=14):
    W, H = canvas.size
    canvas.alpha_composite(Image.new("RGBA", (W, h), BLUE + (255,)), (0, H - 2 * h))
    canvas.alpha_composite(Image.new("RGBA", (W, h), YELLOW + (255,)), (0, H - h))


def pill(canvas, xy, s, size, bg=YELLOW, fg=(12, 12, 16), center=False):
    """Stencil text on a solid tag -- for 'NEW', 'PLAY FREE' style callouts."""
    font = ImageFont.truetype(FONT, size)
    w = font.getlength(s) + size * 0.12 * (len(s) - 1)
    x, y = xy
    if center:
        x -= (w + size * 1.2) / 2
    ImageDraw.Draw(canvas).rounded_rectangle([x, y, x + w + size * 1.2, y + size * 1.6],
                                             radius=size // 4, fill=bg + (255,))
    text(canvas, (x + size * 0.6, y + size * 0.8), s, size, fg + (255,), anchor="lm", spacing=0.12, shadow=False)


# --------------------------------------------------------------------------- alt banners

SAFE = (507, 508, 1546, 423)


def banner_squad():
    """Wordmark with the whole squad lined up underneath; drone hovers in the TV area."""
    W, H = 2560, 1440
    SX0, SY0, SW, SH = SAFE
    cv = background(W, H)

    d = fit(drone_only(), w=1100)
    paste_glow(cv, d, ((W - d.width) // 2, SY0 - d.height - 40), BLUE, 40, 0.9)

    wm = fit(load("wordmark"), h=150)
    paste_glow(cv, wm, ((W - wm.width) // 2, SY0 + 6), (0, 0, 0), 12, 1.0)

    feet = SY0 + SH - 4
    line = [("soldier-4", "right"), ("soldier-1", "right"), ("soldier-2", "right"),
            ("soldier-3", "left"), ("soldier-5", "left")]
    sprites = [soldier(n, 250, f) for n, f in line]
    gap = 34
    total = sum(s.width for s in sprites) + gap * (len(sprites) - 1)
    x = (W - total) // 2
    for s in sprites:
        paste_glow(cv, s, (x, feet - s.height), (0, 0, 0), 12, 0.8)
        x += s.width + gap

    text(cv, (W // 2, H - 250), "GETDRONED.IO", 64, YELLOW + (255,), spacing=0.3)
    flag_bars(cv)
    return cv.convert("RGB")


def banner_target():
    """Drone locked in a red reticle on the left, big tagline on the right."""
    W, H = 2560, 1440
    SX0, SY0, SW, SH = SAFE
    cv = background(W, H, focus_y=H / 2)

    logo = fit(load("drone-logo"), h=330)
    lx, ly = SX0 + 10, SY0 + (SH - logo.height) // 2
    paste_glow(cv, logo, (lx, ly), BLUE, 36, 0.9)
    reticle(cv, lx + logo.width // 2, ly + int(logo.height * 0.30), 120)

    tx = lx + logo.width + 60
    for i, (line, col) in enumerate([("SIX SECTORS.", (240, 240, 245)),
                                     ("NO INSTALLS.", (240, 240, 245)),
                                     ("NO MERCY.", YELLOW)]):
        text(cv, (tx, SY0 + 110 + i * 100), line, 72, col + (255,), anchor="lm", spacing=0.06)

    for name, face, cx in [("soldier-4", "right", SX0 - 240), ("soldier-5", "left", SX0 + SW + 240)]:
        s = soldier(name, 330, face)
        paste_glow(cv, s, (cx - s.width // 2, SY0 + SH - 6 - s.height), (0, 0, 0), 14, 0.8)

    text(cv, (W // 2, 200), "GETDRONED.IO", 64, YELLOW + (255,), spacing=0.3)
    flag_bars(cv)
    return cv.convert("RGB")


# --------------------------------------------------------------------------- thumbnails per soldier

THUMB_GLOW = {"soldier-1": YELLOW, "soldier-2": YELLOW, "soldier-3": BLUE,
              "soldier-4": (120, 220, 120), "soldier-5": BLUE}


def thumbnail_soldier(name, title=None, tag=None):
    W, H = 1280, 720
    cv = background(W, H, focus_y=H * 0.45)
    s = soldier(name, 560, "left")  # soldier on the right, aiming in at the title
    cx = W - 60 - s.width // 2
    ground_shadow(cv, cx, H - 70, 420, 50)
    paste_glow(cv, s, (cx - s.width // 2, H - 60 - s.height), THUMB_GLOW[name], 30, 0.55)

    wm = fit(load("wordmark"), w=440)
    paste_glow(cv, wm, (40, H - wm.height - 36), (0, 0, 0), 10, 1.0)
    if tag:
        pill(cv, (56, 40), tag, 40)
    if title:
        y = 190
        for line in title:
            text(cv, (60, y), line, 92, (255, 255, 255, 255), anchor="lm", spacing=0.02)
            y += 118
    return cv.convert("RGB")


def thumbnail_drone(title=None):
    """Drone-strike thumbnail: big drone locked in a reticle, title under it."""
    W, H = 1280, 720
    cv = background(W, H, focus_y=H * 0.35)
    d = fit(drone_only(), w=1000)
    dx, dy = (W - d.width) // 2, 40
    paste_glow(cv, d, (dx, dy), BLUE, 40, 1.0)
    reticle(cv, W // 2, dy + int(d.height * 0.58), 110)
    if title:
        text(cv, (W // 2, H - 150), title, 96, (255, 255, 255, 255), spacing=0.04)
    wm = fit(load("wordmark"), w=300)
    paste_glow(cv, wm, (W - wm.width - 30, H - wm.height - 24), (0, 0, 0), 8, 1.0)
    return cv.convert("RGB")


# --------------------------------------------------------------------------- end screen

# YouTube end-screen element slots we design around (1920x1080 frame)
END_VIDEO_1 = (120, 300, 760, 428)     # x, y, w, h -- 16:9 video element
END_VIDEO_2 = (1040, 300, 760, 428)
END_SUB = (960, 870, 150)              # cx, cy, diameter -- subscribe circle


def end_screen(guide=False):
    W, H = 1920, 1080
    cv = background(W, H, focus_y=H * 0.5)
    wm = fit(load("wordmark"), h=130)
    paste_glow(cv, wm, ((W - wm.width) // 2, 60), (0, 0, 0), 12, 1.0)
    text(cv, (W // 2, 240), "KEEP FLYING", 44, YELLOW + (255,), spacing=0.35)

    # dark slots so the video cards sit on something clean
    slots = Image.new("RGBA", cv.size, (0, 0, 0, 0))
    ds = ImageDraw.Draw(slots)
    for x, y, w, h in (END_VIDEO_1, END_VIDEO_2):
        ds.rounded_rectangle([x - 10, y - 10, x + w + 10, y + h + 10], radius=18,
                             fill=(0, 0, 0, 140), outline=BLUE + (200,), width=4)
    cx, cy, dia = END_SUB
    ds.ellipse([cx - dia / 2 - 12, cy - dia / 2 - 12, cx + dia / 2 + 12, cy + dia / 2 + 12],
               fill=(0, 0, 0, 140), outline=YELLOW + (220,), width=4)
    cv.alpha_composite(slots)

    for name, face, x in [("soldier-1", "right", 250), ("soldier-3", "left", W - 250)]:
        s = soldier(name, 300, face)
        paste_glow(cv, s, (x - s.width // 2, H - 40 - s.height), (0, 0, 0), 12, 0.8)
    text(cv, (cx - 330, cy), "SUBSCRIBE", 40, (240, 240, 245, 255), spacing=0.25)
    text(cv, (cx + 330, cy), "GETDRONED.IO", 40, YELLOW + (255,), spacing=0.2)
    flag_bars(cv, 10)

    if guide:
        d = ImageDraw.Draw(cv)
        f = ImageFont.truetype(FONT, 30)
        for i, (x, y, w, h) in enumerate((END_VIDEO_1, END_VIDEO_2), 1):
            d.rectangle([x, y, x + w, y + h], outline=(60, 255, 120), width=3)
            d.text((x + w / 2, y + h / 2), f"VIDEO ELEMENT {i}", fill=(60, 255, 120), font=f, anchor="mm")
        d.ellipse([cx - dia / 2, cy - dia / 2, cx + dia / 2, cy + dia / 2], outline=(60, 255, 120), width=3)
        d.text((cx, cy), "SUB", fill=(60, 255, 120), font=f, anchor="mm")
    return cv.convert("RGB")


# --------------------------------------------------------------------------- community post / shorts cover

def community_post():
    S = 1080
    cv = background(S, S, focus_y=S * 0.45)
    logo = fit(load("drone-logo"), w=900)
    paste_glow(cv, logo, ((S - logo.width) // 2, 70), BLUE, 36, 0.9)
    feet = S - 150
    for name, face, cx in [("soldier-1", "right", 250), ("soldier-2", "right", 470),
                           ("soldier-3", "left", 830)]:
        s = soldier(name, 330, face)
        paste_glow(cv, s, (cx - s.width // 2, feet - s.height), (0, 0, 0), 12, 0.8)
    pill(cv, (S // 2, S - 125), "PLAY NOW  •  GETDRONED.IO", 38, center=True)
    flag_bars(cv, 10)
    return cv.convert("RGB")


def shorts_cover(title=None):
    W, H = 1080, 1920
    cv = background(W, H, focus_y=H * 0.45)
    logo = fit(load("drone-logo"), w=960)
    paste_glow(cv, logo, ((W - logo.width) // 2, 180), BLUE, 36, 0.9)
    s = soldier("soldier-4", 680, "right")
    ground_shadow(cv, W // 2, H - 290, 560, 60)
    paste_glow(cv, s, ((W - s.width) // 2, H - 280 - s.height), (120, 220, 120), 34, 0.5)
    if title:
        y = 720
        for line in title:
            text(cv, (W // 2, y), line, 104, (255, 255, 255, 255), spacing=0.03)
            y += 128
    text(cv, (W // 2, H - 170), "GETDRONED.IO", 54, YELLOW + (255,), spacing=0.3)
    flag_bars(cv, 14)
    return cv.convert("RGB")


def main():
    OUT.mkdir(exist_ok=True)
    banner().save(OUT / "banner-2560x1440.jpg", quality=93, optimize=True)
    banner(guide=True).resize((1280, 720), Image.LANCZOS).save(OUT / "preview-banner-safe-areas.jpg", quality=88)

    p1, p2 = profile_lockup(), profile_drone()
    p1.save(OUT / "profile-800x800-logo.png", optimize=True)
    p2.save(OUT / "profile-800x800-drone.png", optimize=True)
    both = Image.new("RGB", (560 * 2, 280), (255, 255, 255))
    both.paste(circle_preview(p1), (0, 0))
    both.paste(circle_preview(p2), (560, 0))
    both.save(OUT / "preview-profile-circles.png")

    watermark().save(OUT / "watermark-150x150.png", optimize=True)

    thumbnail().save(OUT / "thumbnail-template-1280x720.jpg", quality=92)
    thumbnail(["SWEEP THE", "COMPOUND"]).save(OUT / "thumbnail-example-1280x720.jpg", quality=92)

    banner_squad().save(OUT / "banner-alt-squad-2560x1440.jpg", quality=93, optimize=True)
    banner_target().save(OUT / "banner-alt-target-2560x1440.jpg", quality=93, optimize=True)

    for n in ("soldier-1", "soldier-3", "soldier-4", "soldier-5"):
        thumbnail_soldier(n).save(OUT / f"thumbnail-template-{n}-1280x720.jpg", quality=92)
    thumbnail_soldier("soldier-4", ["ONE SHOT.", "ONE DRONE."], tag="NEW SECTOR").save(
        OUT / "thumbnail-example-sniper-1280x720.jpg", quality=92)
    thumbnail_drone().save(OUT / "thumbnail-template-drone-1280x720.jpg", quality=92)
    thumbnail_drone("TARGET LOCKED").save(OUT / "thumbnail-example-drone-1280x720.jpg", quality=92)

    end_screen().save(OUT / "end-screen-1920x1080.jpg", quality=92)
    end_screen(guide=True).resize((960, 540), Image.LANCZOS).save(OUT / "preview-end-screen-slots.jpg", quality=88)

    community_post().save(OUT / "community-post-1080x1080.jpg", quality=92)
    shorts_cover().save(OUT / "shorts-cover-1080x1920.jpg", quality=92)
    shorts_cover(["DRONE", "DOWN!"]).save(OUT / "shorts-cover-example-1080x1920.jpg", quality=92)

    for f in sorted(OUT.iterdir()):
        with Image.open(f) as im:
            print(f"{f.name:40s} {im.size[0]}x{im.size[1]}  {f.stat().st_size / 1024:7.0f} KB")


if __name__ == "__main__":
    main()
