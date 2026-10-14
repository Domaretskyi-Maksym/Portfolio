import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

const FONT_STACK = "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"

function createCanvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('createCanvasTexture: 2D canvas context is unavailable')

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 8

  const render = () => {
    ctx.clearRect(0, 0, width, height)
    draw(ctx)
    texture.needsUpdate = true
  }
  render()
  // Inter may still be loading on first draw; repaint once web fonts are ready.
  document.fonts?.ready.then(render)

  return texture
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const candidate = line ? `${line} ${word}` : word
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines
}

/** Transparent label, meant to sit on the face of a coloured tile. */
export function createSkillTexture(label: string, foreground: string) {
  return createCanvasTexture(256, 256, (ctx) => {
    ctx.fillStyle = foreground
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `700 ${label.length > 5 ? 52 : 68}px ${FONT_STACK}`
    ctx.fillText(label, 128, 132)
  })
}

export function createScreenTexture(title: string, tag: string, description: string, accent: string) {
  const width = 1024
  const height = 640
  return createCanvasTexture(width, height, (ctx) => {
    ctx.fillStyle = '#121317'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = accent
    ctx.fillRect(0, 0, 28, height)
    ctx.beginPath()
    ctx.arc(width - 120, 120, 54, 0, Math.PI * 2)
    ctx.fill()

    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = accent
    ctx.font = `600 34px ${FONT_STACK}`
    ctx.fillText(tag.toUpperCase(), 84, 150)

    ctx.fillStyle = '#f4f4f5'
    ctx.font = `700 92px ${FONT_STACK}`
    ctx.fillText(title, 80, 270)

    ctx.fillStyle = '#a1a1aa'
    ctx.font = `400 40px ${FONT_STACK}`
    wrapText(ctx, description, width - 180).forEach((line, i) => ctx.fillText(line, 84, 370 + i * 56))
  })
}

export function createBeltTexture() {
  const texture = createCanvasTexture(256, 64, (ctx) => {
    ctx.fillStyle = '#1f2024'
    ctx.fillRect(0, 0, 256, 64)
    ctx.fillStyle = '#2c2e34'
    for (let x = 0; x < 256; x += 32) ctx.fillRect(x, 0, 10, 64)
  })
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  return texture
}
