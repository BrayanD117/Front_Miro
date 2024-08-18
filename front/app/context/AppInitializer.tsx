'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRole } from './RoleContext';
import axios from 'axios';
import LoadingScreen from '../components/LoadingScreen';

export const AppInitializer = ({ children }: { children: React.ReactNode }) => {
  const { data: session, status } = useSession();
  const { setUserRole } = useRole();
  const [isRoleLoaded, setIsRoleLoaded] = useState(false);

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
        } finally {
          setIsRoleLoaded(true);
        }
      } else {
        setIsRoleLoaded(true);
      }
    };

    if (status !== "loading") {
      fetchUserRole();
    }
  }, [session, setUserRole, status]);

  if (!isRoleLoaded) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
};
