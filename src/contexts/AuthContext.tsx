'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: number;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const isAuthenticated = !!user;

  // 初期化時にローカルストレージからトークンを確認
  useEffect(() => {
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
  }, []);

  const login = async (email: string, password: string) => {
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
        localStorage.setItem('access_token', access_token);

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
            localStorage.setItem('cached_user', JSON.stringify(userData.data));
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
      const token = localStorage.getItem('access_token');
      
      if (token) {
        await fetch('/api/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('ログアウト処理でエラーが発生しました:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('cached_user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isAuthenticated,
        isInitialized,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}