import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { BookOpen } from 'lucide-react';

import { useSubjects } from '@/hooks/classes/useSubjects';
import { useClassSubjects, useAssignSubjectToClass, useRemoveSubjectFromClass } from '@/hooks/classes/useClassSubjects';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/erp/EmptyState';
import { ConfirmDialog } from '@/components/erp/ConfirmDialog';

function ClassSubjectsPanel({ classId, canWrite }) {
  const { t } = useTranslation('classes');

  const { data: assignedSubjects, isLoading } = useClassSubjects(classId);
  const { data: allSubjects } = useSubjects({ status: 'ACTIVE' });
  const assignSubject = useAssignSubjectToClass(classId);
  const removeSubject = useRemoveSubjectFromClass(classId);

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  // Only offer subjects not already assigned — the backend rejects a
  // duplicate assignment outright, so filtering here avoids a pointless
  // round trip for the obvious case.
  const assignedIds = new Set((assignedSubjects ?? []).map((subject) => subject.id));
  const availableSubjects = (allSubjects ?? []).filter((subject) => !assignedIds.has(subject.id));

  const handleAssign = async () => {
    if (!selectedSubjectId) return;
    try {
      await assignSubject.mutateAsync(Number(selectedSubjectId));
      toast.success(t('classSubjects.toasts.assigned'));
      setSelectedSubjectId('');
    } catch (error) {
      toast.error(error?.response?.data?.message || t('classSubjects.toasts.error'));
    }
  };

  const handleRemove = async () => {
    try {
      await removeSubject.mutateAsync(confirmRemoveId);
      toast.success(t('classSubjects.toasts.removed'));
    } catch (error) {
      toast.error(error?.response?.data?.message || t('classSubjects.toasts.error'));
      throw error;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('classSubjects.sectionTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-space-4">
        {!isLoading && (!assignedSubjects || assignedSubjects.length === 0) && (
          <EmptyState icon={BookOpen} title={t('classSubjects.empty')} />
        )}

        {assignedSubjects?.map((subject) => (
          <div key={subject.id} className="flex items-center justify-between gap-space-2 rounded-md border p-space-3">
            <div className="flex items-center gap-space-2">
              <span className="font-medium">{subject.name}</span>
              <Badge variant="outline">{subject.code}</Badge>
              {subject.is_core ? <Badge variant="success">Core</Badge> : null}
            </div>
            {canWrite && (
              <Button variant="destructive" size="sm" onClick={() => setConfirmRemoveId(subject.id)}>
                {t('classSubjects.removeButton')}
              </Button>
            )}
          </div>
        ))}

        {canWrite && (
          <div className="flex items-end gap-space-2 border-t pt-space-4">
            <div className="w-56 space-y-1">
              <p className="text-sm font-medium">{t('classSubjects.assignLabel')}</p>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('classSubjects.assignPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject.id} value={String(subject.id)}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAssign} disabled={!selectedSubjectId || assignSubject.isPending}>
              {t('classSubjects.assignButton')}
            </Button>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={Boolean(confirmRemoveId)}
        onOpenChange={(open) => !open && setConfirmRemoveId(null)}
        title={t('classSubjects.confirmRemove.title')}
        description={t('classSubjects.confirmRemove.description')}
        confirmLabel={t('classSubjects.removeButton')}
        onConfirm={handleRemove}
      />
    </Card>
  );
}

export default ClassSubjectsPanel;
