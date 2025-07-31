# 酒税法リスク分析判定システム API ドキュメント

## 概要

本システムは酒税法に関するリスクを分析・判定するシステムのWeb APIです。認証機能とファイルアップロード機能を提供します。

## 技術仕様

- **フレームワーク**: Next.js 14 (App Router)
- **認証方式**: JWT (JSON Web Token)
- **データベース**: MySQL
- **API形式**: REST API
- **レスポンス形式**: JSON

## 共通仕様

### ベースURL

```
http://localhost:3000/api
```

### 共通レスポンス形式

すべてのAPIは以下の形式でレスポンスを返します：

```json
{
  "success": boolean,
  "data": object | null,
  "error": {
    "error": string,
    "message": string,
    "details": object | null
  } | null
}
```

### 認証

認証が必要なエンドポイントでは、HTTPヘッダーに以下を含める必要があります：

```
Authorization: Bearer <JWT_TOKEN>
```

### エラーレスポンス

| HTTPステータス | エラーコード | 説明 |
|----------------|--------------|------|
| 400 | validation_error | リクエストパラメータのバリデーションエラー |
| 401 | missing_token | 認証トークンが必要 |
| 401 | invalid_token | 無効な認証トークン |
| 401 | authentication_failed | 認証失敗 |
| 404 | user_not_found | ユーザーが見つからない |
| 405 | method_not_allowed | 許可されていないHTTPメソッド |
| 500 | internal_server_error | サーバー内部エラー |

---

## API エンドポイント

### 1. ログイン

ユーザーの認証を行い、JWTトークンを発行します。

#### リクエスト

```
POST /api/login
```

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### レスポンス

**成功時 (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "role": "user"
  },
  "error": null
}
```

**失敗時 (401 Unauthorized):**
```json
{
  "success": false,
  "data": null,
  "error": {
    "error": "authentication_failed",
    "message": "メールアドレス・パスワードのどちらかが間違っています"
  }
}
```

#### バリデーション

- `email`: 必須、有効なメールアドレス形式
- `password`: 必須、8文字以上、英数字を含む

#### 操作ログ

- **成功時**: `login_success`
- **失敗時**: `login_failed`

---

### 2. ログアウト

ユーザーのログアウト処理を行います。

#### リクエスト

```
POST /api/logout
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

#### レスポンス

**成功時 (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "ログアウトしました"
  },
  "error": null
}
```

#### 注意事項

- JWTはステートレスなため、サーバー側でのトークン無効化は行いません
- クライアント側でトークンを削除することを想定しています
- トークンが無効でもログアウトは成功として扱います

#### 操作ログ

- **実行時**: `logout`

---

### 3. ユーザー情報取得

認証されたユーザーの情報を取得します。

#### リクエスト

```
GET /api/user/me
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

#### レスポンス

**成功時 (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "role": "user",
    "created_at": "2024-01-01 12:00:00"
  },
  "error": null
}
```

**失敗時 (404 Not Found):**
```json
{
  "success": false,
  "data": null,
  "error": {
    "error": "user_not_found",
    "message": "ユーザーが見つかりません"
  }
}
```

#### 操作ログ

- **実行時**: `get_user_info`

---

## ユーザー権限

### ロール種別

| ロール | 説明 |
|--------|------|
| admin | 管理者権限 |
| user | 一般ユーザー権限 |

### テストアカウント

**管理者アカウント:**
- Email: `admin@omukoro.local`
- Password: `admin123`

**一般ユーザーアカウント:**
- Email: `user@omukoro.local`
- Password: `user123`

---

## 操作ログ

システムでは以下の操作がデータベースに記録されます：

| アクション | 説明 | 対象API |
|------------|------|---------|
| login_success | ログイン成功 | POST /api/login |
| login_failed | ログイン失敗 | POST /api/login |
| logout | ログアウト | POST /api/logout |
| get_user_info | ユーザー情報取得 | GET /api/user/me |

### ログ情報

各操作ログには以下の情報が記録されます：

- **user_id**: ユーザーID（失敗時はnull）
- **action**: 実行されたアクション
- **timestamp**: 実行時刻
- **ip_address**: クライアントIPアドレス
- **user_agent**: ユーザーエージェント情報

---

## セキュリティ仕様

### 認証・認可

- **JWT有効期限**: 24時間
- **パスワードハッシュ化**: bcrypt（salt rounds: 12）
- **トークン検証**: すべての保護されたエンドポイントで実施

### IPアドレス取得

プロキシ環境対応のため、以下の順序でIPアドレスを取得：

1. `x-forwarded-for` ヘッダー
2. `x-real-ip` ヘッダー
3. `x-remote-address` ヘッダー
4. フォールバック: "unknown"

### セキュリティ対策

- **パスワード要件**: 8文字以上、英数字を含む
- **エラーメッセージ**: 情報漏洩を防ぐため汎用的なメッセージを使用
- **操作ログ**: 全ての認証関連操作を記録
- **データベース接続**: 接続プールによる効率的な管理

---

## 開発・デバッグ情報

### ログレベル

開発環境では以下の情報がコンソールに出力されます：

```
Login API error: [エラー詳細]
Logout API error: [エラー詳細]
User me API error: [エラー詳細]
Failed to log operation: [ログ記録エラー]
Failed to close database connection: [接続クローズエラー]
```

### 環境変数

APIの動作に必要な環境変数については、環境設定手順書を参照してください。

---

## 更新履歴

| バージョン | 日付 | 変更内容 |
|------------|------|----------|
| 1.0.0 | 2025-07-30 | 初版作成 |

---

## サポート・問い合わせ

技術的な問題や不明な点については、TLB開発担当：福島までお問い合わせください。