import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const ADMIN_EMAIL = 'vanto@onlinecourseformlm.com';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // setAll called from Server Component — can be ignored
          }
        },
      },
    }
  );
}

export async function requireAdminAccess() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user || user.email !== ADMIN_EMAIL) {
    return { authorized: false as const, supabase, user: null };
  }

  const { data, error } = await supabase.rpc('is_admin_email', {
    candidate_email: user.email,
  });

  if (error || !data) {
    return { authorized: false as const, supabase, user };
  }

  return { authorized: true as const, supabase, user };
}
