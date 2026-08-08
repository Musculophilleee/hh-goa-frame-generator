/**
 * Template registry.
 *
 * Each template is pure data: a background image plus a photo slot and a
 * list of text fields with their positions. app.js has ONE renderer that
 * reads this config - adding a 5th template later means adding an entry
 * here, not writing new drawing code.
 *
 * Coordinates are in pixels, relative to the template's own `width`/`height`
 * (i.e. the background image's natural size). The renderer scales
 * everything proportionally if the actual loaded image differs slightly.
 *
 * Field `mode` values:
 *   'direct'  - draw text at (x, y), left/center/right aligned. Optional
 *               `erase` paints a flat rect first (for replacing a small
 *               baked-in placeholder like a short line or word).
 *   'bar'     - text centered inside a fixed-size box (x, y, w, h) that
 *               already exists in the artwork (e.g. a full-width name bar).
 *   'pill'    - draws a rounded-rect "pill" sized to fit the actual text
 *               (centered at cx, cy), then the text on top. Used where the
 *               original design has an individually-sized pill per field.
 *   'rotated' - like 'direct' but rotated (for sideways sidebar text).
 *
 * IMPORTANT: the four .jpg files in /templates right now are WhatsApp-
 * compressed placeholders. Swap them for the clean Canva/Figma exports
 * when they're ready — same filenames, drop-in replacement, no code change
 * needed unless the new exports have a different layout.
 */

const TEMPLATES = [
  {
    id: 'sunset-split',
    label: 'Sunset Split',
    image: 'templates/sunset-split.jpg',
    width: 1050,
    height: 600,
    photo: { x: 133, y: 133, w: 290, h: 330, radius: 24 },
    fields: [
      {
        key: 'name',
        mode: 'direct',
        x: 525,
        y: 163,
        align: 'left',
        font: '800 40px -apple-system, sans-serif',
        color: '#17301f',
        maxWidth: 400,
        erase: { x: 505, y: 132, w: 160, h: 42, color: '#ffffff' }
      },
      {
        key: 'stack',
        mode: 'direct',
        x: 525,
        y: 355,
        align: 'left',
        font: '600 26px -apple-system, sans-serif',
        color: '#17301f',
        maxWidth: 400
      },
      {
        key: 'email',
        mode: 'direct',
        x: 525,
        y: 460,
        align: 'left',
        font: '500 22px -apple-system, sans-serif',
        color: '#3a3a3a',
        maxWidth: 400
      }
    ]
  },
  {
    id: 'golden-hour',
    label: 'Golden Hour',
    image: 'templates/golden-hour.jpg',
    width: 924,
    height: 1310,
    photo: { x: 44, y: 145, w: 587, h: 468, radius: 0 },
    fields: [
      {
        key: 'name',
        mode: 'pill',
        cx: 397,
        cy: 660,
        font: '700 42px -apple-system, sans-serif',
        textColor: '#111111',
        pillColor: '#ffffff',
        padX: 30,
        padY: 16
      },
      {
        key: 'stack',
        mode: 'pill',
        cx: 453,
        cy: 787,
        font: '600 30px -apple-system, sans-serif',
        textColor: '#111111',
        pillColor: '#ffffff',
        padX: 26,
        padY: 14
      },
      {
        key: 'email',
        mode: 'pill',
        cx: 483,
        cy: 886,
        font: '500 26px -apple-system, sans-serif',
        textColor: '#111111',
        pillColor: '#ffffff',
        padX: 22,
        padY: 12
      }
    ]
  },
  {
    id: 'dune-pass',
    label: 'Dune Pass',
    image: 'templates/dune-pass.jpg',
    width: 875,
    height: 1241,
    photo: { x: 147, y: 286, w: 483, h: 634, radius: 0 },
    // No email slot in this design — the layout has nowhere for it to sit
    // without crowding the boarding-pass composition, so we skip it here
    // rather than force it in somewhere it doesn't belong.
    fields: [
      {
        key: 'name',
        mode: 'bar',
        x: 157,
        y: 990,
        w: 483,
        h: 45,
        align: 'center',
        font: '700 32px -apple-system, sans-serif',
        color: '#111111',
        erase: '#ffffff'
      },
      {
        key: 'stack',
        mode: 'rotated',
        cx: 800,
        cy: 390,
        rotationDeg: -90,
        font: '700 30px -apple-system, sans-serif',
        color: '#ffffff',
        // Approximate fill from that part of the sidebar gradient - only
        // needed because the current jpg has baked-in placeholder text.
        // A clean export won't need this at all.
        erase: { w: 340, h: 60, color: '#2f7d40' }
      }
    ]
  },
  {
    id: 'diagonal',
    label: 'Beach House',
    image: 'templates/diagonal.jpg',
    width: 875,
    height: 1241,
    photo: { x: 201, y: 136, w: 471, h: 464, radius: 0 },
    // Same as dune-pass - no designed spot for email here.
    fields: [
      {
        key: 'name',
        mode: 'pill',
        cx: 436,
        cy: 655,
        font: '700 34px -apple-system, sans-serif',
        textColor: '#111111',
        pillColor: '#ffffff',
        padX: 26,
        padY: 14
      },
      {
        key: 'stack',
        mode: 'pill',
        cx: 436,
        cy: 755,
        font: '600 26px -apple-system, sans-serif',
        textColor: '#111111',
        pillColor: '#ffffff',
        padX: 22,
        padY: 12
      }
    ]
  }
]
