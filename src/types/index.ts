// ==========================================
// MTG対戦履歴アプリ - 型定義ファイル
// ==========================================
// このファイルでは、アプリ全体で使うデータの「型」を定義する。
// 型とは「このデータはこういう形をしている」という約束事。
// TypeScriptの型システムにより、間違ったデータを使うとエラーが出る。

// -----------------------------------
// ゲームの勝敗を表す型
// 'ー' は「まだ試合していない（3戦目など）」を意味する
// -----------------------------------
export type GameOutcome = '勝ち' | '負け' | 'ー';

// -----------------------------------
// 先攻・後攻を表す型
// -----------------------------------
export type PlayOrder = '先攻' | '後攻';

// -----------------------------------
// 1ゲーム分のデータ（例: G1, G2, G3 それぞれに対応）
// -----------------------------------
export interface Game {
  outcome: GameOutcome; // このゲームの勝敗
  notes: string;        // このゲームのメモ（自由記述）
}

// -----------------------------------
// 1試合分のデータ
// 例: まさっち vs ピナクル の対戦1回分
// -----------------------------------
export interface Match {
  id: string;                  // 例: "20260306-001"（日付+追い番）
  createdAt: string;           // 作成日時（ISO 8601形式 例: "2026-03-06T16:47:20.093Z"）
  myDeck: string;              // 自分のデッキ名（例: "ピナクル"）
  opponentPlayerName: string;  // 相手プレイヤー名（例: "まさっち"）
  opponentDeck: string;        // 相手のデッキ名（例: "カニL/O"）
  playOrder: PlayOrder;        // デフォルトの先攻・後攻（ゲームごとに上書き可能）
  game1: Game;                 // 1ゲーム目の結果
  game2: Game;                 // 2ゲーム目の結果
  game3: Game;                 // 3ゲーム目の結果
  groupId?: string;            // 所属するMatchGroupのID（未設定の場合は日付でグルーピング）
}

// -----------------------------------
// デッキに含まれるカード1枚分のデータ
// -----------------------------------
export interface DeckCard {
  name: string;   // カード名（例: "稲妻"）
  count: number;  // 枚数（例: 4）
  type: 'creature' | 'spell' | 'land' | 'other'; // カードの種類
}

// -----------------------------------
// デッキ1つ分のデータ
// -----------------------------------
export interface Deck {
  id: string;        // デッキID（自動生成）
  name: string;      // デッキ名（例: "ピナクル"）
  cards: DeckCard[]; // デッキに入っているカードのリスト
}

// -----------------------------------
// フィルター・ソートの設定を表す型
// 対戦一覧を絞り込んだり並び替えたりするときに使う
// -----------------------------------
export interface FilterOptions {
  myDeck?: string;             // 自分のデッキで絞り込む（空の場合は全件）
  opponentPlayerName?: string; // 相手プレイヤーで絞り込む
  opponentDeck?: string;       // 相手デッキで絞り込む
}

// ソートするフィールドの種類
export type SortField = 'id' | 'createdAt' | 'myDeck' | 'opponentPlayerName' | 'opponentDeck';
// asc=昇順(A→Z, 古い順), desc=降順(Z→A, 新しい順)
export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  field: SortField;
  order: SortOrder;
}
