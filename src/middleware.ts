import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ROLE_BASE_PATH: Record<string, string> = {
  admin: '/admin',
  subadmin: '/subadmin',
  limpieza: '/limpieza',
}

const PROTECTED_PREFIXES = ['/admin', '/subadmin', '/limpieza']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as Record<string, string>)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isAuthPage = path === '/login' || path === '/register'
  const isProtected = PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix))

  // Not logged in → redirect to login (unless already on auth page)
  if (!user && !isAuthPage && isProtected) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Logged in on auth pages or root → redirect to role dashboard
  if (user && (isAuthPage || path === '/')) {
    const role = user.user_metadata?.role as string | undefined
    const basePath = ROLE_BASE_PATH[role ?? ''] ?? '/admin'
    return NextResponse.redirect(new URL(basePath, request.url))
  }

  // Logged in user trying to access wrong role's dashboard
  if (user && isProtected) {
    const role = user.user_metadata?.role as string | undefined
    const expectedBase = ROLE_BASE_PATH[role ?? ''] ?? '/admin'
    const currentBase = PROTECTED_PREFIXES.find((p) => path.startsWith(p))

    if (currentBase && currentBase !== expectedBase) {
      return NextResponse.redirect(new URL(expectedBase, request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/.*|sw.js).*)',
  ],
}
