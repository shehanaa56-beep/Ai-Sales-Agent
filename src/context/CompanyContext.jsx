import React, { createContext, useContext, useState, useEffect } from 'react';

const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
  // Initialize with the default test company ID
  const [activeCompanyId, setActiveCompanyId] = useState(() => {
    return localStorage.getItem('activeCompanyId') || 'company_test_001';
  });

  const [activeCompanyName, setActiveCompanyName] = useState('Default Company');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    localStorage.setItem('activeCompanyId', activeCompanyId);
  }, [activeCompanyId]);

  return (
    <CompanyContext.Provider value={{ 
      activeCompanyId, 
      setActiveCompanyId,
      activeCompanyName,
      setActiveCompanyName,
      selectedCustomer,
      setSelectedCustomer
    }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
