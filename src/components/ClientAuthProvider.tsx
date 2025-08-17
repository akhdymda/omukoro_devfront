'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { MasterDataProvider } from '@/contexts/MasterDataContext';

export function ClientAuthProvider({ children }: { children: React.ReactNode }) {
  // AuthProviderとMasterDataProviderでラップ
  return (
    <AuthProvider>
      <MasterDataProvider>
        {children}
      </MasterDataProvider>
    </AuthProvider>
  );
}