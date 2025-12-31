import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

/**
 * Creates a Supabase client for server-side use with user authentication context.
 * This client respects RLS policies based on the authenticated user.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Creates a Supabase admin client that bypasses RLS.
 * Use this for server-side operations that need elevated privileges,
 * such as updating game points when players reach them.
 * 
 * IMPORTANT: Never expose this client to the frontend!
 */
export function createAdminClient() {
  // Use existing SUPABASE_SERVICE_API_KEY (same as service_role key)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_API_KEY
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_API_KEY is not set. Add it to your environment variables.')
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}