// ==========================================
// デッキ戦績集計フック
// ==========================================
// DeckStats と DeckDetailStats の両方で共有する集計ロジック。
// 以前は DeckStats.tsx に直接書かれていたが、複数コンポーネントで
// 使い回せるようにここに切り出した。

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import type { Match } from '../types';

// -----------------------------------
// マッチの勝敗を判定するヘルパー関数
// G1/G2/G3 の結果から、マッチ全体の勝ち/負け/引き分けを返す
// -----------------------------------
function getMatchResult(match: Match): 'win' | 'loss' | 'draw' {
  const games = [match.game1, match.game2, match.game3];
  const wins = games.filter((g) => g.outcome === '勝ち').length;
  const losses = games.filter((g) => g.outcome === '負け').length;
  if (wins > losses) return 'win';
  if (losses > wins) return 'loss';
  return 'draw';
}

// -----------------------------------
// デッキ戦績データの型定義
// このファイルでエクスポートして、他のコンポーネントからも参照できるようにする
// -----------------------------------
export interface DeckRecord {
  deckName: string;   // デッキ名
  wins: number;       // 勝ち数（マッチ単位）
  losses: number;     // 負け数
  total: number;      // 総試合数
  winRate: number;    // 勝率（0〜100）
  // 相手デッキ別の成績マップ: キー=相手デッキ名, 値={wins, losses}
  vsDecks: Map<string, { wins: number; losses: number }>;
}

// -----------------------------------
// 全デッキの戦績を集計するカスタムフック
// DBが更新されると自動的に再集計する
// -----------------------------------
export function useDeckRecords(): DeckRecord[] | undefined {
  return useLiveQuery(async () => {
    const matches = await db.matches.toArray();

    // デッキ名 → DeckRecord のマップを作る
    const recordMap = new Map<string, DeckRecord>();

    matches.forEach((match) => {
      const deckName = match.myDeck;
      if (!deckName) return; // デッキ名が空はスキップ

      // 既存戦績を取得（なければ初期値）
      const existing = recordMap.get(deckName) ?? {
        deckName,
        wins: 0,
        losses: 0,
        total: 0,
        winRate: 0,
        vsDecks: new Map(),
      };

      // マッチ全体の勝敗を集計する
      const result = getMatchResult(match);
      if (result === 'win') existing.wins++;
      else if (result === 'loss') existing.losses++;
      existing.total++;
      existing.winRate = Math.round((existing.wins / existing.total) * 100);

      // 相手デッキ別の集計
      const opponentDeck = match.opponentDeck || '（不明）';
      const vsRecord = existing.vsDecks.get(opponentDeck) ?? { wins: 0, losses: 0 };
      if (result === 'win') vsRecord.wins++;
      else if (result === 'loss') vsRecord.losses++;
      existing.vsDecks.set(opponentDeck, vsRecord);

      recordMap.set(deckName, existing);
    });

    // 配列に変換して総試合数の多い順に並べる
    return [...recordMap.values()].sort((a, b) => b.total - a.total);
  });
}
