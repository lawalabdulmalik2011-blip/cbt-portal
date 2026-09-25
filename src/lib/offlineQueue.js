// src/lib/offlineQueue.js
// Tiny wrapper around IndexedDB — no external dependency

const DB_NAME = 'exampro-offline';
const DB_VERSION = 1;
const STORE_ANSWERS = 'answers';         // pending answer writes
const STORE_CACHE = 'attempt-cache';      // cached attempt data

let dbPromise = null;

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_ANSWERS)) {
        db.createObjectStore(STORE_ANSWERS, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function withStore(storeName, mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = fn(store);
    tx.oncomplete = () => resolve(request?.result);
    tx.onerror = () => reject(tx.error);
  });
}

// ============================================
// ANSWERS QUEUE
// ============================================
export async function queueAnswer({ attemptId, questionId, answer }) {
  const key = `${attemptId}:${questionId}`;
  return withStore(STORE_ANSWERS, 'readwrite', (store) =>
    store.put({
      key,
      attemptId,
      questionId,
      answer,
      queuedAt: Date.now(),
    })
  );
}

export async function getQueuedAnswers() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ANSWERS, 'readonly');
    const req = tx.objectStore(STORE_ANSWERS).getAll();
    req.onsuccess = () => resolve(req.result ?? []);
    req.onerror = () => reject(req.error);
  });
}

export async function removeQueuedAnswer(key) {
  return withStore(STORE_ANSWERS, 'readwrite', (store) => store.delete(key));
}

export async function clearQueuedAnswers() {
  return withStore(STORE_ANSWERS, 'readwrite', (store) => store.clear());
}

// ============================================
// ATTEMPT CACHE (survive refresh)
// ============================================
export async function cacheAttempt(key, data) {
  return withStore(STORE_CACHE, 'readwrite', (store) =>
    store.put({ key, data, cachedAt: Date.now() })
  );
}

export async function getCachedAttempt(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CACHE, 'readonly');
    const req = tx.objectStore(STORE_CACHE).get(key);
    req.onsuccess = () => resolve(req.result?.data ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function clearAttemptCache(key) {
  return withStore(STORE_CACHE, 'readwrite', (store) => store.delete(key));
}