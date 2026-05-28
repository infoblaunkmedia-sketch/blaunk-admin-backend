# B-Store (Local Marketplace) API

## Public (no auth)

```http
GET /api/shops/public
GET /api/shops/public?category=PET%20SHOP
POST /api/shops/register
GET /api/shop-categories/public
```

`GET /shops/public` returns a **JSON array** of approved shops only.

## Admin (JWT + CMS rights)

| Route | Permission |
|-------|------------|
| `GET/PUT/DELETE /api/shops` | `cms:local-stores` |
| `GET/POST/PUT/DELETE /api/shop-categories` | `cms:store-categories` |
| `POST /api/upload/shop` | `cms:local-stores` |

## Seed

Empty DB: 3 categories + 6 approved sample shops (2 per category).
