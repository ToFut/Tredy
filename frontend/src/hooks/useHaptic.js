import { useCallback } from 'react';

/**
 * Hook for haptic feedback on mobile devices
 * Provides different intensity levels for various interactions
 */
export default function useHaptic() {
  const light = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(1);
    }
  }, []);

  const medium = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(5);
    }
  }, []);

  const heavy = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  const success = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
  }, []);

  const warning = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([20, 100, 20]);
    }
  }, []);

  const error = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50]);
    }
  }, []);

  const selection = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(1);
    }
  }, []);

  return {
    light,
    medium,
    heavy,
    success,
    warning,
    error,
    selection
  };
}