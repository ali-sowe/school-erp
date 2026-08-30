import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogFooter } from '@/components/ui/dialog';
import { useSubmitLeaveRequest } from '@/hooks/leave-requests/useLeaveRequestMutations';

// leave_type is free text server-side (createLeaveRequestSchema just
// trims/caps it at 50 chars, no enum) — offering a small fixed set here
// keeps entries consistent without the backend actually requiring it;
// 'OTHER' matches the repository's own default when none is given.
const LEAVE_TYPES = ['SICK', 'VACATION', 'PERSONAL', 'OTHER'];

function LeaveRequestForm({ onSaved, onCancel }) {
  const { t } = useTranslation('leave-requests');

  const leaveRequestSchema = z
    .object({
      leave_type: z.string().optional(),
      start_date: z.string().min(1, t('form.errors.startDateRequired')),
      end_date: z.string().min(1, t('form.errors.endDateRequired')),
      reason: z.string().max(1000).optional(),
    })
    .refine((values) => !values.start_date || !values.end_date || values.end_date >= values.start_date, {
      // Mirrors ensureValidDateRange server-side (see leave-request.helper.js)
      // — catching it here saves a round trip for the obvious case, though
      // the backend still re-checks it as the source of truth.
      message: t('form.errors.endDateRequired'),
      path: ['end_date'],
    });

  const form = useForm({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: { leave_type: 'OTHER', start_date: '', end_date: '', reason: '' },
  });

  const submitLeaveRequest = useSubmitLeaveRequest();

  const onSubmit = async (values) => {
    try {
      const saved = await submitLeaveRequest.mutateAsync({
        leave_type: values.leave_type,
        start_date: values.start_date,
        end_date: values.end_date,
        reason: values.reason || undefined,
      });
      toast.success(t('form.toasts.created'));
      onSaved(saved);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('form.toasts.error'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-space-4">
        <FormField
          control={form.control}
          name="leave_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.leaveTypeLabel')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAVE_TYPES.map((leaveType) => (
                      <SelectItem key={leaveType} value={leaveType}>
                        {t(`form.leaveTypes.${leaveType}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-space-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.startDateLabel')}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('form.endDateLabel')}</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.reasonLabel')}</FormLabel>
              <FormControl>
                <Input placeholder={t('form.reasonPlaceholder')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitLeaveRequest.isPending}>
            {t('common:actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" disabled={submitLeaveRequest.isPending}>
            {submitLeaveRequest.isPending ? t('common:states.loading', { ns: 'common' }) : t('common:actions.save', { ns: 'common' })}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default LeaveRequestForm;
