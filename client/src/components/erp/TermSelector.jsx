import { useTranslation } from 'react-i18next';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTerms } from '@/hooks/shared/useTerms';

// Narrowed to one academic year via `academicYearId` when the caller
// already knows it (e.g. ExamForm resolves the active year first) — same
// reasoning as ClassSelector accepting `params` to narrow its own list.
function TermSelector({ value, onChange, academicYearId, placeholder, disabled }) {
  const { t } = useTranslation('common');
  const { data: terms, isLoading } = useTerms(academicYearId);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder ?? t('selectors.chooseTerm')} />
      </SelectTrigger>
      <SelectContent>
        {(terms ?? []).map((term) => (
          <SelectItem key={term.id} value={String(term.id)}>
            {term.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { TermSelector };
