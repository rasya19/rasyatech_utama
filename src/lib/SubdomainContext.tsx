import React, { createContext, useContext, useEffect, useState } from 'react';

const SubdomainContext = createContext<string | null>(null);

export const SubdomainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    
    // Main domain identification based on user's rasyatech.rsch.my.id setup
    let isMain = parts[0] === 'rasyatech' || parts[0] === 'www' || parts.length < 3;

    // If we are in the Google Cloud Run preview environment (ends with .run.app) or localhost,
    // we default to main domain behavior (subdomain = null) so the user can preview the main app.
    if (hostname.endsWith('.run.app') || hostname === 'localhost' || hostname === '127.0.0.1') {
      isMain = true;
    }

    if (!isMain) {
      setSubdomain(parts[0]);
    } else {
      setSubdomain(null); // Main domain behavior
    }
  }, []);

  return (
    <SubdomainContext.Provider value={subdomain}>
      {children}
    </SubdomainContext.Provider>
  );
};

export const useSubdomain = () => useContext(SubdomainContext);
