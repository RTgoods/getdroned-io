# YouTube channel graphics

Upload these from `export/`:

| File | Where it goes in YouTube Studio → Customization → Branding |
|---|---|
| `banner-2560x1440.jpg` | **Banner image** (logo, tagline and the two inner soldiers sit in the 1546×423 all-device safe area) |
| `profile-800x800-logo.png` *or* `profile-800x800-drone.png` | **Picture** (shown as a circle — see `preview-profile-circles.png`) |
| `watermark-150x150.png` | **Video watermark** |
| `thumbnail-template-1280x720.jpg` | Starting point for video thumbnails (`thumbnail-example-…` shows it with a title) |

### Extras

| File | Use |
|---|---|
| `banner-alt-squad-…`, `banner-alt-target-…` | Alternative banners — swap in any time |
| `thumbnail-template-soldier-N-…`, `thumbnail-template-drone-…` | More thumbnail bases (examples: `thumbnail-example-sniper-…`, `thumbnail-example-drone-…`) |
| `end-screen-1920x1080.jpg` | Last 5–20 s of a video. In the editor's **End screen** add 2 video elements + a subscribe button over the outlined slots (see `preview-end-screen-slots.jpg`) |
| `community-post-1080x1080.jpg` | Community tab / social post |
| `shorts-cover-1080x1920.jpg` | Vertical cover frame for Shorts (example: `shorts-cover-example-…`) |

`preview-*` files are for checking layout only — don't upload them.

Regenerate after changing art in `source/`:

```
pip install pillow numpy
python3 youtube/make_graphics.py
```
