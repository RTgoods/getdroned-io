# YouTube channel graphics

Upload these from `out/`:

| File | Where it goes in YouTube Studio → Customization → Branding |
|---|---|
| `banner-2560x1440.jpg` | **Banner image** (logo, tagline and the two inner soldiers sit in the 1546×423 all-device safe area) |
| `profile-800x800-logo.png` *or* `profile-800x800-drone.png` | **Picture** (shown as a circle — see `preview-profile-circles.png`) |
| `watermark-150x150.png` | **Video watermark** |
| `thumbnail-template-1280x720.jpg` | Starting point for video thumbnails (`thumbnail-example-…` shows it with a title) |

`preview-*` files are for checking layout only — don't upload them.

Regenerate after changing art in `source/`:

```
pip install pillow numpy
python3 youtube/make_graphics.py
```
