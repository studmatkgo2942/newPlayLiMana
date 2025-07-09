import { Pipe, PipeTransform } from '@angular/core';
import { formatDuration } from '../utils/format.util';

@Pipe({
  name: 'duration',
  standalone: true,
})
export class DurationPipe implements PipeTransform {
  transform(value: number | undefined): string {
   return formatDuration(value);
  }
}