import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getConnection, User } from '@/lib/database';
import { verifyPassword } from '@/lib/password';
import { generateToken } from '@/lib/jwt';
import { 
  loginSchema, 
  LoginResponse, 
  ApiResponse, 
  formatValidationError, 
  getSecureErrorMessage 
} from '@/lib/validation';

/**
 * ログインAPI
 * POST /api/auth/login
 */
export async function POST(request: NextRequest) {
  let connection;
  
  try {
    // リクエストボディの取得
    const body = await request.json();
    
    // バリデーション
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          error: 'validation_error',
          message: 'バリデーションエラーが発生しました',
          details: formatValidationError(validationResult.error)
        }
      }, { status: 400 });
    }

    const { email, password } = validationResult.data;

    // データベース接続
    connection = await getConnection();
    
    // ユーザー検索（omukoroデータベースのuserテーブル用）
    const [rows] = await connection.execute(
      'SELECT user_id, tenant_id, email, password, name, role, is_active FROM user WHERE email = ? AND is_active = true',
      [email]
    );

    const user = (rows as User[])[0] as User | undefined;

    // ユーザーが存在しない場合またはパスワードが一致しない場合
    if (!user || !(await verifyPassword(password, user.password))) {
      // 操作ログを記録（失敗）
      if (connection) {
        try {
          await connection.execute(
            'INSERT INTO operation_logs (user_id, action, timestamp, ip_address, user_agent) VALUES (?, ?, NOW(), ?, ?)',
            [
              user?.user_id || null,
              'login_failed',
              getClientIP(request),
              request.headers.get('user-agent') || ''
            ]
          );
        } catch (logError) {
          console.error('Failed to log operation:', logError);
        }
      }

      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          error: 'authentication_failed',
          message: getSecureErrorMessage()
        }
      }, { status: 401 });
    }

    // JWTトークン生成
    const token = generateToken({
      userId: user.user_id,
      email: user.email,
      role: user.role || 'user'
    });

    // 操作ログを記録（成功）
    try {
      await connection.execute(
        'INSERT INTO operation_logs (user_id, action, timestamp, ip_address, user_agent) VALUES (?, ?, NOW(), ?, ?)',
        [
          user.user_id,
          'login_success',
          getClientIP(request),
          request.headers.get('user-agent') || ''
        ]
      );
    } catch (logError) {
      console.error('Failed to log operation:', logError);
    }

    // 成功レスポンス
    const response: LoginResponse = {
      access_token: token,
      token_type: 'bearer',
      role: user.role || 'user'
    };

    return NextResponse.json<ApiResponse<LoginResponse>>({
      success: true,
      data: response
    }, { status: 200 });

  } catch (error) {
    console.error('Login API error:', error);
    
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
 * クライアントのIPアドレスを取得する
 * @param request - NextRequest オブジェクト
 * @returns クライアントのIPアドレス
 */
function getClientIP(request: NextRequest): string {
  // プロキシ経由の場合の実IPを取得
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