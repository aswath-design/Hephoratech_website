# Adding a video or GIF to the Services section

Each service row on the homepage has a **visual side** (`.srow-vis`) that currently
holds an animated UI mock. You can swap any of them for a real video, GIF, or image.

---

## 1. Put your file in the assets folder

Save it here:

```
hephoratech-website/assets/media/
```

Create that `media` folder if it doesn't exist. Recommended:

| Type  | Format | Notes |
|-------|--------|-------|
| Video | `.mp4` (H.264) | Best quality-to-size. Also add `.webm` if you want maximum browser support. |
| GIF   | `.gif` | Simple, but large files — prefer MP4 for anything over 2 seconds. |
| Image | `.webp` or `.png` | Use for a static screenshot. |

**Size guidance:** export around **880 × 620 px** (2× the display size so it stays sharp
on retina screens), and keep videos under ~3 MB so the page stays fast.

---

## 2. Replace the mock in `index.html`

Find the service row you want to change. It looks like this:

```html
<div class="srow-vis" data-par="0.035">
  <div class="uim">
    ... animated mock markup ...
  </div>
</div>
```

Replace **everything inside** `.srow-vis` with one of the options below.

### Option A — Video (recommended)

```html
<div class="srow-vis" data-par="0.035">
  <div class="srow-media">
    <video autoplay muted loop playsinline
           poster="assets/media/web-dev-poster.jpg">
      <source src="assets/media/web-dev.mp4" type="video/mp4">
    </video>
  </div>
</div>
```

The `poster` image shows while the video loads — optional but makes it feel faster.

### Option B — Video with a browser bar on top

```html
<div class="srow-vis" data-par="0.035">
  <div class="srow-media">
    <div class="mbar"><i></i><i></i><i></i><b>hephoratech.com</b></div>
    <video autoplay muted loop playsinline>
      <source src="assets/media/web-dev.mp4" type="video/mp4">
    </video>
  </div>
</div>
```

### Option C — GIF or static image

```html
<div class="srow-vis" data-par="0.035">
  <div class="srow-media">
    <img src="assets/media/web-dev.gif" alt="Web development workflow">
  </div>
</div>
```

---

## 3. That's it

The styling, rounded corners, border, shadow, blue ambient glow, hover lift, and
scroll parallax all apply automatically — you don't need to touch the CSS.

**Videos also pause automatically when scrolled off screen** and resume when they
come back, so having several on one page won't slow the site down.

---

## Notes

- Keep `muted` on any `autoplay` video — browsers block autoplay with sound.
- `playsinline` stops iOS from forcing fullscreen playback.
- The same markup works in the product rows and on inner pages.
- To show a video **and** keep the animated mock on other rows, just change the
  rows you want — they're independent of each other.
