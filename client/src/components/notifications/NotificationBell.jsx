import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useNotificationRealtimeSync,
} from '@/hooks/notifications/useNotifications';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function NotificationBell() {
  const { t } = useTranslation('communication');
  const { data: notifications } = useNotifications();
  const { data: unreadCount } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const navigate = useNavigate();
  useNotificationRealtimeSync();

  const recent = (notifications ?? []).slice(0, 8);

const handleNotificationClick = (notification) => {
  if (!notification.read_at) {
    markRead.mutate(notification.id);
  }

  // Route by entity type — mirrors approval.service.js's/announcement.service.js's
  // relatedEntityType values (ApprovalRequest, Announcement, Conversation).
  // Only Conversation, ApprovalRequest, and Announcement are notification
  // sources today; anything else just marks read with nowhere to go.
  if (notification.related_entity_type === 'Conversation' && notification.related_entity_id) {
    navigate(`/conversations?open=${notification.related_entity_id}`);
  } else if (notification.related_entity_type === 'ApprovalRequest' && notification.related_entity_id) {
    navigate(`/approvals/${notification.related_entity_id}`);
  } else if (notification.related_entity_type === 'Announcement') {
    navigate('/announcements');
  }
};
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-4 min-w-4 justify-center px-1 text-[10px]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          {t('notifications.title')}
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              className="text-xs font-normal text-primary hover:underline"
            >
              {t('notifications.markAllRead')}
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {recent.length === 0 && (
          <p className="p-space-4 text-center text-sm text-muted-foreground">
            {t('notifications.empty')}
          </p>
        )}
        {recent.map((notification) => (
          <DropdownMenuItem
            key={notification.id}
            className={notification.read_at ? 'opacity-60' : ''}
            onSelect={() => handleNotificationClick(notification)}
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{notification.title}</span>
              {notification.body && (
                <span className="text-xs text-muted-foreground">
                  {notification.body}
                </span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default NotificationBell;