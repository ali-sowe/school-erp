import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Trust and Accountability doc: irreversible or hard-to-reverse actions
// (archive, withdraw, unlink, void) need an explicit confirmation step that
// states what's about to happen — not a silent click-and-it's-done button.
// One shared dialog for this instead of every panel building its own.
function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, destructive = true, onConfirm, isPending }) {
  const { t } = useTranslation('common');
  const [internalPending, setInternalPending] = useState(false);
  const pending = isPending ?? internalPending;

  const handleConfirm = async () => {
    setInternalPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setInternalPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {t('actions.cancel')}
          </Button>
          <Button type="button" variant={destructive ? 'destructive' : 'default'} onClick={handleConfirm} disabled={pending}>
            {pending ? t('states.loading') : confirmLabel ?? t('actions.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ConfirmDialog };
