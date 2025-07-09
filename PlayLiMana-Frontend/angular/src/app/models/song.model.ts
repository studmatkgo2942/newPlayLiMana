export interface Song {
  songId?: number;
  title: string;
  artists: string[];
  album?: string;
  genres?: string[];
  playtime: number; // Duration in seconds
  releaseDate: Date;
  linksForWebPlayer: string[];
  coverUrl?: string;
  positionInPlaylist?: number;
  addDate?: Date;
}