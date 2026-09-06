# Ghoomo - Testing & QA Strategy

## 1. Automated Verification
- Run `npm run build` to verify strict TypeScript types, server/client boundaries, and route parameters.
- Run `npm run lint` for ESLint adherence.

## 2. Core Flow End-to-End Test Matrix
1. **URL Ingestion**: Ingest Instagram Reel, TikTok, YouTube Shorts, and generic URLs. Confirm extraction metadata, creator attribution, and confidence score.
2. **Interactive Map**: Verify Leaflet map renders smoothly, pins update when new places are added, and popup cards open on marker click.
3. **Clustering & Itinerary**: Add 6 places across a city; run auto-generate; confirm nearby spots are grouped onto the same day.
4. **Collaboration**: Generate invite link, open in incognito or toggle demo persona to Collaborator; verify permissions work.
5. **Budget & Checklist**: Add custom expense; verify total calculations; toggle checklist items.
