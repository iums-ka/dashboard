import { useEffect, useRef } from 'react';

/**
 * Custom hook for setting up automatic refresh intervals
 * 
 * Handles interval setup, cleanup, and optional initial fetch.
 * Properly cleans up on unmount or when dependencies change.
 * 
 * @param {Function} refreshFn - Function to call on each interval
 * @param {number} interval - Interval in milliseconds
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether auto-refresh is enabled (default: true)
 * @param {boolean} options.immediate - Whether to call refreshFn immediately (default: true)
 * 
 * @example
 * // Basic usage - refresh every 20 minutes
 * useAutoRefresh(fetchData, REFRESH_INTERVALS.TASKS);
 * 
 * // With options - skip initial call
 * useAutoRefresh(fetchData, 60000, { immediate: false });
 * 
 * // Conditionally enabled
 * useAutoRefresh(fetchData, 60000, { enabled: isConnected });
 */
export function useAutoRefresh(refreshFn, interval, options = {}) {
  const { enabled = true, immediate = true } = options;
  
  // Use ref to always have latest refreshFn without triggering effect
  const refreshFnRef = useRef(refreshFn);
  refreshFnRef.current = refreshFn;

  useEffect(() => {
    if (!enabled || !interval) {
      return;
    }

    // Initial call if requested
    if (immediate) {
      refreshFnRef.current();
    }

    // Set up interval
    const intervalId = setInterval(() => {
      refreshFnRef.current();
    }, interval);

    // Cleanup on unmount or when interval/enabled changes
    return () => {
      clearInterval(intervalId);
    };
  }, [interval, enabled, immediate]);
}

export default useAutoRefresh;
