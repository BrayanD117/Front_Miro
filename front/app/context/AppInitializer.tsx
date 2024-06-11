'use client'
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRole } from './RoleContext';

export const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const { setUserRole } = useRole();

  useEffect(() => {
    if (session?.user?.role) {
      setUserRole(session.user.role);
    }
  }, [session, setUserRole]);

  return <>{children}</>;
};
