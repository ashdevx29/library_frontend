import { useState, useCallback } from 'react';

export function usePagination(initialPage = 1, initialLimit = 10) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const nextPage = useCallback(() => setPage(p => p + 1), []);
  const prevPage = useCallback(() => setPage(p => Math.max(1, p - 1)), []);
  const goToPage = useCallback((p) => setPage(p), []);
  const reset = useCallback(() => setPage(1), []);

  return { page, limit, setPage, setLimit, nextPage, prevPage, goToPage, reset, skip: (page - 1) * limit };
}

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useState(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useToggle(initial = false) {
  const [val, setVal] = useState(initial);
  const toggle = useCallback(() => setVal(v => !v), []);
  const on = useCallback(() => setVal(true), []);
  const off = useCallback(() => setVal(false), []);
  return [val, toggle, on, off];
}
