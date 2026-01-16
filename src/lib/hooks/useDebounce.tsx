import { useEffect, useState } from 'react';

/**
 * Debounces a value by delaying updates until the input stops changing.
 *
 * @template T - Type of the value to debounce
 * @param {T} value - The input value to debounce
 * @param {number} delay - Delay in milliseconds (default: 300)
 * @returns {T} The debounced value
 */
export const useDebounce = <T,>(value: T, delay = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
};
