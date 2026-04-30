
'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useUser, useDoc, useFirestore } from '@/firebase';
import { UserProfile } from '@/lib/types';
import { doc } from 'firebase/firestore';

interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, isUserLoading: userLoading } = useUser();
  const db = useFirestore();
  
  const profileRef = useMemo(() => {
    if (!user || !db) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: profile, isLoading: profileLoading } = useDoc<UserProfile>(profileRef);

  const loading = userLoading || (!!user && profileLoading);

  return (
    <AuthContext.Provider value={{ user, profile: profile || null, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
