// ==========================================
// 総合戦績コンポーネント
// ==========================================
// 全対戦を集計して、総合的な勝率・勝敗数を表示する。
// 戦績ページの 2×2 グリッドの左上に配置する。

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import type { Match } from '../../types';

// -----------------------------------
// マッチの勝敗を判定するヘルパー関数
// （PlayerStats.tsx・useDeckRecords.ts と同じロジック）
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
// OverallStats コンポーネント
// -----------------------------------
export function OverallStats() {
  // 全試合を集計してトータルの勝敗と勝率を計算する
  const data = useLiveQuery(async () => {
    const matches = await db.matches.toArray();
    let wins = 0;
    let losses = 0;
    let draws = 0;

    matches.forEach((m) => {
      const r = getMatchResult(m);
      if (r === 'win') wins++;
      else if (r === 'loss') losses++;
      else draws++;
    });

    const total = matches.length;
    // ゲーム単位でも集計する（G1/G2/G3 それぞれの勝敗）
    let gameWins = 0;
    let gameLosses = 0;
    matches.forEach((m) => {
      [m.game1, m.game2, m.game3].forEach((g) => {
        if (g.outcome === '勝ち') gameWins++;
        else if (g.outcome === '負け') gameLosses++;
      });
    });
    const totalGames = gameWins + gameLosses;

    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    const gameWinRate = totalGames > 0 ? Math.round((gameWins / totalGames) * 100) : 0;

    return { wins, losses, draws, total, winRate, gameWins, gameLosses, totalGames, gameWinRate };
  });

  // データ取得中
  if (!data) {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
        <p className="text-stone-500 text-sm text-center py-4">読み込み中...</p>
      </div>
    );
  }

  // 勝率に応じてバーの色を変える
  const barColor =
    data.winRate >= 60 ? 'bg-green-500' :
    data.winRate >= 40 ? 'bg-yellow-500' : 'bg-red-500';

  const gameBarColor =
    data.gameWinRate >= 60 ? 'bg-green-500' :
    data.gameWinRate >= 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
      <h3 className="font-bold text-stone-300 mb-4">総合戦績</h3>

      {data.total === 0 ? (
        <p className="text-stone-500 text-sm text-center py-2">対戦データがありません</p>
      ) : (
        <div className="space-y-4">
          {/* ===== マッチ単位の戦績 ===== */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-stone-300">マッチ勝率</span>
              <span className="text-sm text-stone-400">
                <span className="text-green-400 font-semibold">{data.wins}勝</span>
                {' '}
                <span className="text-red-400 font-semibold">{data.losses}敗</span>
                {data.draws > 0 && (
                  <span className="text-stone-500 ml-1">{data.draws}引</span>
                )}
                <span className="text-stone-500 ml-1">（{data.total}戦）</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-700 rounded-full h-2">
                <div
                  className={`${barColor} h-2 rounded-full transition-all`}
                  style={{ width: `${data.winRate}%` }}
                />
              </div>
              <span className="text-sm font-bold text-stone-200 w-10 text-right">
                {data.winRate}%
              </span>
            </div>
          </div>

          {/* ===== ゲーム単位の戦績 ===== */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-stone-300">ゲーム勝率</span>
              <span className="text-sm text-stone-400">
                <span className="text-green-400 font-semibold">{data.gameWins}勝</span>
                {' '}
                <span className="text-red-400 font-semibold">{data.gameLosses}敗</span>
                <span className="text-stone-500 ml-1">（{data.totalGames}ゲーム）</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-700 rounded-full h-2">
                <div
                  className={`${gameBarColor} h-2 rounded-full transition-all`}
                  style={{ width: `${data.gameWinRate}%` }}
                />
              </div>
              <span className="text-sm font-bold text-stone-200 w-10 text-right">
                {data.gameWinRate}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
