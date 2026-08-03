import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Gates a route on two things: is there a logged-in user at all, and (if a
// permission was requested) does that user's role actually have it. This
// mirrors the backend's authenticate + authorize pair so the UI never shows
// a screen the API would refuse to serve.
function ProtectedRoute({ children, permission }) {
  const { t } = useTranslation('common');
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col gap-space-4 p-space-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasPermission(permission)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-space-6">
        <Alert variant="destructive" className="max-w-md">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>{t('states.accessDeniedTitle')}</AlertTitle>
          <AlertDescription>{t('states.accessDeniedDescription')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
