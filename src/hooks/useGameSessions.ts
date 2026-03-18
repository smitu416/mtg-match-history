// ==========================================
// ゲームセッション（ターン履歴）操作フック
// ==========================================
// このファイルでは、ターン履歴データ（GameSession）の
// 読み取り・保存・削除を行うカスタムフックを定義する。
//
// カスタムフックとは: Reactのロジック（useState, useEffectなど）を
// コンポーネントから切り出して再利用できるようにしたもの。

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import type { GameSession } from '../types/turnHistory';

// -----------------------------------
// 特定の試合・ゲーム番号のセッションを取得するフック
// matchId と gameNumber で1つのGameSessionを特定する
// -----------------------------------
export const useGameSession = (
  matchId: string,
  gameNumber: 1 | 2 | 3,
): GameSession | undefined => {
  // useLiveQuery: DBの値が変更されると自動的に再描画される
  return useLiveQuery(
    () =>
      db.gameSessions
        .where('matchId')
        .equals(matchId)
        .filter((s) => s.gameNumber === gameNumber)
        .first(),
    [matchId, gameNumber], // matchId か gameNumber が変わったら再取得する
  );
};

// -----------------------------------
// 特定の試合の全ゲームセッション（G1/G2/G3）を取得するフック
// -----------------------------------
export const useGameSessionsByMatchId = (matchId: string): GameSession[] | undefined => {
  return useLiveQuery(
    () => db.gameSessions.where('matchId').equals(matchId).toArray(),
    [matchId],
  );
};

// -----------------------------------
// ゲームセッションを保存する関数（新規作成 or 上書き）
// put() は「存在すれば更新、なければ追加」という動作
// -----------------------------------
export const saveGameSession = async (session: GameSession): Promise<void> => {
  await db.gameSessions.put(session);
};

// -----------------------------------
// ゲームセッションを削除する関数
// -----------------------------------
export const deleteGameSession = async (id: string): Promise<void> => {
  await db.gameSessions.delete(id);
};

// -----------------------------------
// 特定の試合に紐づく全ゲームセッションを削除する関数
// 試合を削除するときに合わせて呼ぶ
// -----------------------------------
export const deleteGameSessionsByMatchId = async (matchId: string): Promise<void> => {
  await db.gameSessions.where('matchId').equals(matchId).delete();
};
