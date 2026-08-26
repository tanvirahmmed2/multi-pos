import { NextResponse } from 'next/server';

function isTokenExpiredOrInvalid(token) {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(payloadBase64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    if (!decoded || (!decoded.staff_id && !decoded.user_id)) return true;
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return true;
    return false;
  } catch (e) {
    return true;
  }
}

export function proxy(request) {
  const token = request.cookies.get('ecom_token')?.value;
  const path = request.nextUrl.pathname;
  const hasInvalidSessionParam = request.nextUrl.searchParams.has('invalid_session') || 
                                request.nextUrl.searchParams.has('logout');

  const isDashboardPath = path.startsWith('/dashboard');
  const isAuthPath = path === '/' || path === '/login' || path === '/register';

  const tokenValid = !isTokenExpiredOrInvalid(token);

  if (isDashboardPath && !tokenValid) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('redirect', path);
    const response = NextResponse.redirect(url);
    if (token) {
      response.cookies.delete('ecom_token');
    }
    return response;
  }

  if (isAuthPath) {
    if (hasInvalidSessionParam && token) {
      const response = NextResponse.next();
      response.cookies.delete('ecom_token');
      return response;
    }

    if (tokenValid) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    } else if (token) {
      const response = NextResponse.next();
      response.cookies.delete('ecom_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/', '/login', '/register'],
};

export default proxy;

