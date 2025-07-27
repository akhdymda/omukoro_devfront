import { NextRequest, NextResponse } from 'next/server';
import { getConnection, User } from '@/lib/database';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '@/lib/jwt';
import { ApiResponse } from '@/lib/validation';

// ユーザー情報レスポンスの型定義
export interface UserMeResponse {
  id: number;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

/**
 * 認証されたユーザーの情報を取得するAPI
 * GET /api/user/me
 */
export async function GET(request: NextRequest) {
  let connection;
  
  try {
    // Authorizationヘッダーからトークンを抽出
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader || undefined);
    
    if (!token) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          error: 'missing_token',
          message: '認証トークンが必要です'
        }
      }, { status: 401 });
    }

    // JWTトークンを検証
    let payload: JWTPayload;
    try {
      payload = verifyToken(token);
    } catch (tokenError) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          error: 'invalid_token',
          message: '無効な認証トークンです'
        }
      }, { status: 401 });
    }

    // データベース接続
    connection = await getConnection();
    
    // ユーザー情報を取得（パスワードハッシュは除外）
    const [rows] = await connection.execute(
      'SELECT id, email, role, created_at FROM users WHERE id = ? AND is_active = true',
      [payload.userId]
    );

    const user = (rows as Pick<User, 'id' | 'email' | 'role' | 'created_at'>[])[0] as Pick<User, 'id' | 'email' | 'role' | 'created_at'> | undefined;

    if (!user) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          error: 'user_not_found',
          message: 'ユーザーが見つかりません'
        }
      }, { status: 404 });
    }

    // 操作ログを記録
    try {
      await connection.execute(
        'INSERT INTO operation_logs (user_id, action, timestamp, ip_address, user_agent) VALUES (?, ?, NOW(), ?, ?)',
        [
          user.id,
          'get_user_info',
          getClientIP(request),
          request.headers.get('user-agent') || ''
        ]
      );
    } catch (logError) {
      console.error('Failed to log operation:', logError);
    }

    // レスポンス用にデータをフォーマット
    const response: UserMeResponse = {
      id: user.id,
      email: user.email,
      role: user.role,
      created_at: formatDateForResponse(user.created_at)
    };

    return NextResponse.json<ApiResponse<UserMeResponse>>({
      success: true,
      data: response
    }, { status: 200 });

  } catch (error) {
    console.error('User me API error:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        error: 'internal_server_error',
        message: 'サーバー内部エラーが発生しました'
      }
    }, { status: 500 });
    
  } finally {
    // データベース接続を必ずクローズ
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error('Failed to close database connection:', closeError);
      }
    }
  }
}

/**
 * データベースから取得した日時をレスポンス用にフォーマットする
 * @param date - データベースから取得した日時（文字列またはDate）
 * @returns フォーマットされた日時文字列
 */
function formatDateForResponse(date: string | Date): string {
  if (!date) {
    return '';
  }
  
  // dateStrings: true設定により、MySQLから文字列として取得されるのでそのまま返す
  if (typeof date === 'string') {
    return date;
  }
  
  // フォールバック: Dateオブジェクトの場合（念のため）
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * クライアントのIPアドレスを取得する
 * @param request - NextRequest オブジェクト
 * @returns クライアントのIPアドレス
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddress = request.headers.get('x-remote-address');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (remoteAddress) {
    return remoteAddress;
  }
  
  return 'unknown';
}

/**
 * 許可されていないHTTPメソッドの処理
 */
export async function POST() {
  return NextResponse.json<ApiResponse>({
    success: false,
    error: {
      error: 'method_not_allowed',
      message: 'POST method is not allowed for this endpoint'
    }
  }, { status: 405 });
}