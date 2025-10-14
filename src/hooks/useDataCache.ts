import { useState, useEffect } from 'react';

interface CachedData {
  ndviScore: number;
  soilMoisture: number;
  temperature: number;
  rainfall: number;
  timestamp: number;
}

const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache

export const useDataCache = () => {
  const getCachedData = (key: string): CachedData | null => {
    const cached = localStorage.getItem(`gaiaGuard_${key}`);
    if (!cached) return null;
    
    try {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp > CACHE_DURATION) {
        localStorage.removeItem(`gaiaGuard_${key}`);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  };

  const setCachedData = (key: string, data: Omit<CachedData, 'timestamp'>) => {
    const cacheData: CachedData = {
      ...data,
      timestamp: Date.now(),
    };
    localStorage.setItem(`gaiaGuard_${key}`, JSON.stringify(cacheData));
  };

  const clearCache = () => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('gaiaGuard_')) {
        localStorage.removeItem(key);
      }
    });
  };

  return { getCachedData, setCachedData, clearCache };
};
