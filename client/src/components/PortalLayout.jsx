import { Outlet, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

function initialsFor(user) {
  const first = user?.first_name?.[0] || '';
  const last = user?.last_name?.[0] || '';
  return (first + last).toUpperCase() || '?';
}

// Deliberately much thinner than AppLayout: portal accounts have a handful
// of read-only screens, not 20 staff modules, so there's no sidebar to
// collapse or nav tree to build — each portal page manages its own
// in-page navigation (see StudentPortalPage's tabs).
function PortalLayout() {
  const { t } = useTranslation('portal');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      toast.error(t('common:states.errorDescription', { ns: 'common' }));
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-30 border-b bg-background">
        <div className="flex h-16 items-center justify-between px-space-4 md:px-space-6">
          <div>
            <p className="text-sm font-semibold">{user?.school_name || t('appName')}</p>
          </div>
          <div className="flex items-center gap-space-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{initialsFor(user)}</AvatarFallback>
            </Avatar>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-muted-foreground">{user?.role_name}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title={t('common:actions.logout', { ns: 'common' })}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl p-space-4 md:p-space-6">
        <Outlet />
      </main>
    </div>
  );
}

export default PortalLayout;
