import { useTranslation } from 'react-i18next';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAcademicYears } from '@/hooks/shared/useAcademicYears';

function AcademicYearSelector({ value, onChange, placeholder, disabled }) {
  const { t } = useTranslation('common');
  const { data: academicYears, isLoading } = useAcademicYears();

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder ?? t('selectors.useActiveYear', { defaultValue: 'Use the active academic year' })} />
      </SelectTrigger>
      <SelectContent>
        {(academicYears ?? []).map((year) => (
          <SelectItem key={year.id} value={String(year.id)}>
            {year.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { AcademicYearSelector };
