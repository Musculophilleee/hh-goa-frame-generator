/**
 * HH Goa 2026 Builder Card Generator
 *
 * Flow: upload a photo -> fill in details -> pick one of TEMPLATES
 * (from templates.js) -> canvas renders the composite -> download / share.
 *
 * Everything runs client-side. The renderer is generic - it reads a
 * template's config and draws accordingly, so the four designs share one
 * code path instead of four copy-pasted drawing functions.
 */

// ---- State --------------------------------------------------------------
let sourceImage = null // decoded HTMLImageElement of the user's uploaded photo
let selectedTemplateId = null
let bgImageCache = {} // templateId -> loaded background Image, so we don't refetch on every re-render

// ---- DOM refs -------------------------------------------------------------
const uploadZone = document.getElementById('uploadZone')
const fileInput = document.getElementById('fileInput')
const uploadPrompt = document.getElementById('uploadPrompt')
const uploadedThumb = document.getElementById('uploadedThumb')
const nameInput = document.getElementById('nameInput')
const roleInput = document.getElementById('roleInput')
const emailInput = document.getElementById('emailInput')
const templateGrid = document.getElementById('templateGrid')
const statusMsg = document.getElementById('statusMsg')
const resultSection = document.getElementById('resultSection')
const canvas = document.getElementById('outputCanvas')
const ctx = canvas.getContext('2d')
const downloadBtn = document.getElementById('downloadBtn')
const shareBtn = document.getElementById('shareBtn')

// =====================================================================
// Template picker
// =====================================================================

function buildTemplateGrid () {
  TEMPLATES.forEach((tpl) => {
    const card = document.createElement('button')
    card.className = 'template-card'
    card.type = 'button'
    card.dataset.templateId = tpl.id
    card.innerHTML = `
      <img src="${tpl.image}" alt="${tpl.label}" class="template-card__img">
      <span class="template-card__label">${tpl.label}</span>
    `
    card.addEventListener('click', () => selectTemplate(tpl.id))
    templateGrid.appendChild(card)
  })
}

function selectTemplate (templateId) {
  selectedTemplateId = templateId
  document.querySelectorAll('.template-card').forEach((card) => {
    card.classList.toggle('is-selected', card.dataset.templateId === templateId)
  })
  tryGenerate()
}

buildTemplateGrid()

// =====================================================================
// Upload handling
// =====================================================================

uploadZone.addEventListener('click', () => fileInput.click())
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0]
  if (file) handleFile(file)
})

;['dragover', 'dragleave', 'drop'].forEach((eventName) => {
  uploadZone.addEventListener(eventName, (e) => e.preventDefault())
})
uploadZone.addEventListener('dragover', () => uploadZone.classList.add('is-dragover'))
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('is-dragover'))
uploadZone.addEventListener('drop', (e) => {
  uploadZone.classList.remove('is-dragover')
  const file = e.dataTransfer.files[0]
  if (file) handleFile(file)
})

async function handleFile (file) {
  clearStatus()

  const isHeic = /\.(heic|heif)$/i.test(file.name) || file.type === 'image/heic' || file.type === 'image/heif'
  const isSupportedImage = file.type.startsWith('image/') || isHeic

  if (!isSupportedImage) {
    showStatus('That file doesn\'t look like a photo. Try a JPG, PNG, or HEIC.')
    return
  }

  const MAX_SIZE_MB = 25
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    showStatus(`That photo is too large (max ${MAX_SIZE_MB}MB). Try a smaller one.`)
    return
  }

  showStatus('Loading photo…')

  try {
    let workingFile = file

    if (isHeic) {
      const converted = await window.heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
      workingFile = Array.isArray(converted) ? converted[0] : converted
    }

    sourceImage = await loadImageElement(workingFile)

    uploadedThumb.src = sourceImage.src
    uploadedThumb.hidden = false
    uploadPrompt.hidden = true

    tryGenerate()
  } catch (err) {
    console.error(err)
    showStatus('Couldn\'t read that photo. If it\'s a HEIC from an older iPhone, try exporting it as JPG first.')
  }
}

function loadImageElement (blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('File read failed'))
    reader.onload = () => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Image decode failed'))
      img.src = reader.result
    }
    reader.readAsDataURL(blob)
  })
}

function loadBackgroundImage (templateConfig) {
  if (bgImageCache[templateConfig.id]) return Promise.resolve(bgImageCache[templateConfig.id])
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      bgImageCache[templateConfig.id] = img
      resolve(img)
    }
    img.onerror = () => reject(new Error(`Couldn't load background for ${templateConfig.id}`))
    img.src = templateConfig.image
  })
}

// Regenerate whenever name/stack/email change, but only once a template
// and photo already exist - otherwise there's nothing to render yet.
;[nameInput, roleInput, emailInput].forEach((input) => {
  input.addEventListener('input', () => tryGenerate())
})

function tryGenerate () {
  if (!sourceImage || !selectedTemplateId) return
  if (!nameInput.value.trim()) {
    showStatus('Add your name to generate the card.')
    resultSection.hidden = true
    return
  }
  generate()
}

// =====================================================================
// Rendering
// =====================================================================

async function generate () {
  const tpl = TEMPLATES.find((t) => t.id === selectedTemplateId)
  if (!tpl) return

  clearStatus()

  let bgImage
  try {
    bgImage = await loadBackgroundImage(tpl)
  } catch (err) {
    console.error(err)
    showStatus('Couldn\'t load that template - try another one.')
    return
  }

  canvas.width = tpl.width
  canvas.height = tpl.height

  // 1. Background
  ctx.drawImage(bgImage, 0, 0, tpl.width, tpl.height)

  // 2. Photo, cover-fit into the template's photo slot
  const p = tpl.photo
  ctx.save()
  roundedRectPath(ctx, p.x, p.y, p.w, p.h, p.radius || 0)
  ctx.clip()
  drawImageCover(ctx, sourceImage, p.x, p.y, p.w, p.h)
  ctx.restore()

  // 3. Text fields
  const values = {
    name: nameInput.value.trim(),
    stack: roleInput.value.trim(),
    email: emailInput.value.trim()
  }

  tpl.fields.forEach((field) => {
    const value = values[field.key]
    if (!value) return // nothing to draw for an empty optional field
    renderField(field, value)
  })

  resultSection.hidden = false
}

function renderField (field, value) {
  if (field.mode === 'direct') {
    if (field.erase) {
      ctx.fillStyle = field.erase.color
      ctx.fillRect(field.erase.x, field.erase.y, field.erase.w, field.erase.h)
    }
    const fontSize = fitFontSize(ctx, value, field.font, field.maxWidth)
    ctx.font = fontSize
    ctx.fillStyle = field.color
    ctx.textAlign = field.align || 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(value, field.x, field.y)
    return
  }

  if (field.mode === 'bar') {
    if (field.erase) {
      ctx.fillStyle = field.erase
      ctx.fillRect(field.x, field.y, field.w, field.h)
    }
    const fontSize = fitFontSize(ctx, value, field.font, field.w - 32)
    ctx.font = fontSize
    ctx.fillStyle = field.color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(value, field.x + field.w / 2, field.y + field.h / 2)
    return
  }

  if (field.mode === 'pill') {
    ctx.font = field.font
    const textWidth = ctx.measureText(value).width
    const pillW = textWidth + field.padX * 2
    const pillH = parseInt(field.font.match(/\d+/)[0], 10) + field.padY * 2

    ctx.fillStyle = field.pillColor
    roundedRectPath(ctx, field.cx - pillW / 2, field.cy - pillH / 2, pillW, pillH, pillH / 2)
    ctx.fill()

    ctx.fillStyle = field.textColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(value, field.cx, field.cy)
    return
  }

  if (field.mode === 'rotated') {
    ctx.save()
    ctx.translate(field.cx, field.cy)
    ctx.rotate((field.rotationDeg * Math.PI) / 180)
    if (field.erase) {
      ctx.fillStyle = field.erase.color
      ctx.fillRect(-field.erase.w / 2, -field.erase.h / 2, field.erase.w, field.erase.h)
    }
    ctx.font = field.font
    ctx.fillStyle = field.color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(value, 0, 0)
    ctx.restore()
  }
}

/** Shrinks a font-size declaration until `text` fits within `maxWidth`. */
function fitFontSize (context, text, fontString, maxWidth) {
  if (!maxWidth) return fontString
  let size = parseInt(fontString.match(/\d+/)[0], 10)
  const minSize = 14
  let current = fontString
  context.font = current
  while (context.measureText(text).width > maxWidth && size > minSize) {
    size -= 2
    current = fontString.replace(/\d+px/, `${size}px`)
    context.font = current
  }
  return current
}

/**
 * "cover" fit, same behaviour as CSS object-fit: cover - scales the image
 * up until it fills the target rect, then centre-crops whichever axis
 * overflows. Handles portrait, landscape, and off-centre photos without
 * asking the user to pre-crop.
 */
function drawImageCover (context, img, dx, dy, dWidth, dHeight) {
  const imgRatio = img.width / img.height
  const targetRatio = dWidth / dHeight

  let sx, sy, sWidth, sHeight

  if (imgRatio > targetRatio) {
    sHeight = img.height
    sWidth = sHeight * targetRatio
    sx = (img.width - sWidth) / 2
    sy = 0
  } else {
    sWidth = img.width
    sHeight = sWidth / targetRatio
    sx = 0
    sy = (img.height - sHeight) / 2
  }

  context.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
}

function roundedRectPath (context, x, y, width, height, radius) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.arcTo(x + width, y, x + width, y + height, radius)
  context.arcTo(x + width, y + height, x, y + height, radius)
  context.arcTo(x, y + height, x, y, radius)
  context.arcTo(x, y, x + width, y, radius)
  context.closePath()
}

// =====================================================================
// Download
// =====================================================================

downloadBtn.addEventListener('click', () => {
  if (resultSection.hidden) return
  canvas.toBlob((blob) => {
    if (!blob) {
      showStatus('Download failed - try again.')
      return
    }
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `hh-goa-2026-${selectedTemplateId}.png`
    link.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
})

// =====================================================================
// Share to X
// =====================================================================

// HH Goa's own rejection log shows "no live link in the post" is one of
// the single biggest reasons submissions get bounced - the deployed URL
// has to be in the tweet text itself, not just discoverable from the page.
// UPDATE THIS the moment the Vercel deploy is live, before posting anything.
const DEPLOY_URL = 'https://REPLACE-WITH-YOUR-DEPLOYED-URL.vercel.app'

const SHARE_TEXT = `Got my HH Goa 2026 builder card ready 🌊🔥 #FrameInGoa\nMake yours: ${DEPLOY_URL}`
const X_INTENT_URL = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(SHARE_TEXT)

shareBtn.addEventListener('click', async () => {
  if (resultSection.hidden) return

  canvas.toBlob(async (blob) => {
    if (!blob) {
      showStatus('Couldn\'t prepare the image - try downloading instead.')
      return
    }

    const file = new File([blob], `hh-goa-2026-${selectedTemplateId}.png`, { type: 'image/png' })
    const canShareFiles = navigator.canShare && navigator.canShare({ files: [file] })

    if (navigator.share && canShareFiles) {
      try {
        await navigator.share({ files: [file], text: SHARE_TEXT })
        return
      } catch (err) {
        if (err.name !== 'AbortError') console.error(err)
        else return
      }
    }

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `hh-goa-2026-${selectedTemplateId}.png`
    link.click()
    URL.revokeObjectURL(url)

    showStatus('Image downloaded. Attach it in the X post that just opened.')
    window.open(X_INTENT_URL, '_blank', 'noopener')
  }, 'image/png')
})

// =====================================================================
// Status helpers
// =====================================================================

function showStatus (msg) { statusMsg.textContent = msg }
function clearStatus () { statusMsg.textContent = '' }
