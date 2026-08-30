import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Download, FileSpreadsheet } from 'lucide-react';

import { useAvailableReports } from '@/hooks/reports/useAvailableReports';
import { downloadFile, extractDownloadErrorMessage } from '@/lib/downloadFile';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/erp/EmptyState';

const FORMATS = ['xlsx', 'docx', 'pdf'];

function ReportCard({ report }) {
  const { t } = useTranslation('reports');
  const [format, setFormat] = useState('xlsx');
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadFile(`/reports/${report.key}/download`, {
        params: { format },
        fallbackFilename: `${report.key}.${format}`,
      });
    } catch (error) {
      toast.error(await extractDownloadErrorMessage(error, t('toasts.error')));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSpreadsheet className="h-4 w-4" />
          {report.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-space-2">
        <Select value={format} onValueChange={setFormat}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORMATS.map((value) => (
              <SelectItem key={value} value={value}>
                {value.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={handleDownload} disabled={downloading}>
          <Download className="h-4 w-4" />
          {downloading ? t('common:states.loading', { ns: 'common' }) : t('downloadButton')}
        </Button>
      </CardContent>
    </Card>
  );
}

function ReportsPage() {
  const { t } = useTranslation('reports');
  const { data: reports, isLoading } = useAvailableReports();

  return (
    <div className="space-y-space-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {isLoading && (
        <div className="grid gap-space-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}

      {!isLoading && (reports ?? []).length === 0 && (
        <EmptyState icon={FileSpreadsheet} title={t('empty.title')} description={t('empty.description')} />
      )}

      <div className="grid gap-space-4 sm:grid-cols-2 lg:grid-cols-3">
        {(reports ?? []).map((report) => (
          <ReportCard key={report.key} report={report} />
        ))}
      </div>
    </div>
  );
}

export default ReportsPage;
