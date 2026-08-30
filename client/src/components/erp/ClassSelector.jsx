import { useTranslation } from 'react-i18next';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClasses } from '@/hooks/shared/useClasses';

// UI Patterns doc names ClassSelector explicitly as a reusable ERP
// component. value/onChange are plain strings (Radix Select works with
// string values) — callers coerce to number when sending to the API.
// `params` passes straight through to useClasses (e.g. { status: 'ACTIVE' }
// for contexts — like Attendance — where only active classes are valid).
function ClassSelector({ value, onChange, placeholder, disabled, params }) {
  const { t } = useTranslation('common');
  const { data: classes, isLoading } = useClasses(params);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder ?? t('selectors.chooseClass', { defaultValue: 'Choose a class…' })} />
      </SelectTrigger>
      <SelectContent>
        {(classes ?? []).map((classItem) => (
          <SelectItem key={classItem.id} value={String(classItem.id)}>
            {classItem.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { ClassSelector };
