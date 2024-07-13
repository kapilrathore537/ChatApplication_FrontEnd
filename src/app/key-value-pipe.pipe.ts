import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'keyvalue',
  standalone: true
})
export class KeyValuePipePipe implements PipeTransform {

  transform(value: any): any {
    if (!value) return [];
    
    // Convert object into an array of key-value pairs
    return Object.keys(value).map(key => ({ key, value: value[key] }));
  }

}
