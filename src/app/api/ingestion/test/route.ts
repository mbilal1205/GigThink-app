import { NextResponse } from 'next/server';
import { fetchAdzunaJobs } from '@/lib/sources/adzuna';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    const jobs = await fetchAdzunaJobs('web developer');
    
    // Supabase service role client (server-side only)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let inserted = 0;
    for (const job of jobs) {
      // Check duplicate
      const { data: existing } = await supabaseAdmin
        .from('opportunities')
        .select('id')
        .eq('source', job.source)
        .eq('source_id', job.source_id)
        .maybeSingle();

      if (existing) continue; // skip duplicate

      const { error } = await supabaseAdmin.from('opportunities').insert(job);
      if (error) {
        console.error('Insert error:', error);
        continue;
      }
      inserted++;
    }

    return NextResponse.json({ message: `Fetched ${jobs.length}, inserted ${inserted} new` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}