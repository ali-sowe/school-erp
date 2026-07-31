import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useClassAttendanceRoster, useMarkAttendance } from '@/hooks/attendance/useClassAttendance';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { EmptyState } from '@/components/erp/EmptyState';

const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

// The roster grid is its own editable table rather than going through the
// generic DataTable — every row needs an inline Select + Input, and there's
// a bulk "mark all present" action, neither of which DataTable's read-only
// column model supports today.
function AttendanceRosterForm({ classId, date, canWrite }) {
  const { t } = useTranslation('attendance');
  const { data: rosterData, isLoading } = useClassAttendanceRoster(classId, date);
  const markAttendance = useMarkAttendance(classId);

  const [roster, setRoster] = useState([]);

  // Reset local editable state whenever the server roster for this
  // class/date changes — mirrors the old page's effect-on-[classId, date]
  // behavior, just keyed off the query result instead of a manual fetch.
  useEffect(() => {
    setRoster((rosterData ?? []).map((row) => ({ ...row, status: row.status || 'PRESENT', remarks: row.remarks || '' })));
  }, [rosterData]);

  const updateRow = (studentId, field, value) => {
    setRoster((current) => current.map((row) => (row.student_id === studentId ? { ...row, [field]: value } : row)));
  };

  const markAllPresent = () => {
    setRoster((current) => current.map((row) => ({ ...row, status: 'PRESENT' })));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const entries = roster.map((row) => ({
        student_id: row.student_id,
        status: row.status,
        remarks: row.remarks || undefined,
      }));
      await markAttendance.mutateAsync({ date, entries });
      toast.success(t('roster.toasts.saved'));
    } catch (error) {
      toast.error(error?.response?.data?.message || t('roster.toasts.error'));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-space-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (roster.length === 0) {
    return <EmptyState title={t('roster.empty')} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-space-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">{t('roster.title', { date })}</h2>
        {canWrite && (
          <Button type="button" variant="outline" size="sm" onClick={markAllPresent}>
            {t('roster.markAllPresent')}
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('roster.columns.student')}</TableHead>
              <TableHead>{t('roster.columns.admissionNumber')}</TableHead>
              <TableHead>{t('roster.columns.status')}</TableHead>
              <TableHead>{t('roster.columns.remarks')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roster.map((row) => (
              <TableRow key={row.student_id}>
                <TableCell className="font-medium">
                  {row.first_name} {row.last_name}
                </TableCell>
                <TableCell>{row.admission_number}</TableCell>
                <TableCell>
                  {canWrite ? (
                    <Select value={row.status} onValueChange={(value) => updateRow(row.student_id, 'status', value)}>
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ATTENDANCE_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <StatusBadge status={row.status} />
                  )}
                </TableCell>
                <TableCell>
                  {canWrite ? (
                    <Input
                      value={row.remarks}
                      onChange={(event) => updateRow(row.student_id, 'remarks', event.target.value)}
                      placeholder={t('roster.remarksPlaceholder')}
                      className="min-w-48"
                    />
                  ) : (
                    row.remarks || '—'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {canWrite && (
        <Button type="submit" disabled={markAttendance.isPending}>
          {markAttendance.isPending ? t('common:states.loading', { ns: 'common' }) : t('roster.saveButton')}
        </Button>
      )}
    </form>
  );
}

export default AttendanceRosterForm;
