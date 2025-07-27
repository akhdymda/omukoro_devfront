import { z } from 'zod';

// ログインリクエストのバリデーションスキーマ
export const loginSchema = z.object({
  email: z
    .string()
    .email('正しいメールアドレスの形式で入力してください')
    .min(1, 'メールアドレスを入力してください'),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, 'パスワードには英字と数字を含めてください'),
});

// ログインレスポンスの型定義
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  role: 'admin' | 'user';
}

// エラーレスポンスの型定義
export interface ErrorResponse {
  error: string;
  message: string;
  details?: string[];
}

// API共通レスポンス型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
}

/**
 * バリデーションエラーをフォーマットする
 * @param error - Zod のバリデーションエラー
 * @returns フォーマットされたエラーメッセージの配列
 */
export function formatValidationError(error: z.ZodError): string[] {
  try {
    return error.issues?.map(issue => issue.message) || ['バリデーションエラーが発生しました'];
  } catch (e) {
    return ['バリデーションエラーが発生しました'];
  }
}

/**
 * セキュアなエラーメッセージを生成する
 * セキュリティ上の理由から、具体的な失敗理由を隠す
 * @returns 一般的なエラーメッセージ
 */
export function getSecureErrorMessage(): string {
  return 'メールアドレス・パスワードのどちらかが間違っています';
}