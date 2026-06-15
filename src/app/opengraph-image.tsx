import { ImageResponse } from 'next/og'

// Auto-generated social preview image (1200×630). Next builds this into a PNG
// and wires up og:image + twitter:image automatically — no static file needed.
export const runtime = 'nodejs'
export const alt = 'AG Development — Websites, IT Support & Design for Small Businesses'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #0f1f3d 0%, #162b52 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 4, color: '#60a5fa' }}>
          AG DEVELOPMENT LLC
        </div>
        <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1, marginTop: 24 }}>
          Websites & reliable IT support for small businesses
        </div>
        <div style={{ fontSize: 30, color: 'rgba(255,255,255,0.82)', marginTop: 28 }}>
          WordPress · Shopify · Website care · L1 IT support
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, color: '#34d399', marginTop: 44 }}>
          Registered Wyoming LLC — ag-development.dev
        </div>
      </div>
    ),
    { ...size },
  )
}
