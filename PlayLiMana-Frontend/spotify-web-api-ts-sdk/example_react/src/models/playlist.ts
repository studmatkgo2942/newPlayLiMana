import { Song } from "./song";

export interface Playlist {
  playlistId?: number;
  playlistName: string;
  description?: string;
  visibility: string;
  sorting: string;
  songs: Song[];
  numberOfSongs: number;
  playtime: number;
  dateAdded: Date;
  coverUrl?: string; 
}