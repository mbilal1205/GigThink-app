import { NextResponse } from 'next/server';
import React, { ReactElement } from 'react';
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import Proposal from '@/lib/models/Proposal';
import { ProposalPDFDocument } from '@/lib/pdf/ProposalPDFDocument';
import mongoose from 'mongoose';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params
    const { id } = await params;
    
    console.log('ðŸ“„ [PDF_API]: Generating PDF for ID:', id);

    await connectToDatabase();

    // Find proposal - try _id first, then projectId
    let proposalDoc = null;
    
    if (mongoose.Types.ObjectId.isValid(id)) {
      proposalDoc = await Proposal.findOne({
        $or: [
          { _id: new mongoose.Types.ObjectId(id) },
          { projectId: id }
        ],
        userId: user.id,
      }).lean();
    } else {
      proposalDoc = await Proposal.findOne({
        $or: [{ _id: id }, { projectId: id }],
        userId: user.id,
      }).lean();
    }

    if (!proposalDoc) {
      console.error('âŒ [PDF_API]: Proposal not found for ID:', id);
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    console.log('âœ… [PDF_API]: Proposal found:', {
      id: proposalDoc._id,
      title: proposalDoc.title,
      sectionsCount: proposalDoc.sections?.length || 0,
    });

    // 2. Extract sections data properly
    const sections = proposalDoc.sections || [];
    
    // Build proposal data for PDF
    const proposalData = {
      title: proposalDoc.title || 'Software Proposal',
      clientName: proposalDoc.metadata?.clientName || 'Valued Client',
      clientCompany: proposalDoc.metadata?.clientCompany || '',
      clientEmail: proposalDoc.metadata?.clientEmail || '',
      totalBudget: proposalDoc.metadata?.totalBudget || 0,
      currency: proposalDoc.metadata?.currency || 'USD',
      
      // Extract each section content
      coverLetter: getSectionContent(sections, 'cover-letter'),
      executiveSummary: getSectionContent(sections, 'executive-summary'),
      problemStatement: getSectionContent(sections, 'problem-statement'),
      proposedSolution: getSectionContent(sections, 'proposed-solution'),
      technicalArchitecture: getSectionContent(sections, 'technical-architecture'),
      projectTimeline: getSectionContent(sections, 'project-timeline'),
      investmentPricing: getSectionContent(sections, 'investment-pricing'),
      termsConditions: getSectionContent(sections, 'terms-conditions'),
      
      // Custom sections
      customSections: sections
        .filter((s: any) => s.isCustom && s.isVisible)
        .map((s: any) => ({
          title: s.title,
          content: s.content,
        })),
      
      status: proposalDoc.status,
      version: proposalDoc.version,
      createdAt: proposalDoc.createdAt,
    };

    console.log('ðŸ“Š [PDF_API]: Extracted sections:', {
      hasExecutiveSummary: !!proposalData.executiveSummary,
      hasProblemStatement: !!proposalData.problemStatement,
      hasSolution: !!proposalData.proposedSolution,
    });

    // 3. Fetch Agency Context from Supabase
    const { data: agencyProfile } = await supabase
      .from('agency_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // 4. Render PDF
    const pdfElement = React.createElement(ProposalPDFDocument, {
      proposal:  proposalData,
      agencyProfile: agencyProfile || {},
      clientName: proposalData.clientName,
      projectTitle: proposalData.title,
    }) as ReactElement<DocumentProps>;

    const pdfBuffer = await renderToBuffer(pdfElement);

    // 5. Return PDF
    const filename = `Proposal-${proposalData.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    console.log('âœ… [PDF_API]: PDF generated successfully!');

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'PDF Generation Failed';
    console.error('âŒ [PDF_GEN_ERROR]:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Helper: Extract section content by type
function getSectionContent(sections: any[], type: string): string {
  const section = sections.find(
    (s: any) => s.type === type && s.isVisible !== false
  );
  return section?.content || getDefaultContent(type);
}

// Helper: Default content if section is empty
function getDefaultContent(type: string): string {
  const defaults: Record<string, string> = {
    'cover-letter': 'Dear Client,\n\nWe are pleased to submit this proposal for your project.',
    'executive-summary': 'This proposal outlines our comprehensive approach to delivering a high-quality software solution.',
    'problem-statement': 'After thorough analysis, we have identified key challenges that need to be addressed.',
    'proposed-solution': 'Our solution addresses all identified challenges through a comprehensive digital transformation strategy.',
    'technical-architecture': 'We utilize modern technologies including Next.js, TypeScript, and PostgreSQL.',
    'project-timeline': 'The project will be completed in phases to ensure timely delivery.',
    'investment-pricing': 'Our pricing is competitive and tailored to your project needs.',
    'terms-conditions': 'Standard terms and conditions apply to this engagement.',
  };
  return defaults[type] || 'Content will be provided upon request.';
}