import { ReactNode } from 'react';
import { useFeature } from '../../hooks/useFeature';

interface FeatureGuardProps {
  featureKey: string;
  children: ReactNode;
  fallback?: ReactNode;
  showWhileLoading?: boolean;
}

/**
 * Component that conditionally renders children based on feature flag status
 * Uses the useFeature hook to check if a feature is enabled
 */
export function FeatureGuard({
  featureKey,
  children,
  fallback = null,
  showWhileLoading = false
}: FeatureGuardProps) {
  const { enabled, loading } = useFeature(featureKey);

  // While loading, optionally show children or nothing
  if (loading) {
    return showWhileLoading ? <>{children}</> : null;
  }

  // If feature is enabled, show children
  if (enabled) {
    return <>{children}</>;
  }

  // Otherwise show fallback (defaults to null/nothing)
  return <>{fallback}</>;
}
