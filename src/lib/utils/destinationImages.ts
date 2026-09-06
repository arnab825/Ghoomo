/**
 * Smart Destination & Place Image Resolver
 * Provides reliable, high-resolution imagery for Indian and global destinations.
 * Automatically handles failed CDN links (Instagram, YouTube 404s, CORS blocks).
 */

export const DESTINATION_PHOTOS: Record<string, string> = {
  jaipur: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
  rajasthan: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
  udaipur: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=1200&q=80',
  jodhpur: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80',
  goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
  varanasi: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80',
  kashi: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=80',
  agra: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80',
  taj: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80',
  kerala: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
  munnar: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80',
  alleppey: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
  delhi: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80',
  mumbai: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80',
  ladakh: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1200&q=80',
  leh: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1200&q=80',
  himachal: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80',
  manali: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80',
  shimla: 'https://images.unsplash.com/photo-1597074866923-dc0589150358?auto=format&fit=crop&w=1200&q=80',
  spiti: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1200&q=80',
  kashmir: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=1200&q=80',
  srinagar: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=1200&q=80',
  switzerland: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
  swiss: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
  semporna: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
  thailand: 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1200&q=80',
  bangalore: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80',
  bengaluru: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=80',
  default: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80',
};

/**
 * Returns a high-res cover photo matched by destination region or trip title.
 */
export function getDestinationImage(destination?: string, title?: string, fallbackUrl?: string): string {
  const query = `${destination || ''} ${title || ''}`.toLowerCase();

  for (const [key, url] of Object.entries(DESTINATION_PHOTOS)) {
    if (key !== 'default' && query.includes(key)) {
      return url;
    }
  }

  return fallbackUrl || DESTINATION_PHOTOS.default;
}

/**
 * Sanitizes and repairs social thumbnails and cover images.
 * Fixes YouTube 404 maxresdefault, avoids expired Instagram CDN links,
 * and falls back to destination image if needed.
 */
export function sanitizeImageUrl(url?: string | null, destination?: string, title?: string): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return getDestinationImage(destination, title);
  }

  const clean = url.trim();

  // If YouTube maxresdefault, convert to hqdefault (which always exists)
  if (clean.includes('img.youtube.com') && clean.includes('maxresdefault.jpg')) {
    return clean.replace('maxresdefault.jpg', 'hqdefault.jpg');
  }

  // Instagram CDN URLs expire within hours or days and return 403 Forbidden
  // when hotlinked without exact referrer/headers. Replace with high-quality destination photo.
  if (clean.includes('cdninstagram.com') || clean.includes('fbcdn.net')) {
    return getDestinationImage(destination, title);
  }

  return clean;
}
