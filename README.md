# HH Goa 2026 — Frame Generator

Static site, zero backend. Upload → canvas draws the frame/card → download or
share to X. Everything happens in the browser, which is why it's fast.

## Run it locally

No build step needed — just serve the folder:

```bash
cd hh-goa-frame-generator
python3 -m http.server 8000
```

Open `http://localhost:8000`. (Opening `index.html` directly via `file://`
will break the HEIC conversion and canvas image loading in some browsers, so
always serve it over http.)

## Deploy (pick one, all free, all take under 2 minutes)

**Vercel (recommended — fastest, gives you a real HTTPS URL for Web Share API)**
```bash
npm i -g vercel
cd hh-goa-frame-generator
vercel --prod
```

**Netlify Drop**
Go to https://app.netlify.com/drop and drag the folder in. Done.

**GitHub Pages**
Push this folder to a repo, then Settings → Pages → deploy from the branch.

⚠️ Web Share API (the direct-image-attach share flow) requires HTTPS. It will
silently fall back to the download+intent-link flow on `http://localhost` or
any non-secure origin — so test the real share button after deploying, not
just locally.

## What's actually going on (for when you want to tweak it)

- **`templates.js`** is the entire design system as data — one entry per
  card, each with a `photo` slot (position/size/corner radius) and a
  `fields` array (name/stack/email positions and how they render). `app.js`
  has one generic renderer that reads this config, so all 4 designs share
  one code path. Adding a 5th template later = adding one object here, not
  writing new drawing code.
- **Field render modes** (see the big comment at the top of `templates.js`):
  `direct` (text at a point, optional erase-rect first), `bar` (text
  centered in a fixed box already in the artwork), `pill` (draws a
  rounded pill sized to fit the actual text, then the text — used where
  each field has its own individually-sized pill), `rotated` (sideways
  text, for the Dune Pass sidebar).
- `drawImageCover()` replicates CSS `object-fit: cover` on canvas — makes
  portrait, landscape, and off-center photos all fill their slot correctly
  without asking the user to crop first.
- HEIC files convert client-side via `heic2any` before touching canvas.
- Share button tries `navigator.share()` with the actual file first (direct
  image attach on supporting mobile browsers over HTTPS), falls back to
  download + pre-filled X compose window otherwise.

## Known gaps / what to do before Aug 13

1. **Template images are WhatsApp-compressed placeholders.** The 4 jpgs in
   `/templates` are what you uploaded — fine for testing, but soft/lossy at
   full size. Drop in the clean Canva/Figma exports with the **same
   filenames** (`sunset-split`, `golden-hour`, `dune-pass`, `diagonal` —
   rename as needed, just update the `image` path in `templates.js` to
   match) and nothing else needs to change, unless the new export shifts
   the layout — in that case nudge the numbers in `templates.js`.
2. **Two templates (Dune Pass, Beach House) have no email slot** — that's a
   real constraint of those layouts, not a bug. Email only renders on
   Sunset Split and Golden Hour. If you want it everywhere, that needs a
   design change on those two cards first, not a code change.
3. **The "erase" rect on Dune Pass's rotated sidebar text is a color
   guess** (`#2f7d40`), needed only because the current jpg has baked-in
   placeholder text ("Tech stack") to paint over. Once you're on a clean
   export without baked text, delete the `erase` key from that field
   entirely — one less thing to get slightly wrong.
4. **No manual crop/reposition yet** — auto-centers the crop. Fine for most
   photos; ask me to add drag-to-reposition if you want it before the
   deadline.
5. **Test on an actual iPhone** before submitting — HEIC handling and
   `navigator.share` both vary in ways desktop Chrome won't catch.
6. Don't forget: **post on X with the exact hashtag `#FrameInGoa` before
   submitting the form.**

## Before you post — checklist from HH Goa's actual rejection log

They shared their real rejection reasons across ~50+ submissions. Ranked by
how often they actually kill a submission:

1. **Branding must be on the card itself**, not just the landing page — by
   far the #1 rejection reason. We're covered: the templates carry real HH
   Goa branding baked into the output image.
2. **`DEPLOY_URL` in `app.js` MUST be updated to the real Vercel URL**
   before you post anything — the #2 rejection reason is the live link
   missing from the tweet text. It's currently a placeholder.
3. **Don't use AI image generation** for the output — several teams got
   rejected for this. We're safe (pure canvas compositing, no generative
   AI in the pipeline) — just don't add any "AI enhance" feature later
   without checking this first.
4. **Post from a public X account.** Two teams got rejected because their
   account was protected and the reviewer's bot literally couldn't open
   the post — this has nothing to do with the tool, just check your
   account privacy setting before posting.
5. **Use your own real photo**, not a stock/random image — reviewers
   specifically call this out and reject for it.
6. **Static image, not a GIF or video.**
7. **Submit the form exactly once.** One team had every single one of
   their submissions rejected after they submitted twice — including
   attempts that had nothing else wrong with them.
8. Make sure the X post URL you paste into the form is a real, working
   `https://x.com/<username>/status/<id>` link — not a bio link, not a
   placeholder, not a GitHub link.
