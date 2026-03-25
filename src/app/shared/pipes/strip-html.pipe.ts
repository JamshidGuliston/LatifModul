import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'stripHtml',
    standalone: true
})
export class StripHtmlPipe implements PipeTransform {
    transform(value: string | null | undefined): string {
        if (!value) return '';

        // Create a temporary element to safely extract text content
        const tmp = document.createElement('div');
        tmp.innerHTML = value;

        // Get text content and clean up extra whitespace
        const text = tmp.textContent || tmp.innerText || '';

        // Decoding html entities is handled by innerHTML. Just extra whitespace cleaning
        return text.replace(/\s+/g, ' ').trim();
    }
}
