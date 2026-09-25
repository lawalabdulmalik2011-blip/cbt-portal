// src/lib/announcements.js
import { supabase } from './supabase';

export async function listAnnouncements({ activeOnly = false } = {}) {
  let q = supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (activeOnly) {
    const now = new Date().toISOString();
    q = q
      .eq('is_published', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .or(`publish_at.is.null,publish_at.lte.${now}`);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createAnnouncement(payload) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('announcements')
    .insert({ ...payload, created_by: session.user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAnnouncement(id, updates) {
  const { data, error } = await supabase
    .from('announcements')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAnnouncement(id) {
  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) throw error;
}

// ============================================
// For students — filter by their class + role
// ============================================
export async function getMyAnnouncements({ role, classLevel }) {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_published', true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) throw error;

  return (data ?? []).filter((a) => {
    // Role filter (empty = everyone)
    if (a.target_roles?.length && !a.target_roles.includes(role)) return false;
    // Class filter (empty = all classes)
    if (a.target_classes?.length && !a.target_classes.includes(classLevel))
      return false;
    return true;
  });
}