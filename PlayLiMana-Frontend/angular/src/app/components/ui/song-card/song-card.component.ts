import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DurationPipe } from "../../../pipes/duration.pipe";
import { ValidImageUrlPipe } from "../../../pipes/image.pipe";
import { Song } from '../../../models/song.model';

@Component({
  selector: 'app-song-card',
  templateUrl: './song-card.component.html',
  styleUrls: ['./song-card.component.scss'],
  standalone: true,
  imports: [DurationPipe, ValidImageUrlPipe, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SongCardComponent {
  @Input() songs: Song[] = [];

  logValue(...values: any[]): void {
    values.forEach((value, index) => {
      console.log(`Value ${index + 1}:`, value);
    });
  }
}
