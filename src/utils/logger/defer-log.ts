export const defer = (fn: (...args: any[]) => void) => {
  let timeout: NodeJS.Timeout;
  let cache: any[][] = [];

  return (...args: any[]) => {
    cache.push(args);

    clearTimeout(timeout);

    if (cache.length >= 50) {
      for (const args of cache) fn(...args);

      cache = [];

      return;
    }

    timeout = setTimeout(() => {
      for (const args of cache) fn(...args);

      cache = [];
    });
  };
};
