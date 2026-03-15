// ==========================================
// マッチグループ操作フック
// ==========================================
// このファイルでは、対戦グループ（MatchGroup）の
// 読み取り・作成・更新を行うカスタムフックを定義する。
//
// グループとは: 同じ日の対戦などをまとめて表示するための仕組み。
// 例: "2026/03/15" というグループに、その日の全対戦をまとめる。

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import type { MatchGroup } from '../types/turnHistory';

// -----------------------------------
// 全グループ一覧を取得するフック（作成日の新しい順）
// -----------------------------------
export const useMatchGroups = (): MatchGroup[] | undefined => {
  return useLiveQuery(
    () => db.matchGroups.orderBy('createdAt').reverse().toArray(),
  );
};

// -----------------------------------
// グループIDからグループを取得するフック
// -----------------------------------
export const useMatchGroup = (groupId: string | undefined): MatchGroup | undefined => {
  return useLiveQuery(
    () => (groupId ? db.matchGroups.get(groupId) : undefined),
    [groupId],
  );
};

// -----------------------------------
// グループIDを生成するヘルパー関数
// 日付文字列（"2026-03-15"）からIDを作る
// 例: "group-20260315"
// -----------------------------------
const generateGroupId = (dateStr: string): string => {
  const digits = dateStr.replace(/-/g, '');
  return `group-${digits}`;
};

// -----------------------------------
// 対戦日付からグループ名（表示用）を生成するヘルパー関数
// ISO 8601の日付文字列 → "yyyy/mm/dd" 形式に変換する
// 例: "2026-03-15T10:00:00Z" → "2026/03/15"
// -----------------------------------
const formatGroupName = (createdAt: string): string => {
  const date = new Date(createdAt);
  const yyyy = date.getFullYear();
  // getMonth() は 0始まりなので +1 する。padStart(2, '0') で2桁にゼロ埋め
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}`;
};

// -----------------------------------
// 試合をグループに追加する関数
// 対応するグループがなければ自動作成する
// matchCreatedAt: 試合の createdAt（グループIDとグループ名の決定に使う）
// -----------------------------------
export const addMatchToGroup = async (
  matchId: string,
  matchCreatedAt: string,
): Promise<string> => {
  // 日付部分だけ取り出す（例: "2026-03-15T..." → "2026-03-15"）
  const dateStr = matchCreatedAt.slice(0, 10);
  const groupId = generateGroupId(dateStr);

  // 既存のグループを検索する
  const existing = await db.matchGroups.get(groupId);

  if (existing) {
    // グループが既に存在する場合: matchIdが重複しないように追加する
    const updatedMatchIds = existing.matchIds.includes(matchId)
      ? existing.matchIds
      : [...existing.matchIds, matchId];
    await db.matchGroups.update(groupId, { matchIds: updatedMatchIds });
  } else {
    // グループが存在しない場合: 新規作成する
    const newGroup: MatchGroup = {
      id: groupId,
      name: formatGroupName(matchCreatedAt), // "2026/03/15" 形式
      createdAt: matchCreatedAt,
      matchIds: [matchId],
    };
    await db.matchGroups.add(newGroup);
  }

  // 試合レコードの groupId も更新する
  await db.matches.update(matchId, { groupId });

  return groupId;
};

// -----------------------------------
// グループ名を変更する関数
// -----------------------------------
export const updateGroupName = async (groupId: string, name: string): Promise<void> => {
  await db.matchGroups.update(groupId, { name });
};

// -----------------------------------
// 試合をグループから外す関数（試合を削除するときに呼ぶ）
// -----------------------------------
export const removeMatchFromGroup = async (
  matchId: string,
  groupId: string,
): Promise<void> => {
  const group = await db.matchGroups.get(groupId);
  if (!group) return;

  const updatedMatchIds = group.matchIds.filter((id) => id !== matchId);
  if (updatedMatchIds.length === 0) {
    // グループに試合が0件になったらグループ自体を削除する
    await db.matchGroups.delete(groupId);
  } else {
    await db.matchGroups.update(groupId, { matchIds: updatedMatchIds });
  }
};
