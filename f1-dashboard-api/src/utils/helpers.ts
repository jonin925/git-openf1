import { logger } from './logger';

export const formatDuration = (seconds: number): string => {
  if (!seconds || seconds === 0) return '-';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }
  return `${secs}.${ms.toString().padStart(3, '0')}`;
};

export const formatGap = (gap: string | number): string => {
  if (gap === null || gap === undefined) return '-';
  if (typeof gap === 'string') return gap;
  return `+${gap.toFixed(3)}`;
};

export const parseDate = (dateStr: string): Date => {
  return new Date(dateStr);
};

export const isDateInPast = (dateStr: string): boolean => {
  return new Date(dateStr) < new Date();
};

export const isDateInFuture = (dateStr: string): boolean => {
  return new Date(dateStr) > new Date();
};

export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const sanitizeString = (str: string): string => {
  return str.replace(/[<>]/g, '').trim();
};

export const calculateAverage = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
};

export const calculateMax = (numbers: number[]): number => {
  if (numbers.length === 0) return 0;
  return Math.max(...numbers);
};

export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

export const generateCacheKey = (...parts: (string | number)[]): string => {
  return parts.join(':');
};

export const retryAsync = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      logger.warn(`Attempt ${i + 1} failed, retrying...`, { error: lastError.message });
      await sleep(delay * (i + 1));
    }
  }
  
  throw lastError!;
};

export const filterUnique = <T>(array: T[], keyFn: (item: T) => string | number): T[] => {
  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const sortByDate = <T extends { date: string }>(array: T[], ascending: boolean = true): T[] => {
  return array.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

export const groupBy = <T>(array: T[], keyFn: (item: T) => string): Record<string, T[]> => {
  return array.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
};