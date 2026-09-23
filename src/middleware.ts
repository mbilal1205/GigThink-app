import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes (no auth required)
  const publicAuthPaths = [
    '/auth/signup',
    '/auth/login',
    '/auth/email-confirmation',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/verify-otp',
    '/auth/callback',
  ]

  const redirect = (to: string) => {
    const url = new URL(to, request.url)
    return NextResponse.redirect(url)
  }

  // ── 1. Unauthenticated users ──
  if (!user) {
    if (!publicAuthPaths.includes(pathname)) {
      // Not on a public auth page → go to signup
      return redirect('/auth/signup')
    }
    // Allow access to public auth pages
    return response
  }

  // ── 2. Authenticated users ──
  // If on auth pages, send them to main app (middleware will handle onboarding next)
  if (publicAuthPaths.includes(pathname)) {
    return redirect('/feed')
  }

  // ── 3. Check onboarding status (except on /onboarding) ──
  if (pathname !== '/onboarding') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    const onboardingCompleted = profile?.onboarding_completed ?? false

    if (!onboardingCompleted) {
      // User has not completed onboarding → send them there
      return redirect('/onboarding')
    }
  }

  // ── 4. If onboarding completed and user is on /onboarding, redirect to feed ──
  if (pathname === '/onboarding') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profile?.onboarding_completed) {
      return redirect('/feed')
    }
  }

  // All good, allow access
  return response
}

export const config = {
  matcher: [
    // Match all routes except API, static files, images, etc.
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}