import { createContext, useContext } from 'react';

export interface ScanPage {
  id: string;
  blob: Blob;
  createdAt: string;
}

export interface ScanSessionContextValue {
  pages: ScanPage[];
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  addPage: (blob: Blob) => void;
  replacePage: (index: number, blob: Blob) => void;
  removePage: (index: number) => void;
  movePage: (index: number, direction: -1 | 1) => void;
}

export const ScanSessionContext =
  createContext<ScanSessionContextValue | null>(null);

export function useScanSession(): ScanSessionContextValue {
  const value = useContext(ScanSessionContext);

  if (value === null) {
    throw new Error(
      'useScanSession debe usarse dentro de ScanSessionProvider.',
    );
  }

  return value;
}
