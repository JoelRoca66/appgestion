import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
    name: 'replaceNewlines',
    standalone: true
})
export class ReplaceNewlinesPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) {}

    transform(value: string): SafeHtml {
        if (!value) return '';
        
        let html = value
            .replace(/### (.*?)(\n|$)/g, '<h3 style="font-size: 1.1rem; margin: 0.5rem 0; font-weight: 600;">$1</h3>')
            .replace(/## (.*?)(\n|$)/g, '<h2 style="font-size: 1.2rem; margin: 0.5rem 0; font-weight: 600;">$1</h2>')
            .replace(/# (.*?)(\n|$)/g, '<h1 style="font-size: 1.3rem; margin: 0.5rem 0; font-weight: 600;">$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
            .replace(/\*(.*?)\*/g, '<em>$1</em>') 
            .replace(/`(.*?)`/g, '<code>$1</code>') 
            .replace(/\n/g, '<br>'); 
        return this.sanitizer.bypassSecurityTrustHtml(html);
    }
}
