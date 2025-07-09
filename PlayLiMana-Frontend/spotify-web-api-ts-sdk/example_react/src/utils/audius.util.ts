/**
 * If `link` looks like a normal Audius permalink,
 * return the 10-char track-id (the bit **after** the last “-”).
 * Otherwise `null`.
 * Example:  "https://audius.co/artist/track-name-A7R9K" → "A7R9K"
 */
export const getAudiusTrackId = (link?: string | null): string | null => {
    if (!link?.startsWith("https://audius.co/")) return null;

    const lastSegment = link.split("/").pop()!;      // "track-name-A7R9K"
    const maybeId     = lastSegment.split("-").pop(); // "A7R9K"
    return maybeId?.length ? maybeId : null;
};
