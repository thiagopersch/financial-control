import { EXEMPT_RESOURCES, resourceFromHref } from '@/lib/permissions/catalog';
import { hasPermission } from '@/lib/permissions/has-permission';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];

/**
 * Checagem otimista de autenticação/permissão nas rotas do dashboard. A
 * checagem autoritativa (a que realmente protege dados) acontece em cada
 * Server Action/Server Component via `requirePermission`, que sempre lê a
 * sessão fresca — o Proxy só evita a navegação/flash de uma página que o
 * usuário não pode ver.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const resource = resourceFromHref(pathname);
  if (EXEMPT_RESOURCES.has(resource)) {
    return NextResponse.next();
  }

  const permissions = (token.permissions as string[]) ?? [];
  if (!hasPermission(permissions, resource, 'VIEW')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
