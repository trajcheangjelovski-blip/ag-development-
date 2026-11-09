# Veloce — image and 3D manifest

All photos are free-licence images from Unsplash, chosen so each one matches the car it's listed under (make, model, colour). In the real build the dealer uploads their own photography per car from the admin panel; until then, swap any file below for the client's own shot using the same filename.

If a file is missing, the site shows a neutral "Photos coming soon" panel instead of a broken image.

## Site
| File | Used for |
|---|---|
| `ferrari-f8.jpg` | Hero image and the F8 Tributo listing |
| `bentley-spur.jpg` | "How we sell" section (detail crop) and the Flying Spur listing |
| `og.jpg` | Social share preview (1200 × 630, cropped from the F8 photo) |

The logo is a typographic wordmark set in Archivo Expanded (no image file). Replace it with the client's logo SVG when available.

## Vehicles
Each car has a cover, gallery photos, and close-ups for the "Materials and finishes" section.

| Car | Cover | Gallery | Material close-ups |
|---|---|---|---|
| BMW M4 Competition xDrive | `bmw-m4.jpg` | `bmw-cockpit.jpg`, `bmw-cabin.jpg` | `bmw-carbon-seat.jpg`, `bmw-carbon.jpg` |
| Ferrari 458 Spider | `458-spider.jpg` | `458-wheel.jpg` | `458-leather.jpg`, `458-engine.jpg` |
| Ferrari F8 Tributo | `ferrari-f8.jpg` | `f8-rear.jpg`, `f8-front.jpg`, `f8-wheel.jpg` | `f8-seat.jpg`, `f8-wheel-detail.jpg` |
| Mercedes-Benz S 580 L | `mercedes-s.jpg` | — | `s-cabin.jpg`, `s-console.jpg` |
| Mercedes-AMG GT C | `amg-gt.jpg` | — | `amg-leather.jpg`, `amg-cockpit.jpg` |
| Bentley Flying Spur V8 | `bentley-spur.jpg` | `spur-cabin.jpg` | `spur-quilt.jpg`, `spur-clock.jpg` |
| McLaren P1 GTR (sold) | `mclaren-p1gtr.jpg` | `p1-cabin.jpg` | `p1-seats.jpg` |

Recommended sizes: gallery 1800 px wide, close-ups 1400 px wide, JPG around quality 72.

## 3D model (`../models/`)
| File | Notes |
|---|---|
| `ferrari.glb` | Ferrari 458 (Spider body) from the three.js examples, credited to vicent091036. Shown on the 458 Spider page as a sample of the 3D view. |
| `ferrari_ao.png` | Soft ground shadow for the model. |

**Licence note:** the model ships inside the MIT-licensed three.js repository, but its original Sketchfab page is no longer online, so its own licence could not be verified. Fine for a private, noindex sales demo; for the production site use the dealer's own 3D or 360° photography (for example from a 360° capture service), or a model with a confirmed licence.

---

Cars, prices, specifications and contact details are placeholders to show the layout. In the final build everything is editable from the admin panel without touching code.

Built by **AG Development** · ag-development.dev
