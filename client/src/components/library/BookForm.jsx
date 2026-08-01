import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { DialogFooter } from '@/components/ui/dialog';
import { useCreateBook, useUpdateBook } from '@/hooks/library/useBooks';

function BookForm({ book, onSaved, onCancel }) {
  const { t } = useTranslation('library');
  const isEdit = Boolean(book?.id);

  const bookSchema = z.object({
    title: z.string().min(1, t('books.form.errors.titleRequired')).max(255),
    author: z.string().max(150).optional(),
    isbn: z.string().max(20).optional(),
    category: z.string().max(100).optional(),
    publisher: z.string().max(150).optional(),
    description: z.string().max(5000).optional(),
  });

  const form = useForm({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: book?.title || '',
      author: book?.author || '',
      isbn: book?.isbn || '',
      category: book?.category || '',
      publisher: book?.publisher || '',
      description: book?.description || '',
    },
  });

  const createBook = useCreateBook();
  const updateBook = useUpdateBook(book?.id);
  const submitting = createBook.isPending || updateBook.isPending;

  const onSubmit = async (values) => {
    const payload = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''));

    try {
      const saved = isEdit ? await updateBook.mutateAsync(payload) : await createBook.mutateAsync(payload);
      toast.success(isEdit ? t('books.form.toasts.updated') : t('books.form.toasts.created'));
      onSaved(saved);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('books.form.toasts.error'));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-space-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('books.form.titleLabel')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-space-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('books.form.authorLabel')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isbn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('books.form.isbnLabel')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-space-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('books.form.categoryLabel')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="publisher"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('books.form.publisherLabel')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('books.form.descriptionLabel')}</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            {t('common:actions.cancel', { ns: 'common' })}
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? t('common:states.loading', { ns: 'common' }) : t('common:actions.save', { ns: 'common' })}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default BookForm;
