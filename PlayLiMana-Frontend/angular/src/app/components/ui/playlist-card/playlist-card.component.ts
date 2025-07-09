import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Playlist } from '../../../models/playlist.model';
import { DurationPipe } from '../../../pipes/duration.pipe';

@Component({
  selector: 'app-playlist-card',
  standalone: true,
  templateUrl: './playlist-card.component.html',
  styleUrls: ['./playlist-card.component.scss'],
  imports: [CommonModule, DurationPipe],
})
export class PlaylistCardComponent {
  @Input() playlist!: Playlist; // Übergibt der Karte die Playlist-Daten durch die `Input`-Dekoration
  @Output() playlistClick = new EventEmitter<Playlist>(); // Ermöglicht das Signal an die Parent-Komponente (click)
  
  // Methode, um das Klick-Ereignis weiterzuleiten
  onPlaylistClick(): void {
    console.log(this.playlist.playtime);
    this.playlistClick.emit(this.playlist); // Gibt das Playlist-Objekt als Event aus
  }
}