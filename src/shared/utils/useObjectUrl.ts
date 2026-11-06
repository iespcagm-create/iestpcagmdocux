import { useEffect, useMemo } from 'react';

export function useObjectUrl(blob: Blob | null): string {
  const url = useMemo(
    () => (blob ? URL.createObjectURL(blob) : ''),
    [blob],
  );

  useEffect(() => {
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [url]);

  return url;
}
