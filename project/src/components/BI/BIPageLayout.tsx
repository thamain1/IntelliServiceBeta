import { ReactNode } from 'react';
import { ExportMenu } from './ExportMenu';
import { ExportData } from '../../services/ExportService';

interface BIPageLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  getExportData?: () => ExportData | null;
  exportEnabled?: boolean;
}

export function BIPageLayout({
  title,
  subtitle,
  children,
  getExportData,
  exportEnabled = false,
}: BIPageLayoutProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>
        </div>
        <ExportMenu
          getExportData={getExportData || (() => null)}
          disabled={!exportEnabled || !getExportData}
        />
      </div>
      {children}
    </div>
  );
}
