# Admin & Personnel — Site Media API

Base URL: `{API_ORIGIN}` (e.g. `http://localhost:8000` or production backend)

---

## Authentication (admin endpoints only)

| Header | Value |
|--------|--------|
| `Authorization` | `Bearer <JWT>` |
| `Content-Type` | `application/json` (except file upload) |

**Roles:** `admin` (full access) or `employee` with permission `adminPersonnel` or `adminPersonnel:media`.

**Public endpoint:** no auth (see §6).

---

## Section IDs

| `section` | Type | Slots | Notes |
|-----------|------|-------|-------|
| `contact-us` | image (21:9) | 10 | Page banners (add more in admin) |
| `social-media` | **url** + image | 5 | Slots 1–3: Instagram, Youtube, Facebook URLs · slots 4–5: banners (21:9) |
| `become-a-seller` | image (21:9) | 6 | Slot 1: hero image · slots 2–4: hero slider · slots 5–6: bottom slider |
| `contest` | image (21:9) | 2 | Slider |
| `refer-earn` | image (21:9) | 2 | Slider |
| `career` | image (21:9) | 3 | Slot 1: top banner · slots 2–3: slider |
| `home-page-slider` | image (16:9) | 5 |
| `gif-poster` (Cakes & Bakes) | image (16:9) | 20 | `title`: `CARD_TITLE \| OFFER_TEXT` (offer optional) |
| `bgt-export-poster` | image (9:16) | 3 |
| `boutique-ellite11` | image (1:1) | 3 |
| `boutique-disclaimer` | image (16:9) | 1 |

`slot` is **1-based** (1 … max for that section).

---

## 1. List all saved media (admin)

```http
GET /api/admin-personnel/media
GET /api/site-media
```

Optional query:

```http
GET /api/admin-personnel/media?section=home-page-slider
```

**Response `200`:**

```json
{
  "records": [
    {
      "id": "665a1b2c3d4e5f6789012345",
      "section": "home-page-slider",
      "slot": 1,
      "kind": "image",
      "value": "https://res.cloudinary.com/.../image.jpg",
      "fileName": "banner.jpg",
      "updatedAt": "2026-05-23T12:00:00.000Z"
    }
  ]
}
```

---

## 2. Save / update slot (admin)

Upsert by `section` + `slot`. Used for **social URLs** and manual URL updates.

```http
PUT /api/admin-personnel/media/slots
PUT /api/site-media/slots
```

**Body:**

```json
{
  "section": "social-media",
  "slot": 1,
  "kind": "url",
  "value": "https://facebook.com/yourpage",
  "fileName": ""
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `section` | yes | See table above |
| `slot` | yes | Integer ≥ 1 |
| `kind` | yes | `"image"` or `"url"` |
| `value` | yes | Image URL or link URL (`http://` / `https://` for urls) |
| `fileName` | no | Original file name for images |

**Response `200`:**

```json
{
  "record": {
    "id": "...",
    "section": "social-media",
    "slot": 1,
    "kind": "url",
    "value": "https://facebook.com/yourpage",
    "fileName": "",
    "updatedAt": "..."
  }
}
```

---

## 3. Delete slot (admin)

Removes saved media for that section/slot. Public API will no longer return it.

```http
DELETE /api/admin-personnel/media/slots
DELETE /api/site-media/slots
```

**Body:**

```json
{
  "section": "home-page-slider",
  "slot": 2
}
```

**Response `200`:**

```json
{
  "deleted": true
}
```

---

## 4. Upload image to Cloudinary (admin)

Uploads file, saves to DB automatically (`kind: image`).

```http
POST /api/upload/cloudinary
```

**Headers:** `Authorization: Bearer <JWT>` only (multipart — no `Content-Type` header).

**Body:** `multipart/form-data`

| Field | Required |
|-------|----------|
| `image` | yes — image file (max **1 MB**) |
| `section` | yes — e.g. `home-page-slider` |
| `slot` | yes — e.g. `1` |

**Response `200`:**

```json
{
  "message": "Image uploaded successfully",
  "url": "https://res.cloudinary.com/.../image.jpg",
  "publicId": "bluank/admin-personnel/home-page-slider/slot-1-1716470000000",
  "section": "home-page-slider",
  "slot": 1
}
```

**Replace image:** same `POST` with same `section` + `slot` (overwrites DB record).

**Errors:** `400` validation · `401` unauthorized · `413` file too large · `503` Cloudinary not configured

---

## 5. Admin UI behaviour (reference)

| Action | API |
|--------|-----|
| Page load | `GET /api/admin-personnel/media` |
| Upload / replace image | `POST /api/upload/cloudinary` |
| Edit social URL | type in field → `PUT .../slots` (debounced) |
| Delete image or URL | `DELETE .../slots` |

---

## 6. Public read API (consumer website)

**No auth.** IP whitelist bypassed.

```http
GET /api/site-media/public
GET /api/site-media/public?section=home-page-slider
```

Aliases (same handler):

```http
GET /api/admin-personnel/media/public
```

**Response `200`:**

```json
{
  "records": [
    { "section": "home-page-slider", "slot": 1, "kind": "image", "value": "https://..." }
  ],
  "bySection": {
    "home-page-slider": [
      { "slot": 1, "kind": "image", "value": "https://..." }
    ]
  }
}
```

Only slots with a non-empty `value` are returned.

**Website examples:**

```js
// All sections once
const all = await fetch(`${API}/api/site-media/public`).then((r) => r.json());

// Home slider images only
const home = await fetch(`${API}/api/site-media/public?section=home-page-slider`).then((r) => r.json());
const images = (home.bySection['home-page-slider'] || []).map((s) => s.value);

// Social links
const social = await fetch(`${API}/api/site-media/public?section=social-media`).then((r) => r.json());
const links = (social.bySection['social-media'] || []).map((s) => s.value);
```

---

## 7. Error format

```json
{
  "message": "Human-readable error"
}
```

Common status codes: `400` · `401` · `403` · `413` · `500` · `503`

---

## 8. Endpoint summary

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/api/admin-personnel/media` | yes | List all (admin) |
| `PUT` | `/api/admin-personnel/media/slots` | yes | Save URL / update metadata |
| `DELETE` | `/api/admin-personnel/media/slots` | yes | Delete slot |
| `POST` | `/api/upload/cloudinary` | yes | Upload / replace image |
| `GET` | `/api/site-media/public` | **no** | Public website read |

Same routes also work under `/api/site-media` (except upload stays on `/api/upload/cloudinary`).
