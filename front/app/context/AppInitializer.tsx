'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRole } from './RoleContext';
import axios from 'axios';

export const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const { setUserRole } = useRole();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (session?.user?.email) {
        try {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/roles`, {
            params: { email: session.user.email },
          });
          if (response.data.activeRole) {
            setUserRole(response.data.activeRole);
          }
        } catch (error) {
          console.error("Error fetching user role from database:", error);
        }
      }
    };

    fetchUserRole();
  }, [session, setUserRole]);

  return <>{children}</>;
};
