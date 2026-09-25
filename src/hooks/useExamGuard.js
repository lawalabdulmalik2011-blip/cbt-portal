// src/hooks/useExamGuard.js
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const GRACE_PERIOD_MS = 2500;
const MAX_VIOLATIONS = 3;
const FULLSCREEN_CHECK_MS = 1000;

export function useExamGuard(attemptId, enabled, { onLockout, onViolation } = {}) {
  const violationsRef = useRef(0);
  const mountedAtRef = useRef(Date.now());
  const enabledRef = useRef(enabled);
  const fullscreenIntervalRef = useRef(null);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const logViolation = useCallback(
    async (type, metadata = {}) => {
      if (!enabledRef.current || !attemptId) return;
      if (Date.now() - mountedAtRef.current < GRACE_PERIOD_MS) return;

      violationsRef.current += 1;
      const count = violationsRef.current;

      try {
        await supabase.from('proctor_logs').insert({
          attempt_id: attemptId,
          event_type: type,
          metadata: { ...metadata, violation_number: count },
        });

        await supabase
          .from('attempts')
          .update({
            violations: count,
            violation_reason: type,
            is_flagged: count >= MAX_VIOLATIONS,
          })
          .eq('id', attemptId);
      } catch (err) {
        console.error('Violation log failed:', err);
      }

      onViolation?.(count, type);

      if (count >= MAX_VIOLATIONS) {
        enabledRef.current = false;
        onLockout?.(type);
      }
    },
    [attemptId, onViolation, onLockout]
  );

  const forceFullscreen = useCallback(async () => {
    if (!enabledRef.current) return;
    if (document.fullscreenElement) return;
    try {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!enabled || !attemptId) return;

    mountedAtRef.current = Date.now();

    const onVisibility = () => {
      if (document.hidden) logViolation('tab_switch');
      else forceFullscreen();
    };

    const onBlur = () => logViolation('window_blur');
    const onFocus = () => forceFullscreen();

    const onFullscreen = () => {
      if (!document.fullscreenElement) {
        logViolation('fullscreen_exit');
        setTimeout(() => {
          if (enabledRef.current) forceFullscreen();
        }, 100);
      }
    };

    const onContextMenu = (e) => {
      e.preventDefault();
      logViolation('right_click');
    };

    const onCopy = (e) => { e.preventDefault(); logViolation('copy'); };
    const onCut = (e) => { e.preventDefault(); logViolation('cut'); };
    const onPaste = (e) => { e.preventDefault(); logViolation('paste'); };
    const onDragStart = (e) => { e.preventDefault(); logViolation('drag'); };

    const onKeyDown = (e) => {
      const k = e.key?.toLowerCase();

      if (k === 'f12') { e.preventDefault(); logViolation('devtools_attempt'); return; }
      if (e.ctrlKey && e.shiftKey && ['i', 'j', 'c', 'k'].includes(k)) {
        e.preventDefault(); logViolation('devtools_attempt'); return;
      }
      if (e.metaKey && e.altKey && ['i', 'j', 'c'].includes(k)) {
        e.preventDefault(); logViolation('devtools_attempt'); return;
      }
      if (k === 'f11') { e.preventDefault(); logViolation('f11_press'); return; }
      if (e.ctrlKey && k === 'u') { e.preventDefault(); logViolation('view_source'); return; }
      if (e.ctrlKey && ['c', 'x', 'v'].includes(k)) {
        e.preventDefault(); logViolation(`ctrl_${k}`); return;
      }
      if (e.ctrlKey && k === 'p') { e.preventDefault(); logViolation('print'); return; }
      if (e.ctrlKey && k === 's') { e.preventDefault(); logViolation('save'); return; }
      if (e.ctrlKey && k === 'a') { e.preventDefault(); return; }
      if ((e.ctrlKey && k === 'r') || k === 'f5') {
        e.preventDefault(); logViolation('refresh_attempt'); return;
      }
      if (e.ctrlKey && ['w', 't', 'n'].includes(k)) {
        e.preventDefault(); logViolation('tab_manipulation'); return;
      }
      if (e.altKey) {
        e.preventDefault();
        logViolation('alt_key');
        return;
      }
      if (e.metaKey && !['c','v','x','a'].includes(k)) {
        e.preventDefault();
        logViolation('meta_key');
        return;
      }
      if (k === 'printscreen') { e.preventDefault(); logViolation('printscreen'); return; }
      if (k === 'escape') {
        setTimeout(() => forceFullscreen(), 50);
        return;
      }
      if (/^f\d+$/.test(k) && k !== 'f5') {
        e.preventDefault();
        return;
      }
    };

    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Your exam is in progress!';
      return e.returnValue;
    };

    const onSelectStart = (e) => e.preventDefault();

    const onPopState = () => {
      logViolation('back_navigation');
      window.history.pushState(null, '', window.location.href);
    };

    fullscreenIntervalRef.current = setInterval(() => {
      if (!enabledRef.current) return;
      if (!document.fullscreenElement) forceFullscreen();
    }, FULLSCREEN_CHECK_MS);

    window.history.pushState(null, '', window.location.href);

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('fullscreenchange', onFullscreen);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCut);
    document.addEventListener('paste', onPaste);
    document.addEventListener('dragstart', onDragStart);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('selectstart', onSelectStart);
    window.addEventListener('popstate', onPopState);

    forceFullscreen();

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('fullscreenchange', onFullscreen);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('dragstart', onDragStart);
      document.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('selectstart', onSelectStart);
      window.removeEventListener('popstate', onPopState);

      if (fullscreenIntervalRef.current) clearInterval(fullscreenIntervalRef.current);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [enabled, attemptId, logViolation, forceFullscreen]);

  return { getViolations: () => violationsRef.current, forceFullscreen };
}

export const MAX_VIOLATIONS_ALLOWED = MAX_VIOLATIONS;