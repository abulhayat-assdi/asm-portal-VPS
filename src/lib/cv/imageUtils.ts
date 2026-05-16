/**
 * Resolves a profile photo URL to a directly renderable image URL.
 * Handles Google Drive share links, lh3.googleusercontent.com, and plain URLs.
 */
export function resolveProfilePhoto(url: string | null | undefined): string | null {
  if (!url || !url.trim()) return null;

  // Pattern 1: https://drive.google.com/file/d/FILE_ID/view?...
  const matchFile = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFile) {
    return `https://drive.google.com/thumbnail?id=${matchFile[1]}&sz=w400`;
  }

  // Pattern 2: https://drive.google.com/open?id=FILE_ID
  const matchOpen = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (matchOpen) {
    return `https://drive.google.com/thumbnail?id=${matchOpen[1]}&sz=w400`;
  }

  // Pattern 3: https://drive.google.com/uc?id=FILE_ID (already a direct link)
  // Leave as-is, it works
  if (url.includes('drive.google.com/uc?')) return url;

  // Pattern 4: Google Photos / lh3 links — already direct, leave as-is
  if (url.includes('googleusercontent.com')) return url;

  // Anything else — return as-is (regular https image URL)
  return url;
}

/**
 * Checks whether a URL string looks like a valid image source.
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}
