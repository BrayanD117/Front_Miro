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
    if (typeof window !== "undefined") {
      return localStorage.getItem('userRole') || 'Usuario';
    }
    return 'Usuario';
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem('userRole', userRole);
    }
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
