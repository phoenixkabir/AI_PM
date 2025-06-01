import { useState } from 'react';

type CopyStatus = 'idle' | 'copied' | 'error';

export function useClipboard(resetInterval = 2000) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus('copied');
      
      const timer = setTimeout(() => {
        setCopyStatus('idle');
      }, resetInterval);
      
      return () => clearTimeout(timer);
    } catch (error) {
      setCopyStatus('error');
      console.error('Failed to copy text:', error);
    }
  };

  return { copyStatus, copy };
} 