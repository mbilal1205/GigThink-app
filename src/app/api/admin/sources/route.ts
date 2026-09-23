import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const sourceSchema = z.object({
  company_name: z.string().min(1),
  provider: z.enum(['greenhouse', 'lever', 'ashby', 'smartrecruiters', 'custom']),
  board_token: z.string().min(1),
  source_url: z.string().url().optional(),
  api_endpoint: z.string().url().optional(),
  config: z.record(z.string(), z.any()).optional(),  // Fixed: 2 arguments required
  check_frequency_minutes: z.number().int().positive().default(30),
});

export async function POST(req: NextRequest) {
  try {
    // Only admin (service role) or specific user role can add sources
    const authHeader = req.headers.get('authorization');
    const adminSecret = process.env.CRON_SECRET;
    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = sourceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('job_sources')
      .insert({
        company_name: parsed.data.company_name,
        provider: parsed.data.provider,
        board_token: parsed.data.board_token,
        source_url: parsed.data.source_url,
        api_endpoint: parsed.data.api_endpoint,
        config: parsed.data.config || {},
        check_frequency_minutes: parsed.data.check_frequency_minutes,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, source: data }, { status: 201 });
  } catch (err: any) {
    console.error('[SOURCE_CREATE]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}