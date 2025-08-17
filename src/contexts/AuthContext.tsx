'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthState, AuthActions } from '@/types/auth';

export interface AuthContextType extends AuthState, AuthActions {}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const isAuthenticated = !!user;

  // マウント状態を管理
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 初期化時にローカルストレージからトークンを確認
  useEffect(() => {
    if (!isMounted) return;
    
    const initializeAuth = async () => {
      
      // キャッシュされたユーザー情報を復元
      const cachedUser = localStorage.getItem('cached_user');
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
      }
      
      const token = localStorage.getItem('access_token');
      
      if (token) {
        try {
          const response = await fetch('/api/user/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setUser(data.data);
              localStorage.setItem('cached_user', JSON.stringify(data.data));
            } else {
              localStorage.removeItem('access_token');
              localStorage.removeItem('cached_user');
              setUser(null);
            }
          } else {
            localStorage.removeItem('access_token');
            localStorage.removeItem('cached_user');
            setUser(null);
          }
        } catch (error) {
          console.error('認証の初期化に失敗しました:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('cached_user');
          setUser(null);
        }
      } else {
        // トークンがない場合はキャッシュもクリア
        localStorage.removeItem('cached_user');
        setUser(null);
      }
      
      setIsInitialized(true);
    };

    initializeAuth();
  }, [isMounted]);

  const login = async (credentials: { email: string; password: string }) => {
    const { email, password } = credentials;
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const { access_token } = data.data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', access_token);
        }

        // ユーザー情報を取得
        const userResponse = await fetch('/api/user/me', {
          headers: {
            'Authorization': `Bearer ${access_token}`,
          },
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.success) {
            setUser(userData.data);
            if (typeof window !== 'undefined') {
              localStorage.setItem('cached_user', JSON.stringify(userData.data));
            }
          }
        }
      } else {
        throw new Error(data.error?.message || 'ログインに失敗しました');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        
        if (token) {
          await fetch('/api/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
        }
      }
    } catch (error) {
      console.error('ログアウト処理でエラーが発生しました:', error);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('cached_user');
      }
      setUser(null);
      setError(null);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/user/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUser(data.data);
          localStorage.setItem('cached_user', JSON.stringify(data.data));
        }
      }
    } catch (error) {
      console.error('ユーザー情報の更新に失敗しました:', error);
      setError('ユーザー情報の更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isInitialized,
        error,
        login,
        logout,
        clearError,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // 開発環境でのみエラーを表示し、本番環境では安全なデフォルト値を返す
    if (process.env.NODE_ENV === 'development') {
      console.error('useAuth must be used within an AuthProvider');
    }
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      isInitialized: false,
      error: null,
      login: async () => { throw new Error('AuthProvider not initialized'); },
      logout: async () => { throw new Error('AuthProvider not initialized'); },
      clearError: () => { throw new Error('AuthProvider not initialized'); },
      refreshUser: async () => { throw new Error('AuthProvider not initialized'); },
    };
  }
  return context;
}