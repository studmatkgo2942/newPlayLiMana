export interface SearchResultDisplayItem {
    id: string
    title: string
    type: "Artist" | "Album" | "Track"
    imageUrl?: string
    externalUrl?: string
    previewUrl?: string
    uri?: string
    source?: "spotify" | "audius"
}

export interface SelectedTrackInfo {
    url: string
    title: string
    imageUrl?: string
    source?: "spotify" | "audius"
}

export interface GroupedResults {
    artists: SearchResultDisplayItem[]
    tracks: SearchResultDisplayItem[]
    albums: SearchResultDisplayItem[]
}

export interface SongForPlaylist {
    songId?: string
    title: string
    artists: string
    album?: string
    coverUrl?: string
    playtime?: number
    linksForWebPlayer: string[]
    uri?: string
}