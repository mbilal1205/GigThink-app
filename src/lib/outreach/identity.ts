import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface SenderIdentity {
  name: string;
  email: string;
  signature: string;
  footer: string;
}

export async function getSenderIdentity(userId: string): Promise<SenderIdentity> {
  // Fetch user profile
  const { data: userProfile } = await supabaseAdmin
    .from('profiles')
    .select('name, email')
    .eq('id', userId)
    .single();

  // Fetch agency profile (if exists)
  const { data: agencyProfile } = await supabaseAdmin
    .from('agency_profiles')
    .select('agency_name, contact_email, website_url, tagline')
    .eq('user_id', userId)
    .maybeSingle();

  const senderName = agencyProfile?.agency_name || userProfile?.name || 'Your Name';
  const senderEmail = agencyProfile?.contact_email || userProfile?.email || 'you@example.com';
  const website = agencyProfile?.website_url || '';

  const signature = `
Best Regards,
${senderName}
${agencyProfile ? `Founder â€“ ${agencyProfile.agency_name}` : ''}
${website ? website + '\n' : ''}${senderEmail}
`.trim();

  return {
    name: senderName,
    email: senderEmail,
    signature,
    footer: 'Powered by GigThink',
  };
}