import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Social preview image (1200×630) served from the static file public/og.png.
// We serve a prebuilt PNG instead of generating one with next/og at runtime,
// because dynamic image generation can fail in the standalone Docker build —
// which leaves link previews (Instagram/Facebook/WhatsApp) with no picture.
export const runtime = 'nodejs'
export const alt = 'AG Development — Websites & reliable IT support for small businesses'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  const data = await readFile(join(process.cwd(), 'public', 'og.png'))
  return new Response(new Uint8Array(data), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
