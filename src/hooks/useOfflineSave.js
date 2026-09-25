import { useEffect, useRef, useState } from 'react';
import { saveAnswer } from '../lib/attempts';
import {
  queueAnswer,
  getQueuedAnswers,
  removeQueuedAnswer,
} from '../lib/offlineQueue';
import { useOnlineStatus } from './useOnlineStatus';

export function useOfflineSave(attemptId) {
  const online = useOnlineStatus();
  const [queuedCount, setQueuedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  async function refreshQueue() {
    if (!attemptId) return;
    const items = await getQueuedAnswers();
    const mine = items.filter((i) => i.attemptId === attemptId);
    setQueuedCount(mine.length);
  }

  useEffect(() => {
    refreshQueue();
  }, [attemptId]);

  useEffect(() => {
    if (!online || !attemptId || syncingRef.current) return;
    (async () => {
      const items = await getQueuedAnswers();
      const mine = items.filter((i) => i.attemptId === attemptId);
      if (!mine.length) return;

      syncingRef.current = true;
      setSyncing(true);

      for (const item of mine) {
        try {
          await saveAnswer({
            attemptId: item.attemptId,
            questionId: item.questionId,
            answer: item.answer,
          });
          await removeQueuedAnswer(item.key);
        } catch (err) {
          console.error('Sync failed:', err);
        }
      }

      await refreshQueue();
      setSyncing(false);
      syncingRef.current = false;
    })();
  }, [online, attemptId]);

  async function save(payload) {
    if (online) {
      try {
        await saveAnswer(payload);
        return { queued: false };
      } catch (err) {
        await queueAnswer(payload);
        await refreshQueue();
        return { queued: true, error: err.message };
      }
    }
    await queueAnswer(payload);
    await refreshQueue();
    return { queued: true };
  }

  return { save, queuedCount, syncing, online };
}