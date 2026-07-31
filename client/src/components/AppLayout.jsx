import { NavLink, Outlet, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  UserRound,
  GraduationCap,
  BookOpen,
  Presentation,
  ClipboardCheck,
  FileSpreadsheet,
  Wallet,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';
import { useUIStore } from '@/store/useUIStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Mirrors the "Version 1 Modules" build order from docs/readme.txt.
// `ready` means "has a frontend page today" — every one of these modules
// already exists on the backend; this list is purely about frontend
// coverage, so the nav always shows the full roadmap rather than only
// whatever happens to have a screen so far.
const NAV_ITEMS = [
  { key: 'dashboard', to: '/dashboard', permission: null, icon: LayoutDashboard, ready: true },
  { key: 'students', to: '/students', permission: 'students.read', icon: GraduationCap, ready: true },
  { key: 'guardians', to: '/guardians', permission: 'guardians.read', icon: UserRound, ready: true },
  { key: 'classes', to: '/classes', permission: 'classes.read', icon: BookOpen, ready: true },
  { key: 'teachers', to: '/teachers', permission: 'teachers.read', icon: Presentation, ready: true },
  { key: 'attendance', to: '/attendance', permission: 'attendance.read', icon: ClipboardCheck, ready: true },
  { key: 'exams', to: '/exams', permission: 'exams.read', icon: FileSpreadsheet, ready: true },
  { key: 'finance', to: '/finance', permission: 'finance.read', icon: Wallet, ready: true },
  { key: 'admin', to: '/admin', permission: 'users.read', icon: ShieldCheck, ready: true },
];

function initialsFor(user) {
  const first = user?.first_name?.[0] || '';
  const last = user?.last_name?.[0] || '';
  return (first + last).toUpperCase() || '?';
}

function AppLayout() {
  const { t } = useTranslation('common');
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      // Best-effort: even if the server call fails, clear local state and
      // send the user back to login rather than leaving them stuck.
      toast.error(t('states.errorDescription'));
      navigate('/login', { replace: true });
    }
  };

  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(item.permission));

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside
        className={cn(
          'flex flex-col border-r bg-background transition-all duration-200',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        <div className="flex h-14 items-center justify-between px-space-4">
          {!sidebarCollapsed && <span className="text-sm font-semibold">{t('appName')}</span>}
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="ml-auto">
            {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>

        <Separator />

        <nav className="flex-1 space-y-1 p-space-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            if (!item.ready) {
              return (
                <span
                  key={item.key}
                  title="Coming soon"
                  className="flex cursor-not-allowed items-center gap-3 rounded-sm px-3 py-2 text-sm text-muted-foreground/50"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{t(`nav.${item.key}`)}</span>}
                </span>
              );
            }

            return (
              <NavLink
                key={item.key}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!sidebarCollapsed && <span className="truncate">{t(`nav.${item.key}`)}</span>}
              </NavLink>
            );
          })}
        </nav>

        <Separator />

        <div className="p-space-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-sm p-space-2 text-left hover:bg-accent"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initialsFor(user)}</AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{user?.role_name}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem disabled className="opacity-100">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user?.email}</span>
                  <span className="text-xs text-muted-foreground">{user?.role_name}</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4" />
                {t('actions.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <div className="flex-1 overflow-auto">
        <main className="mx-auto max-w-6xl p-space-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
