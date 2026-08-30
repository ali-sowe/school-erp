import { useTranslation } from 'react-i18next';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGradeLevels } from '@/hooks/classes/useGradeLevels';

function GradeLevelSelector({ value, onChange, placeholder, disabled, params }) {
  const { t } = useTranslation('classes');
  const { data: gradeLevels, isLoading } = useGradeLevels(params);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder ?? t('classes.form.gradeLevelLabel')} />
      </SelectTrigger>
      <SelectContent>
        {(gradeLevels ?? []).map((gradeLevel) => (
          <SelectItem key={gradeLevel.id} value={String(gradeLevel.id)}>
            {gradeLevel.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { GradeLevelSelector };
