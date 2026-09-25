import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // we don't use magic links
      storage: window.localStorage,
    },
  }
);

// ============================================
// EXAM NUMBER → EMAIL MAPPING
// ============================================
// Supabase Auth requires an email. We fake it by
// appending a domain to the exam number.
// "STU/2025/001" → "stu-2025-001@exampro.local"

export function examNumberToEmail(examNumber) {
  const slug = examNumber
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')  // replace slashes/spaces with dashes
    .replace(/^-|-$/g, '');        // trim leading/trailing dashes
  return `${slug}@exampro.local`;
}

export function emailToExamNumber(email) {
  // Reverse for display purposes (approximation)
  const slug = email.split('@')[0];
  return slug.toUpperCase().replace(/-/g, '/');
}