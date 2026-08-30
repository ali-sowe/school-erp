import { NavLink, Outlet, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  UserRound,
  GraduationCap,
  BookOpen,
  Presentation,
  ClipboardCheck,
  ClipboardList,
  FileSpreadsheet,
  Wallet,
  Receipt,
  CalendarClock,
  CalendarRange,
  Library as LibraryIcon,
  MessageSquare,
  Megaphone,
  FileText,
  UploadCloud,
  Building2,
  FileBarChart,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Menu,
  X,
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
import NotificationBell from '@/components/notifications/NotificationBell';

// NAV_ITEMS (unchanged)
const NAV_ITEMS = [
  { key: 'dashboard', to: '/dashboard', permission: null, icon: LayoutDashboard, ready: true },
  { key: 'academic-calendar', to: '/academic-calendar', permission: 'academic-years.read', icon: CalendarRange, ready: true },
  { key: 'students', to: '/students', permission: 'students.read', icon: GraduationCap, ready: true },
  { key: 'guardians', to: '/guardians', permission: 'guardians.read', icon: UserRound, ready: true },
  { key: 'classes', to: '/classes', permission: 'classes.read', icon: BookOpen, ready: true },
  { key: 'teachers', to: '/teachers', permission: 'teachers.read', icon: Presentation, ready: true },
  { key: 'attendance', to: '/attendance', permission: 'attendance.read', icon: ClipboardCheck, ready: true },
  { key: 'exams', to: '/exams', permission: 'exams.read', icon: FileSpreadsheet, ready: true },
  { key: 'finance', to: '/finance', permission: 'finance.read', icon: Wallet, ready: true },
  { key: 'expenses', to: '/expenses', permission: 'expenses.read', icon: Receipt, ready: true },
  { key: 'library', to: '/library', permission: 'library.read', icon: LibraryIcon, ready: true },
  { key: 'approvals', to: '/approvals', permission: 'approvals.read', icon: ClipboardList, ready: true },
  { key: 'leave-requests', to: '/leave-requests', permission: 'leave-requests.read', icon: CalendarClock, ready: true },
  { key: 'conversations', to: '/conversations', permission: 'messaging.read', icon: MessageSquare, ready: true },
  { key: 'announcements', to: '/announcements', permission: 'announcements.read', icon: Megaphone, ready: true },
  { key: 'documents', to: '/documents', permission: 'documents.read', icon: FileText, ready: true },
  { key: 'data-imports', to: '/data-imports', permission: 'data-imports.read', icon: UploadCloud, ready: true },
  { key: 'schools', to: '/schools', permission: 'schools.read', icon: Building2, ready: true },
  { key: 'reports', to: '/reports', permission: 'reports.read', icon: FileBarChart, ready: true },
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
  const {
    sidebarCollapsed,
    toggleSidebar,
    isMobile,
    isMobileSidebarOpen,
    setMobileSidebarOpen,
  } = useUIStore();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      toast.error(t('states.errorDescription'));
      navigate('/login', { replace: true });
    }
  };

  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(item.permission));

  // ----- Sidebar content (shared between desktop and mobile) -----
  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Brand + toggle */}
      <div className="flex h-16 items-center justify-between px-4 border-b">
        {!sidebarCollapsed && <span className="text-lg font-bold">{t('appName')}</span>}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="ml-auto hidden md:flex"
        >
          {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </Button>
        {/* Mobile close button */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          if (!item.ready) {
            return (
              <div
                key={item.key}
                className="flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed"
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{t(`nav.${item.key}`)}</span>}
              </div>
            );
          }
          return (
            <NavLink
              key={item.key}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground'
                )
              }
              onClick={() => {
                if (isMobile) setMobileSidebarOpen(false);
              }}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{t(`nav.${item.key}`)}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{initialsFor(user)}</AvatarFallback>
          </Avatar>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.role_name}
              </p>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 justify-start text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {!sidebarCollapsed && t('actions.logout')}
        </Button>
      </div>
    </div>
  );

  // ----- Main Layout -----
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r bg-background transition-all duration-300 h-full fixed top-0 left-0 z-40',
          sidebarCollapsed ? 'w-20' : 'w-64'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (custom drawer) */}
      {isMobile && (
        <>
          {/* Backdrop */}
          <div
            className={cn(
              'fixed inset-0 z-50 bg-black/50 transition-opacity duration-300',
              isMobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            onClick={() => setMobileSidebarOpen(false)}
          />
          {/* Drawer */}
          <div
            className={cn(
              'fixed top-0 left-0 z-50 h-full w-64 bg-background transition-transform duration-300 ease-in-out',
              isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            <SidebarContent />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <main
        className={cn(
          'flex-1 flex flex-col transition-all duration-300 h-screen overflow-hidden',
          'md:ml-64',
          sidebarCollapsed && 'md:ml-20'
        )}
      >
        {/* Topbar */}
        <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center px-4 gap-4">
            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* School name */}
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium truncate block">
                {user?.school_name || t('appName')}
              </span>
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-2">
              {/* Optional search */}
            </div>
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{initialsFor(user)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.role_name}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('actions.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AppLayout;