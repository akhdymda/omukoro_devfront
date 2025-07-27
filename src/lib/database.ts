import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '3306', 10),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  timezone: '+09:00', // 日本時間を明示的に設定
  dateStrings: true,  // 日時を文字列として取得（タイムゾーン変換を避ける）
};

// 接続設定の検証
if (!dbConfig.host || !dbConfig.user || !dbConfig.password || !dbConfig.database) {
  throw new Error('Database configuration is incomplete. Please check your environment variables.');
}

/**
 * データベース接続を取得する
 * @returns MySQL接続オブジェクト
 */
export async function getConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    return connection;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw new Error('Failed to connect to database');
  }
}

/**
 * データベース接続をテストする
 * @returns 接続テストの結果
 */
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await getConnection();
    await connection.execute('SELECT 1');
    await connection.end();
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

// ユーザー型定義
export interface User {
  id: number;
  email: string;
  password_hash: string;
  role: 'admin' | 'user';
  is_active?: boolean;
  created_at: string | Date; // dateStrings設定により文字列の可能性もある
  updated_at: string | Date;
}

// 操作ログ型定義
export interface OperationLog {
  id: number;
  user_id: number;
  action: string;
  timestamp: Date;
  ip_address?: string;
  user_agent?: string;
}