import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ----- Scoring helpers (userâ€‘specific) -----
function skillMatchScore(userSkills: string[], requiredSkills: string[]): number {
  if (!requiredSkills || requiredSkills.length === 0) return 0.5;
  const matched = requiredSkills.filter(skill =>
    userSkills.some(u => u.toLowerCase() === skill.toLowerCase())
  ).length;
  return matched / requiredSkills.length;
}

function budgetFitScore(userMinBudget: number, oppBudgetMax: number | null): number {
  if (!oppBudgetMax) return 0.5;
  return userMinBudget <= oppBudgetMax ? 1 : 0.5;
}

function locationFitScore(userMarkets: string[], oppCountry: string, isRemote: boolean): number {
  if (isRemote) return 1;
  if (!userMarkets || userMarkets.length === 0) return 0.5;
  return userMarkets.some(m => m.toUpperCase() === oppCountry?.toUpperCase()) ? 1 : 0.5;
}

function clientQualityScore(quality: string | null): number {
  switch (quality) {
    case 'high': return 0.9;
    case 'medium': return 0.6;
    case 'low': return 0.3;
    default: return 0.5;
  }
}

function freshnessScore(postedAt: string): number {
  const hoursAgo = (Date.now() - new Date(postedAt).getTime()) / (1000 * 60 * 60);
  if (hoursAgo <= 24) return 1;
  if (hoursAgo > 168) return 0.2;
  return 1 - (hoursAgo - 24) / (168 - 24);
}

function competitionScore(estimate: string | null): number {
  switch (estimate) {
    case 'low': return 0.9;
    case 'medium': return 0.6;
    case 'high': return 0.3;
    default: return 0.5;
  }
}

// -------------------------------------------------

export async function GET(request: Request) {
  // 1. Authenticate user
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Fetch user profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('skills, experience_level, min_budget, preferred_markets, opportunity_types, target_client')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const userSkills = profile.skills || [];
  const userMinBudget = profile.min_budget || 0;
  const userMarkets = profile.preferred_markets || [];

  // 3. Parse pagination params
  const url = new URL(request.url);
  const sort = url.searchParams.get('sort') || 'best_match';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);
  const offset = (page - 1) * limit;

  // 4. Fetch enriched opportunities (fetch limit+1 to know if hasMore)
  const { data: allOpps, error: oppError } = await supabaseAdmin
    .from('opportunities')
    .select('*')
    .eq('enriched', true)
    .order('base_score', { ascending: false })  // preâ€‘sorted by AI score
    .limit(500);  // enough for several pages, adjust as needed

  if (oppError) {
    return NextResponse.json({ error: oppError.message }, { status: 500 });
  }

  if (!allOpps || allOpps.length === 0) {
    return NextResponse.json({
      opportunities: [],
      total: 0,
      page,
      limit,
      hasMore: false,
      sort,
    });
  }

  // 5. Score & build reasons
  let scored = allOpps.map(opp => {
    const sMatch = skillMatchScore(userSkills, opp.skills || []);
    const bFit = budgetFitScore(userMinBudget, opp.budget_max);
    const lFit = locationFitScore(userMarkets, opp.country, opp.is_remote);
    const cq = clientQualityScore(opp.client_quality);
    const fresh = freshnessScore(opp.posted_at);
    const comp = competitionScore(opp.competition_estimate);

    const raw = (sMatch * 0.35) + (bFit * 0.25) + (lFit * 0.15) + (cq * 0.1) + (fresh * 0.1) + (comp * 0.05);
    const score = Math.round(raw * 100);

    const reasons: string[] = [];
    if (sMatch >= 0.8) reasons.push(`Strong skill match`);
    else if (sMatch > 0) reasons.push(`Partial skill match`);
    if (bFit === 1) reasons.push(`Budget fits`);
    if (lFit === 1) reasons.push(`Location fits`);
    if (opp.client_quality === 'high') reasons.push(`Quality client`);
    if (opp.competition_estimate === 'low') reasons.push(`Low competition`);
    const hoursAgo = Math.round((Date.now() - new Date(opp.posted_at).getTime()) / (1000 * 60 * 60));
    if (hoursAgo <= 24) reasons.push(`New (${hoursAgo}h)`);
    if (reasons.length === 0) reasons.push(`Potential match`);

    return { ...opp, score, why_this: reasons };
  });

  // 6. Sort
  switch (sort) {
    case 'best_match':
      scored.sort((a, b) => b.score - a.score);
      break;
    case 'newest':
      scored.sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime());
      break;
    case 'budget_high':
      scored.sort((a, b) => (b.budget_max || 0) - (a.budget_max || 0));
      break;
    case 'low_competition':
      scored.sort((a, b) => {
        const aComp = a.competition_estimate === 'low' ? 3 : a.competition_estimate === 'medium' ? 2 : 1;
        const bComp = b.competition_estimate === 'low' ? 3 : b.competition_estimate === 'medium' ? 2 : 1;
        return bComp - aComp;
      });
      break;
  }

  // 7. Paginate & hasMore
  const total = scored.length;
  const paginated = scored.slice(offset, offset + limit);
  const hasMore = offset + limit < total;

  return NextResponse.json({
    opportunities: paginated,
    total,
    page,
    limit,
    hasMore,
    sort,
  });
}