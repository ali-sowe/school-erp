import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Receipt, Wallet } from 'lucide-react';

import { useFeeStructures } from '@/hooks/finance/useFeeStructures';
import { useArchiveFeeStructure, useRestoreFeeStructure } from '@/hooks/finance/useFeeStructureMutations';
import { useInvoices } from '@/hooks/finance/useInvoices';
import { useCreateInvoice } from '@/hooks/finance/useInvoiceMutations';
import { useStudents } from '@/hooks/students/useStudents';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/erp/DataTable';
import { EmptyState } from '@/components/erp/EmptyState';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { StudentSelector } from '@/components/erp/StudentSelector';
import FeeStructureForm from '@/components/finance/FeeStructureForm';

function formatAmount(amount) {
  // amount is a string (DECIMAL column) — Number() before formatting, same
  // string-vs-number care as ExamResultsPanel's score handling.
  return Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function FinancePage() {
  const { t } = useTranslation('finance');
  const navigate = useNavigate();

  const { data: feeStructures, isLoading: feeStructuresLoading } = useFeeStructures();
  const archiveFeeStructure = useArchiveFeeStructure();
  const restoreFeeStructure = useRestoreFeeStructure();

  const { data: invoices, isLoading: invoicesLoading } = useInvoices();
  const createInvoice = useCreateInvoice();

  // Invoices only carry a raw student_id (SELECT * FROM invoices, no join —
  // see invoice.repository.js's findAll), so the name has to be resolved
  // client-side, same id-to-name mapping pattern as AdminDashboard's
  // role_id -> role_name.
  const { data: students } = useStudents({ status: 'ACTIVE' });
  const studentNameById = useMemo(() => {
    const map = new Map();
    (students ?? []).forEach((student) => map.set(student.id, `${student.first_name} ${student.last_name}`));
    return map;
  }, [students]);

  const [feeStructureFormOpen, setFeeStructureFormOpen] = useState(false);
  const [activeFeeStructure, setActiveFeeStructure] = useState(null);

  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [invoiceStudentId, setInvoiceStudentId] = useState('');
  const [invoiceFeeStructureId, setInvoiceFeeStructureId] = useState('');

  const handleArchiveToggle = async (feeStructure) => {
    try {
      if (feeStructure.status === 'ARCHIVED') {
        await restoreFeeStructure.mutateAsync(feeStructure.id);
        toast.success(t('feeStructures.toasts.restored'));
      } else {
        await archiveFeeStructure.mutateAsync(feeStructure.id);
        toast.success(t('feeStructures.toasts.archived'));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || t('feeStructures.toasts.error'));
    }
  };

  const feeStructureColumns = useMemo(
    () => [
      { accessorKey: 'name', header: t('feeStructures.table.name') },
      {
        accessorKey: 'amount',
        header: t('feeStructures.table.amount'),
        cell: ({ row }) => formatAmount(row.original.amount),
      },
      {
        accessorKey: 'status',
        header: t('feeStructures.table.status'),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: t('feeStructures.table.actions'),
        cell: ({ row }) => (
          <div className="flex gap-space-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveFeeStructure(row.original);
                setFeeStructureFormOpen(true);
              }}
            >
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

  const invoiceColumns = useMemo(
    () => [
      {
        id: 'student',
        header: t('invoices.table.student'),
        cell: ({ row }) => studentNameById.get(row.original.student_id) || '—',
      },
      { accessorKey: 'description', header: t('invoices.table.description') },
      {
        accessorKey: 'amount_due',
        header: t('invoices.table.amountDue'),
        cell: ({ row }) => formatAmount(row.original.amount_due),
      },
      {
        accessorKey: 'amount_paid',
        header: t('invoices.table.amountPaid'),
        cell: ({ row }) => formatAmount(row.original.amount_paid),
      },
      {
        accessorKey: 'status',
        header: t('invoices.table.status'),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        header: t('invoices.table.actions'),
        cell: ({ row }) => (
          <Button variant="outline" size="sm" onClick={() => navigate(`/finance/invoices/${row.original.id}`)}>
            {t('invoices.table.viewButton')}
          </Button>
        ),
      },
    ],
    [t, navigate, studentNameById]
  );

  const handleCreateInvoice = async (event) => {
    event.preventDefault();
    if (!invoiceStudentId || !invoiceFeeStructureId) return;

    try {
      const invoice = await createInvoice.mutateAsync({
        student_id: Number(invoiceStudentId),
        fee_structure_id: Number(invoiceFeeStructureId),
        academic_year_id: feeStructures.find((fs) => fs.id === Number(invoiceFeeStructureId))?.academic_year_id,
      });
      toast.success(t('invoices.toasts.created'));
      setInvoiceDialogOpen(false);
      setInvoiceStudentId('');
      setInvoiceFeeStructureId('');
      navigate(`/finance/invoices/${invoice.id}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || t('invoices.toasts.error'));
    }
  };

  return (
    <div className="space-y-space-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4" />
            {t('feeStructures.sectionTitle')}
          </CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setActiveFeeStructure(null);
              setFeeStructureFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            {t('feeStructures.addButton')}
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={feeStructureColumns}
            data={feeStructures}
            isLoading={feeStructuresLoading}
            emptyState={
              <EmptyState icon={Wallet} title={t('feeStructures.empty.title')} description={t('feeStructures.empty.description')} />
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4" />
            {t('invoices.sectionTitle')}
          </CardTitle>
          <Button size="sm" onClick={() => setInvoiceDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            {t('invoices.addButton')}
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={invoiceColumns}
            data={invoices}
            isLoading={invoicesLoading}
            emptyState={<EmptyState icon={Receipt} title={t('invoices.empty.title')} description={t('invoices.empty.description')} />}
          />
        </CardContent>
      </Card>

      <Dialog open={feeStructureFormOpen} onOpenChange={setFeeStructureFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {activeFeeStructure ? t('feeStructures.form.editTitle') : t('feeStructures.form.createTitle')}
            </DialogTitle>
          </DialogHeader>
          <FeeStructureForm
            feeStructure={activeFeeStructure}
            onSaved={() => setFeeStructureFormOpen(false)}
            onCancel={() => setFeeStructureFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('invoices.form.createTitle')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateInvoice} className="space-y-space-4">
            <div className="space-y-space-2">
              <label className="text-sm font-medium">{t('invoices.form.studentLabel')}</label>
              <StudentSelector value={invoiceStudentId} onChange={setInvoiceStudentId} />
            </div>
            <div className="space-y-space-2">
              <label className="text-sm font-medium">{t('invoices.form.feeStructureLabel')}</label>
              <Select value={invoiceFeeStructureId} onValueChange={setInvoiceFeeStructureId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('invoices.form.feeStructurePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {(feeStructures ?? [])
                    .filter((fs) => fs.status === 'ACTIVE')
                    .map((fs) => (
                      <SelectItem key={fs.id} value={String(fs.id)}>
                        {fs.name} ({formatAmount(fs.amount)})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInvoiceDialogOpen(false)}>
                {t('common:actions.cancel', { ns: 'common' })}
              </Button>
              <Button type="submit" disabled={createInvoice.isPending}>
                {createInvoice.isPending ? t('common:states.loading', { ns: 'common' }) : t('common:actions.save', { ns: 'common' })}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FinancePage;
