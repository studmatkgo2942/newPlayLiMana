import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DataService } from './services/data.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  constructor(private dataService: DataService) {}
  title = 'PlayLiMana';

  ngOnInit(): void {
    const ttl = 1000 * 60; // 1 min
    this.dataService.initializePlaylistsFromStorage(ttl);
  }
}
