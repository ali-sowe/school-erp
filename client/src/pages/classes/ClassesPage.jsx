import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { BookOpen, GraduationCap, Plus, School } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';
import { useGradeLevels, useArchiveGradeLevel, useRestoreGradeLevel } from '@/hooks/classes/useGradeLevels';
import { useSubjects, useArchiveSubject, useRestoreSubject } from '@/hooks/classes/useSubjects';
import { useClasses } from '@/hooks/shared/useClasses';
import { useArchiveClass, useRestoreClass } from '@/hooks/classes/useClassMutations';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/erp/DataTable';
import { EmptyState } from '@/components/erp/EmptyState';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { ConfirmDialog } from '@/components/erp/ConfirmDialog';
import GradeLevelForm from '@/components/classes/GradeLevelForm';
import SubjectForm from '@/components/classes/SubjectForm';
import ClassForm from '@/components/classes/ClassForm';

function ClassesPage() {
  const { t } = useTranslation('classes');
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('classes.write');
  const canWriteGradeLevels = hasPermission('grade-levels.write');
  const canWriteSubjects = hasPermission('subjects.write');

  // --- Grade Levels ---
  const { data: gradeLevels, isLoading: gradeLevelsLoading } = useGradeLevels();
  const archiveGradeLevel = useArchiveGradeLevel();
  const restoreGradeLevel = useRestoreGradeLevel();
  const [gradeLevelFormOpen, setGradeLevelFormOpen] = useState(false);
  const [activeGradeLevel, setActiveGradeLevel] = useState(null);
  const [gradeLevelConfirm, setGradeLevelConfirm] = useState(null); // { id, action }

  const gradeLevelColumns = useMemo(
    () => [
      { accessorKey: 'name', header: t('gradeLevels.columns.name') },
      { accessorKey: 'education_level', header: t('gradeLevels.columns.educationLevel') },
      { accessorKey: 'sequence_order', header: t('gradeLevels.columns.sequence') },
      { accessorKey: 'status', header: t('gradeLevels.columns.status'), cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      ...(canWriteGradeLevels
        ? [
            {
              id: 'actions',
              header: t('gradeLevels.columns.actions'),
              cell: ({ row }) => (
                <div className="flex gap-space-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveGradeLevel(row.original);
                      setGradeLevelFormOpen(true);
                    }}
                  >
                    {t('common:actions.edit', { ns: 'common' })}
                  </Button>
                  {row.original.status === 'ARCHIVED' ? (
                    <Button variant="outline" size="sm" onClick={() => setGradeLevelConfirm({ id: row.original.id, action: 'restore' })}>
                      {t('common:actions.restore', { ns: 'common' })}
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setGradeLevelConfirm({ id: row.original.id, action: 'archive' })}>
                      {t('common:actions.archive', { ns: 'common' })}
                    </Button>
                  )}
                </div>
              ),
            },
          ]
        : []),
    ],
    [t, canWriteGradeLevels]
  );

  const handleGradeLevelConfirm = async () => {
    try {
      if (gradeLevelConfirm.action === 'archive') {
        await archiveGradeLevel.mutateAsync(gradeLevelConfirm.id);
      } else {
        await restoreGradeLevel.mutateAsync(gradeLevelConfirm.id);
      }
      toast.success(gradeLevelConfirm.action === 'archive' ? t('gradeLevels.toasts.archived') : t('gradeLevels.toasts.restored'));
    } catch {
      toast.error(t('gradeLevels.toasts.error'));
    }
  };

  // --- Subjects ---
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const archiveSubject = useArchiveSubject();
  const restoreSubject = useRestoreSubject();
  const [subjectFormOpen, setSubjectFormOpen] = useState(false);
  const [activeSubject, setActiveSubject] = useState(null);
  const [subjectConfirm, setSubjectConfirm] = useState(null);

  const subjectColumns = useMemo(
    () => [
      { accessorKey: 'name', header: t('subjects.columns.name') },
      { accessorKey: 'code', header: t('subjects.columns.code') },
      {
        accessorKey: 'is_core',
        header: t('subjects.columns.core'),
        cell: ({ row }) => (row.original.is_core ? t('subjects.coreYes') : t('subjects.coreNo')),
      },
      { accessorKey: 'status', header: t('subjects.columns.status'), cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      ...(canWriteSubjects
        ? [
            {
              id: 'actions',
              header: t('subjects.columns.actions'),
              cell: ({ row }) => (
                <div className="flex gap-space-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveSubject(row.original);
                      setSubjectFormOpen(true);
                    }}
                  >
                    {t('common:actions.edit', { ns: 'common' })}
                  </Button>
                  {row.original.status === 'ARCHIVED' ? (
                    <Button variant="outline" size="sm" onClick={() => setSubjectConfirm({ id: row.original.id, action: 'restore' })}>
                      {t('common:actions.restore', { ns: 'common' })}
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setSubjectConfirm({ id: row.original.id, action: 'archive' })}>
                      {t('common:actions.archive', { ns: 'common' })}
                    </Button>
                  )}
                </div>
              ),
            },
          ]
        : []),
    ],
    [t, canWriteSubjects]
  );

  const handleSubjectConfirm = async () => {
    try {
      if (subjectConfirm.action === 'archive') {
        await archiveSubject.mutateAsync(subjectConfirm.id);
      } else {
        await restoreSubject.mutateAsync(subjectConfirm.id);
      }
      toast.success(subjectConfirm.action === 'archive' ? t('subjects.toasts.archived') : t('subjects.toasts.restored'));
    } catch {
      toast.error(t('subjects.toasts.error'));
    }
  };

  // --- Classes ---
  const { data: classes, isLoading: classesLoading } = useClasses();
  const archiveClass = useArchiveClass();
  const restoreClass = useRestoreClass();
  const [classFormOpen, setClassFormOpen] = useState(false);
  const [classConfirm, setClassConfirm] = useState(null);

  const gradeLevelNameById = useMemo(() => {
    const map = new Map();
    (gradeLevels ?? []).forEach((gradeLevel) => map.set(gradeLevel.id, gradeLevel.name));
    return map;
  }, [gradeLevels]);

  const classColumns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: t('classes.columns.name'),
        cell: ({ row }) => (
          <Link to={`/classes/${row.original.id}`} className="font-medium text-primary hover:underline">
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: 'grade_level_id',
        header: t('classes.columns.gradeLevel'),
        cell: ({ row }) => gradeLevelNameById.get(row.original.grade_level_id) || '—',
      },
      { accessorKey: 'capacity', header: t('classes.columns.capacity'), cell: ({ row }) => row.original.capacity ?? '—' },
      { accessorKey: 'status', header: t('classes.columns.status'), cell: ({ row }) => <StatusBadge status={row.original.status} /> },
      ...(canWrite
        ? [
            {
              id: 'actions',
              header: t('classes.columns.actions'),
              cell: ({ row }) =>
                row.original.status === 'ARCHIVED' ? (
                  <Button variant="outline" size="sm" onClick={() => setClassConfirm({ id: row.original.id, action: 'restore' })}>
                    {t('common:actions.restore', { ns: 'common' })}
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setClassConfirm({ id: row.original.id, action: 'archive' })}>
                    {t('common:actions.archive', { ns: 'common' })}
                  </Button>
                ),
            },
          ]
        : []),
    ],
    [t, canWrite, gradeLevelNameById]
  );

  const handleClassConfirm = async () => {
    try {
      if (classConfirm.action === 'archive') {
        await archiveClass.mutateAsync(classConfirm.id);
      } else {
        await restoreClass.mutateAsync(classConfirm.id);
      }
      toast.success(classConfirm.action === 'archive' ? t('classes.toasts.archived') : t('classes.toasts.restored'));
    } catch {
      toast.error(t('classes.toasts.error'));
    }
  };

  return (
    <div className="space-y-space-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('page.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('page.subtitle')}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <GraduationCap className="h-4 w-4" />
            {t('gradeLevels.sectionTitle')}
          </CardTitle>
          {canWriteGradeLevels && (
            <Button
              size="sm"
              onClick={() => {
                setActiveGradeLevel(null);
                setGradeLevelFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('gradeLevels.addButton')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <DataTable
            columns={gradeLevelColumns}
            data={gradeLevels}
            isLoading={gradeLevelsLoading}
            emptyState={<EmptyState icon={GraduationCap} title={t('gradeLevels.empty.title')} description={t('gradeLevels.empty.description')} />}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            {t('subjects.sectionTitle')}
          </CardTitle>
          {canWriteSubjects && (
            <Button
              size="sm"
              onClick={() => {
                setActiveSubject(null);
                setSubjectFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t('subjects.addButton')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <DataTable
            columns={subjectColumns}
            data={subjects}
            isLoading={subjectsLoading}
            emptyState={<EmptyState icon={BookOpen} title={t('subjects.empty.title')} description={t('subjects.empty.description')} />}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <School className="h-4 w-4" />
            {t('classes.sectionTitle')}
          </CardTitle>
          {canWrite && (
            <Button size="sm" onClick={() => setClassFormOpen(true)}>
              <Plus className="h-4 w-4" />
              {t('classes.addButton')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <DataTable
            columns={classColumns}
            data={classes}
            isLoading={classesLoading}
            emptyState={<EmptyState icon={School} title={t('classes.empty.title')} description={t('classes.empty.description')} />}
          />
        </CardContent>
      </Card>

      <Dialog open={gradeLevelFormOpen} onOpenChange={setGradeLevelFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeGradeLevel ? t('gradeLevels.form.editTitle') : t('gradeLevels.form.createTitle')}</DialogTitle>
          </DialogHeader>
          <GradeLevelForm gradeLevel={activeGradeLevel} onSaved={() => setGradeLevelFormOpen(false)} onCancel={() => setGradeLevelFormOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={subjectFormOpen} onOpenChange={setSubjectFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeSubject ? t('subjects.form.editTitle') : t('subjects.form.createTitle')}</DialogTitle>
          </DialogHeader>
          <SubjectForm subject={activeSubject} onSaved={() => setSubjectFormOpen(false)} onCancel={() => setSubjectFormOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={classFormOpen} onOpenChange={setClassFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('classes.form.createTitle')}</DialogTitle>
          </DialogHeader>
          <ClassForm onSaved={() => setClassFormOpen(false)} onCancel={() => setClassFormOpen(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(gradeLevelConfirm)}
        onOpenChange={(open) => !open && setGradeLevelConfirm(null)}
        title={gradeLevelConfirm?.action === 'archive' ? t('gradeLevels.confirmArchive.title') : t('gradeLevels.confirmRestore.title')}
        description={gradeLevelConfirm?.action === 'archive' ? t('gradeLevels.confirmArchive.description') : t('gradeLevels.confirmRestore.description')}
        destructive={gradeLevelConfirm?.action === 'archive'}
        onConfirm={handleGradeLevelConfirm}
      />

      <ConfirmDialog
        open={Boolean(subjectConfirm)}
        onOpenChange={(open) => !open && setSubjectConfirm(null)}
        title={subjectConfirm?.action === 'archive' ? t('subjects.confirmArchive.title') : t('subjects.confirmRestore.title')}
        description={subjectConfirm?.action === 'archive' ? t('subjects.confirmArchive.description') : t('subjects.confirmRestore.description')}
        destructive={subjectConfirm?.action === 'archive'}
        onConfirm={handleSubjectConfirm}
      />

      <ConfirmDialog
        open={Boolean(classConfirm)}
        onOpenChange={(open) => !open && setClassConfirm(null)}
        title={classConfirm?.action === 'archive' ? t('classes.confirmArchive.title') : t('classes.confirmRestore.title')}
        description={classConfirm?.action === 'archive' ? t('classes.confirmArchive.description') : t('classes.confirmRestore.description')}
        destructive={classConfirm?.action === 'archive'}
        onConfirm={handleClassConfirm}
      />
    </div>
  );
}

export default ClassesPage;
