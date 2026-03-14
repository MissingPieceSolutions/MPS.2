import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireRole, AuthError } from '@/lib/auth-guard';

const ALLOWED_TABLES = [
  'pages', 'services', 'pricing_tiers', 'blog_posts',
  'case_studies', 'resources', 'media',
] as const;

type AllowedTable = typeof ALLOWED_TABLES[number];

function isAllowedTable(table: string): table is AllowedTable {
  return ALLOWED_TABLES.includes(table as AllowedTable);
}

/** GET /api/admin/content?table=pages — list all rows (including drafts) */
export async function GET(request: Request) {
  try {
    await requireRole('editor');
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }

  const { searchParams } = new URL(request.url);
  const table = searchParams.get('table');

  if (!table || !isAllowedTable(table)) {
    return NextResponse.json({ error: `Invalid table. Allowed: ${ALLOWED_TABLES.join(', ')}` }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

/** POST /api/admin/content — create a row */
export async function POST(request: Request) {
  try {
    await requireRole('editor');
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }

  const body = await request.json();
  const { table, record } = body;

  if (!table || !isAllowedTable(table) || !record) {
    return NextResponse.json({ error: 'table and record are required' }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from(table).insert(record).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

/** PUT /api/admin/content — update a row */
export async function PUT(request: Request) {
  try {
    await requireRole('editor');
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }

  const body = await request.json();
  const { table, id, record } = body;

  if (!table || !isAllowedTable(table) || !id || !record) {
    return NextResponse.json({ error: 'table, id, and record are required' }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from(table).update(record).eq('id', id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

/** DELETE /api/admin/content — delete a row */
export async function DELETE(request: Request) {
  try {
    await requireRole('admin');
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }

  const body = await request.json();
  const { table, id } = body;

  if (!table || !isAllowedTable(table) || !id) {
    return NextResponse.json({ error: 'table and id are required' }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.from(table).delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
