import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { connectToDatabase } from '@/lib/db/mongodb';
import Project from '@/lib/models/Project';
import Proposal from '@/lib/models/Proposal';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = user.id;

    // 1. Sequences counts
    const { count: totalSequences } = await supabaseAdmin
      .from('follow_up_sequences')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: activeSequences } = await supabaseAdmin
      .from('follow_up_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active');

    const { count: pausedSequences } = await supabaseAdmin
      .from('follow_up_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'paused');

    const { count: completedSequences } = await supabaseAdmin
      .from('follow_up_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    const { count: testSequences } = await supabaseAdmin
      .from('follow_up_sequences')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_test', true);

    // 2. Email analytics
    const { count: totalEmailsSent } = await supabaseAdmin
      .from('follow_up_logs')
      .select('*', { count: 'exact', head: true })
      .eq('follow_up_assignments.user_id', userId) // join needed; simpler: logs through assignments
      .eq('status', 'sent');

    // Actually join not straightforward with supabase-js for count. Use subquery:
    // Get assignment ids for user, then count logs where assignment_id in (ids).
    const { data: userAssignments } = await supabaseAdmin
      .from('follow_up_assignments')
      .select('id')
      .eq('user_id', userId);

    const assignmentIds = (userAssignments || []).map(a => a.id);

    let totalEmailsSentCount = 0;
    let failedEmailsCount = 0;
    if (assignmentIds.length > 0) {
      const { count: sentCount } = await supabaseAdmin
        .from('follow_up_logs')
        .select('*', { count: 'exact', head: true })
        .in('assignment_id', assignmentIds)
        .eq('status', 'sent');
      totalEmailsSentCount = sentCount || 0;

      const { count: failedCount } = await supabaseAdmin
        .from('follow_up_logs')
        .select('*', { count: 'exact', head: true })
        .in('assignment_id', assignmentIds)
        .eq('status', 'failed');
      failedEmailsCount = failedCount || 0;
    }

    const { count: scheduledEmails } = await supabaseAdmin
      .from('follow_up_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('next_scheduled_at', new Date().toISOString());

    // 3. Clients (Supabase)
    const { count: totalClients } = await supabaseAdmin
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { data: recentClients } = await supabaseAdmin
      .from('clients')
      .select('id, client_name, company_name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // 4. Proposals (MongoDB)
    await connectToDatabase();
    const totalProposals = await Proposal.countDocuments({ userId });
    const wonProposals = await Proposal.countDocuments({ userId, status: 'accepted' });
    const lostProposals = await Proposal.countDocuments({ userId, status: 'rejected' });
    const activeProposals = await Proposal.countDocuments({ userId, status: { $in: ['sent', 'review'] } });

    const recentProposals = await Proposal.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title status clientId metadata updatedAt');

    // 5. Projects (MongoDB)
    const totalProjects = await Project.countDocuments({ userId });
    const activeProjects = await Project.countDocuments({ userId, status: { $in: ['In Progress', 'Review'] } });
    const completedProjects = await Project.countDocuments({ userId, status: 'Completed' });

    const recentProjects = await Project.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title status clientName updatedAt');

    // Return aggregated data
    return NextResponse.json({
      sequences: {
        total: totalSequences || 0,
        active: activeSequences || 0,
        paused: pausedSequences || 0,
        completed: completedSequences || 0,
        test: testSequences || 0,
      },
      emails: {
        sent: totalEmailsSentCount,
        scheduled: scheduledEmails || 0,
        failed: failedEmailsCount,
      },
      clients: {
        total: totalClients || 0,
        recent: recentClients || [],
      },
      proposals: {
        total: totalProposals,
        active: activeProposals,
        won: wonProposals,
        lost: lostProposals,
        recent: recentProposals || [],
      },
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        recent: recentProjects || [],
      },
    });
  } catch (err: any) {
    console.error('Dashboard overview error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}