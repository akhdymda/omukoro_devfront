'use client';

import { useState } from 'react';
import type { User } from '@/types';

interface HeaderProps {
  user: User;
  onLogout: () => Promise<void>;
}

export default function Header({ user, onLogout }: HeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
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
              {user.name} ({user.email}) - {user.role === 'admin' ? '管理者' : 'ユーザー'}
            </span>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isLoggingOut
                  ? 'bg-[#5A5552] cursor-not-allowed text-white'
                  : 'bg-[#B34700] hover:bg-[#FB8F44] text-white'
              }`}
            >
              {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}