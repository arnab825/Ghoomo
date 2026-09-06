# Ghoomo - API Contracts

## 1. Social URL Extraction (`POST /api/social-import`)

### Request
```json
{
  "url": "https://www.instagram.com/reel/C3abc123xyz/",
  "tripId": "uuid-optional"
}
```

### Response
```json
{
  "success": true,
  "source": {
    "url": "https://www.instagram.com/reel/C3abc123xyz/",
    "platform": "instagram",
    "title": "7 Hidden Sunrise Spots in Varanasi You Must Visit",
    "author": "@explorer_aarav",
    "thumbnailUrl": "https://images.unsplash.com/photo-1561361513-2d000a50f0dc"
  },
  "extractedPlaces": [
    {
      "name": "Assi Ghat Subah-e-Banaras",
      "city": "Varanasi",
      "state": "Uttar Pradesh",
      "lat": 25.2917,
      "lng": 83.0076,
      "category": "spiritual",
      "confidence": 0.95,
      "notes": "Spiritual classical music & aarti at 5:30 AM"
    }
  ]
}
```

---

## 2. Trip CRUD Operations

- `GET /api/trips`: List all trips created by or shared with current user.
- `POST /api/trips`: Create new trip record.
- `GET /api/trips/:id`: Retrieve complete trip bundle (trip, sources, places, days, items, budget, checklist).
- `PUT /api/trips/:id`: Update trip metadata.
- `DELETE /api/trips/:id`: Archive or delete trip.

---

## 3. Collaboration Invites

- `POST /api/trips/:id/collaborate`: Generate shareable token or send email invite.
- `GET /api/trips/share/:token`: Public read-only trip payload for shared links.
