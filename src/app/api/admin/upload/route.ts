import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { requireRole, AuthError } from '@/lib/auth-guard';

/** POST /api/admin/upload — upload a file to Supabase Storage + create media record */
export async function POST(request: Request) {
  let auth;
  try {
    auth = await requireRole('editor');
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: e.status });
    throw e;
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const altText = formData.get('alt_text') as string | null;

  if (!file) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }

  const supabase = await createServerSupabase();

  // Upload to storage
  const ext = file.name.split('.').pop() || 'bin';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);

  // Create media record
  const { data: media, error: dbError } = await supabase
    .from('media')
    .insert({
      url: publicUrl,
      filename: file.name,
      alt_text: altText || null,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: auth.userId,
    })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ data: media }, { status: 201 });
}
