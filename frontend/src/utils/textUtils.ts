export const cleanContent = (content: string | undefined | null): string => {
  if (!content) return '';
  
  // Replace empty lists and paragraphs
  let cleaned = content
    .replace(/<li>(?:\s|<br>|&nbsp;)*<\/li>/gi, '') // empty li
    .replace(/<p>(?:\s|<br>|&nbsp;)*<\/p>/gi, '') // empty p
    .replace(/<ul>(?:\s|<br>|&nbsp;)*<\/ul>/gi, '') // empty ul
    .replace(/<ol>(?:\s|<br>|&nbsp;)*<\/ol>/gi, ''); // empty ol

  // Clean orphan dots or whitespace-only tags
  cleaned = cleaned.replace(/<li>[\s\u00A0.]*<\/li>/gi, '');
  cleaned = cleaned.replace(/<p>[\s\u00A0.]*<\/p>/gi, '');
  
  // Recursively clean empty ul/ol if they became empty after li removal
  cleaned = cleaned.replace(/<ul>(?:\s|<br>|&nbsp;)*<\/ul>/gi, '');
  cleaned = cleaned.replace(/<ol>(?:\s|<br>|&nbsp;)*<\/ol>/gi, '');

  return cleaned.trim();
};
