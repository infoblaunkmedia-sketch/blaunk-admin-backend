# GIFF API (CMS + consumer site)

Manage page GIFF/GIF/JPG uploads under **CMS → GIFF** (separate from Homepage Banners).

**Base URL:** `http://localhost:8000` (or production backend)

---

## Categories

| `category` slug | Label | Max uploads |
|-----------------|-------|-------------|
| `home-page-cake-giff` | HOME PAGE CAKE - GIFF | 2 |
| `connect-page-giff` | CONNECT PAGE - GIFF | 2 |
| `boutique-page-giff` | BOUTIQUE PAGE - GIFF | 1 |
| `bgt-home-page-giff` | BGT HOME PAGE - GIFF | 1 |
| `dial-home-page-hotel-giff` | DIAL HOME PAGE - HOTEL GIFF | 2 |
| `dial-home-page-boutique` | DIAL HOME PAGE - BOUTIQUE | 1 |
| `hotel-home-page-giff` | HOTEL HOME PAGE - GIFF | 1 |
| `hotel-page-wedding-giff` | HOTEL PAGE WEDDING - GIFF | 1 |

`sortOrder` **1** = left slot, **2** = right slot (when max is 2).

---

## Public (no auth)

```http
GET /api/giff/public?category={category}
```

Omit `category` to return all active records (all categories).

```json
{
  "records": [
    {
      "id": "674a1b2c3d4e5f6789012345",
      "category": "home-page-cake-giff",
      "sortOrder": 1,
      "imageUrl": "/uploads/cake-left.gif",
      "format": "gif",
      "isActive": true
    }
  ]
}
```

Inactive rows are excluded from the public list.

---

## Admin (JWT + `cms:giff` or admin role)

| Method | Path |
|--------|------|
| `GET` | `/api/giff/categories` |
| `GET` | `/api/giff?category=home-page-cake-giff` |
| `POST` | `/api/giff` |
| `PUT` | `/api/giff/:id` |
| `DELETE` | `/api/giff/:id` |

### Upload image (max 700KB)

```http
POST /api/upload/giff
Authorization: Bearer {token}
Content-Type: multipart/form-data
image: (file)
```

### Create body

```json
{
  "category": "home-page-cake-giff",
  "imageUrl": "/uploads/image-123.gif",
  "format": "gif",
  "isActive": true,
  "sortOrder": 1
}
```

---

## Frontend integration (short flow)

1. **Load category** (e.g. home cake):  
   `GET /api/giff/public?category=home-page-cake-giff`
2. **Map slots:** `sortOrder === 1` → left box, `sortOrder === 2` → right box.
3. **Render:** use `imageUrl` (prefix with API origin if path is relative) and `format` (`gif` vs `jpg`).
4. **Admin:** CMS → GIFF tab → pick category → upload (auto-assigns next free slot).

Helper on admin app: `fetchPublicGiffs(category)` and `giffBySortOrder(records)` in `giff.service.ts`.
