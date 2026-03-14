import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireRole, AuthError } from '@/lib/auth-guard';

/** GET /api/admin/contacts — list all contact submissions */
export async function GET() {
  try {
    await requireRole('admin');
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('contact_submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

/** PUT /api/admin/contacts — update submission status */
export async function PUT(request: Request) {
  try {
    await requireRole('admin');
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }

  const { id, status } = await request.json();

  if (!id || !['new', 'read', 'replied'].includes(status)) {
    return NextResponse.json({ error: 'id and valid status (new/read/replied) required' }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('contact_submissions')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
