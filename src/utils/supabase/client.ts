// Is file ka code poora change karke yeh likhein:
import { createBrowserClient } from '@supabase/ssr'

let supabaseBrowserInstance: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  if (!supabaseBrowserInstance) {
    supabaseBrowserInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabaseBrowserInstance
}
