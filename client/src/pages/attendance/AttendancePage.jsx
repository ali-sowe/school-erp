import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ClassSelector } from '@/components/erp/ClassSelector';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import AttendanceRosterForm from '@/components/attendance/AttendanceRosterForm';
import AttendanceSummaryCard from '@/components/attendance/AttendanceSummaryCard';
import { useAuth } from '@/context/AuthContext';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function AttendancePage() {
  const { t } = useTranslation('attendance');
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('attendance.write');

  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(todayIso());

  return (
    <div className="space-y-space-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('page.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('page.subtitle')}</p>
      </div>

      <div className="flex flex-wrap items-end gap-space-3">
        <div className="w-56 space-y-1">
          <p className="text-sm font-medium">{t('page.classLabel')}</p>
          {/* Only ACTIVE classes can take attendance — the API rejects an
              archived class outright, so there's no point offering them. */}
          <ClassSelector value={classId} onChange={setClassId} params={{ status: 'ACTIVE' }} />
        </div>
        <div className="w-48 space-y-1">
          <p className="text-sm font-medium">{t('page.dateLabel')}</p>
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} max={todayIso()} />
        </div>
      </div>

      {!classId ? (
        <Card>
          <CardContent className="pt-space-5">
            <p className="text-sm text-muted-foreground">{t('page.chooseClassPrompt')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="pt-space-5">
              <AttendanceRosterForm classId={classId} date={date} canWrite={canWrite} />
            </CardContent>
          </Card>

          <AttendanceSummaryCard classId={classId} />
        </>
      )}
    </div>
  );
}

export default AttendancePage;
