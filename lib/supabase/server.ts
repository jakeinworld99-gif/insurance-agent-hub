import { createServerClient } from '@supabase/ssr'
import { createClient as createSbClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setAll(cookiesToSet: any[]) {
          try {
            cookiesToSet.forEach((cookie) =>
              cookieStore.set(cookie.name, cookie.value, cookie.options)
            )
          } catch {}
        },
      },
    }
  )
}

export function createServiceClient(): SupabaseClient {
  return createSbClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

export async function getAgentId(supabase: SupabaseClient): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('agents')
    .select('id')
    .eq('user_id', user.id)
    .single()
  return data?.id ?? null
}
