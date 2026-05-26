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
  
  // Clean redundant whitespace and normalize line breaks
  cleaned = cleaned.replace(/(&nbsp;)+/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Restore basic spacing for block elements to ensure they don't collapse
  cleaned = cleaned.replace(/<\/p>/gi, '</p>\n');
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '<br>\n');

  // Recursively clean empty ul/ol if they became empty after li removal
  cleaned = cleaned.replace(/<ul>(?:\s|<br>|&nbsp;)*<\/ul>/gi, '');
  cleaned = cleaned.replace(/<ol>(?:\s|<br>|&nbsp;)*<\/ol>/gi, '');

  return cleaned.trim();
};

export const formatPropertyPrice = (
  price: number | null | undefined,
  priceType?: 'exact' | 'from' | 'range' | null,
  maxPrice?: number | null | undefined,
  currency?: string | null | undefined,
  language = 'es'
): string => {
  if (price === null || price === undefined) return '-';
  
  const curr = currency || 'EUR';
  const isEn = language.startsWith('en');
  
  const format = (val: number) => {
    return new Intl.NumberFormat(isEn ? 'en-US' : 'de-DE', {
      style: 'currency',
      currency: curr,
      maximumFractionDigits: 0
    }).format(val);
  };

  const formattedPrice = format(price);

  if (priceType === 'from') {
    return isEn ? `From ${formattedPrice}` : `Desde ${formattedPrice}`;
  }
  
  if (priceType === 'range' && maxPrice) {
    const formattedMax = format(maxPrice);
    return `${formattedPrice} - ${formattedMax}`;
  }

  return formattedPrice;
};

