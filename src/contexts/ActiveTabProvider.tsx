import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ActiveTabType = 'notes' | 'plan';

interface ActiveTabContextType {
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
}

const ActiveTabContext = createContext<ActiveTabContextType | undefined>(undefined);

export const useActiveTab = () => {
  const context = useContext(ActiveTabContext);
  if (!context) {
    throw new Error('useActiveTab must be used within an ActiveTabProvider');
  }
  return context;
};

interface ActiveTabProviderProps {
  children: ReactNode;
}

export const ActiveTabProvider: React.FC<ActiveTabProviderProps> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTabType>('notes');

  return (
    <ActiveTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </ActiveTabContext.Provider>
  );
};
