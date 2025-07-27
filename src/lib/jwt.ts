import * as jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: number;
  email: string;
  role: 'admin' | 'user';
  iat?: number;
  exp?: number;
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

// TypeScript用に型アサーション（undefinedでないことを保証）
const jwtSecret: string = JWT_SECRET;
const jwtExpiresIn: string = JWT_EXPIRES_IN;

/**
 * JWTトークンを生成する
 * @param payload - トークンに含めるペイロード
 * @returns JWT トークン文字列
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, jwtSecret, {
    expiresIn: jwtExpiresIn,
    algorithm: 'HS256'
  } as jwt.SignOptions);
}

/**
 * JWTトークンを検証してペイロードを取得する
 * @param token - JWT トークン文字列
 * @returns 検証されたペイロード
 * @throws トークンが無効な場合はエラー
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256']
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
}

/**
 * リクエストヘッダーからBearerトークンを抽出する
 * @param authHeader - Authorization ヘッダーの値
 * @returns 抽出されたトークン文字列 または null
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * トークンの有効期限を確認する
 * @param token - JWT トークン文字列
 * @returns トークンが有効かどうか
 */
export function isTokenValid(token: string): boolean {
  try {
    verifyToken(token);
    return true;
  } catch {
    return false;
  }
}