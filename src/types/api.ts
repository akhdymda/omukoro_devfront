// バックエンドAPI統合のための統一型定義

// 新しいバックエンドAPIレスポンス形式に対応
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error?: {
    error_code: string;
    message: string;
    details?: unknown;
  } | null;
}

// マスタデータの型定義
export interface Industry {
  category_id: string;
  category_code: string;
  category_name: string;
  description?: string;
  is_default: number;
  sort_order: number;
}

export interface AlcoholType {
  type_id: string;
  type_code: string;
  type_name: string;
  description?: string;
  is_default: number;
  sort_order: number;
}

// フロントエンド用に変換されたマスタデータ
export interface MasterDataItem {
  id: string;
  name: string;
  description?: string;
}

// 相談関連の型定義
export interface Consultation {
  id: string;
  title: string;
  content: string;
  industry_id?: string;
  alcohol_type_id?: string;
  status: 'pending' | 'analyzed' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface ConsultationSearchParams {
  keyword?: string;
  industry_id?: string;
  alcohol_type_id?: string;
  limit?: number;
  offset?: number;
}

export interface ConsultationSuggestion {
  suggestion: string;
  reasoning: string;
  confidence: number;
}

// 分析関連の型定義
export interface AnalysisRequest {
  text: string;
  industry_id?: string;
  alcohol_type_id?: string;
}

export interface AnalysisResult {
  score: number;
  analysis: string;
  recommendations: string[];
  risk_level: 'low' | 'medium' | 'high';
}

export interface ExtractTextResult {
  text: string;
  confidence: number;
  pages?: number;
}

// エラー処理用
export interface ApiError {
  error_code: string;
  message: string;
  details?: unknown;
}

// 共通のHTTPメソッド型
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// リクエスト設定
export interface RequestConfig {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}