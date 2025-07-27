'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BeerLoadingAnimation from '@/components/BeerLoadingAnimation';
import { Mail, Lock, Shield } from 'lucide-react';

interface FormData {
  email: string;
  password: string;
}

interface ValidationErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginForm() {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // フォームが有効かどうかをチェック
  const isFormValid = formData.email.trim() !== '' && formData.password !== '';

  // バリデーション関数
  const validateForm = (): ValidationErrors => {
    const newErrors: ValidationErrors = {};

    // メールアドレスのバリデーション
    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '正しいメールアドレスの形式で入力してください';
    }

    // パスワードのバリデーション
    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください';
    } else if (formData.password.length < 8) {
      newErrors.password = 'パスワードは8文字以上で入力してください';
    } else if (!/^(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'パスワードには英字と数字を含めてください';
    }

    return newErrors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // 入力時にエラーをクリア
    if (errors[name as keyof ValidationErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション実行
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await login(formData.email, formData.password);
    } catch (error) {
      // セキュリティ上の理由で一般的なエラーメッセージを表示
      setErrors({
        general: 'メールアドレス・パスワードのどちらかが間違っています',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isSubmitting && (
        <BeerLoadingAnimation 
          message="ログイン中..." 
          subMessage="認証情報を確認しています" 
        />
      )}
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full">
          {/* メインカード */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            {/* ヘッダー部分 */}
            <div className="text-center mb-8">
              {/* ロゴアイコン */}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#B34700] rounded-2xl mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Legal Knowledge System
              </h1>
              <p className="text-sm text-gray-600 mb-8">
                社内機密情報管理システム
              </p>
              
              {/* セキュアログインセクション */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-center mb-2">
                  <Lock className="w-5 h-5 text-[#B34700] mr-2" />
                  <h2 className="text-lg font-semibold text-gray-800">セキュアログイン</h2>
                </div>
                <p className="text-sm text-gray-600">
                  認証情報を入力してシステムにアクセスしてください
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* メールアドレス */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={`block w-full pl-10 pr-3 py-3 border ${
                      errors.email ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#B34700] focus:border-[#B34700]'
                    } placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm transition-colors`}
                    placeholder="メールアドレスを入力してください"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isSubmitting || isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* パスワード */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  パスワード
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className={`block w-full pl-10 pr-3 py-3 border ${
                      errors.password ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-[#B34700] focus:border-[#B34700]'
                    } placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm transition-colors`}
                    placeholder="パスワードを入力してください"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isSubmitting || isLoading}
                  />
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* エラーメッセージ */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{errors.general}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ログインボタン */}
              <button
                type="submit"
                disabled={isSubmitting || isLoading || !isFormValid}
                className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white transition-colors ${
                  isFormValid && !isSubmitting && !isLoading
                    ? 'bg-[#B34700] hover:bg-[#FB8F44] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B34700]'
                    : 'bg-[#5A5552] cursor-not-allowed'
                }`}
              >
                <Lock className="w-4 h-4 mr-2" />
                ログイン
              </button>

              {/* セキュリティ通知 */}
              <div className="text-center pt-4">
                <div className="flex items-center justify-center text-xs text-gray-500">
                  <Shield className="w-3 h-3 mr-1" />
                  このシステムは暗号化により保護されています
                </div>
              </div>
            </form>
          </div>

          {/* フッター */}
          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">
              © 2024 Company Legal Department. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}