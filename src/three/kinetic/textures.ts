import { CanvasTexture, NoColorSpace, RepeatWrapping, SRGBColorSpace, type ColorSpace } from 'three'

const FONT_STACK = "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif"

function createCanvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
  colorSpace: ColorSpace = SRGBColorSpace,
) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('createCanvasTexture: 2D canvas context is unavailable')

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = colorSpace
  texture.anisotropy = 8

  const render = () => {
    ctx.save()
    ctx.clearRect(0, 0, width, height)
    draw(ctx)
    ctx.restore()
    texture.needsUpdate = true
  }
  render()
  // Inter may still be loading on first draw; repaint once web fonts are ready.
  document.fonts?.ready.then(render)

  return { texture, ctx, render }
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

/** Fine directional streaks — roughness variation that makes metal read as machined. */
export function createBrushedRoughnessTexture() {
  const size = 512
  const { texture } = createCanvasTexture(
    size,
    size,
    (ctx) => {
      ctx.fillStyle = 'rgb(150,150,150)'
      ctx.fillRect(0, 0, size, size)
      for (let i = 0; i < 2600; i++) {
        const shade = 110 + Math.random() * 90
        ctx.strokeStyle = `rgba(${shade},${shade},${shade},${0.15 + Math.random() * 0.25})`
        ctx.lineWidth = Math.random() * 1.4 + 0.3
        const y = Math.random() * size
        const x = Math.random() * size
        const length = 60 + Math.random() * 260
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + length, y + (Math.random() - 0.5) * 2)
        ctx.stroke()
      }
    },
    NoColorSpace,
  )
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(2, 2)
  return texture
}

/**
 * Engraving masks for a label: `bump` is white with the letters sunk in (dark),
 * `glow` is the same letters lit on black, used as an emissive map.
 */
export function createEngravingTextures(label: string) {
  const size = 256
  const fontSize = label.length > 4 ? 60 : 78
  const drawLabel = (ctx: CanvasRenderingContext2D, color: string, blur: number) => {
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `800 ${fontSize}px ${FONT_STACK}`
    ctx.filter = blur ? `blur(${blur}px)` : 'none'
    ctx.fillText(label, size / 2, size / 2 + 4)
  }

  const bump = createCanvasTexture(
    size,
    size,
    (ctx) => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      // Soft edge gives the engraving a chamfered wall instead of a hard step.
      drawLabel(ctx, '#000000', 1.5)
    },
    NoColorSpace,
  ).texture

  const glow = createCanvasTexture(size, size, (ctx) => {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, size, size)
    drawLabel(ctx, '#ffffff', 0)
  }).texture

  return { bump, glow }
}

export interface LiveScreen {
  texture: CanvasTexture
  /** Redraws the animated preview; call at a modest rate (it repaints a full canvas). */
  update: (time: number) => void
}

/**
 * Animated "live preview" for a project screen — a moving UI mock with a waveform,
 * bars and a scanning highlight. Stand-in until a real recording is supplied.
 */
export function createLiveScreen(title: string, tag: string, description: string, accent: string): LiveScreen {
  const width = 1024
  const height = 640
  let time = 0

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#0c0d11'
    ctx.fillRect(0, 0, width, height)

    // Drifting grid.
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'
    ctx.lineWidth = 1
    const shift = (time * 24) % 48
    for (let x = -48 + shift; x < width; x += 48) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    for (let y = 0; y < height; y += 48) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Waveform "chart".
    ctx.strokeStyle = accent
    ctx.lineWidth = 4
    ctx.beginPath()
    for (let x = 0; x <= width; x += 8) {
      const y =
        520 + Math.sin(x * 0.012 + time * 2.1) * 34 + Math.sin(x * 0.031 - time * 1.3) * 14
      if (x === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // Equaliser bars on the right.
    for (let i = 0; i < 9; i++) {
      const h = 40 + (Math.sin(time * 3 + i * 0.9) * 0.5 + 0.5) * 120
      ctx.fillStyle = i % 3 === 0 ? accent : 'rgba(255,255,255,0.18)'
      ctx.fillRect(width - 330 + i * 30, 340 - h, 18, h)
    }

    // Accent rail + status dot.
    ctx.fillStyle = accent
    ctx.fillRect(0, 0, 22, height)
    ctx.globalAlpha = 0.55 + Math.sin(time * 4) * 0.45
    ctx.beginPath()
    ctx.arc(width - 80, 80, 22, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1

    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = accent
    ctx.font = `600 32px ${FONT_STACK}`
    ctx.fillText(tag.toUpperCase(), 72, 112)

    ctx.fillStyle = '#f4f4f5'
    ctx.font = `700 84px ${FONT_STACK}`
    ctx.fillText(title, 68, 210)

    ctx.fillStyle = '#a1a1aa'
    ctx.font = `400 36px ${FONT_STACK}`
    wrapText(ctx, description, 560).forEach((line, i) => ctx.fillText(line, 72, 280 + i * 48))

    // Scanning highlight sweeping down the panel.
    const scanY = ((time * 140) % (height + 200)) - 100
    const scan = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 60)
    scan.addColorStop(0, 'rgba(255,255,255,0)')
    scan.addColorStop(0.5, 'rgba(255,255,255,0.06)')
    scan.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = scan
    ctx.fillRect(0, scanY - 60, width, 120)
  }

  const { texture, render } = createCanvasTexture(width, height, draw)
  return {
    texture,
    update: (nextTime) => {
      time = nextTime
      render()
    },
  }
}

export function createBeltTexture() {
  const { texture } = createCanvasTexture(256, 64, (ctx) => {
    ctx.fillStyle = '#1f2024'
    ctx.fillRect(0, 0, 256, 64)
    ctx.fillStyle = '#2c2e34'
    for (let x = 0; x < 256; x += 32) ctx.fillRect(x, 0, 10, 64)
  })
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  return texture
}
