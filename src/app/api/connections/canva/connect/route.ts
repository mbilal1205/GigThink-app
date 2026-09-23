import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clientId = process.env.CANVA_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_CANVA_REDIRECT_URI;
  const scope = 'design:content:write'; // or appropriate scope

  const canvaAuthUrl = `https://www.canva.com/api/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri!)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${user.id}`;

  return NextResponse.redirect(canvaAuthUrl);
}