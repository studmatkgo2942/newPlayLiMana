import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PlaylistService } from '../../../services/playlist.service';
import { Playlist } from '../../../models/playlist.model';
import { HttpClientModule } from '@angular/common/http';
import { DataService } from '../../../services/data.service';
import { DurationPipe } from '../../../pipes/duration.pipe';
import { SongCardComponent } from '../../ui/song-card/song-card.component';
import { sortSongs } from '../../../utils/sort.util';
import { PlaylistPopupComponent } from '../../ui/playlist-popup/playlist-popup.component';

@Component({
  selector: 'app-playlist-detail',
  standalone: true,
  imports: [CommonModule, HttpClientModule, DurationPipe, SongCardComponent, PlaylistPopupComponent],
  providers: [PlaylistService],
  templateUrl: './playlist-detail.component.html',
  styleUrl: './playlist-detail.component.scss'
})


export class PlaylistDetailComponent implements OnInit {
  playlistId: string | null = null;
  playlist: Playlist | null = null;
  selectedSortCriterion: string = 'Custom';
  isAscending: boolean = false;
  isEditing: boolean = false;
  errorMessage: string | null = null;
  errorStatusCode: number | null = null;


  readonly sortOptions: { label: string, value: string }[] = [
    { label: 'Custom', value: 'CUSTOM' },
    { label: 'Recently Added', value: 'RECENTLY_ADDED' },
    { label: 'Release Date', value: 'RELEASE_DATE' },
    { label: 'Title', value: 'TITLE' },
    { label: 'Artist', value: 'ARTIST' },
    { label: 'Album', value: 'ALBUM' },
    { label: 'Playtime', value: 'PLAYTIME' }
  ];

  constructor(private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    private playlistService: PlaylistService) { }

  ngOnInit(): void {
    const playlistId = this.route.snapshot.paramMap.get('id');
    if (playlistId) {
      this.dataService.setCurrentPlaylistId(+playlistId);
      this.playlistService.getPlaylistById(+playlistId).subscribe({
        next: (playlist) => {
          console.log('Playlist abgerufen:', playlist);
          this.playlist = playlist;
          this.selectedSortCriterion = playlist.sorting ?? 'CUSTOM';
        },
        error: (err) => {
          console.error('Fehler beim Abrufen der Playlist:', err);
          this.errorStatusCode = err.status;

          if (err.status === 404) {
            this.errorMessage = 'Playlist not found.';
          } else if (err.status === 403) {
            this.errorMessage = 'Playlist is private.';
          } else if (err.status === 401) {
            this.errorMessage = 'Authorization failed.'
          } else if (err.status === 0) {
            this.errorMessage = 'Server unreachable. Check your internet connection or try again later.';
          } else {
            this.errorMessage = 'An unexpected error occurred.';
          }
        }
      });
    } else {
      console.error('Keine Playlist-ID in der URL gefunden!');
    }
  }

  /* Sorting */
  onSortSelectionChange(event: any): void {
    this.selectedSortCriterion = event.target.value;
    if (this.playlist?.songs) {
      sortSongs(this.playlist?.songs, this.selectedSortCriterion, this.isAscending);
    }
  }

  toggleSortingOrder(): void {
    this.isAscending = !this.isAscending;
    if (this.playlist?.songs) {
      sortSongs(this.playlist?.songs, this.selectedSortCriterion, this.isAscending);
    }
  }

  /* Editing */
  enterEditMode(): void {
    this.isEditing = true;
  }

  exitEditMode(): void {
    this.isEditing = false;
  }

  // Methode: Änderungen speichern (Mock-Implementierung)
  saveChanges(): void {
    if (this.playlist) {
      console.log('Speichern gedrückt: ', this.playlist);
      this.isEditing = false;
      // Hier kann die Logik für die API-Updates hinzugefügt werden
      // this.playlistService.updatePlaylist(this.playlist).subscribe({
      //   next: () => console.log('Änderungen erfolgreich gespeichert'),
      //   error: (err) => console.error('Fehler beim Speichern:', err),
      // });
    }
  }

  // Methode: Cover bearbeiten (Mock-Implementierung für später)
  editCover(): void {
    console.log('Bearbeiten des Covers gestartet');
  }
}