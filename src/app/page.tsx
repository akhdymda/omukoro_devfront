'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';
import BeerLoadingAnimation from '@/components/BeerLoadingAnimation';
import Header from '@/components/ui/Header';
import TabMenu from '@/components/ui/TabMenu';
import TabContent from '@/components/ui/TabContent';
import type { TabType } from '@/types';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // クライアントサイドでのマウント前は何も表示しない
  if (!isMounted) {
    return null;
  }

  return <AuthenticatedHome />;
}

function AuthenticatedHome() {
  const { isAuthenticated, isLoading, user, logout, isInitialized } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('document-analysis');

  // 初期化中は何も表示しない（Hydrationエラー回避）
  if (!isInitialized) {
    return null;
  }

  // ローディング中の表示
  if (isLoading) {
    return <BeerLoadingAnimation message="認証確認中..." subMessage="アカウント情報を確認しています" />;
  }

  // 未認証の場合はログインフォームを表示
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // 認証済みの場合はメインアプリケーションを表示
  return (
    <div className="min-h-screen bg-gray-100">
      <Header user={user!} onLogout={logout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TabMenu activeTab={activeTab} onTabChange={setActiveTab} />
        <TabContent activeTab={activeTab} />
      </main>
    </div>
  );
}
