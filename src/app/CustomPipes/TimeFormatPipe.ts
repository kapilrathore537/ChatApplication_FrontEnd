import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeFormat',
  standalone: true
})
export class TimeFormatPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';  
    // Assuming value is in the format "HH:MM:SS"
    const [hours, minutes] = value.split(':');

    return `${hours}:${minutes}`;
  }
}
