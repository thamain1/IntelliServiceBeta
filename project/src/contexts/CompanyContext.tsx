import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface CompanyContextValue {
  companyName: string;
  companyLogoUrl: string;
  refresh: () => void;
}

const CompanyContext = createContext<CompanyContextValue>({
  companyName: 'IntelliService',
  companyLogoUrl: '',
  refresh: () => {},
});

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companyName, setCompanyName] = useState('IntelliService');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('accounting_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['company_name', 'company_logo_url']);
    data?.forEach((row) => {
      if (row.setting_key === 'company_name' && row.setting_value)
        setCompanyName(row.setting_value);
      if (row.setting_key === 'company_logo_url' && row.setting_value)
        setCompanyLogoUrl(row.setting_value);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    document.title = companyName;
  }, [companyName]);

  return (
    <CompanyContext.Provider value={{ companyName, companyLogoUrl, refresh: load }}>
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => useContext(CompanyContext);
