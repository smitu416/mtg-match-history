# MTG 対戦履歴アプリ

マジックザギャザリングの対戦履歴を記録・管理するWebアプリ。

## 機能

### 対戦管理
- 対戦の新規入力・編集・削除
- G1/G2/G3 の勝敗・先攻後攻をゲームごとに独立設定
- プレイヤー名・デッキ名の入力補完（過去の入力から自動候補）
- 対戦一覧のグループ表示（日付別）・フラットリスト表示
- 対戦一覧クリックで詳細ビュー表示

### ターン履歴記録
- G1/G2/G3 ごとにターン単位で行動を記録
- カード使用・相手行動をワンタップでチップ追加
- フリーテキスト入力（改行可）
- ライフカウンター（増減ボタン + 記録ボタン）
  - 2T目以降は前ターンの最終ライフ値を自動引き継ぎ
  - 履歴は左端固定の記録ボタン → 右側に時系列で表示
- 土地カウンター（上）・ライフカウンター（下）の縦並び
- 自分と相手の同ターンが常に同じ高さに揃う

### 戦績集計
- 総合・プレイヤー別・デッキ別・相手デッキ別の戦績

### データ管理
- CSVエクスポート（ヘッダーから実行）
- CSVインポート（過去データ取り込み）
- ブラウザの IndexedDB（Dexie.js）に保存

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
├── types/
│   ├── index.ts            # Match, Game, Deck, SortOptions 等の型定義
│   └── turnHistory.ts      # TurnData, PlayerTurnData, GameSession 等の型定義
├── utils/
│   └── idGenerator.ts      # ID生成（例: "20260306-001"）
├── services/
│   ├── db.ts               # Dexie.js DBスキーマ（matches, decks, gameSessions, matchGroups）
│   ├── csvExport.ts        # CSVエクスポート
│   └── csvImport.ts        # CSVインポート
├── hooks/
│   ├── useMatches.ts       # 対戦CRUD + フィルター/ソート
│   ├── useDecks.ts         # デッキ名・プレイヤー名補完候補
│   ├── useGameSessions.ts  # ターン履歴の保存・取得
│   ├── useMatchGroups.ts   # 対戦グループ（日付別まとめ）
│   └── useDeckRecords.ts   # デッキ別レコード集計
├── components/
│   ├── AutocompleteInput.tsx   # カスタム補完入力（入力欄直下にリスト表示）
│   ├── CsvImportModal.tsx      # CSVインポートダイアログ
│   ├── match/
│   │   ├── GameResultRow.tsx   # G1/G2/G3 勝敗入力（1クリック）
│   │   ├── MatchForm.tsx       # 簡易入力フォーム（後方互換）
│   │   └── MatchList.tsx       # 一覧・グループ表示・フィルター・削除
│   ├── stats/
│   │   ├── OverallStats.tsx    # 総合戦績
│   │   ├── PlayerStats.tsx     # プレイヤー別戦績
│   │   └── DeckStats.tsx       # デッキ別戦績（相手デッキ別詳細含む）
│   └── turn/
│       ├── TurnHistoryPage.tsx # ターン履歴入力メイン画面（新規入力・編集）
│       ├── TurnRow.tsx         # 1ターン分の行（自分/相手共通）
│       ├── ActionChipField.tsx # アクションチップ + フリーテキスト入力欄
│       └── MatchDetailView.tsx # 対戦詳細の読み取り専用ビュー
├── App.tsx                 # メインコンポーネント（ページ管理）
├── main.tsx                # エントリーポイント
└── test/setup.ts           # テストセットアップ
tests/unit/
├── idGenerator.test.ts
└── csvExport.test.ts
.github/
├── workflows/ci.yml           # Lint + Test + Build 自動実行
└── PULL_REQUEST_TEMPLATE.md
```

## データ保存先

ブラウザの IndexedDB（Dexie.js）に保存。
テーブル: `matches` / `decks` / `gameSessions` / `matchGroups`
CSVエクスポートでバックアップ可能。

## 既存CSVフォーマット（インポート互換）

- パス: `/Users/shosaku/MTG/対戦履歴/YYYY_MM_DD_matches.csv`
- 列: `id, createdAt, myDeck, opponentPlayerName, opponentDeck, playOrder, game1_outcome, game1_notes, game2_outcome, game2_notes, game3_outcome, game3_notes`
