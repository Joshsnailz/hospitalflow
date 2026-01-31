import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/patients', '/appointments', '/records', '/pharmacy', '/users', '/settings'];
const authRoutes = ['/login', '/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for auth token in cookies or local storage isn't possible in middleware
  // So we'll handle this client-side in the dashboard layout
  // This middleware just handles basic redirects

  // For now, allow all routes - the client-side auth provider handles protection
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/patients/:path*',
    '/appointments/:path*',
    '/records/:path*',
    '/pharmacy/:path*',
    '/users/:path*',
    '/settings/:path*',
    '/login',
    '/forgot-password',
  ],
};
