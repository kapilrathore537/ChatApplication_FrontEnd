import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileType',
  standalone:true
})
export class FileTypePipe implements PipeTransform {

  transform(url: string): string {
    const fileName = url.substring(url.lastIndexOf('/') + 1);
    const fileExtension = fileName.split('.').pop();
    const type = fileExtension ? fileExtension.toLowerCase() : 'unknown';
    return type;
  }

}
