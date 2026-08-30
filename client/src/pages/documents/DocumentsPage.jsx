import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, FileText, Search, Download, Eye, RotateCcw } from 'lucide-react';

import { useDocuments, useSearchDocuments } from '@/hooks/documents/useDocuments';
import {
  useUploadDocument,
  useUpdateDocument,
  useArchiveDocument,
  useRestoreDocument,
  useReprocessDocument,
} from '@/hooks/documents/useDocumentMutations';
import { downloadFile, extractDownloadErrorMessage } from '@/lib/downloadFile';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/erp/DataTable';
import { EmptyState } from '@/components/erp/EmptyState';
import { StatusBadge } from '@/components/erp/StatusBadge';

const SUGGESTED_CATEGORIES = ['LETTER', 'CIRCULAR', 'POLICY', 'MEETING_MINUTES', 'CERTIFICATE', 'DATA_IMPORT', 'OTHER'];

function UploadDialog({ open, onOpenChange }) {
  const { t } = useTranslation('documents');
  const uploadDocument = useUploadDocument();

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});

  const handleClose = (nextOpen) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setFile(null);
      setTitle('');
      setCategory('');
      setDescription('');
      setErrors({});
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!file) nextErrors.file = t('uploadDialog.errors.fileRequired');
    if (!title.trim()) nextErrors.title = t('uploadDialog.errors.titleRequired');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await uploadDocument.mutateAsync({ file, title: title.trim(), category: category || undefined, description: description || undefined });
      toast.success(t('uploadDialog.toastSuccess'));
      handleClose(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('uploadDialog.toastError'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('uploadDialog.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-space-4">
          <div className="space-y-space-2">
            <label className="text-sm font-medium">{t('uploadDialog.fileLabel')}</label>
            <Input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            {errors.file && <p className="text-sm text-destructive">{errors.file}</p>}
          </div>
          <div className="space-y-space-2">
            <label className="text-sm font-medium">{t('uploadDialog.titleLabel')}</label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>
          <div className="space-y-space-2">
            <label className="text-sm font-medium">{t('uploadDialog.categoryLabel')}</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder={t('uploadDialog.categoryPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {SUGGESTED_CATEGORIES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`categories.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-space-2">
            <label className="text-sm font-medium">{t('uploadDialog.descriptionLabel')}</label>
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              {t('common:actions.cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" disabled={uploadDocument.isPending}>
              {uploadDocument.isPending ? t('common:states.loading', { ns: 'common' }) : t('uploadDialog.submitButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditDocumentDialog({ document, open, onOpenChange }) {
  const { t } = useTranslation('documents');
  const updateDocument = useUpdateDocument(document?.id);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});

  // Prefill whenever the dialog opens for a (possibly different) document —
  // same reset-on-open pattern as AnnouncementFormDialog.
  useEffect(() => {
    if (!open) return;
    setTitle(document?.title || '');
    setCategory(document?.category || '');
    setDescription(document?.description || '');
    setErrors({});
  }, [document, open]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!title.trim()) nextErrors.title = t('editDialog.errors.titleRequired');
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      await updateDocument.mutateAsync({
        title: title.trim(),
        category: category || undefined,
        description: description || undefined,
      });
      toast.success(t('editDialog.toastSuccess'));
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('editDialog.toastError'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('editDialog.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-space-4">
          <div className="space-y-space-2">
            <label className="text-sm font-medium">{t('editDialog.titleLabel')}</label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>
          <div className="space-y-space-2">
            <label className="text-sm font-medium">{t('editDialog.categoryLabel')}</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder={t('editDialog.categoryPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {SUGGESTED_CATEGORIES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`categories.${value}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-space-2">
            <label className="text-sm font-medium">{t('editDialog.descriptionLabel')}</label>
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common:actions.cancel', { ns: 'common' })}
            </Button>
            <Button type="submit" disabled={updateDocument.isPending}>
              {updateDocument.isPending ? t('common:states.loading', { ns: 'common' }) : t('common:actions.save', { ns: 'common' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DocumentsPage() {
  const { t } = useTranslation('documents');
  const [search, setSearch] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);

  const isSearching = Boolean(search.trim());
  const { data: listDocuments, isLoading: listLoading } = useDocuments();
  const { data: searchResults, isLoading: searchLoading } = useSearchDocuments(search);
  const documents = isSearching ? searchResults : listDocuments;
  const isLoading = isSearching ? searchLoading : listLoading;

  const archiveDocument = useArchiveDocument();
  const restoreDocument = useRestoreDocument();
  const reprocessDocument = useReprocessDocument();
  const [editingDocument, setEditingDocument] = useState(null);

  const handleArchiveToggle = async (document) => {
    try {
      if (document.status === 'ARCHIVED') {
        await restoreDocument.mutateAsync(document.id);
        toast.success(t('toasts.restored'));
      } else {
        await archiveDocument.mutateAsync(document.id);
        toast.success(t('toasts.archived'));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || t('toasts.error'));
    }
  };

  const handleReprocess = async (document) => {
    try {
      await reprocessDocument.mutateAsync(document.id);
      toast.success(t('toasts.reprocessTriggered'));
    } catch (error) {
      toast.error(error?.response?.data?.message || t('toasts.error'));
    }
  };

  const handleDownload = async (document, action) => {
    try {
      await downloadFile(`/documents/${document.id}/${action}`, { fallbackFilename: document.original_filename || document.title });
    } catch (error) {
      toast.error(await extractDownloadErrorMessage(error, t('toasts.error')));
    }
  };

  const columns = useMemo(
    () => [
      { accessorKey: 'title', header: t('table.title') },
      {
        accessorKey: 'category',
        header: t('table.category'),
        cell: ({ row }) => t(`categories.${row.original.category}`, { defaultValue: row.original.category }),
      },
      { accessorKey: 'kind', header: t('table.kind'), cell: ({ row }) => t(`kinds.${row.original.kind}`) },
      {
        accessorKey: 'status',
        header: t('table.status'),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'processing',
        header: t('table.processing'),
        cell: ({ row }) => {
          const failed = row.original.preview_status === 'FAILED' || row.original.text_extraction_status === 'FAILED';
          if (!failed) return '—';
          return (
            <Button variant="outline" size="sm" onClick={() => handleReprocess(row.original)}>
              <RotateCcw className="h-3 w-3" />
              {t('table.retryButton')}
            </Button>
          );
        },
      },
      {
        id: 'actions',
        header: t('table.actions'),
        cell: ({ row }) => (
          <div className="flex gap-space-2">
            <Button variant="outline" size="sm" onClick={() => handleDownload(row.original, 'preview')}>
              <Eye className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDownload(row.original, 'download')}>
              <Download className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditingDocument(row.original)}>
              {t('common:actions.edit', { ns: 'common' })}
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleArchiveToggle(row.original)}>
              {row.original.status === 'ARCHIVED'
                ? t('common:actions.restore', { ns: 'common' })
                : t('common:actions.archive', { ns: 'common' })}
            </Button>
          </div>
        ),
      },
    ],
    [t]
  );

  return (
    <div className="space-y-space-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <Plus className="h-4 w-4" />
          {t('uploadButton')}
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder={t('searchPlaceholder')} value={search} onChange={(event) => setSearch(event.target.value)} />
      </div>

      <DataTable
        columns={columns}
        data={documents}
        isLoading={isLoading}
        emptyState={<EmptyState icon={FileText} title={t('empty.title')} description={t('empty.description')} />}
      />

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <EditDocumentDialog
        document={editingDocument}
        open={Boolean(editingDocument)}
        onOpenChange={(open) => {
          if (!open) setEditingDocument(null);
        }}
      />
    </div>
  );
}

export default DocumentsPage;
