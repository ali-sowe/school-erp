import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useReturnBook } from '@/hooks/library/useBorrowRecords';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function ReturnBookForm({ borrowRecordId, open, onOpenChange, onSaved }) {
  const { t } = useTranslation('library');
  const returnBook = useReturnBook();

  const [condition, setCondition] = useState('GOOD');
  const [returnedDate, setReturnedDate] = useState(todayIso());
  const [remarks, setRemarks] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await returnBook.mutateAsync({ borrowRecordId, condition, returned_date: returnedDate, remarks: remarks || undefined });
      toast.success(t('borrow.toasts.returned'));
      setCondition('GOOD');
      setReturnedDate(todayIso());
      setRemarks('');
      onSaved();
    } catch (error) {
      toast.error(error?.response?.data?.message || t('borrow.toasts.error'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('borrow.returnForm.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-space-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">{t('borrow.returnForm.conditionLabel')}</p>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GOOD">{t('borrow.returnForm.conditionGood')}</SelectItem>
                <SelectItem value="DAMAGED">{t('borrow.returnForm.conditionDamaged')}</SelectItem>
                <SelectItem value="LOST">{t('borrow.returnForm.conditionLost')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">{t('borrow.returnForm.returnedDateLabel')}</p>
            <Input type="date" value={returnedDate} onChange={(event) => setReturnedDate(event.target.value)} />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">{t('borrow.returnForm.remarksLabel')}</p>
            <Textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={returnBook.isPending}>
              {t('common:actions.cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" disabled={returnBook.isPending}>
              {returnBook.isPending ? t('common:states.loading', { ns: 'common' }) : t('borrow.returnForm.submitButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default ReturnBookForm;
