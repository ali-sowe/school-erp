import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Megaphone, Pencil, Check, Users } from 'lucide-react';

import {
  useAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useArchiveAnnouncement,
  useRestoreAnnouncement,
  useMarkAnnouncementRead,
  useAnnouncementReaders,
  useAnnouncementRealtimeSync,
} from '@/hooks/messaging/useAnnouncements';
import { useAuth } from '@/context/AuthContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/erp/EmptyState';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { GradeLevelSelector } from '@/components/erp/GradeLevelSelector';
import { ClassSelector } from '@/components/erp/ClassSelector';

const AUDIENCE_TYPES = ['SCHOOL', 'GRADE_LEVEL', 'CLASS'];

function AnnouncementFormDialog({ open, onOpenChange, announcement }) {
  const { t } = useTranslation('communication');
  const isEditMode = Boolean(announcement);
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement(announcement?.id);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audienceType, setAudienceType] = useState('SCHOOL');
  const [audienceId, setAudienceId] = useState('');
  const [errors, setErrors] = useState({});

  // Prefill from the announcement being edited (re-runs when the dialog is
  // reopened for a different one), or reset to blank for "create".
  useEffect(() => {
    if (!open) return;
    if (announcement) {
      setTitle(announcement.title ?? '');
      setBody(announcement.body ?? '');
      setAudienceType(announcement.audience_type ?? 'SCHOOL');
      setAudienceId(announcement.audience_id ? String(announcement.audience_id) : '');
    } else {
      setTitle('');
      setBody('');
      setAudienceType('SCHOOL');
      setAudienceId('');
    }
    setErrors({});
  }, [announcement, open]);

  const handleClose = (nextOpen) => {
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!title.trim()) nextErrors.title = t('announcements.form.errors.titleRequired');
    if (!body.trim()) nextErrors.body = t('announcements.form.errors.bodyRequired');
    if (audienceType !== 'SCHOOL' && !audienceId) nextErrors.audienceId = t('announcements.form.errors.audienceIdRequired');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const payload = {
      title: title.trim(),
      body: body.trim(),
      audience_type: audienceType,
      ...(audienceType !== 'SCHOOL' ? { audience_id: Number(audienceId) } : {}),
    };

    try {
      if (isEditMode) {
        await updateAnnouncement.mutateAsync(payload);
        toast.success(t('announcements.form.toasts.updated'));
      } else {
        await createAnnouncement.mutateAsync(payload);
        toast.success(t('announcements.form.toasts.created'));
      }
      handleClose(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('announcements.form.toasts.error'));
    }
  };

  const isPending = isEditMode ? updateAnnouncement.isPending : createAnnouncement.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? t('announcements.form.editTitle') : t('announcements.form.createTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-space-4">
          <div className="space-y-space-2">
            <label className="text-sm font-medium">{t('announcements.form.titleLabel')}</label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-space-2">
            <label className="text-sm font-medium">{t('announcements.form.bodyLabel')}</label>
            <Textarea value={body} onChange={(event) => setBody(event.target.value)} rows={4} />
            {errors.body && <p className="text-sm text-destructive">{errors.body}</p>}
          </div>

          <div className="space-y-space-2">
            <label className="text-sm font-medium">{t('announcements.form.audienceLabel')}</label>
            <Select
              value={audienceType}
              onValueChange={(value) => {
                setAudienceType(value);
                setAudienceId('');
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`announcements.audienceTypes.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {audienceType === 'GRADE_LEVEL' && (
            <div className="space-y-space-2">
              <label className="text-sm font-medium">{t('announcements.form.gradeLevelLabel')}</label>
              <GradeLevelSelector value={audienceId} onChange={setAudienceId} params={{ status: 'ACTIVE' }} />
              {errors.audienceId && <p className="text-sm text-destructive">{errors.audienceId}</p>}
            </div>
          )}

          {audienceType === 'CLASS' && (
            <div className="space-y-space-2">
              <label className="text-sm font-medium">{t('announcements.form.classLabel')}</label>
              <ClassSelector value={audienceId} onChange={setAudienceId} params={{ status: 'ACTIVE' }} />
              {errors.audienceId && <p className="text-sm text-destructive">{errors.audienceId}</p>}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              {t('common:actions.cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? t('common:states.loading', { ns: 'common' })
                : isEditMode
                  ? t('announcements.form.saveButton')
                  : t('announcements.form.publishButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReadersDialog({ announcementId, open, onOpenChange }) {
  const { t } = useTranslation('communication');
  const { data: readers, isLoading } = useAnnouncementReaders(open ? announcementId : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('announcements.readersDialog.title')}</DialogTitle>
        </DialogHeader>
        {isLoading && <Skeleton className="h-20 w-full" />}
        {!isLoading && (readers ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">{t('announcements.readersDialog.empty')}</p>
        )}
        {!isLoading && (readers ?? []).length > 0 && (
          <ul className="space-y-space-2">
            {readers.map((reader) => (
              <li key={reader.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {reader.first_name} {reader.last_name}
                </span>
                <span className="text-muted-foreground">
                  {t('announcements.readersDialog.readAtLabel')} {reader.read_at?.slice(0, 10)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AnnouncementCard({ announcement, canWrite, onEdit, onArchiveToggle }) {
  const { t } = useTranslation('communication');
  const markRead = useMarkAnnouncementRead(announcement.id);
  const [readersOpen, setReadersOpen] = useState(false);

  const handleMarkRead = async () => {
    try {
      await markRead.mutateAsync();
      toast.success(t('announcements.toasts.markedRead'));
    } catch (error) {
      toast.error(error?.response?.data?.message || t('announcements.toasts.error'));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{announcement.title}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {t(`announcements.audienceTypes.${announcement.audience_type}`)} · {announcement.created_at?.slice(0, 10)}
          </p>
        </div>
        <div className="flex items-center gap-space-2">
          <StatusBadge status={announcement.status} />
          <Button variant="outline" size="sm" onClick={handleMarkRead} disabled={markRead.isPending}>
            <Check className="h-3.5 w-3.5" />
            {t('announcements.readButton')}
          </Button>
          {canWrite && (
            <Button variant="outline" size="sm" onClick={() => setReadersOpen(true)}>
              <Users className="h-3.5 w-3.5" />
              {t('announcements.readersButton')}
            </Button>
          )}
          {canWrite && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
              {t('common:actions.edit', { ns: 'common' })}
            </Button>
          )}
          {canWrite && (
            <Button variant="outline" size="sm" onClick={onArchiveToggle}>
              {announcement.status === 'ARCHIVED'
                ? t('common:actions.restore', { ns: 'common' })
                : t('common:actions.archive', { ns: 'common' })}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm">{announcement.body}</p>
      </CardContent>
      <ReadersDialog announcementId={announcement.id} open={readersOpen} onOpenChange={setReadersOpen} />
    </Card>
  );
}

function AnnouncementsPage() {
  const { t } = useTranslation('communication');
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('announcements.write');
  const { data: announcements, isLoading } = useAnnouncements();
  const archiveAnnouncement = useArchiveAnnouncement();
  const restoreAnnouncement = useRestoreAnnouncement();
  useAnnouncementRealtimeSync();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  const handleArchiveToggle = async (announcement) => {
    try {
      if (announcement.status === 'ARCHIVED') {
        await restoreAnnouncement.mutateAsync(announcement.id);
        toast.success(t('announcements.toasts.restored'));
      } else {
        await archiveAnnouncement.mutateAsync(announcement.id);
        toast.success(t('announcements.toasts.archived'));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || t('announcements.toasts.error'));
    }
  };

  return (
    <div className="space-y-space-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('announcements.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('announcements.subtitle')}</p>
        </div>
        {canWrite && (
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('announcements.addButton')}
          </Button>
        )}
      </div>

      {isLoading && <Skeleton className="h-32 w-full" />}

      {!isLoading && (announcements ?? []).length === 0 && (
        <EmptyState icon={Megaphone} title={t('announcements.empty.title')} description={t('announcements.empty.description')} />
      )}

      <div className="space-y-space-3">
        {(announcements ?? []).map((announcement) => (
          <AnnouncementCard
            key={announcement.id}
            announcement={announcement}
            canWrite={canWrite}
            onEdit={() => setEditingAnnouncement(announcement)}
            onArchiveToggle={() => handleArchiveToggle(announcement)}
          />
        ))}
      </div>

      {canWrite && <AnnouncementFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />}
      {canWrite && (
        <AnnouncementFormDialog
          open={Boolean(editingAnnouncement)}
          onOpenChange={(open) => {
            if (!open) setEditingAnnouncement(null);
          }}
          announcement={editingAnnouncement}
        />
      )}
    </div>
  );
}

export default AnnouncementsPage;
