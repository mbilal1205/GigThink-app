import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { provider } = await request.json();
  if (!provider) return NextResponse.json({ error: 'Provider required' }, { status: 400 });

  // Configure scopes per provider
  let scopes: string;
  if (provider === 'google_gmail') {
    scopes = 'https://www.googleapis.com/auth/gmail.send';
  } else {
    return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/connections/callback?provider=${provider}`,
      scopes,
      skipBrowserRedirect: true, // We'll get URL and redirect manually
    },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ url: data.url });
}