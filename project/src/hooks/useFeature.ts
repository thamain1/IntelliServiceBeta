import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface FeatureData {
  enabled: boolean;
  config: Record<string, unknown>;
  displayName: string;
  description: string | null;
}

interface UseFeatureResult {
  enabled: boolean;
  loading: boolean;
  error: string | null;
  config: Record<string, unknown>;
  refresh: () => Promise<void>;
}

// Cache for feature flags with 5-minute TTL
const featureCache = new Map<string, { data: FeatureData; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Global subscribers for cache invalidation
const subscribers = new Map<string, Set<() => void>>();

/**
 * Hook to check if a feature is enabled
 * Caches results for 5 minutes to avoid repeated queries
 */
export function useFeature(featureKey: string): UseFeatureResult {
  const [featureData, setFeatureData] = useState<FeatureData>({
    enabled: false,
    config: {},
    displayName: '',
    description: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const loadFeature = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache first (unless forcing refresh)
      if (!forceRefresh) {
        const cached = featureCache.get(featureKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
          if (mountedRef.current) {
            setFeatureData(cached.data);
            setLoading(false);
            setError(null);
          }
          return;
        }
      }

      const { data, error: queryError } = await supabase
        .from('organization_features')
        .select('feature_key, display_name, description, is_enabled, config')
        .eq('feature_key', featureKey)
        .maybeSingle();

      if (queryError) throw queryError;

      const featureResult: FeatureData = {
        enabled: data?.is_enabled ?? false,
        config: data?.config ?? {},
        displayName: data?.display_name ?? '',
        description: data?.description ?? null,
      };

      // Update cache
      featureCache.set(featureKey, {
        data: featureResult,
        timestamp: Date.now(),
      });

      if (mountedRef.current) {
        setFeatureData(featureResult);
        setError(null);
      }
    } catch (err: unknown) {
      console.error(`Error loading feature ${featureKey}:`, err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load feature flag');
        // Default to disabled on error
        setFeatureData({
          enabled: false,
          config: {},
          displayName: '',
          description: null,
        });
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [featureKey]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await loadFeature(true);
  }, [loadFeature]);

  // Subscribe to cache invalidation
  useEffect(() => {
    const handleCacheInvalidation = () => {
      loadFeature(true);
    };

    // Add subscriber
    if (!subscribers.has(featureKey)) {
      subscribers.set(featureKey, new Set());
    }
    subscribers.get(featureKey)!.add(handleCacheInvalidation);

    return () => {
      subscribers.get(featureKey)?.delete(handleCacheInvalidation);
    };
  }, [featureKey, loadFeature]);

  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    loadFeature();

    return () => {
      mountedRef.current = false;
    };
  }, [loadFeature]);

  return {
    enabled: featureData.enabled,
    loading,
    error,
    config: featureData.config,
    refresh,
  };
}

/**
 * Invalidate cache for a specific feature key
 * Call this after updating a feature flag
 */
export function invalidateFeatureCache(featureKey: string): void {
  featureCache.delete(featureKey);
  // Notify all subscribers
  subscribers.get(featureKey)?.forEach((callback) => callback());
}

/**
 * Invalidate all feature caches
 */
export function invalidateAllFeatureCaches(): void {
  featureCache.clear();
  subscribers.forEach((subscriberSet) => {
    subscriberSet.forEach((callback) => callback());
  });
}

/**
 * Prefetch multiple feature flags at once
 * Useful for reducing initial load queries
 */
export async function prefetchFeatures(featureKeys: string[]): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('organization_features')
      .select('feature_key, display_name, description, is_enabled, config')
      .in('feature_key', featureKeys);

    if (error) throw error;

    const now = Date.now();
    (data || []).forEach((feature) => {
      featureCache.set(feature.feature_key, {
        data: {
          enabled: feature.is_enabled ?? false,
          config: feature.config ?? {},
          displayName: feature.display_name ?? '',
          description: feature.description ?? null,
        },
        timestamp: now,
      });
    });

    // Also cache features that weren't found (default to disabled)
    featureKeys.forEach((key) => {
      if (!featureCache.has(key)) {
        featureCache.set(key, {
          data: {
            enabled: false,
            config: {},
            displayName: '',
            description: null,
          },
          timestamp: now,
        });
      }
    });
  } catch (err) {
    console.error('Error prefetching features:', err);
  }
}
