// ==========================================
// ターン履歴機能の型定義ファイル
// ==========================================
// このファイルでは、ターン履歴（ゲーム中の行動記録）に関するデータ型を定義する。
// ゲームをプレイしながらリアルタイムで記録するための型。

import type { PlayOrder } from './index';

// -----------------------------------
// アクションチップ（Action欄に表示されるタグ1枚）
// 例: カード「稲妻」を使ったら「稲妻」というチップがAction欄に追加される
// -----------------------------------
export interface ActionChip {
  id: string;   // ユニークID（重複しないように Date.now() などで生成）
  label: string; // 表示テキスト 例: "稲妻", "クリーチャー"
  type: 'card' | 'opponent_action'; // カードの使用 or 相手の行動
}

// -----------------------------------
// ライフ履歴エントリ
// 「記録」ボタンを押した時点のライフをスナップショットとして保存する
// 例: 20点 → 18点になったタイミングで記録 → { life: 18, recordedAt: "2026-03-15T..." }
// -----------------------------------
export interface LifeHistoryEntry {
  life: number;       // その時点のライフ点数
  recordedAt: string; // 記録した日時（ISO 8601形式）
}

// -----------------------------------
// 1プレイヤー分のターンデータ
// 自分と相手それぞれに同じ構造を使う
// -----------------------------------
export interface PlayerTurnData {
  actions: ActionChip[];            // そのターンにしたアクション（カード使用など）のチップ一覧
  land: number;                     // そのターンの土地の枚数
  life: number;                     // そのターンの現在ライフ
  lifeHistory: LifeHistoryEntry[];  // ライフ変動の記録履歴
  freeText: string;                 // 自由記述（改行可能なメモ欄）
}

// -----------------------------------
// 1ターン分のデータ（自分と相手の両方を含む）
// -----------------------------------
export interface TurnData {
  turnNumber: number;      // ターン数（1ターン目、2ターン目...）
  my: PlayerTurnData;      // 自分のターンデータ
  opponent: PlayerTurnData; // 相手のターンデータ
}

// -----------------------------------
// ゲームセッション（G1/G2/G3の1戦分のターン履歴）
// 1試合は最大3ゲームあるので、ゲームごとに1つのGameSessionが作られる
// -----------------------------------
export interface GameSession {
  id: string;           // 例: "20260315-001-g1"（matchId + ゲーム番号）
  matchId: string;      // どの試合のセッションか（Matchのid）
  gameNumber: 1 | 2 | 3; // G1, G2, G3 のどれか
  playOrder: PlayOrder; // このゲームの先攻/後攻
  cardListRaw: string;  // デッキリストの生テキスト（例: "4 稲妻\n24 山"）
  turns: TurnData[];    // ターンごとのデータ配列（デフォルト10ターン）
  createdAt: string;    // 作成日時（ISO 8601形式）
}

// -----------------------------------
// マッチグループ（対戦日などでグルーピングするための型）
// 例: "2026/03/15" という名前のグループに、その日の対戦をまとめる
// -----------------------------------
export interface MatchGroup {
  id: string;           // グループID（自動生成）
  name: string;         // 表示名 デフォルト: "yyyy/mm/dd" 形式の日付
  createdAt: string;    // グループ作成日時（ISO 8601形式）
  matchIds: string[];   // このグループに含まれる Match の id 一覧
}

// -----------------------------------
// デフォルトのプレイヤーターンデータを生成するヘルパー関数
// 新しいターンを追加するときに使う
// -----------------------------------
export const createDefaultPlayerTurnData = (prevLife = 20, prevLand = 0): PlayerTurnData => ({
  actions: [],
  land: prevLand,
  life: prevLife,
  lifeHistory: [],
  freeText: '',
});

// -----------------------------------
// デフォルトのターンデータを生成するヘルパー関数
// ターンを新規追加するときに呼ばれる。
// 前のターンのライフ履歴の「最後に記録された値」を引き継ぐ。
// 履歴がなければ現在のライフ値を使う。
// -----------------------------------
export const createDefaultTurnData = (
  turnNumber: number,
  prevMyData?: PlayerTurnData,
  prevOpponentData?: PlayerTurnData,
): TurnData => {
  // 前ターンのライフ履歴の最後のエントリ、なければ現在値を返すヘルパー
  const getLastLife = (data?: PlayerTurnData, fallback = 20): number => {
    if (!data) return fallback;
    const history = data.lifeHistory;
    if (history.length > 0) return history[history.length - 1].life;
    return data.life;
  };

  return {
    turnNumber,
    my: createDefaultPlayerTurnData(getLastLife(prevMyData), prevMyData?.land ?? 0),
    opponent: createDefaultPlayerTurnData(getLastLife(prevOpponentData), prevOpponentData?.land ?? 0),
  };
};

// -----------------------------------
// デフォルトの10ターン分のデータを生成するヘルパー関数
// 新しいゲームセッション開始時に使う
// -----------------------------------
export const createDefaultTurns = (): TurnData[] =>
  Array.from({ length: 10 }, (_, i) =>
    i === 0
      ? createDefaultTurnData(1)
      : createDefaultTurnData(i + 1,
          createDefaultPlayerTurnData(20, 0),
          createDefaultPlayerTurnData(20, 0),
        ),
  );
