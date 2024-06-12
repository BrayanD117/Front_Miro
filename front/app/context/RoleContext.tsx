'use client'
import { createContext, useState, useContext, ReactNode, useEffect } from "react";

type RoleContextType = {
  userRole: string;
  setUserRole: (role: string) => void;
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

type RoleProviderProps = {
  children: ReactNode;
};

export const RoleProvider = ({ children }: RoleProviderProps) => {
  const [userRole, setUserRole] = useState<string>(() => {
    return localStorage.getItem('userRole') || 'Usuario';
  });

  useEffect(() => {
    localStorage.setItem('userRole', userRole);
  }, [userRole]);

  return (
    <RoleContext.Provider value={{ userRole, setUserRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
};
