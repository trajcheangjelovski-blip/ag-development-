# Aurelle demo — image manifest

All photos are free-licence images from Unsplash, used as stand-ins. The client will supply their own product and lifestyle photography; swap any file below for theirs using the same filename (or map new filenames in `app.js` → `P[].img`).

No text, photos, logo or other assets from the style reference (residencesupply.com) are used. The logo is a typographic wordmark (Newsreader), not an image.

## Products (`p-*.jpg`, 1000 px wide)
| File | Product |
|---|---|
| p-halo-sconce | Halo Alabaster Sconce |
| p-arc-sconce | Arc Plaster Sconce |
| p-tube-sconce | Linea Up/Down Sconce |
| p-carved-alabaster, p-carved-alabaster-2 | Carved Alabaster Table Lamp |
| p-column-marble | Column Marble Table Lamp |
| p-cap-brass | Cap Brass Table Lamp |
| p-plaster-mushroom | Nube Plaster Lamp |
| p-scallop-glass | Scallop Glass Lamp |
| p-trio-globe | Orbit Trio Lamp |
| p-travertine | Travertine Pillar Lamp |
| p-arco-dome | Arco Dome Floor Lamp |
| p-linen-floor | Linen Column Floor Lamp |
| p-pleated-floor | Pleat Paper Floor Lamp |
| p-bow-floor | Bow Floor Lamp |
| p-slatted-oak | Slatted Oak Pendant |
| p-brass-dome | Spun Brass Pendant |
| p-rattan | Woven Rattan Pendant |
| p-crystal-chandelier | Fontaine Chandelier |
| p-enamel-pendant | Enamel Dome Pendant |
| p-studio-task | Studio Brass Task Lamp |

## Lifestyle / editorial (1800 px wide)
hero-pendant, ed-light, hero-nook (hero slides) · hero-living (shop the look) · ed-alabaster (alabaster feature) · about-hero, about-still (trade/about) · room-living, room-dining, room-bedroom, room-study (shop by room) · j-1..3 (journal) · contact · og (social preview, 1200×630).

## Hero film (`video/`)
Free-licence Pexels clips, muted and looped behind the hero text. The page loads only one cut: the landscape `hero-desktop.mp4` (1280×720, pendant lamps glowing in a dark room) above 899 px wide, or the portrait `hero-mobile.mp4` (720×1280, table lamp in a warm corner) below that. Posters: `img/hero-video-desktop.jpg`, `img/hero-video-mobile.jpg`. Swap both for the client's own brand film using the same filenames. With reduced motion turned on, only the poster shows.

## 3D Halo pendant (`hero3d.js`)
Built in code with Three.js (no model file): brass cap, carved-alabaster globe with procedural veining, a halo ring, an inner light and drifting dust. Drag to rotate, switch the light on and off, and change the metal finish live. Rendering pauses while the hero is off screen.
