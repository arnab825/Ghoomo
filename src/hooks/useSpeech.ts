'use client';

import { useState, useCallback } from 'react';

export function useSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState<string | null>(null);

  const speak = useCallback((text: string, lang = 'hi-IN', rate = 0.9) => {
    if (typeof window === 'undefined') return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // stop previous speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;

      utterance.onstart = () => {
        setIsPlaying(true);
        setCurrentText(text);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentText(null);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        setCurrentText(null);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      console.warn('Web Speech API not supported in this environment');
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setCurrentText(null);
    }
  }, []);

  return { speak, stop, isPlaying, currentText };
}
