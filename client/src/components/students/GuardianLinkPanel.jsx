import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Users } from 'lucide-react';

import { useStudentGuardians, useLinkGuardian, useUnlinkGuardian, searchGuardians } from '@/hooks/students/useStudentGuardians';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/erp/EmptyState';
import { ConfirmDialog } from '@/components/erp/ConfirmDialog';
import GuardianForm from '@/components/guardians/GuardianForm';

function GuardianLinkPanel({ studentId, canWrite }) {
  const { t } = useTranslation('students');

  const { data: guardians, isLoading } = useStudentGuardians(studentId);
  const linkGuardian = useLinkGuardian(studentId);
  const unlinkGuardian = useUnlinkGuardian(studentId);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedGuardianId, setSelectedGuardianId] = useState('');
  const [relationship, setRelationship] = useState('');
  const [isPrimaryContact, setIsPrimaryContact] = useState(false);
  const [showNewGuardianForm, setShowNewGuardianForm] = useState(false);
  const [confirmUnlinkId, setConfirmUnlinkId] = useState(null);

  const handleSearch = async (event) => {
    event.preventDefault();
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await searchGuardians(searchTerm);
      setSearchResults(results);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('guardians.toasts.error'));
    }
  };

  const linkGuardianById = async (guardianId) => {
    if (!guardianId || !relationship) {
      toast.error(t('guardians.toasts.selectionRequired'));
      return;
    }
    try {
      await linkGuardian.mutateAsync({ guardianId, relationship, isPrimaryContact });
      toast.success(t('guardians.toasts.linked'));
      setSearchTerm('');
      setSearchResults([]);
      setSelectedGuardianId('');
      setRelationship('');
      setIsPrimaryContact(false);
      setShowNewGuardianForm(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('guardians.toasts.error'));
    }
  };

  const handleNewGuardianSaved = (guardian) => linkGuardianById(guardian.id);

  const handleUnlink = async () => {
    try {
      await unlinkGuardian.mutateAsync(confirmUnlinkId);
      toast.success(t('guardians.toasts.unlinked'));
    } catch (error) {
      toast.error(error?.response?.data?.message || t('guardians.toasts.error'));
      throw error;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('guardians.sectionTitle')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-space-4">
        {!isLoading && (!guardians || guardians.length === 0) && <EmptyState icon={Users} title={t('guardians.empty')} />}

        {guardians?.map((guardian) => (
          <div key={guardian.id} className="flex items-center justify-between gap-space-2 rounded-md border p-space-3">
            <div>
              <Link to="/guardians" className="font-medium text-primary hover:underline">
                {guardian.first_name} {guardian.last_name}
              </Link>
              {guardian.is_primary_contact && <Badge variant="success" className="ml-space-2">{t('guardians.primaryContactBadge')}</Badge>}
              <p className="text-sm text-muted-foreground">
                {guardian.relationship} · {guardian.phone || '—'}
              </p>
            </div>
            {canWrite && (
              <Button variant="destructive" size="sm" onClick={() => setConfirmUnlinkId(guardian.id)}>
                {t('guardians.unlinkButton')}
              </Button>
            )}
          </div>
        ))}

        {canWrite && (
          <div className="space-y-space-3 rounded-md border border-dashed p-space-4">
            <form onSubmit={handleSearch} className="flex gap-space-2">
              <Input
                placeholder={t('guardians.searchPlaceholder')}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
              <Button type="submit" variant="outline">{t('guardians.searchButton')}</Button>
            </form>

            {searchResults.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">{t('guardians.selectGuardianLabel')}</p>
                <Select value={selectedGuardianId} onValueChange={setSelectedGuardianId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('guardians.selectGuardianPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {searchResults.map((guardian) => (
                      <SelectItem key={guardian.id} value={String(guardian.id)}>
                        {guardian.first_name} {guardian.last_name} ({guardian.phone || guardian.email || 'no contact info'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-sm font-medium">{t('guardians.relationshipLabel')}</p>
              <Input
                placeholder={t('guardians.relationshipPlaceholder')}
                value={relationship}
                onChange={(event) => setRelationship(event.target.value)}
              />
            </div>

            {/* Plain checkbox input rather than a shadcn Checkbox primitive —
                @radix-ui/react-checkbox isn't an installed dependency yet,
                and adding one for this single boolean isn't worth it. */}
            <label className="flex items-center gap-space-2 text-sm">
              <input
                type="checkbox"
                checked={isPrimaryContact}
                onChange={(event) => setIsPrimaryContact(event.target.checked)}
                className="h-4 w-4 rounded-sm border-input"
              />
              {t('guardians.primaryContactLabel')}
            </label>

            <div className="flex flex-wrap gap-space-2">
              <Button
                type="button"
                onClick={() => linkGuardianById(selectedGuardianId)}
                disabled={linkGuardian.isPending || !selectedGuardianId}
              >
                {t('guardians.linkSelectedButton')}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowNewGuardianForm((current) => !current)}>
                {showNewGuardianForm ? t('guardians.cancelNewButton') : t('guardians.addNewInsteadButton')}
              </Button>
            </div>

            {/* GuardianForm was migrated to the new stack along with the
                rest of the Guardians module — reused here as-is. */}
            {showNewGuardianForm && (
              <div className="rounded-md border p-space-3">
                <GuardianForm onSaved={handleNewGuardianSaved} onCancel={() => setShowNewGuardianForm(false)} />
              </div>
            )}
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={Boolean(confirmUnlinkId)}
        onOpenChange={(open) => !open && setConfirmUnlinkId(null)}
        title={t('guardians.confirmUnlink.title')}
        description={t('guardians.confirmUnlink.description')}
        confirmLabel={t('guardians.unlinkButton')}
        onConfirm={handleUnlink}
      />
    </Card>
  );
}

export default GuardianLinkPanel;
