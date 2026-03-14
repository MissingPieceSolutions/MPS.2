import { createServerSupabase } from '@/lib/supabase/server';

export type UserRole = 'admin' | 'editor' | 'client';

interface AuthResult {
  userId: string;
  role: UserRole;
}

/**
 * Verify the current user has the required role.
 * Returns user info or throws with an appropriate message.
 */
export async function requireRole(minimumRole: UserRole): Promise<AuthResult> {
  const supabase = await createServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new AuthError('Not authenticated', 401);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = (profile?.role || 'client') as UserRole;

  const hierarchy: Record<UserRole, number> = { admin: 3, editor: 2, client: 1 };

  if (hierarchy[role] < hierarchy[minimumRole]) {
    throw new AuthError('Insufficient permissions', 403);
  }

  return { userId: user.id, role };
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
