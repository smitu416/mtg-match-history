# MTG 対戦履歴アプリ

マジックザギャザリングの対戦履歴を記録・管理するWebアプリ。

## 機能

- 対戦の新規入力・編集・削除
- G1/G2/G3 の勝敗を1クリックで記録
- プレイヤー名・デッキ名の入力補完（過去の入力から自動候補）
- 先攻/後攻のワンクリック切り替え
- 対戦一覧のソート・フィルター
- プレイヤー別・デッキ別の戦績集計
- CSVエクスポート（バックアップ）・インポート（過去データ取り込み）

## セットアップ

```bash
# パッケージをインストール
npm install

# 開発サーバーを起動（ブラウザで http://localhost:5173 を開く）
npm run dev
```

## 開発コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # 本番用ビルド
npm run test     # テスト実行
npm run lint     # コードチェック
```

## GitHub開発フロー

1. GitHubで Issue を作成する
2. ブランチを切る: `git checkout -b feature/xxx`
3. コードを書いて commit/push する
4. Pull Request を作成する → CI が自動で lint+test+build を実行
5. レビュー・マージ

## プロジェクト構造

```
src/
├── components/
│   ├── match/       # 対戦入力・一覧コンポーネント
│   └── stats/       # 戦績・統計コンポーネント
├── hooks/           # データ操作フック（useMatches, useDecks）
├── services/        # DB・CSV処理（db.ts, csvExport.ts, csvImport.ts）
├── types/           # 型定義
└── utils/           # ユーティリティ（ID生成など）
```

## データ保存先

ブラウザの IndexedDB（Dexie.js）に保存。
CSVエクスポートでバックアップ可能。
