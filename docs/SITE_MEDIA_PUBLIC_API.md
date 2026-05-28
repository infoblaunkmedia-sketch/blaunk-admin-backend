# Site Media — Public API (consumer website)

Admin uploads are stored in MongoDB and served on the **public website** via a single read-only endpoint.

## Endpoint

```
GET /api/site-media/public
```

Also available at (same handler):

```
GET /api/admin-personnel/media/public
```

- **Auth:** none  
- **CORS:** allowed from configured frontend origins  
- **IP whitelist:** bypassed (public, like `/api/banners/public`)

### Query parameters

| Param     | Required | Description                                      |
|-----------|----------|--------------------------------------------------|
| `section` | No       | Filter one block, e.g. `home-page-slider`        |

If omitted, returns **all sections** that have at least one saved value.

### Valid `section` values

- `contact-us` — slots **1–10**: page banners (21:9 images)
- `social-media` — slots **1–3**: Instagram, Youtube, Facebook URLs · slots **4–5**: banners (21:9)
- `become-a-seller` — slot **1**: hero image · slots **2–4**: hero slider · slots **5–6**: bottom slider
- `contest` — slots **1–2**: slider images
- `refer-earn` — slots **1–2**: slider images
- `career` — slot **1**: top banner · slots **2–3**: slider
- `home-page-slider`
- `gif-poster` (Cakes & Bakes) — up to 20 cards · `title`: `CARD_TITLE | OFFER_TEXT`
- `bgt-export-poster`
- `boutique-ellite11`
- `boutique-disclaimer`

## Response

```json
{
  "records": [
    {
      "section": "home-page-slider",
      "slot": 1,
      "kind": "image",
      "value": "https://res.cloudinary.com/..."
    },
    {
      "section": "social-media",
      "slot": 1,
      "kind": "url",
      "title": "Instagram",
      "value": "https://instagram.com/your-page"
    },
    {
      "section": "social-media",
      "slot": 2,
      "kind": "url",
      "title": "Youtube",
      "value": "https://youtube.com/@your-channel"
    },
    {
      "section": "social-media",
      "slot": 3,
      "kind": "url",
      "title": "Facebook",
      "value": "https://facebook.com/your-page"
    }
  ],
  "bySection": { "...": [] },
  "sectionLayout": {
    "become-a-seller": {
      "heroImage": "https://.../hero-main.jpg",
      "heroSlider": [
        { "slot": 1, "value": "https://.../hero1.jpg" },
        { "slot": 2, "value": "https://.../hero2.jpg" }
      ],
      "bottomSlider": [
        { "slot": 4, "value": "https://.../bottom1.jpg" },
        { "slot": 5, "value": "https://.../bottom2.jpg" }
      ]
    }
  }
}
```

- `records` — flat list (easy to loop)  
- `sectionLayout` — **use this on the frontend** — named groups per section (empty groups are `[]`)  
- `bySection` — same data grouped by section, slots sorted ascending  

Empty slots (never uploaded) are **not** included.

## Examples

**All media (e.g. app shell / cache once):**

```http
GET http://localhost:8000/api/site-media/public
```

**Home slider only:**

```http
GET http://localhost:8000/api/site-media/public?section=home-page-slider
```

**Contact page images:**

```http
GET http://localhost:8000/api/site-media/public?section=contact-us
```

**Footer social links:**

```http
GET http://localhost:8000/api/site-media/public?section=social-media
```

## Website usage (JavaScript)

```js
const API = 'http://localhost:8000'; // or production API URL

async function loadHomeSlider() {
  const res = await fetch(`${API}/api/site-media/public?section=home-page-slider`);
  const { bySection } = await res.json();
  const slides = (bySection['home-page-slider'] || [])
    .filter((s) => s.kind === 'image')
    .sort((a, b) => a.slot - b.slot)
    .map((s) => s.value);
  return slides; // string[] of image URLs
}
```

TypeScript helper (copy from admin repo):

`admin/frontend/src/shared/services/siteMediaPublic.service.ts`

```ts
import { fetchPublicSiteMedia, imageUrlsForSection } from './siteMediaPublic.service';

const data = await fetchPublicSiteMedia('https://your-api.com', 'home-page-slider');
const sliderImages = imageUrlsForSection(data, 'home-page-slider');
```

## Admin vs public

| Use            | Endpoint                              | Auth        |
|----------------|---------------------------------------|-------------|
| Admin panel    | `GET /api/admin-personnel/media`      | Bearer JWT  |
| Public website | `GET /api/site-media/public`          | None        |

Uploads still go through admin (`POST /api/upload/cloudinary`); the public API is read-only.
