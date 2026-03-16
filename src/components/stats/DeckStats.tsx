// ==========================================
// デッキ別戦績コンポーネント
// ==========================================
// DeckStats: デッキ一覧を表示（クリックで選択）
// DeckDetailStats: 選択デッキの相手デッキ別詳細を表示
//
// 両コンポーネントとも useDeckRecords フックで共通データを取得する。
// selectedDeck と onSelectDeck を props で受け取ることで、
// 親コンポーネント（App.tsx の StatsPage）で状態を管理する。

import { useDeckRecords } from '../../hooks/useDeckRecords';

// ==========================================
// DeckStats コンポーネント（デッキ一覧）
// ==========================================
interface DeckStatsProps {
  selectedDeck: string | null;          // 現在選択中のデッキ名
  onSelectDeck: (name: string | null) => void; // デッキ選択時のコールバック
}

export function DeckStats({ selectedDeck, onSelectDeck }: DeckStatsProps) {
  // useDeckRecords フックで集計済みデータを取得する
  const deckRecords = useDeckRecords();

  if (!deckRecords) {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
        <p className="text-center py-6 text-stone-500 text-sm">読み込み中...</p>
      </div>
    );
  }

  if (deckRecords.length === 0) {
    return (
      <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
        <h3 className="font-bold text-stone-300 mb-3">デッキ別戦績</h3>
        <p className="text-center py-4 text-stone-500 text-sm">対戦データがありません</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
      <h3 className="font-bold text-stone-300 mb-3">デッキ別戦績</h3>

      <div className="space-y-2">
        {deckRecords.map((record) => (
          <div
            key={record.deckName}
            // クリックすると選択・再クリックで解除
            onClick={() =>
              onSelectDeck(selectedDeck === record.deckName ? null : record.deckName)
            }
            className={`
              p-3 border rounded-lg cursor-pointer transition
              ${
                selectedDeck === record.deckName
                  ? 'border-stone-400 bg-slate-800'
                  : 'border-slate-700 hover:border-slate-500'
              }
            `}
          >
            {/* デッキ名と勝敗数 */}
            <div className="flex justify-between items-center mb-1.5">
              <span className="font-medium text-stone-100">{record.deckName}</span>
              <span className="text-sm text-stone-400">
                <span className="text-green-400">{record.wins}勝</span>
                {' '}
                <span className="text-red-400">{record.losses}敗</span>
                <span className="text-stone-500 ml-1">（{record.total}戦）</span>
              </span>
            </div>

            {/* 勝率バー */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    record.winRate >= 60
                      ? 'bg-green-500'
                      : record.winRate >= 40
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${record.winRate}%` }}
                />
              </div>
              <span className="text-sm font-semibold text-stone-300 w-10 text-right">
                {record.winRate}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// DeckDetailStats コンポーネント（相手デッキ別詳細）
// ==========================================
// selectedDeck で選ばれたデッキに対して、
// どの相手デッキに何勝何敗かを表示する。

interface DeckDetailStatsProps {
  selectedDeck: string | null; // 選択中のデッキ名（null なら未選択）
}

export function DeckDetailStats({ selectedDeck }: DeckDetailStatsProps) {
  const deckRecords = useDeckRecords();

  // 選択中のデッキのレコードを検索する
  const selectedRecord = selectedDeck
    ? deckRecords?.find((r) => r.deckName === selectedDeck)
    : null;

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 p-4">
      <h3 className="font-bold text-stone-300 mb-3">相手デッキ別成績</h3>

      {/* デッキが選択されていない場合 */}
      {!selectedDeck && (
        <p className="text-stone-500 text-sm text-center py-4">
          左のデッキ一覧から<br />デッキを選択してください
        </p>
      )}

      {/* 選択デッキのデータが読み込み中 */}
      {selectedDeck && !deckRecords && (
        <p className="text-stone-500 text-sm text-center py-4">読み込み中...</p>
      )}

      {/* 選択デッキの相手別成績 */}
      {selectedRecord && (
        <>
          {/* 選択中デッキ名を表示 */}
          <p className="text-xs text-stone-400 mb-3">
            <span className="text-stone-200 font-medium">{selectedRecord.deckName}</span>
            {' '}の相手デッキ別成績
          </p>

          <div className="space-y-2">
            {[...selectedRecord.vsDecks.entries()]
              // 試合数が多い順に並べる
              .sort((a, b) => (b[1].wins + b[1].losses) - (a[1].wins + a[1].losses))
              .map(([opponentDeck, vsRecord]) => {
                const vsTotal = vsRecord.wins + vsRecord.losses;
                const vsWinRate =
                  vsTotal > 0 ? Math.round((vsRecord.wins / vsTotal) * 100) : 0;

                return (
                  <div key={opponentDeck} className="flex items-center gap-2 text-sm">
                    {/* 相手デッキ名 */}
                    <span className="w-24 text-stone-300 shrink-0 truncate text-xs">
                      {opponentDeck}
                    </span>
                    {/* 勝敗 */}
                    <span className="text-xs shrink-0">
                      <span className="text-green-400">{vsRecord.wins}勝</span>
                      {' '}
                      <span className="text-red-400">{vsRecord.losses}敗</span>
                    </span>
                    {/* 勝率バー */}
                    <div className="flex-1 bg-slate-700 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${
                          vsWinRate >= 60
                            ? 'bg-green-500'
                            : vsWinRate >= 40
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${vsWinRate}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs text-stone-400 shrink-0">
                      {vsWinRate}%
                    </span>
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
