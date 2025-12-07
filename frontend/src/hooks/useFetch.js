import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for managing async data fetching state
 * 
 * Provides consistent loading, error, and data state management
 * with manual refresh capability. Automatically fetches on mount.
 * 
 * @param {Function} fetchFn - Async function that fetches data
 * @param {Object} options - Configuration options
 * @param {Function} options.transformResponse - Function to transform the response
 * @param {boolean} options.autoFetch - Whether to fetch on mount (default: true)
 * @returns {Object} - { data, loading, error, lastUpdated, refresh, execute }
 * 
 * @example
 * const { data, loading, error, refresh } = useFetch(
 *   () => api.mensa.getMenu(true),
 *   { transformResponse: (result) => result.data }
 * );
 */
export function useFetch(fetchFn, options = {}) {
  const { transformResponse = (data) => data, autoFetch = true } = options;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Use refs to avoid stale closures and infinite loops
  const fetchFnRef = useRef(fetchFn);
  const transformResponseRef = useRef(transformResponse);
  fetchFnRef.current = fetchFn;
  transformResponseRef.current = transformResponse;

  /**
   * Execute the fetch function
   * @param {boolean} showLoading - Whether to show loading state
   */
  const execute = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      const result = await fetchFnRef.current();
      const transformedData = transformResponseRef.current(result);
      
      setData(transformedData);
      setLastUpdated(new Date());
      
      return transformedData;
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies - refs handle latest values

  /**
   * Manual refresh - always shows loading spinner
   */
  const refresh = useCallback(() => {
    return execute(true);
  }, [execute]);

  /**
   * Silent refresh - no loading spinner (for auto-refresh)
   */
  const silentRefresh = useCallback(() => {
    return execute(false);
  }, [execute]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      execute(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    silentRefresh,
    execute,
    // Setters for manual state control if needed
    setData,
    setError,
  };
}

export default useFetch;
