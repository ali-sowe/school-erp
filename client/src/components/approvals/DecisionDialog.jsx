import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function DecisionDialog({
  open,
  onOpenChange,
  title,
  description,
  fieldLabel,
  fieldRequired,
  requiredError,
  submitLabel,
  destructive,
  isPending,
  onConfirm,
}) {
  const { t } = useTranslation('common');
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);

  const showError = fieldRequired && touched && !value.trim();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (fieldRequired && !value.trim()) return;

    await onConfirm(value.trim());
    setValue('');
    setTouched(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-space-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">{fieldLabel}</p>
            <Textarea value={value} onChange={(event) => setValue(event.target.value)} rows={3} />
            {showError && <p className="text-sm font-medium text-destructive">{requiredError}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              {t('actions.cancel')}
            </Button>
            <Button type="submit" variant={destructive ? 'destructive' : 'default'} disabled={isPending}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default DecisionDialog;
