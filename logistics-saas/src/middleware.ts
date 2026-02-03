import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// NOTE: Auth middleware temporarily simplified for demo/preview mode
// In production, uncomment the auth import and session checks below

// import { auth } from '@/lib/auth';

// Routes that require authentication
// const protectedRoutes = ['/dashboard', '/loads', '/drivers', '/tracking', '/settings', '/users', '/reports', '/notifications', '/audit-logs'];

// Routes that should redirect to dashboard if already authenticated
// const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  // Demo mode: allow all routes without auth
  return NextResponse.next();

  // Production mode (requires database):
  // const { pathname } = request.nextUrl;
  // const session = await auth();
  // const isProtectedRoute = protectedRoutes.some(
  //   (route) => pathname === route || pathname.startsWith(route + '/')
  // );
  // const isAuthRoute = authRoutes.some((route) => pathname === route);
  // if (isProtectedRoute && !session?.user) {
  //   const loginUrl = new URL('/login', request.url);
  //   loginUrl.searchParams.set('callbackUrl', pathname);
  //   return NextResponse.redirect(loginUrl);
  // }
  // if (isAuthRoute && session?.user) {
  //   return NextResponse.redirect(new URL('/dashboard', request.url));
  // }
  // return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
};
