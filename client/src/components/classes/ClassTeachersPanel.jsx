import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { BookOpen, Presentation } from 'lucide-react';

import { useSubjects } from '@/hooks/classes/useSubjects';
import { useTeachers } from '@/hooks/teachers/useTeachers';
import {
  useClassSubjectTeachers,
  useAssignSubjectTeacher,
  useEndSubjectTeacherAssignment,
  useClassTeacher,
  useAssignClassTeacher,
  useEndClassTeacherAssignment,
} from '@/hooks/classes/useClassTeacherAssignments';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TeacherSelector } from '@/components/erp/TeacherSelector';
import { EmptyState } from '@/components/erp/EmptyState';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { ConfirmDialog } from '@/components/erp/ConfirmDialog';

// The write counterpart to ClassSubjectsPanel (which class-subject to
// offer) and TeacherAssignmentsPanel (a teacher's own read-only view) —
// this is where "who teaches this subject to this class" and "who's the
// homeroom teacher" actually get assigned, since both are always scoped to
// one class (see class.routes.js's comments on why these live here).
function ClassTeachersPanel({ classId, canWrite }) {
  const { t } = useTranslation('teachers');

  // --- Subject teachers ---
  const { data: subjectTeachers, isLoading: subjectTeachersLoading } = useClassSubjectTeachers(classId);
  const { data: allSubjects } = useSubjects({ status: 'ACTIVE' });
  const assignSubjectTeacher = useAssignSubjectTeacher(classId);
  const endSubjectTeacherAssignment = useEndSubjectTeacherAssignment(classId);

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [endAssignmentId, setEndAssignmentId] = useState(null);

  // Offer every active subject — unlike ClassSubjectsPanel's "not already
  // assigned" filter, re-selecting an already-assigned subject here is a
  // legitimate way to reassign its teacher (the backend updates the
  // existing row rather than rejecting a duplicate).
  const handleAssignSubjectTeacher = async () => {
    if (!selectedSubjectId || !selectedTeacherId) return;
    try {
      await assignSubjectTeacher.mutateAsync({
        subjectId: Number(selectedSubjectId),
        teacherId: Number(selectedTeacherId),
      });
      toast.success(t('classAssignments.toasts.assigned'));
      setSelectedSubjectId('');
      setSelectedTeacherId('');
    } catch (error) {
      toast.error(error?.response?.data?.message || t('classAssignments.toasts.error'));
    }
  };

  const handleEndSubjectTeacherAssignment = async () => {
    try {
      await endSubjectTeacherAssignment.mutateAsync(endAssignmentId);
      toast.success(t('classAssignments.toasts.ended'));
    } catch (error) {
      toast.error(error?.response?.data?.message || t('classAssignments.toasts.error'));
      throw error;
    }
  };

  // --- Homeroom teacher ---
  const { data: classTeacher, isLoading: classTeacherLoading } = useClassTeacher(classId);
  const { data: allTeachers } = useTeachers();
  const teacherNameById = new Map((allTeachers ?? []).map((teacher) => [teacher.id, `${teacher.first_name} ${teacher.last_name}`]));
  const assignClassTeacher = useAssignClassTeacher(classId);
  const endClassTeacherAssignment = useEndClassTeacherAssignment(classId);

  const [homeroomFormOpen, setHomeroomFormOpen] = useState(false);
  const [selectedHomeroomTeacherId, setSelectedHomeroomTeacherId] = useState('');
  const [endHomeroomConfirm, setEndHomeroomConfirm] = useState(false);

  const handleAssignClassTeacher = async () => {
    if (!selectedHomeroomTeacherId) return;
    try {
      await assignClassTeacher.mutateAsync(Number(selectedHomeroomTeacherId));
      toast.success(t('classAssignments.toasts.assigned'));
      setHomeroomFormOpen(false);
      setSelectedHomeroomTeacherId('');
    } catch (error) {
      toast.error(error?.response?.data?.message || t('classAssignments.toasts.error'));
    }
  };

  const handleEndClassTeacherAssignment = async () => {
    try {
      await endClassTeacherAssignment.mutateAsync(classTeacher.id);
      toast.success(t('classAssignments.toasts.ended'));
    } catch (error) {
      toast.error(error?.response?.data?.message || t('classAssignments.toasts.error'));
      throw error;
    }
  };

  return (
    <div className="space-y-space-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            {t('classAssignments.subjectTeachersSectionTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-space-4">
          {!subjectTeachersLoading && (!subjectTeachers || subjectTeachers.length === 0) && (
            <EmptyState icon={BookOpen} title={t('classAssignments.subjectTeachersEmpty')} />
          )}

          {subjectTeachers?.map((assignment) => (
            <div key={assignment.id} className="flex items-center justify-between gap-space-2 rounded-md border p-space-3">
              <div className="flex items-center gap-space-2">
                <span className="font-medium">{assignment.subject_name}</span>
                <span className="text-sm text-muted-foreground">
                  {assignment.teacher_first_name} {assignment.teacher_last_name}
                </span>
                <StatusBadge status={assignment.status} />
              </div>
              {canWrite && assignment.status !== 'ENDED' && (
                <Button variant="destructive" size="sm" onClick={() => setEndAssignmentId(assignment.id)}>
                  {t('classAssignments.endButton')}
                </Button>
              )}
            </div>
          ))}

          {canWrite && (
            <div className="flex flex-wrap items-end gap-space-2 border-t pt-space-4">
              <div className="w-48">
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('classAssignments.chooseSubjectPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {(allSubjects ?? []).map((subject) => (
                      <SelectItem key={subject.id} value={String(subject.id)}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <TeacherSelector value={selectedTeacherId} onChange={setSelectedTeacherId} />
              </div>
              <Button
                onClick={handleAssignSubjectTeacher}
                disabled={!selectedSubjectId || !selectedTeacherId || assignSubjectTeacher.isPending}
              >
                {t('classAssignments.assignButton')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Presentation className="h-4 w-4" />
            {t('classAssignments.homeroomSectionTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-space-4">
          {classTeacherLoading ? null : !classTeacher ? (
            <EmptyState
              icon={Presentation}
              title={t('classAssignments.homeroomNotAssigned')}
              action={
                canWrite && (
                  <Button size="sm" onClick={() => setHomeroomFormOpen((open) => !open)}>
                    {t('classAssignments.homeroomAssignButton')}
                  </Button>
                )
              }
            />
          ) : (
            <div className="flex items-center justify-between gap-space-2 rounded-md border p-space-3">
              <div className="flex items-center gap-space-2">
                <span className="font-medium">{teacherNameById.get(classTeacher.teacher_id) || '—'}</span>
                <StatusBadge status={classTeacher.status} />
              </div>
              {canWrite && classTeacher.status !== 'ENDED' && (
                <div className="flex gap-space-2">
                  <Button variant="outline" size="sm" onClick={() => setHomeroomFormOpen((open) => !open)}>
                    {t('classAssignments.homeroomChangeButton')}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setEndHomeroomConfirm(true)}>
                    {t('classAssignments.endButton')}
                  </Button>
                </div>
              )}
            </div>
          )}

          {canWrite && homeroomFormOpen && (
            <div className="flex flex-wrap items-end gap-space-2 border-t pt-space-4">
              <div className="w-48">
                <TeacherSelector value={selectedHomeroomTeacherId} onChange={setSelectedHomeroomTeacherId} />
              </div>
              <Button onClick={handleAssignClassTeacher} disabled={!selectedHomeroomTeacherId || assignClassTeacher.isPending}>
                {t('classAssignments.assignButton')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(endAssignmentId)}
        onOpenChange={(open) => !open && setEndAssignmentId(null)}
        title={t('classAssignments.confirmEnd.title')}
        description={t('classAssignments.confirmEnd.description')}
        confirmLabel={t('classAssignments.endButton')}
        onConfirm={handleEndSubjectTeacherAssignment}
      />

      <ConfirmDialog
        open={endHomeroomConfirm}
        onOpenChange={setEndHomeroomConfirm}
        title={t('classAssignments.confirmEnd.title')}
        description={t('classAssignments.confirmEnd.description')}
        confirmLabel={t('classAssignments.endButton')}
        onConfirm={handleEndClassTeacherAssignment}
      />
    </div>
  );
}

export default ClassTeachersPanel;
