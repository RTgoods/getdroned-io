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

    for f in sorted(OUT.iterdir()):
        with Image.open(f) as im:
            print(f"{f.name:40s} {im.size[0]}x{im.size[1]}  {f.stat().st_size / 1024:7.0f} KB")


if __name__ == "__main__":
    main()
