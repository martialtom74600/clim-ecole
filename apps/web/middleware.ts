import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthToken } from '@/lib/crypto';

const ADMIN_COOKIE = 'clim_admin';
const ADMIN_LOGIN_PATH = '/admin/login';

/** Routes API admin legacy (hors /api/admin/*) — conservées pour compatibilité cockpit */
const LEGACY_ADMIN_API_PREFIXES = ['/api/export', '/api/dossier', '/api/search'];

function hasAdminToken(request: NextRequest): boolean {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const session = verifyAuthToken<{ role?: string }>(token);
  return session?.role === 'admin';
}

function isAdminPage(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function isPublicAdminPath(pathname: string): boolean {
  return pathname === ADMIN_LOGIN_PATH || pathname.startsWith('/api/auth/admin/');
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicAdminPath(pathname)) {
    return NextResponse.next();
  }

  const needsAdmin =
    isAdminPage(pathname) ||
    pathname.startsWith('/api/admin/') ||
    LEGACY_ADMIN_API_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );

  if (!needsAdmin) {
    return NextResponse.next();
  }

  if (hasAdminToken(request)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = ADMIN_LOGIN_PATH;
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/api/export/:path*',
    '/api/dossier/:path*',
    '/api/search',
  ],
};
