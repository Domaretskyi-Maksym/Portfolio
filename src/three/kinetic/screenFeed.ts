import { SRGBColorSpace, VideoTexture, type Texture } from 'three'
import type { Project } from '../../data/projects'
import { createLiveScreen } from './textures'

export interface ScreenFeed {
  texture: Texture
  /** Advances animated previews; recorded video updates itself. */
  update: (time: number) => void
  dispose: () => void
}

/** Crops the texture like CSS `object-fit: cover` so the recording keeps its proportions. */
function coverFit(texture: Texture, sourceAspect: number, targetAspect: number) {
  if (sourceAspect > targetAspect) {
    texture.repeat.set(targetAspect / sourceAspect, 1)
  } else {
    texture.repeat.set(1, sourceAspect / targetAspect)
  }
  texture.offset.set((1 - texture.repeat.x) / 2, (1 - texture.repeat.y) / 2)
}

function createVideoFeed(src: string, aspect: number): ScreenFeed {
  const video = document.createElement('video')
  video.src = src
  video.crossOrigin = 'anonymous'
  video.loop = true
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'

  const texture = new VideoTexture(video)
  texture.colorSpace = SRGBColorSpace

  const onMetadata = () => coverFit(texture, video.videoWidth / video.videoHeight, aspect)
  video.addEventListener('loadedmetadata', onMetadata, { once: true })
  // Autoplay may be refused until the first user gesture; the texture just holds its first frame.
  video.play().catch(() => {})

  return {
    texture,
    update: () => {},
    dispose: () => {
      video.removeEventListener('loadedmetadata', onMetadata)
      video.pause()
      video.removeAttribute('src')
      video.load()
      texture.dispose()
    },
  }
}

/**
 * Real screen recording when the project has one, otherwise an animated UI preview.
 * `aspect` is the display's width / height, used to crop recordings without stretching.
 */
export function createScreenFeed(project: Project, aspect: number): ScreenFeed {
  if (project.video) return createVideoFeed(project.video, aspect)

  const live = createLiveScreen(project.title, project.tag, project.description, project.accent)
  return {
    texture: live.texture,
    update: live.update,
    dispose: () => live.texture.dispose(),
  }
}
