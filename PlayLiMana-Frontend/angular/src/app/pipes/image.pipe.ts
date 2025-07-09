import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { isValidImageUrl } from '../utils/validate.util';

@Pipe({
  name: 'validImageUrl',
  standalone: true, // Kann direkt in Angular-Komponenten genutzt werden
})
@Injectable({ providedIn: 'root' }) 
export class ValidImageUrlPipe implements PipeTransform {
  /**
   * Überprüft, ob die URL gültig ist, und gibt alternativ einen passenden Platzhalter zurück.
   * @param url Die zu prüfende URL.
   * @param type Der Typ des Bildes: 'playlist' oder 'song'.
   * @returns Die valide URL oder ein passender Placeholder.
   */
  transform(url: string | null | undefined, type: 'playlist' | 'song'): string {
    const playlistPlaceholder = '/assets/playlist-cover-placeholder.svg';
    const songPlaceholder = '/assets/song-cover-placeholder.svg';

    if (isValidImageUrl(url)) {
      return url as string;
    }

    return type === 'playlist' ? playlistPlaceholder : songPlaceholder;
  }
}