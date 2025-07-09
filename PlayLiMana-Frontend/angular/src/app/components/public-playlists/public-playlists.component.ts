import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlaylistService } from '../../services/playlist.service';
import { Playlist } from '../../models/playlist.model';
import { RouterModule, Router } from '@angular/router';
import { DurationPipe } from '../../pipes/duration.pipe';

@Component({
  selector: 'app-public-playlists',
  standalone: true,
  imports: [CommonModule, RouterModule, DurationPipe],
  templateUrl: './public-playlists.component.html',
  styleUrls: ['./public-playlists.component.scss']
})
export class PublicPlaylistsComponent implements OnInit {
  publicPlaylists: Playlist[] = [];
  loading: boolean = true;
  error: string = '';

  constructor(private playlistService: PlaylistService, private router: Router) {}

  ngOnInit(): void {
    this.fetchPublicPlaylists();
  }

  fetchPublicPlaylists(): void {
    this.playlistService.getPlaylists().subscribe({
      next: (playlists) => {
        this.publicPlaylists = playlists.filter(p => p.visibility === 'PUBLIC');
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load public playlists', err);
        this.error = 'Could not load public playlists.';
        this.loading = false;
      }
    });
  }

  viewPlaylist(playlist: Playlist): void {
    this.router.navigate(['/playlist', playlist.playlistId]);
  }
}
