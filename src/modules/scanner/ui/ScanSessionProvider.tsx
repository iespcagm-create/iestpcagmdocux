import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ScanSessionContext,
  type ScanPage,
  type ScanSessionContextValue,
} from './scanSessionContext';

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createPage(blob: Blob): ScanPage {
  return {
    id: createId(),
    blob,
    createdAt: new Date().toISOString(),
  };
}

export function ScanSessionProvider({ children }: { children: ReactNode }) {
  const [pages, setPages] = useState<ScanPage[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const addPage = useCallback((blob: Blob) => {
    setPages((current) => [...current, createPage(blob)]);
  }, []);

  const replacePage = useCallback((index: number, blob: Blob) => {
    setPages((current) =>
      current.map((page, pageIndex) =>
        pageIndex === index ? createPage(blob) : page,
      ),
    );
  }, []);

  const removePage = useCallback((index: number) => {
    setPages((current) => current.filter((_, pageIndex) => pageIndex !== index));
  }, []);

  const movePage = useCallback((index: number, direction: -1 | 1) => {
    setPages((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const value = useMemo<ScanSessionContextValue>(
    () => ({
      pages,
      voiceEnabled,
      setVoiceEnabled,
      addPage,
      replacePage,
      removePage,
      movePage,
    }),
    [addPage, movePage, pages, removePage, replacePage, voiceEnabled],
  );

  return (
    <ScanSessionContext.Provider value={value}>
      {children}
    </ScanSessionContext.Provider>
  );
}
