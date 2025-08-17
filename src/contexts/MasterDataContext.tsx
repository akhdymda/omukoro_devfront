'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { masterDataApi } from '@/lib/api';
import type { MasterDataItem } from '@/types';

interface MasterDataContextType {
  industries: MasterDataItem[];
  alcoholTypes: MasterDataItem[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

const MasterDataContext = createContext<MasterDataContextType | undefined>(undefined);

export function MasterDataProvider({ children }: { children: React.ReactNode }) {
  const [industries, setIndustries] = useState<MasterDataItem[]>([]);
  const [alcoholTypes, setAlcoholTypes] = useState<MasterDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMasterData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [industriesData, alcoholTypesData] = await Promise.all([
        masterDataApi.getIndustries(),
        masterDataApi.getAlcoholTypes(),
      ]);
      
      setIndustries(industriesData);
      setAlcoholTypes(alcoholTypesData);
    } catch (err) {
      console.error('マスタデータの取得に失敗しました:', err);
      setError(err instanceof Error ? err.message : 'マスタデータの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  const refreshData = async () => {
    await loadMasterData();
  };

  return (
    <MasterDataContext.Provider
      value={{
        industries,
        alcoholTypes,
        isLoading,
        error,
        refreshData,
      }}
    >
      {children}
    </MasterDataContext.Provider>
  );
}

export function useMasterData() {
  const context = useContext(MasterDataContext);
  if (context === undefined) {
    throw new Error('useMasterData must be used within a MasterDataProvider');
  }
  return context;
}