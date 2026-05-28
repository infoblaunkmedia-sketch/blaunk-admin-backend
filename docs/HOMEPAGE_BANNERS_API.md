# Homepage Banners API (CMS)

Marketing homepage (`Frontend/`) loads all slots via **`GET /api/banners/public`**.  
Admin manages content under **CMS → Homepage Banners**.

**Base URL:** `http://localhost:8000` (or production backend)

---

## Public (no auth)

```http
GET /api/banners/public?page=home&position={position}
```

- Always returns `{ "records": [] }` when empty (not 404).
- Filters: `page`, `position` (lowercase), `isActive`, `startDate`/`endDate`.
- Sort: `sortOrder` ascending.
- Omit `position` to return all active `page=home` records.

### All `position` values

| position | Use on site |
|----------|-------------|
| `hero` | Top carousel |
| `market-map` | BGT map image |
| `market-card` | Market section cards |
| `industry-card` | Industry insights |
| `bdial-feature` | B-Dial hero image |
| `bdial-service` | B-Dial service cards |
| `bdial-logistics` | B-Dial logistics cards |
| `bdial-helpdesk` | Helpdesk bar (title + subtitle phone) |
| `trade-hub` | Connect slider below B-Dial (21:9, title/subtitle/ctaText) |
| `connect-testimonials` | Connect slider above testimonials (same fields, separate records) |
| `partner-spotlight` | Partner scroller |
| `sustainability` | Ethical & Green block |
| `cake-upload` | Cake GIFF boxes (max 2 · sortOrder 1=left, 2=right) |
| `valued-clients` | Client marquee images |

**Not implemented (frontend hardcoded):** `home-ticker`, `valued-clients-header`.

### Example hero record

```json
{
  "id": "...",
  "page": "home",
  "position": "hero",
  "title": "Welcome to Blaunk",
  "imageUrl": "/uploads/banner-123.jpg",
  "linkUrl": "https://blaunk.com",
  "tag": "0% Commission Platform",
  "subtitle": "Direct sourcing from verified manufacturers.",
  "ctaText": "Connect Now",
  "titleAccent": "",
  "description": "",
  "overlayQuote": "",
  "variant": "",
  "focalPoint": { "x": 50, "y": 45 },
  "sortOrder": 1,
  "isActive": true,
  "startDate": null,
  "endDate": null,
  "createdAt": "2026-05-22T07:21:09.961Z"
}
```

### Example `cake-upload` public response

`GET /api/banners/public?page=home&position=cake-upload` returns flat records only (no `title`, no `linkUrl`):

```json
{
  "records": [
    {
      "id": "674a1b2c3d4e5f6789012345",
      "page": "home",
      "position": "cake-upload",
      "sortOrder": 1,
      "imageUrl": "/uploads/cake-left.jpg",
      "isActive": true
    },
    {
      "id": "674a1b2c3d4e5f6789012346",
      "page": "home",
      "position": "cake-upload",
      "sortOrder": 2,
      "imageUrl": "/uploads/cake-right.jpg",
      "isActive": true
    }
  ]
}
```

**Placement:** `sortOrder` `1` = left box, `2` = right box. Inactive rows are omitted from the public list.

Admin `GET /api/banners?position=cake-upload` still returns CMS fields (`format`, `slotKey`, `sectionLayout`, etc.).

`POST` / `PUT` for `cake-upload`: `page`, `position`, `imageUrl`, `variant` or `format`, `isActive`, `sortOrder` (1=left, 2=right).

---

## Admin (JWT + `cms:banners` or admin role)

| Method | Path |
|--------|------|
| `GET` | `/api/banners?page=home&position=hero` |
| `POST` | `/api/banners` |
| `PUT` | `/api/banners/:id` |
| `PATCH` | `/api/banners/:id` (alias) |
| `DELETE` | `/api/banners/:id` |

### Image upload

```http
POST /api/upload/banner
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Field: `image` (max 2 MB) → response `{ "url": "/uploads/..." }` — use as `imageUrl` in banner body.

---

## Smoke test

```bash
BASE=http://localhost:8000/api
for pos in hero market-map market-card industry-card bdial-feature bdial-service bdial-logistics bdial-helpdesk trade-hub connect-testimonials partner-spotlight sustainability cake-upload valued-clients; do
  echo "=== $pos ==="
  curl -s "$BASE/banners/public?page=home&position=$pos" | head -c 200
  echo ""
done
```

---

## Seed data

On first empty `page=home` collection, server seeds: 1× hero, 2× market-card, 1× trade-hub.

---

## Deploy / CORS

- Static files: `GET /uploads/*` from backend.
- CORS: localhost, LAN, Vercel (see `server.js`).
- Production example: `https://blaunk-admin-backend-hwl9.onrender.com`
