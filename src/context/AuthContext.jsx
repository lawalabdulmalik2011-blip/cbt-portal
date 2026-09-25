import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, examNumberToEmail } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Supabase auth.user
  const [profile, setProfile] = useState(null); // profiles row
  const [loading, setLoading] = useState(true);

  // Load profile row for the current user
  async function loadProfile(userId) {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Profile load failed:', error);
      return null;
    }
    return data;
  }

  // Bootstrap session on mount + subscribe to changes
  useEffect(() => {
    let mounted = true;

    // 1. Load existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        const p = await loadProfile(session.user.id);
        if (mounted) setProfile(p);
      }
      setLoading(false);
    });

    // 2. Listen for auth changes
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        if (session?.user) {
          setUser(session.user);
          const p = await loadProfile(session.user.id);
          if (mounted) setProfile(p);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // ============================================
  // SIGN IN with exam number + password
  // ============================================
  async function signIn(examNumber, password) {
    const email = examNumberToEmail(examNumber.trim());

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(translateAuthError(error.message));

    // Load profile (may be delayed a tick)
    const p = await loadProfile(data.user.id);
    setProfile(p);
    setUser(data.user);

    if (!p) throw new Error('Profile not found. Contact your administrator.');
    if (p.is_active === false) {
      await supabase.auth.signOut();
      throw new Error('Your account has been deactivated.');
    }

    return { user: data.user, profile: p };
  }

  // ============================================
  // SIGN OUT
  // ============================================
  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  const value = {
    user,
    profile,
    role: profile?.role ?? null,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

// Friendly error messages
function translateAuthError(msg = '') {
  if (msg.includes('Invalid login credentials')) return 'Invalid exam number or password.';
  if (msg.includes('Email not confirmed')) return 'Account not confirmed. Contact admin.';
  if (msg.includes('Too many requests')) return 'Too many attempts. Try again later.';
  return msg;
}