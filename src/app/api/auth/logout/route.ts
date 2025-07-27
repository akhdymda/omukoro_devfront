import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/database';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '@/lib/jwt';
import { ApiResponse } from '@/lib/validation';

/**
 * ログアウトAPI
 * POST /api/auth/logout
 * 
 * 注意: JWTは基本的にステートレスなので、サーバー側でのトークン無効化は困難です。
 * このAPIは主にログアウト操作をログに記録し、クライアント側でトークンを削除することを想定しています。
 * 本格的なトークン無効化が必要な場合は、Redis等を使用したブラックリスト機能の実装を検討してください。
 */
export async function POST(request: NextRequest) {
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
      // トークンが無効でもログアウト操作は成功とみなす
      return NextResponse.json<ApiResponse>({
        success: true,
        data: {
          message: 'ログアウトしました'
        }
      }, { status: 200 });
    }

    // データベース接続
    connection = await getConnection();
    
    // ユーザーが存在するか確認
    const [rows] = await connection.execute(
      'SELECT id FROM users WHERE id = ? AND is_active = true',
      [payload.userId]
    );

    const user = (rows as {id: number}[])[0];

    if (user) {
      // 操作ログを記録
      try {
        await connection.execute(
          'INSERT INTO operation_logs (user_id, action, timestamp, ip_address, user_agent) VALUES (?, ?, NOW(), ?, ?)',
          [
            user.id,
            'logout',
            getClientIP(request),
            request.headers.get('user-agent') || ''
          ]
        );
      } catch (logError) {
        console.error('Failed to log operation:', logError);
      }
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        message: 'ログアウトしました'
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Logout API error:', error);
    
    // ログアウトはエラーが発生しても成功とみなす（ユーザー体験を優先）
    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        message: 'ログアウトしました'
      }
    }, { status: 200 });
    
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
export async function GET() {
  return NextResponse.json<ApiResponse>({
    success: false,
    error: {
      error: 'method_not_allowed',
      message: 'GET method is not allowed for this endpoint'
    }
  }, { status: 405 });
}