import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useClassAttendanceSummary } from '@/hooks/attendance/useClassAttendance';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

function AttendanceSummaryCard({ classId }) {
  const { t } = useTranslation('attendance');

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [range, setRange] = useState({ from: undefined, to: undefined });

  const { data: summary, isFetching, isError } = useClassAttendanceSummary(classId, range);

  useEffect(() => {
    if (isError) toast.error(t('summary.toasts.error'));
  }, [isError, t]);

  const handleLoad = (event) => {
    event.preventDefault();
    setRange({ from: from || undefined, to: to || undefined });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('summary.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-space-4">
        <form onSubmit={handleLoad} className="flex flex-wrap items-end gap-space-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t('summary.fromLabel')}</p>
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{t('summary.toLabel')}</p>
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </div>
          <Button type="submit" variant="outline" disabled={isFetching}>
            {t('summary.loadButton')}
          </Button>
        </form>

        {summary && (
          <div className="grid grid-cols-2 gap-space-3 sm:grid-cols-5">
            {ATTENDANCE_STATUSES.map((status) => (
              <div key={status} className="rounded-md border p-space-3 text-center">
                <p className="text-2xl font-semibold">{summary[status] ?? 0}</p>
                <p className="text-xs text-muted-foreground">{status}</p>
              </div>
            ))}
            <div className="rounded-md border bg-muted/40 p-space-3 text-center">
              <p className="text-2xl font-semibold">{summary.TOTAL ?? 0}</p>
              <p className="text-xs text-muted-foreground">{t('summary.total')}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AttendanceSummaryCard;
