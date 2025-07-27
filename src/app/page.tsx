'use client';

import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';
import FileUploadSystem from '@/components/FileUploadSystem';
import BeerLoadingAnimation from '@/components/BeerLoadingAnimation';

export default function Home() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

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
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                酒税法リスク分析判定システム
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.email} ({user?.role === 'admin' ? '管理者' : 'ユーザー'})
              </span>
              <button
                onClick={logout}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main>
        <FileUploadSystem />
      </main>
    </div>
  );
}
