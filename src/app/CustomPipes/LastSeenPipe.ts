import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'lastSeen',
  pure: false, // Marking pipe as impure to allow dynamic updates
  standalone: true
})
export class LastSeenPipe implements PipeTransform {

  transform(value: Date | string): string {
    const lastSeenDate = new Date(value);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastSeenDate.getTime()) / 1000);

    const secondsInMinute = 60;
    const secondsInHour = 3600;
    const secondsInDay = 86400;
    const secondsInMonth = 2592000; // Approximation: 30 days
    const secondsInYear = 31536000; // Approximation: 365 days

    if (diffInSeconds < secondsInMinute) {
      return 'Just now';
    } else if (diffInSeconds < secondsInHour) {
      const minutes = Math.floor(diffInSeconds / secondsInMinute);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < secondsInDay) {
      const hours = Math.floor(diffInSeconds / secondsInHour);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < secondsInMonth) {
      const days = Math.floor(diffInSeconds / secondsInDay);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < secondsInYear) {
      const months = Math.floor(diffInSeconds / secondsInMonth);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffInSeconds / secondsInYear);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
  }
}
