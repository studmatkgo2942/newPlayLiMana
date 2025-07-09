import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';
import { Playlist } from '../models/playlist.model';
import { Song } from '../models/song.model';
import { DataService } from './data.service';
import { ValidImageUrlPipe } from '../pipes/image.pipe';
import { mapPlaylistDTOToPlaylist } from '../utils/format.util';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PlaylistService {
  private apiUrl = environment.apiUrl + '/api/v1/playlists/';
  private headers = new HttpHeaders({ Authorization: 'Bearer dummy-token' });

  constructor(
    private http: HttpClient,
    private dataService: DataService,
    private validImageUrlPipe: ValidImageUrlPipe
  ) {}

  // GET all playlists
  getPlaylists(): Observable<Playlist[]> {
    return this.dataService.getPlaylists$().pipe(
      switchMap((cachedPlaylists) => {
        if (cachedPlaylists.length > 0) {
          console.log('Playlists aus Cache geladen.');
          return of(cachedPlaylists);
        }

        return this.http.get<Playlist[]>(this.apiUrl, { headers: this.headers }).pipe(
          tap((playlists) => {
            const mappedPlaylists = playlists.map((playlist) => mapPlaylistDTOToPlaylist(playlist));
            this.dataService.setPlaylists(mappedPlaylists);
          })
        );
      })
    );
  }

  // GET specific playlist by ID
  getPlaylistById(playlistId: number): Observable<Playlist> {
    return this.dataService.getPlaylists$().pipe(
      switchMap((cachedPlaylists) => {
        const cachedPlaylist = cachedPlaylists.find((playlist) => playlist.playlistId === playlistId);
        if (cachedPlaylist) {
          console.log(`Playlist ${playlistId} aus Cache geladen.`);
          return of(cachedPlaylist);
        }

        return this.http.get<Playlist>(`${this.apiUrl}${playlistId}`, { headers: this.headers }).pipe(
          tap((playlist) => {
            const mappedPlaylist = mapPlaylistDTOToPlaylist(playlist);
            this.dataService.addPlaylist(mappedPlaylist);
          })
        );
      })
    );
  }

  // POST a new playlist
  createPlaylist(playlist: Playlist): Observable<Playlist> {
    const headers = this.headers.set('Content-Type', 'application/json');
    return this.http.post<Playlist>(`${this.apiUrl}create`, playlist, { headers }).pipe(
      tap((newPlaylist) => {
        this.dataService.addPlaylist(newPlaylist);
      })
    );
  }

  // PATCH to edit a playlist
  editPlaylist(playlist: Playlist): Observable<Playlist> {
    return this.http.put<Playlist>(`${this.apiUrl}${playlist.playlistId}`, playlist, { headers: this.headers }).pipe(
      tap((updatedPlaylist) => {
        this.dataService.updatePlaylist(updatedPlaylist);
      })
    );
  }

  // DELETE a playlist by ID
  deletePlaylist(playlistId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}${playlistId}`, { headers: this.headers }).pipe(
      tap(() => {
        this.dataService.removePlaylist(playlistId);
      })
    );
  }

  // POST a song to a playlist
  addSongToPlaylist(playlistId: number, song: Song): Observable<Playlist> {
    return this.http.post<Playlist>(`${this.apiUrl}${playlistId}/songs`, song, { headers: this.headers }).pipe(
      tap((updatedPlaylist) => {
        this.dataService.updatePlaylist(updatedPlaylist);
      })
    );
  }

  // DELETE a song from a playlist by song ID and position
  removeSongFromPlaylist(playlistId: number, songId: number, position: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${this.apiUrl}${playlistId}/songs/${songId}?position=${position}`,
      { headers: this.headers }
    ).pipe(
      tap(() => {
        console.log(`Song with ID ${songId} removed from playlist ${playlistId} at position ${position}`);
      })
    );
  }

  // PATCH the song order in a playlist
  changeSongOrder(playlistId: number, playlist: Playlist): Observable<Playlist> {
    return this.http.patch<Playlist>(`${this.apiUrl}${playlistId}/songOrder`, playlist, { headers: this.headers }).pipe(
      tap((updatedPlaylist) => {
        this.dataService.updatePlaylist(updatedPlaylist);
      })
    );
  }

  // PATCH the playlist name
  changePlaylistName(playlistId: number, name: string): Observable<Playlist> {
    return this.http.patch<Playlist>(`${this.apiUrl}${playlistId}/name`, { name }, { headers: this.headers }).pipe(
      tap((updatedPlaylist) => {
        this.dataService.updatePlaylist(updatedPlaylist);
      })
    );
  }

  // PATCH the playlist description
  changePlaylistDescription(playlistId: number, description: string): Observable<Playlist> {
    return this.http.patch<Playlist>(
      `${this.apiUrl}${playlistId}/description`,
      { description },
      { headers: this.headers }
    ).pipe(
      tap((updatedPlaylist) => {
        this.dataService.updatePlaylist(updatedPlaylist);
      })
    );
  }

  // PATCH the playlist visibility
  changePlaylistVisibility(playlistId: number, visibility: 'PUBLIC' | 'PRIVATE'): Observable<Playlist> {
    return this.http.patch<Playlist>(
      `${this.apiUrl}${playlistId}/visibility`,
      { visibility },
      { headers: this.headers }
    ).pipe(
      tap((updatedPlaylist) => {
        this.dataService.updatePlaylist(updatedPlaylist);
      })
    );
  }
}