import { useTranslation } from 'react-i18next';
import { BookOpen, Presentation } from 'lucide-react';

import { useTeacherSubjectAssignments, useTeacherClassTeacherAssignments } from '@/hooks/teachers/useTeacherAssignments';
import { useAcademicYears } from '@/hooks/shared/useAcademicYears';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/erp/EmptyState';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';

// Read-only by design: a teacher's own "what do I teach" view. Assigning
// or ending an assignment always happens from the class side (see
// ClassTeachersPanel.jsx / class.routes.js's class-scoped endpoints) —
// this only reads teacher.routes.js's two "for this teacher" endpoints.
function TeacherAssignmentsPanel({ teacherId }) {
  const { t } = useTranslation('teachers');

  const { data: subjectAssignments, isLoading: subjectsLoading } = useTeacherSubjectAssignments(teacherId);
  const { data: homeroomAssignments, isLoading: homeroomLoading } = useTeacherClassTeacherAssignments(teacherId);
  const { data: academicYears } = useAcademicYears();

  const academicYearNameById = new Map((academicYears ?? []).map((year) => [year.id, year.name]));

  return (
    <div className="space-y-space-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            {t('assignments.subjectsSectionTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subjectsLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !subjectAssignments || subjectAssignments.length === 0 ? (
            <EmptyState icon={BookOpen} title={t('assignments.subjectsEmpty')} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('assignments.subjectsColumns.class')}</TableHead>
                  <TableHead>{t('assignments.subjectsColumns.subject')}</TableHead>
                  <TableHead>{t('assignments.subjectsColumns.academicYear')}</TableHead>
                  <TableHead>{t('assignments.subjectsColumns.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjectAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>{assignment.class_name}</TableCell>
                    <TableCell>
                      {assignment.subject_name} <span className="text-muted-foreground">({assignment.subject_code})</span>
                    </TableCell>
                    <TableCell>{academicYearNameById.get(assignment.academic_year_id) || '—'}</TableCell>
                    <TableCell>
                      <StatusBadge status={assignment.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Presentation className="h-4 w-4" />
            {t('assignments.homeroomSectionTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {homeroomLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !homeroomAssignments || homeroomAssignments.length === 0 ? (
            <EmptyState icon={Presentation} title={t('assignments.homeroomEmpty')} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('assignments.homeroomColumns.class')}</TableHead>
                  <TableHead>{t('assignments.homeroomColumns.academicYear')}</TableHead>
                  <TableHead>{t('assignments.homeroomColumns.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {homeroomAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>{assignment.class_name}</TableCell>
                    <TableCell>{academicYearNameById.get(assignment.academic_year_id) || '—'}</TableCell>
                    <TableCell>
                      <StatusBadge status={assignment.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default TeacherAssignmentsPanel;
