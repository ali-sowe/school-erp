import { useTranslation } from 'react-i18next';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStudents } from '@/hooks/students/useStudents';

// Same plain-Select pattern as ClassSelector/TeacherSelector rather than a
// search-as-you-type combobox — consistent with those, and a combobox
// component doesn't exist in the UI kit yet. Fine for a school's roster
// size; worth revisiting if this ever needs to scale to thousands of rows.
function StudentSelector({ value, onChange, placeholder, disabled, params }) {
  const { t } = useTranslation('common');
  const { data: students, isLoading } = useStudents({ status: 'ACTIVE', ...params });

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || isLoading}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder ?? t('selectors.chooseStudent', { defaultValue: 'Choose a student…' })} />
      </SelectTrigger>
      <SelectContent>
        {(students ?? []).map((student) => (
          <SelectItem key={student.id} value={String(student.id)}>
            {student.first_name} {student.last_name}
            {student.admission_number ? ` (${student.admission_number})` : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { StudentSelector };
