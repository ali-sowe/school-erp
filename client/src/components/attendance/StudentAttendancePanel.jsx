import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';
import { useStudentAttendanceHistory, useUpdateAttendanceRecord } from '@/hooks/attendance/useStudentAttendance';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { EmptyState } from '@/components/erp/EmptyState';

const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

function StudentAttendancePanel({ studentId }) {
  const { t } = useTranslation('attendance');
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('attendance.write');

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [range, setRange] = useState({ from: undefined, to: undefined });

  const { data: history, isLoading } = useStudentAttendanceHistory(studentId, range);
  const updateRecord = useUpdateAttendanceRecord(studentId);

  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ status: '', remarks: '' });

  const handleFilter = (event) => {
    event.preventDefault();
    setRange({ from: from || undefined, to: to || undefined });
  };

  const startEdit = (record) => {
    setEditingId(record.id);
    setEditValues({ status: record.status, remarks: record.remarks || '' });
  };

  const handleSaveEdit = async (recordId) => {
    try {
      await updateRecord.mutateAsync({ recordId, status: editValues.status, remarks: editValues.remarks || undefined });
      toast.success(t('history.toasts.updated'));
      setEditingId(null);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('history.toasts.error'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('history.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-space-4">
        <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-space-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t('history.fromLabel')}</p>
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t('history.toLabel')}</p>
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </div>
          <Button type="submit" variant="outline">
            {t('history.filterButton')}
          </Button>
        </form>

        {isLoading && (
          <div className="space-y-space-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {!isLoading && (!history || history.length === 0) && <EmptyState title={t('history.empty')} />}

        {!isLoading && history && history.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('history.columns.date')}</TableHead>
                  <TableHead>{t('history.columns.status')}</TableHead>
                  <TableHead>{t('history.columns.remarks')}</TableHead>
                  {canWrite && <TableHead>{t('history.columns.actions')}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((record) => {
                  const isEditing = editingId === record.id;
                  return (
                    <TableRow key={record.id}>
                      <TableCell>{record.attendance_date?.slice(0, 10)}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Select value={editValues.status} onValueChange={(value) => setEditValues((current) => ({ ...current, status: value }))}>
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
                          <StatusBadge status={record.status} />
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editValues.remarks}
                            onChange={(event) => setEditValues((current) => ({ ...current, remarks: event.target.value }))}
                            className="min-w-48"
                          />
                        ) : (
                          record.remarks || '—'
                        )}
                      </TableCell>
                      {canWrite && (
                        <TableCell>
                          {isEditing ? (
                            <div className="flex gap-space-2">
                              <Button size="sm" onClick={() => handleSaveEdit(record.id)} disabled={updateRecord.isPending}>
                                {t('history.saveButton')}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                                {t('history.cancelButton')}
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => startEdit(record)}>
                              {t('history.editButton')}
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StudentAttendancePanel;
