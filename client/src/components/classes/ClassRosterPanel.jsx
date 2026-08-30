import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';

import { useClassRoster } from '@/hooks/shared/useClassRoster';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/erp/EmptyState';
import { StatusBadge } from '@/components/erp/StatusBadge';

// The plain "who's in this class" view — every other place the roster
// shows up (attendance marking, exam results entry) wraps it in a specific
// task; this is just the list on its own, for the common case of wanting
// to check enrollment without doing either of those.
function ClassRosterPanel({ classId }) {
  const { t } = useTranslation('classes');
  const { data: roster, isLoading } = useClassRoster(classId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          {t('roster.sectionTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-32 w-full" />}
        {!isLoading && (!roster || roster.length === 0) && <EmptyState icon={Users} title={t('roster.empty')} />}
        {!isLoading && roster && roster.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-space-2 font-medium">{t('roster.nameHeader')}</th>
                <th className="py-space-2 font-medium">{t('roster.admissionNumberHeader')}</th>
                <th className="py-space-2 font-medium">{t('roster.enrolledDateHeader')}</th>
                <th className="py-space-2 font-medium">{t('roster.statusHeader')}</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((student) => (
                <tr key={student.enrollment_id} className="border-b last:border-0">
                  <td className="py-space-2">
                    <Link to={`/students/${student.id}`} className="font-medium text-primary hover:underline">
                      {student.first_name} {student.last_name}
                    </Link>
                  </td>
                  <td className="py-space-2">{student.admission_number}</td>
                  <td className="py-space-2">{student.enrolled_date?.slice(0, 10)}</td>
                  <td className="py-space-2">
                    <StatusBadge status={student.enrollment_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

export default ClassRosterPanel;
