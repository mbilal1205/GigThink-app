import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { ResumePDFDocument } from '@/lib/pdf/ResumePDFDocument';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const { data: resume, error } = await supabaseAdmin
      .from('resumes')
      .select('structured_content')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !resume?.structured_content) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // âœ… Cast the entire element to any to bypass type mismatch
    const pdfBuffer = await renderToBuffer(
      React.createElement(ResumePDFDocument as any, { resume: resume.structured_content }) as any
    );

    const uint8Array = new Uint8Array(pdfBuffer);

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="resume-${id}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error('[PDF_GENERATION]', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}