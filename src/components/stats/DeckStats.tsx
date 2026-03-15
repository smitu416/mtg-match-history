// ==========================================
// デッキ別戦績コンポーネント
// ==========================================
// 自分のデッキごとに戦績を集計して表示する。
// 各デッキが「どの相手デッキに勝てているか/負けているか」もわかる。

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import type { Match } from '../../types';

// -----------------------------------
// マッチの勝敗を判定する関数（PlayerStatsと同じロジック）
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
// デッキ戦績データの型
// -----------------------------------
interface DeckRecord {
  deckName: string;
  wins: number;
  losses: number;
  total: number;
  winRate: number;
  // 相手デッキ別の成績マップ
  vsDecks: Map<string, { wins: number; losses: number }>;
}

// -----------------------------------
// DeckStats コンポーネント本体
// -----------------------------------
export function DeckStats() {
  // 現在選択中のデッキ（詳細表示用）
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);

  // 全対戦データを集計する
  const deckRecords = useLiveQuery(async () => {
    const matches = await db.matches.toArray();

    // デッキ名 → 戦績 のマップを作る
    const recordMap = new Map<string, DeckRecord>();

    matches.forEach((match) => {
      const deckName = match.myDeck;
      if (!deckName) return;

      // このデッキの既存戦績を取得（なければ初期値）
      const existing = recordMap.get(deckName) ?? {
        deckName,
        wins: 0,
        losses: 0,
        total: 0,
        winRate: 0,
        vsDecks: new Map(),
      };

      // マッチ全体の結果を集計する
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

  if (!deckRecords) {
    return <div className="text-center py-10 text-slate-500">読み込み中...</div>;
  }

  if (deckRecords.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500">
        <p>対戦データがありません</p>
      </div>
    );
  }

  // 選択中のデッキのデータを取得する
  const selectedRecord = selectedDeck
    ? deckRecords.find((r) => r.deckName === selectedDeck)
    : null;

  return (
    <div className="space-y-4">
      {/* ===== デッキ一覧 ===== */}
      <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
        <h3 className="font-bold text-amber-400 mb-3">デッキ別戦績</h3>

        <div className="space-y-3">
          {deckRecords.map((record) => (
            <div
              key={record.deckName}
              onClick={() => setSelectedDeck(
                selectedDeck === record.deckName ? null : record.deckName
              )}
              className={`
                p-3 border rounded-lg cursor-pointer transition
                ${selectedDeck === record.deckName
                  ? 'border-amber-600 bg-amber-900/20'
                  : 'border-slate-700 hover:border-slate-500'
                }
              `}
            >
              {/* デッキ名と勝敗数 */}
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-medium text-slate-200">{record.deckName}</span>
                <span className="text-sm text-slate-400">
                  {record.wins}勝 {record.losses}敗
                  <span className="text-slate-500 ml-1">（{record.total}戦）</span>
                </span>
              </div>

              {/* 勝率バー */}
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      record.winRate >= 60 ? 'bg-green-500' :
                      record.winRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${record.winRate}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-slate-300 w-10 text-right">
                  {record.winRate}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== 選択したデッキの詳細（相手デッキ別） ===== */}
      {selectedRecord && (
        <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
          <h3 className="font-bold text-amber-400 mb-3">
            {selectedRecord.deckName} の相手デッキ別成績
          </h3>

          {/* 相手デッキ別の成績テーブル */}
          <div className="space-y-2">
            {[...selectedRecord.vsDecks.entries()]
              // 試合数が多い順に並べる
              .sort((a, b) => (b[1].wins + b[1].losses) - (a[1].wins + a[1].losses))
              .map(([opponentDeck, vsRecord]) => {
                const vsTotal = vsRecord.wins + vsRecord.losses;
                const vsWinRate = vsTotal > 0 ? Math.round((vsRecord.wins / vsTotal) * 100) : 0;

                return (
                  <div key={opponentDeck} className="flex items-center gap-3 text-sm">
                    {/* 相手デッキ名 */}
                    <span className="w-28 text-slate-300 shrink-0 truncate">{opponentDeck}</span>
                    {/* 勝敗 */}
                    <span className="text-slate-400 w-20 shrink-0">
                      {vsRecord.wins}勝{vsRecord.losses}敗
                    </span>
                    {/* 勝率バー */}
                    <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          vsWinRate >= 60 ? 'bg-green-500' :
                          vsWinRate >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${vsWinRate}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-slate-400">{vsWinRate}%</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
