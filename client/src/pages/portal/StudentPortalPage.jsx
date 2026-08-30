import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Check } from 'lucide-react';

import {
  useMyStudentProfile,
  useMyAttendance,
  useMyExamResults,
  useMyLibraryBorrows,
  useMyStudentAnnouncements,
  useMarkMyAnnouncementRead,
} from '@/hooks/portal/useStudentPortal';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/erp/EmptyState';
import { StatusBadge } from '@/components/erp/StatusBadge';
import { cn } from '@/lib/utils';

const SECTIONS = ['attendance', 'grades', 'library', 'announcements'];

function AttendanceSection() {
  const { t } = useTranslation('portal');
  const { data: records, isLoading } = useMyAttendance();

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!records || records.length === 0) {
    return <EmptyState title={t('student.attendance.empty')} />;
  }

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

function GradesSection() {
  const { t } = useTranslation('portal');
  const { data: results, isLoading } = useMyExamResults();

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!results || results.length === 0) {
    return <EmptyState title={t('student.grades.empty')} />;
  }

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

function LibrarySection() {
  const { t } = useTranslation('portal');
  const { data: borrows, isLoading } = useMyLibraryBorrows();

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!borrows || borrows.length === 0) {
    return <EmptyState title={t('student.library.empty')} />;
  }

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

function AnnouncementCard({ announcement }) {
  const { t } = useTranslation('portal');
  const markRead = useMarkMyAnnouncementRead(announcement.id);

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

function AnnouncementsSection() {
  const { t } = useTranslation('portal');
  const { data: announcements, isLoading } = useMyStudentAnnouncements();

  if (isLoading) return <Skeleton className="h-40 w-full" />;
  if (!announcements || announcements.length === 0) {
    return <EmptyState title={t('student.announcements.empty')} />;
  }

  return (
    <div className="space-y-space-3">
      {announcements.map((announcement) => (
        <AnnouncementCard key={announcement.id} announcement={announcement} />
      ))}
    </div>
  );
}

function StudentPortalPage() {
  const { t } = useTranslation('portal');
  const { data: student, isLoading: profileLoading } = useMyStudentProfile();
  const [activeSection, setActiveSection] = useState('attendance');

  if (profileLoading) {
    return (
      <div className="space-y-space-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-space-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('student.greeting', { name: student?.first_name })}
        </h1>
        <p className="text-sm text-muted-foreground">{t('student.subtitle')}</p>
      </div>

      <Card>
        <CardContent className="grid gap-space-4 pt-space-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">{t('student.profile.admissionNumber')}</p>
            <p className="font-medium">{student?.admission_number || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('student.profile.status')}</p>
            <StatusBadge status={student?.status} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('student.profile.admissionDate')}</p>
            <p className="font-medium">{student?.admission_date?.slice(0, 10) || '—'}</p>
          </div>
        </CardContent>
      </Card>

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
                {t(`student.tabs.${section}`)}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {activeSection === 'attendance' && <AttendanceSection />}
          {activeSection === 'grades' && <GradesSection />}
          {activeSection === 'library' && <LibrarySection />}
          {activeSection === 'announcements' && <AnnouncementsSection />}
        </CardContent>
      </Card>
    </div>
  );
}

export default StudentPortalPage;
