 export function isValidDate(date: any): boolean {
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime()); // `getTime()` returns NaN if invalid
  }


 export function isValidUrl(url: string | null | undefined): boolean {
    if (!url) {
      return false; // URL is null or undefined
    }
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch {
      return false; // Invalid URL
    }
  }


  export function isValidImageUrl(url: string | null | undefined ): boolean {
  if (!url || !isValidUrl(url)) {
    return false;
  }

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];

  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname.toLowerCase();
    return imageExtensions.some((ext) => pathname.endsWith(ext));
  } catch {
    return false;
  }
}