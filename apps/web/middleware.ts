import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthToken } from '@/lib/crypto';

const ADMIN_COOKIE = 'clim_admin';

const ADMIN_API_PREFIXES = [
  '/api/export',
  '/api/dossier',
  '/api/search',
  '/api/pipeline',
];

function hasAdminToken(request: NextRequest): boolean {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const session = verifyAuthToken<{ role?: string }>(token);
  return session?.role === 'admin';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (ADMIN_API_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (!hasAdminToken(request)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/export/:path*', '/api/dossier/:path*', '/api/search', '/api/pipeline'],
};
