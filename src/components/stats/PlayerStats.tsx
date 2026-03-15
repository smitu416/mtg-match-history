// ==========================================
// プレイヤー別戦績コンポーネント
// ==========================================
// 相手プレイヤーごとに「何勝何敗か」を集計して表示する。

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import type { Match } from '../../types';

// -----------------------------------
// 1プレイヤーの戦績データの型
// -----------------------------------
interface PlayerRecord {
  playerName: string; // プレイヤー名
  wins: number;       // 勝ち数（マッチ単位）
  losses: number;     // 負け数（マッチ単位）
  total: number;      // 総試合数
  winRate: number;    // 勝率（0〜100）
}

// -----------------------------------
// マッチの勝敗を判定する関数
// -----------------------------------
// ゲーム1, 2, 3 の結果から、マッチ全体の勝ち/負けを返す。
// 2勝先取なのでどちらかが2勝したらマッチ終了。
// 戻り値: 'win' | 'loss' | 'draw'
function getMatchResult(match: Match): 'win' | 'loss' | 'draw' {
  const games = [match.game1, match.game2, match.game3];
  const wins = games.filter((g) => g.outcome === '勝ち').length;
  const losses = games.filter((g) => g.outcome === '負け').length;

  if (wins > losses) return 'win';
  if (losses > wins) return 'loss';
  return 'draw';
}

// -----------------------------------
// PlayerStats コンポーネント本体
// -----------------------------------
export function PlayerStats() {
  // DBから全対戦データを取得して集計する
  const playerRecords = useLiveQuery(async () => {
    const matches = await db.matches.toArray();

    // プレイヤー名 → 戦績 のマップ（辞書）を作る
    // Map は「キーと値のペア」を保持するデータ構造
    const recordMap = new Map<string, PlayerRecord>();

    matches.forEach((match) => {
      const playerName = match.opponentPlayerName;
      if (!playerName) return; // プレイヤー名が空ならスキップ

      // このプレイヤーの既存戦績を取得（なければ初期値を作る）
      const existing = recordMap.get(playerName) ?? {
        playerName,
        wins: 0,
        losses: 0,
        total: 0,
        winRate: 0,
      };

      // マッチ結果を判定して集計する
      const result = getMatchResult(match);
      if (result === 'win') existing.wins++;
      else if (result === 'loss') existing.losses++;
      existing.total++;

      // 勝率を計算する（小数点以下を四捨五入）
      existing.winRate = Math.round((existing.wins / existing.total) * 100);

      // マップを更新する
      recordMap.set(playerName, existing);
    });

    // Map を配列に変換して勝率の高い順に並べる
    return [...recordMap.values()].sort((a, b) => b.winRate - a.winRate);
  });

  // データ取得中
  if (!playerRecords) {
    return <div className="text-center py-10 text-slate-500">読み込み中...</div>;
  }

  // データなし
  if (playerRecords.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500">
        <p>対戦データがありません</p>
      </div>
    );
  }

  // ===================================
  // 表示部分（JSX）
  // ===================================
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
      <h3 className="font-bold text-amber-400 mb-3">プレイヤー別戦績</h3>

      <div className="space-y-3">
        {playerRecords.map((record) => (
          <PlayerRecordRow key={record.playerName} record={record} />
        ))}
      </div>
    </div>
  );
}

// ===================================
// サブコンポーネント: 1プレイヤーの戦績行
// ===================================
interface PlayerRecordRowProps {
  record: PlayerRecord;
}

function PlayerRecordRow({ record }: PlayerRecordRowProps) {
  // 勝率に応じてプログレスバーの色を変える
  const barColor =
    record.winRate >= 60 ? 'bg-green-500' :
    record.winRate >= 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="p-3 border border-slate-700 rounded-lg">
      {/* プレイヤー名と勝敗数 */}
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-medium text-slate-200">{record.playerName}</span>
        <span className="text-sm text-slate-400">
          {record.wins}勝 {record.losses}敗
          <span className="text-slate-500 ml-1">（{record.total}戦）</span>
        </span>
      </div>

      {/* 勝率プログレスバー */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-700 rounded-full h-2">
          <div
            className={`${barColor} h-2 rounded-full transition-all`}
            style={{ width: `${record.winRate}%` }} // インラインスタイルで幅を動的に設定
          />
        </div>
        <span className="text-sm font-semibold text-slate-300 w-10 text-right">
          {record.winRate}%
        </span>
      </div>
    </div>
  );
}
