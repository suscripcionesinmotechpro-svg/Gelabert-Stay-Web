import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // Only redirect for the exact root path '/'
  if (url.pathname !== '/') {
    return NextResponse.next();
  }

  // Check language preference in cookies (set by our i18n switcher)
  const cookieLang = request.cookies.get('i18next')?.value;

  if (cookieLang) {
    if (cookieLang.startsWith('en')) {
      url.pathname = '/en';
      return NextResponse.redirect(url);
    }
    return NextResponse.next(); // Remain on '/' (which is Spanish)
  }

  // If no cookie, parse the Accept-Language header
  const acceptLang = request.headers.get('accept-language') || '';
  const esIndex = acceptLang.indexOf('es');
  const enIndex = acceptLang.indexOf('en');

  // If English is preferred (appears earlier or Spanish is not listed)
  if (enIndex !== -1 && (esIndex === -1 || enIndex < esIndex)) {
    url.pathname = '/en';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Config to only intercept the root route
export const config = {
  matcher: ['/'],
};
