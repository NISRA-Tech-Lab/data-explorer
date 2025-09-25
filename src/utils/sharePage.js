   import { page_title } from "./elements.js";
   
   export function sharePage() {

    if (navigator.share) {
        navigator.share({
        title: page_title.textContent,
        url: document.location.href,
        text: page_title.textContent
        }).catch(console.error);
    } else {
        // fallback
    }
}