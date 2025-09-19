'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useHealthcareStore } from '@/app/stores/healthcareStore';

interface AuthProviderProps {
  readonly children: ReactNode;
  readonly session?: Session | null;
}

function SessionUserBridge() {
  const { data } = useSession();
  const setCurrentUser = useHealthcareStore(state => state.setCurrentUser);

  useEffect(() => {
    setCurrentUser(data?.user?.id ?? null);
    return () => {
      setCurrentUser(null);
    };
  }, [data?.user?.id, setCurrentUser]);

  return null;
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <SessionUserBridge />
      {children}
    </SessionProvider>
  );
}

export default AuthProvider;
