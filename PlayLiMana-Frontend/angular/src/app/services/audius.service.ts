import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AudiusService {
  private readonly baseUrl = 'https://discoveryprovider.audius.co/v1';

  constructor(private http: HttpClient) {}

  searchTracks(query: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/tracks/search`, {
      params: { query, limit: 10 },
    });
  }

  getEmbedUrl(trackId: string): string {
    return `https://audius.co/embed/track?trackId=${trackId}`;
  }
}
