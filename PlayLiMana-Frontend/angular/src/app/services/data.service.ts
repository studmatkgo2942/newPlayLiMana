import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { Playlist } from '../models/playlist.model';
import { signData } from '../utils/crypto.util'
import { mapPlaylistDTOToPlaylist } from '../utils/format.util';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private secretKey = "testkey" // authService.getToken(); TODO
  private playlistsSubject = new BehaviorSubject<Playlist[]>([]);
  private playlists$: Observable<Playlist[]> = this.playlistsSubject.asObservable();
  private currentPlaylistIdSubject = new BehaviorSubject<number | null>(null);
  private currentPlaylistId$: Observable<number | null> = this.currentPlaylistIdSubject.asObservable();

  constructor() {
    this.playlists$.subscribe((playlists) => {
      this.saveToLocalStorage('playlists', playlists, this.secretKey);
    });
    this.currentPlaylistId$.subscribe((id) => {
      if (id !== null) this.saveToLocalStorage('currentPlaylistId', id, this.secretKey);
    });
  }


  // Save Cache
  saveToLocalStorage(key: string, data: any, secretKey: string): void {
    const timestamp = Date.now();
    const signature = signData(data, secretKey);
    const payload = { signature, data, timestamp };
    localStorage.setItem(key, JSON.stringify(payload));
  }

  // Load Cache
  loadFromLocalStorage<T>(key: string, secretKey: string, ttl: number): T | null {
    const rawPayload = localStorage.getItem(key);
    if (!rawPayload) return null;
    const payload = JSON.parse(rawPayload);

    if (ttl && Date.now() - payload.timestamp > ttl) {
      console.log('Cache veraltet.');
      localStorage.removeItem(key);
      return null;
    }

    const recalculatedSignature = signData(payload.data, secretKey);
    if (recalculatedSignature !== payload.signature) {
      console.warn('Daten wurden manipuliert!');
      return null;
    }

    return payload.data as T;
  }

  // Initialize playlists cache from storage
  initializePlaylistsFromStorage(ttl: number): void {
    const cachedPlaylists = this.loadFromLocalStorage<Playlist[]>('playlists', this.secretKey, ttl);
    if (cachedPlaylists) {
      const mappedPlaylists = cachedPlaylists.map((playlist) =>
        mapPlaylistDTOToPlaylist(playlist)
      );
      this.playlistsSubject.next(mappedPlaylists);
      console.log('Playlists aus lokalem Speicher in Cache geladen.');
    }
    const cachedPlaylistId = this.loadFromLocalStorage<number>('currentPlaylistId', this.secretKey, ttl);
    if (cachedPlaylistId !== null) {
      this.currentPlaylistIdSubject.next(cachedPlaylistId);
      console.log(`Aktuelle Playlist-ID aus lokalem Speicher geladen: ${cachedPlaylistId}`);
    }
  }

  // Cache all playlists
  setPlaylists(playlists: Playlist[]): void {
    this.playlistsSubject.next(playlists);
    console.log('Alle Playlists im Cache gespeichert:', playlists);
  }

  // Cache ID of the playlist currently displayed
  setCurrentPlaylistId(playlistId: number | null): void {
    if (this.currentPlaylistIdSubject.value === playlistId) {
      console.log(`Playlist-ID ${playlistId} wurde bereits gesetzt.`);
      return;
    }
    console.log(`Aktuelle Playlist-ID gesetzt: ${playlistId}`);
    this.currentPlaylistIdSubject.next(playlistId);
  }

  // Get cached ID of the playlist currently displayed
  getPlaylists$(): Observable<Playlist[]> {
    return this.playlists$;
  }

  // Get playlist corresponding to cached ID
  getCurrentPlaylist(): Observable<Playlist | null> {
    return combineLatest([this.playlists$, this.currentPlaylistId$]).pipe(
      map(([playlists, id]) => playlists.find(p => p.playlistId === id) || null)
    );
  }

  // Add single playlist to cache
  addPlaylist(playlist: Playlist): void {
    const currentPlaylists = this.playlistsSubject.value;
    // Check if already cached
    if (currentPlaylists.some((p) => p.playlistId === playlist.playlistId)) {
      console.log(`Playlist ${playlist.playlistId} bereits im Cache. Keine Änderungen.`);
    } else {
      const updatedPlaylists = [...currentPlaylists, playlist];
      console.log('Neue Playlist zum Cache hinzugefügt:', playlist);
      this.playlistsSubject.next(updatedPlaylists);
    }
  }

  // Update an existing playlist in the cache
  updatePlaylist(updatedPlaylist: Playlist): void {
    const currentPlaylists = this.playlistsSubject.value;
    // Check if the playlist exists in the cache
    const playlistIndex = currentPlaylists.findIndex(p => p.playlistId === updatedPlaylist.playlistId);
    if (playlistIndex !== -1) {
      // Replace the existing playlist with the updated one
      const updatedPlaylists = [...currentPlaylists];
      updatedPlaylists[playlistIndex] = updatedPlaylist;
      console.log('Playlist im Cache aktualisiert:', updatedPlaylist);
      this.playlistsSubject.next(updatedPlaylists);
    } else {
      console.warn(`Playlist ${updatedPlaylist.playlistId} nicht im Cache gefunden. Keine Aktualisierung durchgeführt.`);
    }
  }

  // Remove a playlist from the cache
  removePlaylist(playlistId: number): void {
    const currentPlaylists = this.playlistsSubject.value;
    // Check if the playlist exists in the cache
    const updatedPlaylists = currentPlaylists.filter(p => p.playlistId !== playlistId);
    if (updatedPlaylists.length !== currentPlaylists.length) {
      console.log(`Playlist ${playlistId} aus dem Cache entfernt.`);
      this.playlistsSubject.next(updatedPlaylists);
    } else {
      console.warn(`Playlist ${playlistId} nicht im Cache gefunden. Keine Änderungen durchgeführt.`);
    }
  }

  // Empty cache
  clearPlaylists(): void {
    this.playlistsSubject.next([]);
    this.currentPlaylistIdSubject.next(null);
    localStorage.removeItem('playlists');
    localStorage.removeItem('currentPlaylistId');
    console.log('Playlist-Cache geleert');
  }
}