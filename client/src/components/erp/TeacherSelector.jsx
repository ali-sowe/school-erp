import { useTranslation } from 'react-i18next';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTeachers } from '@/hooks/teachers/useTeachers';

// UI Patterns doc names TeacherSelector explicitly as a reusable ERP
// component, same shape as ClassSelector — value/onChange are plain
// strings (Radix Select), callers coerce to number for the API. Defaults
// to active teachers only, since assigning a class/subject to an archived
// teacher wouldn't make sense — callers can override via `params`.
function TeacherSelector({ value, onChange, placeholder, disabled, params = { status: 'ACTIVE' } }) {
  const { t } = useTranslation('common');
  const { data: teachers, isLoading } = useTeachers(params);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder ?? t('selectors.chooseTeacher')} />
      </SelectTrigger>
      <SelectContent>
        {(teachers ?? []).map((teacher) => (
          <SelectItem key={teacher.id} value={String(teacher.id)}>
            {teacher.first_name} {teacher.last_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { TeacherSelector };
