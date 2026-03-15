// ==========================================
// デッキ名・プレイヤー名の補完候補を管理するフック
// ==========================================
// このフックは、過去の対戦履歴からデッキ名・プレイヤー名の
// 一覧を自動収集してくれる。
//
// 例:「ピナクル」「セシル」「呪文捕らえ」を過去に入力していれば、
// 次回フォーム入力時に補完候補として表示される。

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';

// -----------------------------------
// 自分のデッキ名の候補一覧を取得するフック
// -----------------------------------
// 戻り値: ユニークなデッキ名の配列（重複なし、アイウエオ順）
export function useMyDeckNames(): string[] {
  const names = useLiveQuery(async () => {
    // 全対戦データを取得する
    const matches = await db.matches.toArray();

    // myDeck フィールドだけ取り出す
    const allNames = matches.map((m) => m.myDeck).filter(Boolean);

    // Set を使って重複を除去する
    // Set は「同じ値を持たないコレクション」
    const unique = [...new Set(allNames)];

    // 日本語対応でアイウエオ順にソートする
    return unique.sort((a, b) => a.localeCompare(b, 'ja'));
  });

  return names ?? []; // undefined の場合は空配列を返す
}

// -----------------------------------
// 相手プレイヤー名の候補一覧を取得するフック
// -----------------------------------
export function useOpponentPlayerNames(): string[] {
  const names = useLiveQuery(async () => {
    const matches = await db.matches.toArray();
    const allNames = matches.map((m) => m.opponentPlayerName).filter(Boolean);
    const unique = [...new Set(allNames)];
    return unique.sort((a, b) => a.localeCompare(b, 'ja'));
  });

  return names ?? [];
}

// -----------------------------------
// 相手デッキ名の候補一覧を取得するフック
// -----------------------------------
export function useOpponentDeckNames(): string[] {
  const names = useLiveQuery(async () => {
    const matches = await db.matches.toArray();
    const allNames = matches.map((m) => m.opponentDeck).filter(Boolean);
    const unique = [...new Set(allNames)];
    return unique.sort((a, b) => a.localeCompare(b, 'ja'));
  });

  return names ?? [];
}
