import { NextResponse } from 'next/server';

export function proxy(request) {
  const token = request.cookies.get('ecom_token')?.value;
  const path = request.nextUrl.pathname;

  const isDashboardPath = path.startsWith('/dashboard');
  const isAuthPath = path === '/' || path === '/login' || path === '/register';

  if (isDashboardPath && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }

  if (isAuthPath && token) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/', '/login', '/register'],
};

export default proxy;
