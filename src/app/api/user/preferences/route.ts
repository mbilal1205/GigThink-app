import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendWelcomeEmail } from '@/utils/sendEmail'

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      skills,
      experience_level,
      min_budget,
      preferred_markets,
      opportunity_types,
      target_client,
    } = body

    // Basic validation
    if (min_budget !== undefined && (typeof min_budget !== 'number' || min_budget < 0)) {
      return NextResponse.json({ error: 'Invalid min_budget' }, { status: 400 })
    }
    if (experience_level && !['junior', 'mid', 'senior'].includes(experience_level)) {
      return NextResponse.json({ error: 'Invalid experience_level' }, { status: 400 })
    }

    // Build update object (only provided fields)
    const updateData: Record<string, any> = {}
    if (skills) updateData.skills = skills
    if (experience_level) updateData.experience_level = experience_level
    if (min_budget !== undefined) updateData.min_budget = min_budget
    if (preferred_markets) updateData.preferred_markets = preferred_markets
    if (opportunity_types) updateData.opportunity_types = opportunity_types
    if (target_client) updateData.target_client = target_client

    // Always mark onboarding as completed
    updateData.onboarding_completed = true

    // Fetch existing profile to check previous onboarding status and get user info
    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select(
        'onboarding_completed, name, email, skills, experience_level, min_budget, preferred_markets, opportunity_types, target_client'
      )
      .eq('id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Fetch profile error:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
    }

    const wasOnboardingComplete = existingProfile?.onboarding_completed ?? false

    // Update profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 })
    }

    // Send welcome email ONLY if onboarding was previously incomplete and now becomes complete
    if (!wasOnboardingComplete) {
      const userEmail = existingProfile?.email || user.email
      const userName = existingProfile?.name || user.user_metadata?.full_name || 'User'

      if (userEmail) {
        // Merge existing values with updated ones for email
        const emailPreferences = {
          skills: skills ?? existingProfile?.skills ?? [],
          experience_level: experience_level ?? existingProfile?.experience_level ?? 'mid',
          min_budget: min_budget ?? existingProfile?.min_budget ?? 0,
          preferred_markets: preferred_markets ?? existingProfile?.preferred_markets ?? [],
          opportunity_types: opportunity_types ?? existingProfile?.opportunity_types ?? [],
          target_client: target_client ?? existingProfile?.target_client ?? [],
        }

        await sendWelcomeEmail(userEmail, userName, emailPreferences)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error'
    console.error('[PREFERENCES_UPDATE_ERROR]:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}