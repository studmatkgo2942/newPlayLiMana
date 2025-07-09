import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { PlaylistService } from '../../../services/playlist.service';
import { Playlist } from '../../../models/playlist.model';
import { PlaylistPopupComponent } from '../../ui/playlist-popup/playlist-popup.component';
import { RouterModule, Router } from '@angular/router';
import { DataService } from '../../../services/data.service';
import { DurationPipe } from '../../../pipes/duration.pipe';
import { sortPlaylists } from '../../../utils/sort.util';
import { PlaylistCardComponent } from '../../ui/playlist-card/playlist-card.component';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [
    CommonModule, 
    HttpClientModule, 
    PlaylistPopupComponent, 
    RouterModule, 
    DurationPipe, 
    PlaylistCardComponent
  ],
  providers: [],
  templateUrl: './library.component.html',
  styleUrls: ['./library.component.scss']
})

export class LibraryComponent implements OnInit {
  playlists: Playlist[] = [];
  apiUrl = 'http://localhost:9000/playlist';
  selectedSortCriterion: string = 'Recently Added';
  isAscending: boolean = false;

  constructor(
    private http: HttpClient,
    private playlistService: PlaylistService,
    private router: Router,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    this.getPlaylists();
  }

 /* Get all playlists in library*/
  getPlaylists(): void {
    this.playlistService.getPlaylists().subscribe((playlists) => {
      this.playlists = playlists;
      sortPlaylists(this.playlists, this.selectedSortCriterion, this.isAscending);
    });
  }

  /* React to creation of new playlist */
  handlePlaylistCreated(newPlaylist: Playlist): void {
    // Add new playlist to others
    this.playlists.push({
      playlistId: this.playlists.length + 1,
      playlistName: newPlaylist.playlistName,
      visibility: newPlaylist.visibility,
      sorting: 'CUSTOM',
      numberOfSongs: newPlaylist.numberOfSongs,
      playtime: newPlaylist.playtime,
      dateAdded: new Date(),
      coverUrl: '/assets/playlist-cover-placeholder.svg',
      songs: [],
    });
    // Sort to right position
    sortPlaylists(this.playlists, this.selectedSortCriterion, this.isAscending);
    // Scroll down
    setTimeout(() => {
    const newIndex = this.playlists.findIndex(
    playlist => playlist.playlistName === newPlaylist.playlistName
    );
    const playlistElements = document.querySelectorAll('.playlist-card');
    const playlistToScrollTo = playlistElements[newIndex];
    playlistToScrollTo?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 0);
    // Redirect to detail page
    //this.router.navigate(['/playlist', newPlaylist.playlistId]);
  }

  /* Sorting */
  onSortSelectionChange(event: any): void {
    this.selectedSortCriterion = event.target.value;
    sortPlaylists(this.playlists, this.selectedSortCriterion, this.isAscending);
  }

  toggleSortingOrder(): void {
    this.isAscending = !this.isAscending;
    sortPlaylists(this.playlists, this.selectedSortCriterion, this.isAscending);
  }

  /* Click on playlist card */
  goToPlaylist(playlist: Playlist): void {
    console.log("Klick auf Playlist: ", playlist);
    this.router.navigate(['/playlist', playlist.playlistId]);
  }
}