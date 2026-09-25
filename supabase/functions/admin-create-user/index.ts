// ============================================
// SUPABASE EDGE FUNCTION: admin-create-user
// ============================================
// Called by authenticated admins to create:
//   • Students (exam_number: STU/YYYY/NNN)
//   • Teachers (exam_number: TCH/YYYY/NNN)
//   • Admins   (exam_number: ADM/YYYY/NNN)
//
// Uses the service_role key (server-side only) to bypass RLS
// and create auth.users + profiles rows atomically.
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateUserPayload {
  exam_number: string;        // "STU/2025/042"
  full_name: string;          // "Adebayo Folake"
  password?: string;          // optional — auto-generated if missing
  role: 'student' | 'teacher' | 'admin';
  class_level?: string;       // students only
  subject_specialty?: string; // teachers only
}

Deno.serve(async (req) => {
  // ----- CORS preflight -----
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ----- 1. Verify the caller is an authenticated admin -----
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing authorization' }, 401);

    // Client with the caller's JWT (respects RLS)
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller }, error: authError } = await userClient.auth.getUser();
    if (authError || !caller) return json({ error: 'Invalid session' }, 401);

    // Confirm caller is admin
    const { data: callerProfile } = await userClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .maybeSingle();

    if (callerProfile?.role !== 'admin') {
      return json({ error: 'Only admins can create users' }, 403);
    }

    // ----- 2. Parse + validate the payload -----
    const body: CreateUserPayload = await req.json();

    if (!body.exam_number || !body.full_name || !body.role) {
      return json({ error: 'exam_number, full_name, and role are required' }, 400);
    }
    if (!['student', 'teacher', 'admin'].includes(body.role)) {
      return json({ error: 'Invalid role' }, 400);
    }

    // ----- 3. Convert exam_number → email -----
    const slug = body.exam_number
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const email = `${slug}@exampro.local`;

    // ----- 4. Generate a password if not provided -----
    const password = body.password && body.password.length >= 6
      ? body.password
      : generatePassword();

    // ----- 5. Create the auth user via service role -----
    const adminClient = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SERVICE_ROLE_KEY')!,   // ← renamed
  { auth: { autoRefreshToken: false, persistSession: false } }
);

    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // skip email confirmation
      user_metadata: {
        exam_number: body.exam_number,
        full_name: body.full_name,
        role: body.role,
        class_level: body.class_level ?? null,
        subject_specialty: body.subject_specialty ?? null,
      },
    });

    if (createErr) {
      // Friendly dup errors
      if (createErr.message.includes('already been registered')) {
        return json({ error: 'This exam number is already registered.' }, 409);
      }
      return json({ error: createErr.message }, 400);
    }

    // ----- 6. Update the profile row (trigger already inserted a default) -----
    // The trigger uses the metadata, so the row should already be correct,
    // but we double-write to be safe (e.g. subject_specialty).
    await adminClient
      .from('profiles')
      .update({
        full_name: body.full_name,
        role: body.role,
        class_level: body.class_level ?? null,
        subject_specialty: body.subject_specialty ?? null,
      })
      .eq('id', newUser.user.id);

    // ----- 7. Return the credentials so the admin can share them -----
    return json({
      success: true,
      user: {
        id: newUser.user.id,
        exam_number: body.exam_number,
        email,
        full_name: body.full_name,
        role: body.role,
        class_level: body.class_level ?? null,
        subject_specialty: body.subject_specialty ?? null,
      },
      password, // only shown once — admin must save it
    });
  } catch (err) {
    return json({ error: err.message ?? 'Unexpected error' }, 500);
  }
});

// ============================================
// HELPERS
// ============================================

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Cryptographically-strong 10-char password with mixed case + digits.
 * Omits ambiguous chars (0/O, 1/l/I).
 */
function generatePassword(): string {
  const lower = 'abcdefghjkmnpqrstuvwxyz';   // no i, l, o
  const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ';   // no I, O
  const digits = '23456789';                 // no 0, 1
  const all = lower + upper + digits;
  const len = 10;

  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);

  // Guarantee at least one of each class
  const chars = [
    lower[bytes[0] % lower.length],
    upper[bytes[1] % upper.length],
    digits[bytes[2] % digits.length],
  ];
  for (let i = 3; i < len; i++) {
    chars.push(all[bytes[i] % all.length]);
  }

  // Shuffle
  for (let i = chars.length - 1; i > 0; i--) {
    const j = bytes[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}