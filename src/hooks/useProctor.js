// src/hooks/useProctor.js
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useProctor(attemptId, enabled = true) {
  useEffect(() => {
    if (!enabled || !attemptId) return;

    let lastLogTime = 0;
    const LOG_THROTTLE_MS = 2000; // don't spam — 1 log per 2s max

    async function logEvent(type, metadata = {}) {
      const now = Date.now();
      if (now - lastLogTime < LOG_THROTTLE_MS) return;
      lastLogTime = now;

      try {
        await supabase.from('proctor_logs').insert({
          attempt_id: attemptId,
          event_type: type,
          metadata,
        });
      } catch (err) {
        console.error('Proctor log failed:', err);
      }
    }

    const onVisibility = () => {
      if (document.hidden) logEvent('tab_switch');
    };
    const onBlur = () => logEvent('blur');
    const onCopy = (e) => {
      e.preventDefault();
      logEvent('copy_attempt');
    };
    const onContext = (e) => {
      e.preventDefault();
      logEvent('right_click');
    };
    const onFullscreen = () => {
      if (!document.fullscreenElement) logEvent('fullscreen_exit');
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    document.addEventListener('copy', onCopy);
    document.addEventListener('contextmenu', onContext);
    document.addEventListener('fullscreenchange', onFullscreen);

    // Enter fullscreen (best-effort; may fail silently)
    document.documentElement.requestFullscreen?.().catch(() => {});

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('contextmenu', onContext);
      document.removeEventListener('fullscreenchange', onFullscreen);
    };
  }, [attemptId, enabled]);
}