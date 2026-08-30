import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ArrowLeft, Check } from 'lucide-react';

import {
  useChildAttendance,
  useChildExamResults,
  useChildInvoices,
  useChildLibraryBorrows,
  useChildAnnouncements,
  useMarkChildAnnouncementRead,
} from '@/hooks/portal/useParentPortal';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/erp/EmptyState';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { cn } from '@/lib/utils';

const SECTIONS = ['attendance', 'grades', 'invoices', 'library', 'announcements'];

// amount_due/amount_paid are DECIMAL columns (strings over the wire) — same
// Number()-before-formatting care as FinancePage/ExpensesPage's formatAmount.
function formatAmount(amount) {
  return Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function AttendanceSection({ studentId }) {
  const { t } = useTranslation('portal');
  const { data: records, isLoading } = useChildAttendance(studentId);

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!records || records.length === 0) return <EmptyState title={t('student.attendance.empty')} />;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="py-space-2 font-medium">{t('student.attendance.dateHeader')}</th>
          <th className="py-space-2 font-medium">{t('student.attendance.statusHeader')}</th>
          <th className="py-space-2 font-medium">{t('student.attendance.remarksHeader')}</th>
        </tr>
      </thead>
      <tbody>
        {records.map((record) => (
          <tr key={record.id} className="border-b last:border-0">
            <td className="py-space-2">{record.attendance_date?.slice(0, 10)}</td>
            <td className="py-space-2">
              <StatusBadge status={record.status} />
            </td>
            <td className="py-space-2 text-muted-foreground">{record.remarks || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function GradesSection({ studentId }) {
  const { t } = useTranslation('portal');
  const { data: results, isLoading } = useChildExamResults(studentId);

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!results || results.length === 0) return <EmptyState title={t('student.grades.empty')} />;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="py-space-2 font-medium">{t('student.grades.examHeader')}</th>
          <th className="py-space-2 font-medium">{t('student.grades.subjectHeader')}</th>
          <th className="py-space-2 text-right font-medium">{t('student.grades.scoreHeader')}</th>
          <th className="py-space-2 font-medium">{t('student.grades.remarksHeader')}</th>
        </tr>
      </thead>
      <tbody>
        {results.map((result) => (
          <tr key={result.id} className="border-b last:border-0">
            <td className="py-space-2">
              {result.exam_name}
              <span className="ml-space-2 text-xs text-muted-foreground">{result.exam_type}</span>
            </td>
            <td className="py-space-2">{result.subject_name}</td>
            <td className="py-space-2 text-right">
              {result.score} / {result.max_score}
            </td>
            <td className="py-space-2 text-muted-foreground">{result.remarks || '—'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function InvoicesSection({ studentId }) {
  const { t } = useTranslation('portal');
  const { data: invoices, isLoading } = useChildInvoices(studentId);

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!invoices || invoices.length === 0) return <EmptyState title={t('parent.invoices.empty')} />;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="py-space-2 font-medium">{t('parent.invoices.descriptionHeader')}</th>
          <th className="py-space-2 font-medium">{t('parent.invoices.dueDateHeader')}</th>
          <th className="py-space-2 text-right font-medium">{t('parent.invoices.amountDueHeader')}</th>
          <th className="py-space-2 text-right font-medium">{t('parent.invoices.amountPaidHeader')}</th>
          <th className="py-space-2 font-medium">{t('parent.invoices.statusHeader')}</th>
        </tr>
      </thead>
      <tbody>
        {invoices.map((invoice) => (
          <tr key={invoice.id} className="border-b last:border-0">
            <td className="py-space-2">{invoice.description}</td>
            <td className="py-space-2">{invoice.due_date?.slice(0, 10) || '—'}</td>
            <td className="py-space-2 text-right">{formatAmount(invoice.amount_due)}</td>
            <td className="py-space-2 text-right">{formatAmount(invoice.amount_paid)}</td>
            <td className="py-space-2">
              <StatusBadge status={invoice.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LibrarySection({ studentId }) {
  const { t } = useTranslation('portal');
  const { data: borrows, isLoading } = useChildLibraryBorrows(studentId);

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!borrows || borrows.length === 0) return <EmptyState title={t('student.library.empty')} />;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="py-space-2 font-medium">{t('student.library.bookHeader')}</th>
          <th className="py-space-2 font-medium">{t('student.library.borrowedHeader')}</th>
          <th className="py-space-2 font-medium">{t('student.library.dueHeader')}</th>
          <th className="py-space-2 font-medium">{t('student.library.statusHeader')}</th>
        </tr>
      </thead>
      <tbody>
        {borrows.map((borrow) => (
          <tr key={borrow.id} className="border-b last:border-0">
            <td className="py-space-2">
              <p className="font-medium">{borrow.book_title}</p>
              <p className="text-xs text-muted-foreground">{borrow.book_author}</p>
            </td>
            <td className="py-space-2">{borrow.borrowed_date?.slice(0, 10)}</td>
            <td className="py-space-2">{borrow.due_date?.slice(0, 10)}</td>
            <td className="py-space-2">
              {borrow.is_overdue ? (
                <span className="font-medium text-destructive">{t('student.library.overdue')}</span>
              ) : (
                <StatusBadge status={borrow.status} />
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ChildAnnouncementCard({ announcement }) {
  const { t } = useTranslation('portal');
  const markRead = useMarkChildAnnouncementRead(announcement.id);

  const handleMarkRead = async () => {
    try {
      await markRead.mutateAsync();
      toast.success(t('student.announcements.markedRead'));
    } catch (error) {
      toast.error(error?.response?.data?.message || t('common:states.errorDescription', { ns: 'common' }));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">{announcement.title}</CardTitle>
          <p className="text-xs text-muted-foreground">{announcement.created_at?.slice(0, 10)}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleMarkRead} disabled={markRead.isPending}>
          <Check className="h-3.5 w-3.5" />
          {t('student.announcements.readButton')}
        </Button>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm">{announcement.body}</p>
      </CardContent>
    </Card>
  );
}

function AnnouncementsSection({ studentId }) {
  const { t } = useTranslation('portal');
  const { data: announcements, isLoading } = useChildAnnouncements(studentId);

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!announcements || announcements.length === 0) return <EmptyState title={t('student.announcements.empty')} />;

  return (
    <div className="space-y-space-3">
      {announcements.map((announcement) => (
        <ChildAnnouncementCard key={announcement.id} announcement={announcement} />
      ))}
    </div>
  );
}

function ParentChildDetailPage() {
  const { t } = useTranslation('portal');
  const { studentId } = useParams();
  const [activeSection, setActiveSection] = useState('attendance');

  return (
    <div className="space-y-space-4">
      <Button variant="ghost" size="sm" asChild className="-ml-space-2">
        <Link to="/portal/parent">
          <ArrowLeft className="h-4 w-4" />
          {t('parent.backToChildren')}
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-space-2">
            {SECTIONS.map((section) => (
              <button
                key={section}
                type="button"
                onClick={() => setActiveSection(section)}
                className={cn(
                  'rounded-md px-space-3 py-space-2 text-sm font-medium transition-colors',
                  activeSection === section ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                )}
              >
                {t(`parent.tabs.${section}`)}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {activeSection === 'attendance' && <AttendanceSection studentId={studentId} />}
          {activeSection === 'grades' && <GradesSection studentId={studentId} />}
          {activeSection === 'invoices' && <InvoicesSection studentId={studentId} />}
          {activeSection === 'library' && <LibrarySection studentId={studentId} />}
          {activeSection === 'announcements' && <AnnouncementsSection studentId={studentId} />}
        </CardContent>
      </Card>
    </div>
  );
}

export default ParentChildDetailPage;
