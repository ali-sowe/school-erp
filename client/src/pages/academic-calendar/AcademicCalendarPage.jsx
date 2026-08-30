import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { CalendarDays, CalendarRange, Copy, Plus } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useAcademicYears } from '@/hooks/shared/useAcademicYears';
import { useTerms } from '@/hooks/shared/useTerms';
import { useCalendarEvents, useArchiveCalendarEvent, useRestoreCalendarEvent, useCopyCalendarEvents } from '@/hooks/academic-calendar/useCalendarEvents';
import { useActivateAcademicYear, useCompleteAcademicYear } from '@/hooks/academic-calendar/useAcademicYearMutations';
import { useActivateTerm, useCompleteTerm } from '@/hooks/academic-calendar/useTermMutations';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/erp/DataTable';
import { EmptyState } from '@/components/erp/EmptyState';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { ConfirmDialog } from '@/components/erp/ConfirmDialog';
import AcademicYearForm from '@/components/academic-calendar/AcademicYearForm';
import AcademicYearOverrideForm from '@/components/academic-calendar/AcademicYearOverrideForm';
import TermForm from '@/components/academic-calendar/TermForm';
import CalendarEventForm from '@/components/academic-calendar/CalendarEventForm';

function AcademicCalendarPage() {
  const { t } = useTranslation('academic-calendar');
  const { hasPermission } = useAuth();
  const canWriteYears = hasPermission('academic-years.write');
  const canWriteTerms = hasPermission('terms.write');
  const canWriteCalendar = hasPermission('calendar.write');

  // --- Academic Years ---
  const { data: academicYears, isLoading: yearsLoading } = useAcademicYears();
  const activateYear = useActivateAcademicYear();
  const completeYear = useCompleteAcademicYear();
  const [yearFormOpen, setYearFormOpen] = useState(false);
  const [activeYear, setActiveYear] = useState(null);
  const [overrideYear, setOverrideYear] = useState(null);
  const [yearConfirm, setYearConfirm] = useState(null); // { id, action: 'activate' | 'complete' }

  const yearColumns = useMemo(
    () => [
      { accessorKey: 'name', header: t('years.columns.name') },
      {
        accessorKey: 'start_date',
        header: t('years.columns.planned'),
        cell: ({ row }) => `${row.original.start_date?.slice(0, 10)} – ${row.original.end_date?.slice(0, 10)}`,
      },
      {
        accessorKey: 'actual_start_date',
        header: t('years.columns.actual'),
        cell: ({ row }) =>
          row.original.actual_start_date || row.original.actual_end_date
            ? `${row.original.actual_start_date?.slice(0, 10) || '—'} – ${row.original.actual_end_date?.slice(0, 10) || '—'}`
            : '—',
      },
      { accessorKey: 'status', header: t('years.columns.status'), cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      ...(canWriteYears
        ? [
            {
              id: 'actions',
              header: t('years.columns.actions'),
              cell: ({ row }) => (
                <div className="flex flex-wrap gap-space-2">
                  {row.original.status !== 'COMPLETED' && (
                    <Button variant="outline" size="sm" onClick={() => { setActiveYear(row.original); setYearFormOpen(true); }}>
                      {t('common:actions.edit', { ns: 'common' })}
                    </Button>
                  )}
                  {row.original.status === 'SCHEDULED' && (
                    <Button variant="outline" size="sm" onClick={() => setYearConfirm({ id: row.original.id, action: 'activate' })}>
                      {t('years.activateButton')}
                    </Button>
                  )}
                  {row.original.status === 'ACTIVE' && (
                    <Button variant="outline" size="sm" onClick={() => setYearConfirm({ id: row.original.id, action: 'complete' })}>
                      {t('years.completeButton')}
                    </Button>
                  )}
                  {row.original.status !== 'COMPLETED' && (
                    <Button variant="outline" size="sm" onClick={() => setOverrideYear(row.original)}>
                      {t('years.overrideButton')}
                    </Button>
                  )}
                </div>
              ),
            },
          ]
        : []),
    ],
    [t, canWriteYears]
  );

  const handleYearConfirm = async () => {
    try {
      if (yearConfirm.action === 'activate') {
        await activateYear.mutateAsync(yearConfirm.id);
        toast.success(t('years.toasts.activated'));
      } else {
        await completeYear.mutateAsync(yearConfirm.id);
        toast.success(t('years.toasts.completed'));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || t('years.toasts.error'));
    }
  };

  // --- Selected year drives Terms + Calendar Events below ---
  const [selectedYearId, setSelectedYearId] = useState('');
  useEffect(() => {
    if (!selectedYearId && academicYears?.length > 0) {
      const active = academicYears.find((year) => year.status === 'ACTIVE');
      setSelectedYearId(String(active?.id ?? academicYears[0].id));
    }
  }, [academicYears, selectedYearId]);

  // --- Terms ---
  const { data: terms, isLoading: termsLoading } = useTerms(selectedYearId);
  const activateTerm = useActivateTerm();
  const completeTerm = useCompleteTerm();
  const [termFormOpen, setTermFormOpen] = useState(false);
  const [activeTerm, setActiveTerm] = useState(null);
  const [termConfirm, setTermConfirm] = useState(null);

  const termColumns = useMemo(
    () => [
      { accessorKey: 'name', header: t('terms.columns.name') },
      {
        accessorKey: 'start_date',
        header: t('terms.columns.dates'),
        cell: ({ row }) => `${row.original.start_date?.slice(0, 10)} – ${row.original.end_date?.slice(0, 10)}`,
      },
      { accessorKey: 'status', header: t('terms.columns.status'), cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      ...(canWriteTerms
        ? [
            {
              id: 'actions',
              header: t('terms.columns.actions'),
              cell: ({ row }) => (
                <div className="flex flex-wrap gap-space-2">
                  {row.original.status !== 'COMPLETED' && (
                    <Button variant="outline" size="sm" onClick={() => { setActiveTerm(row.original); setTermFormOpen(true); }}>
                      {t('common:actions.edit', { ns: 'common' })}
                    </Button>
                  )}
                  {row.original.status === 'SCHEDULED' && (
                    <Button variant="outline" size="sm" onClick={() => setTermConfirm({ id: row.original.id, action: 'activate' })}>
                      {t('terms.activateButton')}
                    </Button>
                  )}
                  {row.original.status === 'ACTIVE' && (
                    <Button variant="outline" size="sm" onClick={() => setTermConfirm({ id: row.original.id, action: 'complete' })}>
                      {t('terms.completeButton')}
                    </Button>
                  )}
                </div>
              ),
            },
          ]
        : []),
    ],
    [t, canWriteTerms]
  );

  const handleTermConfirm = async () => {
    try {
      if (termConfirm.action === 'activate') {
        await activateTerm.mutateAsync(termConfirm.id);
        toast.success(t('terms.toasts.activated'));
      } else {
        await completeTerm.mutateAsync(termConfirm.id);
        toast.success(t('terms.toasts.completed'));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || t('terms.toasts.error'));
    }
  };

  // --- Calendar Events ---
  const { data: events, isLoading: eventsLoading } = useCalendarEvents(selectedYearId);
  const archiveEvent = useArchiveCalendarEvent();
  const restoreEvent = useRestoreCalendarEvent();
  const copyEvents = useCopyCalendarEvents();
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState(null);
  const [eventConfirm, setEventConfirm] = useState(null);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copySourceYearId, setCopySourceYearId] = useState('');

  const eventColumns = useMemo(
    () => [
      { accessorKey: 'title', header: t('events.columns.title') },
      { accessorKey: 'category', header: t('events.columns.category'), cell: ({ row }) => row.original.category || '—' },
      {
        accessorKey: 'start_date',
        header: t('events.columns.dates'),
        cell: ({ row }) => `${row.original.start_date?.slice(0, 10)} – ${row.original.end_date?.slice(0, 10)}`,
      },
      {
        accessorKey: 'is_school_closed',
        header: t('events.columns.schoolClosed'),
        cell: ({ row }) => (row.original.is_school_closed ? t('events.closedYes') : t('events.closedNo')),
      },
      { accessorKey: 'status', header: t('events.columns.status'), cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      ...(canWriteCalendar
        ? [
            {
              id: 'actions',
              header: t('events.columns.actions'),
              cell: ({ row }) => (
                <div className="flex gap-space-2">
                  {row.original.status === 'ACTIVE' && (
                    <Button variant="outline" size="sm" onClick={() => { setActiveEvent(row.original); setEventFormOpen(true); }}>
                      {t('common:actions.edit', { ns: 'common' })}
                    </Button>
                  )}
                  {row.original.status === 'ARCHIVED' ? (
                    <Button variant="outline" size="sm" onClick={() => setEventConfirm({ id: row.original.id, action: 'restore' })}>
                      {t('common:actions.restore', { ns: 'common' })}
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setEventConfirm({ id: row.original.id, action: 'archive' })}>
                      {t('common:actions.archive', { ns: 'common' })}
                    </Button>
                  )}
                </div>
              ),
            },
          ]
        : []),
    ],
    [t, canWriteCalendar]
  );

  const handleEventConfirm = async () => {
    try {
      if (eventConfirm.action === 'archive') {
        await archiveEvent.mutateAsync(eventConfirm.id);
      } else {
        await restoreEvent.mutateAsync(eventConfirm.id);
      }
      toast.success(eventConfirm.action === 'archive' ? t('events.toasts.archived') : t('events.toasts.restored'));
    } catch {
      toast.error(t('events.toasts.error'));
    }
  };

  const handleCopyEvents = async () => {
    if (!copySourceYearId) return;
    try {
      const copied = await copyEvents.mutateAsync({ sourceAcademicYearId: Number(copySourceYearId), targetAcademicYearId: Number(selectedYearId) });
      toast.success(t('events.copyDialog.toasts.copied', { count: copied?.length ?? 0 }));
      setCopyDialogOpen(false);
      setCopySourceYearId('');
    } catch (error) {
      toast.error(error?.response?.data?.message || t('events.copyDialog.toasts.error'));
    }
  };

  const otherYears = (academicYears ?? []).filter((year) => String(year.id) !== selectedYearId);

  return (
    <div className="space-y-space-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('page.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('page.subtitle')}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarRange className="h-4 w-4" />
            {t('years.sectionTitle')}
          </CardTitle>
          {canWriteYears && (
            <Button size="sm" onClick={() => { setActiveYear(null); setYearFormOpen(true); }}>
              <Plus className="h-4 w-4" />
              {t('years.addButton')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <DataTable
            columns={yearColumns}
            data={academicYears}
            isLoading={yearsLoading}
            emptyState={<EmptyState icon={CalendarRange} title={t('years.empty.title')} description={t('years.empty.description')} />}
          />
        </CardContent>
      </Card>

      {academicYears?.length > 0 && (
        <div className="w-64 space-y-1">
          <p className="text-sm font-medium">{t('yearFilter.label')}</p>
          <Select value={selectedYearId} onValueChange={setSelectedYearId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((year) => (
                <SelectItem key={year.id} value={String(year.id)}>
                  {year.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4" />
            {t('terms.sectionTitle')}
          </CardTitle>
          {canWriteTerms && selectedYearId && (
            <Button size="sm" onClick={() => { setActiveTerm(null); setTermFormOpen(true); }}>
              <Plus className="h-4 w-4" />
              {t('terms.addButton')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!selectedYearId ? (
            <EmptyState title={t('yearFilter.chooseYearFirst')} />
          ) : (
            <DataTable
              columns={termColumns}
              data={terms}
              isLoading={termsLoading}
              emptyState={<EmptyState icon={CalendarDays} title={t('terms.empty.title')} description={t('terms.empty.description')} />}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4" />
            {t('events.sectionTitle')}
          </CardTitle>
          {canWriteCalendar && selectedYearId && (
            <div className="flex gap-space-2">
              {otherYears.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setCopyDialogOpen(true)}>
                  <Copy className="h-4 w-4" />
                  {t('events.copyButton')}
                </Button>
              )}
              <Button size="sm" onClick={() => { setActiveEvent(null); setEventFormOpen(true); }}>
                <Plus className="h-4 w-4" />
                {t('events.addButton')}
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!selectedYearId ? (
            <EmptyState title={t('yearFilter.chooseYearFirst')} />
          ) : (
            <DataTable
              columns={eventColumns}
              data={events}
              isLoading={eventsLoading}
              emptyState={<EmptyState icon={CalendarDays} title={t('events.empty.title')} description={t('events.empty.description')} />}
            />
          )}
        </CardContent>
      </Card>

      {/* --- Academic Year dialogs --- */}
      <Dialog open={yearFormOpen} onOpenChange={setYearFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeYear ? t('years.form.editTitle') : t('years.form.createTitle')}</DialogTitle>
          </DialogHeader>
          <AcademicYearForm academicYear={activeYear} onSaved={() => setYearFormOpen(false)} onCancel={() => setYearFormOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(overrideYear)} onOpenChange={(open) => !open && setOverrideYear(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('years.overrideForm.title', { name: overrideYear?.name })}</DialogTitle>
          </DialogHeader>
          {overrideYear && (
            <AcademicYearOverrideForm academicYear={overrideYear} onSaved={() => setOverrideYear(null)} onCancel={() => setOverrideYear(null)} />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(yearConfirm)}
        onOpenChange={(open) => !open && setYearConfirm(null)}
        title={yearConfirm?.action === 'activate' ? t('years.confirmActivate.title') : t('years.confirmComplete.title')}
        description={yearConfirm?.action === 'activate' ? t('years.confirmActivate.description') : t('years.confirmComplete.description')}
        destructive={false}
        onConfirm={handleYearConfirm}
      />

      {/* --- Term dialogs --- */}
      <Dialog open={termFormOpen} onOpenChange={setTermFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeTerm ? t('terms.form.editTitle') : t('terms.form.createTitle')}</DialogTitle>
          </DialogHeader>
          <TermForm term={activeTerm} academicYearId={Number(selectedYearId)} onSaved={() => setTermFormOpen(false)} onCancel={() => setTermFormOpen(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(termConfirm)}
        onOpenChange={(open) => !open && setTermConfirm(null)}
        title={termConfirm?.action === 'activate' ? t('terms.confirmActivate.title') : t('terms.confirmComplete.title')}
        description={termConfirm?.action === 'activate' ? t('terms.confirmActivate.description') : t('terms.confirmComplete.description')}
        destructive={false}
        onConfirm={handleTermConfirm}
      />

      {/* --- Calendar Event dialogs --- */}
      <Dialog open={eventFormOpen} onOpenChange={setEventFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeEvent ? t('events.form.editTitle') : t('events.form.createTitle')}</DialogTitle>
          </DialogHeader>
          <CalendarEventForm
            event={activeEvent}
            academicYearId={Number(selectedYearId)}
            onSaved={() => setEventFormOpen(false)}
            onCancel={() => setEventFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(eventConfirm)}
        onOpenChange={(open) => !open && setEventConfirm(null)}
        title={eventConfirm?.action === 'archive' ? t('events.confirmArchive.title') : t('events.confirmRestore.title')}
        description={eventConfirm?.action === 'archive' ? t('events.confirmArchive.description') : t('events.confirmRestore.description')}
        destructive={eventConfirm?.action === 'archive'}
        onConfirm={handleEventConfirm}
      />

      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('events.copyDialog.title')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t('events.copyDialog.description')}</p>
          <Select value={copySourceYearId} onValueChange={setCopySourceYearId}>
            <SelectTrigger>
              <SelectValue placeholder={t('events.copyDialog.sourcePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {otherYears.map((year) => (
                <SelectItem key={year.id} value={String(year.id)}>
                  {year.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyDialogOpen(false)} disabled={copyEvents.isPending}>
              {t('common:actions.cancel', { ns: 'common' })}
            </Button>
            <Button onClick={handleCopyEvents} disabled={!copySourceYearId || copyEvents.isPending}>
              {copyEvents.isPending ? t('common:states.loading', { ns: 'common' }) : t('events.copyButton')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AcademicCalendarPage;
