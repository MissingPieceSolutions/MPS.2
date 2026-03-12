import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { name, email, company, project_type, message } = body as Record<string, string>;

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 });
  }

  if (typeof name !== 'string' || name.length > 200) {
    return NextResponse.json({ error: 'Invalid name.' }, { status: 400 });
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
  }
  if (typeof message !== 'string' || message.length > 5000) {
    return NextResponse.json({ error: 'Message too long.' }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.from('contact_submissions').insert({
    name,
    email,
    company: typeof company === 'string' ? company : null,
    project_type: typeof project_type === 'string' ? project_type : null,
    message,
  });

  if (error) {
    return NextResponse.json({ error: 'Failed to submit. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
