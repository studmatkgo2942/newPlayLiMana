import { Component } from '@angular/core';
import { AudiusService } from '../../services/audius.service';

@Component({
  selector: 'app-audius-search',
  standalone: true,
  templateUrl: './audius-search.component.html',
  styleUrls: ['./audius-search.component.scss'],
  imports: [],
})
export class AudiusSearchComponent {
  query = '';
  results: any[] = [];

  constructor(private audiusService: AudiusService) {}

  onSearch(): void {
    this.audiusService.searchTracks(this.query).subscribe((res: any) => {
      this.results = res.data;
    });
  }

  getEmbedUrl(trackId: string): string {
    return this.audiusService.getEmbedUrl(trackId);
  }
}
