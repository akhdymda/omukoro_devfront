// 型定義のエクスポート

export type * from './api';
export type * from './auth';

// 共通の型定義
export type TabType = 'ai-consultation' | 'document-analysis' | 'past-cases';

export interface PageProps {
  params?: Record<string, string>;
  searchParams?: Record<string, string>;
}

export interface LayoutProps {
  children: React.ReactNode;
}

// 状態管理用の共通型
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}