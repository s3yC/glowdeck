import { get, set, del } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';
import { createJSONStorage } from 'zustand/middleware';
import { PERSIST_DEBOUNCE_MS } from './constants';

const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

/**
 * Raw idb-keyval StateStorage adapter with debounced writes.
 */
function idbStateStorage(storeName: string): StateStorage {
  return {
    getItem: async (name: string): Promise<string | null> => {
      const val = await get(`${storeName}-${name}`);
      return (val as string) ?? null;
    },
    setItem: (name: string, value: string): void => {
      const key = `${storeName}-${name}`;
      clearTimeout(debounceTimers[key]);
      debounceTimers[key] = setTimeout(() => {
        set(key, value);
      }, PERSIST_DEBOUNCE_MS);
    },
    removeItem: async (name: string): Promise<void> => {
      await del(`${storeName}-${name}`);
    },
  };
}

/**
 * Creates a Zustand persist-compatible storage adapter backed by idb-keyval.
 * Wraps the raw StateStorage with createJSONStorage for proper serialization.
 * Writes are debounced by PERSIST_DEBOUNCE_MS to avoid thrashing during
 * drag/resize operations.
 */
export function createIDBStorage(storeName: string) {
  return createJSONStorage(() => idbStateStorage(storeName));
}
