# 酒税法リスク判断支援システム API テスト手順書

## 概要
実装されたログイン認証システムの動作確認を行うためのテスト手順です。

---

## 事前準備

### 必要なもの
- 開発サーバーが起動していること（`npm run dev`実行済み）
- VS Code with REST Client拡張機能（推奨）
- または、curlコマンドが使用可能な環境

### テストアカウント
- **管理者**: `admin@omukoro.local` / `admin123`
- **一般ユーザー**: `user@omukoro.local` / `user12345`

---

## テスト手順

### Step 1: 環境変数を設定

⏺ 1.1 .env.exampleをコピーして、.env.localにファイル名変更。.env.localにAzure Database for MySQL の情報を設定

  # 1. .env.exampleをコピーして.env.local ファイルを作成
  code .env.local

  # 2. JWT秘密鍵を生成を安全なランダム文字列で生成（推奨）
  # 以下のコマンドをVSCodeターミナルで実行
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

  以下のような長いランダム文字列が生成されます：
  a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcde・・・・

  # 3. .env.localの内容を以下の値をあなたのAzure MySQL情報に更新
  DATABASE_HOST=your-azure-mysql-server.mysql.database.azure.com
  DATABASE_PORT=3306
  DATABASE_USER=your-username@your-server-name
  DATABASE_PASSWORD=your-actual-password
  DATABASE_NAME=omukoro_auth

  # JWT_SECRETを先程生成した全なランダム文字列に変更
  JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-random-string
   ↓
  JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcde・・・・

### スキップ → Step 2: データベーステーブルおよびテストアカウント作成
  ※この手順はすでに済んでおりますので、スキップしてください。

  1. テスト用ユーザー
  管理者: admin@omukoro.local / admin123
  一般ユーザー: user@omukoro.local / user12345

### Step 3: 開発サーバーを起動
⏺ npm run dev

### Step 4: 管理者ログインでトークン取得
**curlコマンドでテスト：**
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@omukoro.local","password":"admin123"}'
```

**期待されるレスポンス例：**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "role": "admin"
  }
}
```

### Step 5: レスポンスからaccess_tokenをコピー
上記レスポンスの`access_token`の値をコピーしてください。

### Step 6: ユーザー情報取得APIをテスト

**curlコマンドでテスト：**
```bash
curl -X GET http://localhost:3000/api/user/me -H "Authorization: Bearer 【Step5でコピーしたトークン】"
```

**期待されるレスポンス例：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "admin@omukoro.local",
    "role": "admin",
    "created_at": "2025-07-27 09:19:27"
  }
}
```

### Step 7: 一般ユーザーログインをテスト

**curlコマンドでテスト：**
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@omukoro.local","password":"user12345"}'
```

**期待されるレスポンス例：**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "role": "user"
  }
}
```

### Step 8: エラーケースをテスト

**間違ったパスワードでのテスト：**
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@omukoro.local","password":"wrongpassword"}'
```

**期待されるレスポンス例：**
```json
{
  "success": false,
  "error": {
    "error": "authentication_failed",
    "message": "メールアドレス・パスワードのどちらかが間違っています"
  }
}
```

---

## VS Code REST Client を使用する場合
VSCode拡張機能 REST Client を使用して、 プロジェクト内の`test-api.http`ファイルの内容を実行します
  1. REST Clientの拡張機能とをインストールし、VSCodeで test-api.http を開きます
  2. Step 4, 7のログインテストを実行してトークンを取得
  3. test-api.httpファイル内の以下の行を一時的に変更
     ```http
   @adminToken = 【取得したトークン】
   ```
  4. 各テストの上にある「Send Request」をクリックして実行
  5. 拡張機能が起動して、右ウィンドウにRequest結果が表示されます
  6. 各リクエストの結果を確認し、期待されるレスポンスが得られるかをチェックします（全14項目）


---

## ✅ 動作確認項目

- [ ] 管理者ログインが成功する
- [ ] 一般ユーザーログインが成功する  
- [ ] 取得したトークンで認証APIにアクセスできる
- [ ] 間違ったパスワードで適切なエラーが返る
- [ ] 無効なトークンで認証エラーが返る
- [ ] ログイン時に正しいロール（admin/user）が返る