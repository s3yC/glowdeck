import { get, set, del } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';
import { PERSIST_DEBOUNCE_MS } from './constants';

const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

/**
 * Creates a Zustand-compatible StateStorage adapter backed by idb-keyval.
 * Writes are debounced by PERSIST_DEBOUNCE_MS to avoid thrashing during
 * drag/resize operations.
 */
export function createIDBStorage(storeName: string): StateStorage {
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
