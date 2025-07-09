export function getSpotifyTrackId(link?: string): string | null {
    if (!link) return null;
    const parts = link.split("/track/");
    if (parts.length < 2) return null;
    return parts[1].split("?")[0];          // strip any query-string
}
