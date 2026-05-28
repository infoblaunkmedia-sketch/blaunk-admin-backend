# Homepage Testimonials API

## Public (no auth)

```http
GET /api/testimonials/public
```

**Response `200`:**

```json
{
  "records": [
    {
      "name": "Rajesh Kumar",
      "occupation": "exporter",
      "country": "India",
      "rating": 5,
      "description": "Blaunk helped us grow exports quickly.",
      "profilePhotoUrl": "https://res.cloudinary.com/.../profile.jpg",
      "sortOrder": 1
    }
  ]
}
```

- Only `isActive: true` records
- Sorted by `sortOrder` ascending, then `createdAt`
- Empty: `{ "records": [] }`

## Admin (JWT — `admin` role only)

| Method | Path | Action |
|--------|------|--------|
| `GET` | `/api/testimonials` | List all |
| `POST` | `/api/testimonials` | Create |
| `PUT` | `/api/testimonials/:id` | Update |
| `DELETE` | `/api/testimonials/:id` | Delete |

**Profile photo upload:**

```http
POST /api/upload/testimonial-photo
Authorization: Bearer <admin JWT>
Content-Type: multipart/form-data
```

Field: `image` (max 1 MB)

### Fields

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | required |
| `occupation` | enum | `owner`, `manager`, `founder`, `retailer`, `trader`, `exporter`, `wholesaler`, `director` |
| `country` | string | Full country name (e.g. `India`, `United Arab Emirates`) |
| `rating` | integer | 1–5 |
| `description` | string | max **70** chars (server enforced) |
| `profilePhotoUrl` | string | image URL |
| `sortOrder` | number | optional; default `0` (not shown in CMS admin UI) |
| `isActive` | boolean | default `true` |
