import React, { createContext, useContext, useState, useEffect } from 'react';

const CompanyContext = createContext();

export const CompanyProvider = ({ children }) => {
  // Initialize with priority: LocalStorage > Env Var > Default Test ID
  const [activeCompanyId, setActiveCompanyId] = useState(() => {
    return localStorage.getItem('activeCompanyId') || 
           import.meta.env.VITE_DEFAULT_COMPANY_ID || 
           'company_test_001';
  });

  const [activeCompanyName, setActiveCompanyName] = useState(() => {
    return localStorage.getItem('activeCompanyName') || 'Loading...';
  });

  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('activeCompanyId', activeCompanyId);
  }, [activeCompanyId]);

  useEffect(() => {
    localStorage.setItem('activeCompanyName', activeCompanyName);
  }, [activeCompanyName]);

  // Load company details from Firestore when ID changes
  useEffect(() => {
    if (!activeCompanyId || activeCompanyId === 'company_test_001' || activeCompanyId === 'company_test_002') {
      if (activeCompanyId === 'company_test_001') setActiveCompanyName('Gym Pro Fitness (Mocked)');
      if (activeCompanyId === 'company_test_002') setActiveCompanyName('Yoga Bliss Studio (Mocked)');
      return;
    }

    const fetchCompanyName = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase/config');
        const docSnap = await getDoc(doc(db, 'companies', activeCompanyId));
        if (docSnap.exists()) {
          setActiveCompanyName(docSnap.data().name);
        } else {
          setActiveCompanyName('Unknown Company');
        }
      } catch (err) {
        console.error("Error fetching company name:", err);
      }
    };

    fetchCompanyName();
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
