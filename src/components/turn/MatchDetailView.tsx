// ==========================================
// MatchDetailView コンポーネント
// ==========================================
// 対戦一覧の行をクリックしたときに表示する「読み取り専用」詳細ビュー。
// ターン履歴・デッキリスト・ライフ履歴などを確認できる。
// 編集したい場合は「編集」ボタンで TurnHistoryPage に遷移する。

import React, { useState } from 'react';
import type { Match } from '../../types';
import { useGameSessionsByMatchId } from '../../hooks/useGameSessions';

// -----------------------------------
// このコンポーネントが受け取るプロパティの型
// -----------------------------------
interface MatchDetailViewProps {
  match: Match;         // 詳細を表示する試合データ
  onClose: () => void;  // 「← 戻る」ボタンで一覧に戻るとき
  onEdit: () => void;   // 「編集」ボタンで編集画面に遷移するとき
}

// -----------------------------------
// ゲームタブの定義
// -----------------------------------
const GAME_NUMBERS = [1, 2, 3] as const;

// -----------------------------------
// MatchDetailView コンポーネント
// -----------------------------------
const MatchDetailView: React.FC<MatchDetailViewProps> = ({ match, onClose, onEdit }) => {
  // DBから GameSession 一覧を取得する（リアルタイム更新対応）
  const sessions = useGameSessionsByMatchId(match.id);

  // 現在表示中のゲームタブ（G1/G2/G3）
  const [activeGame, setActiveGame] = useState<1 | 2 | 3>(1);

  // デッキリストの折りたたみ状態
  const [showCardList, setShowCardList] = useState(true);

  // 現在のゲームセッション
  const currentSession = sessions?.find((s) => s.gameNumber === activeGame);

  // 現在のゲームの勝敗
  const currentOutcome =
    activeGame === 1
      ? match.game1.outcome
      : activeGame === 2
        ? match.game2.outcome
        : match.game3.outcome;

  // 勝敗のスタイル
  const outcomeStyle =
    currentOutcome === '勝ち'
      ? 'text-green-400'
      : currentOutcome === '負け'
        ? 'text-red-400'
        : 'text-stone-500';

  return (
    <div className="flex flex-col h-full gap-2">

      {/* ===== ヘッダー ===== */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-200 transition"
          >
            ← 戻る
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-1 text-xs border border-stone-500 text-stone-200 font-semibold rounded-lg hover:bg-slate-800 hover:border-stone-300 transition"
          >
            ✏️ 編集
          </button>
        </div>

        {/* 基本情報（読み取り専用） */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <p className="text-xs text-stone-500 mb-0.5">自分のデッキ</p>
            <p className="text-sm font-semibold text-stone-200">{match.myDeck}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500 mb-0.5">相手プレイヤー</p>
            <p className="text-sm font-semibold text-stone-200">{match.opponentPlayerName}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500 mb-0.5">相手デッキ</p>
            <p className="text-sm font-semibold text-stone-200">{match.opponentDeck || '—'}</p>
          </div>
        </div>
      </div>

      {/* ===== ゲームタブ + 先攻後攻 + 勝敗 ===== */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* G1/G2/G3 タブ */}
        <div className="flex gap-0.5 bg-slate-900 rounded-lg border border-slate-700 p-0.5">
          {GAME_NUMBERS.map((num) => (
            <button
              key={num}
              onClick={() => setActiveGame(num)}
              className={`
                px-4 py-1 rounded-md text-xs font-semibold transition
                ${activeGame === num ? 'bg-slate-700 text-stone-100' : 'text-stone-500 hover:text-stone-300'}
              `}
            >
              G{num}
            </button>
          ))}
        </div>

        {/* 先攻後攻（読み取り専用） */}
        <span className="text-xs px-3 py-1 border border-slate-700 text-stone-400 rounded-lg">
          {currentSession?.playOrder ?? match.playOrder}
        </span>

        {/* 勝敗（読み取り専用） */}
        <span className={`ml-auto text-sm font-bold ${outcomeStyle}`}>
          {currentOutcome}
        </span>
      </div>

      {/* ===== デッキリスト ===== */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-2">
        <button
          onClick={() => setShowCardList((prev) => !prev)}
          className="w-full flex items-center justify-between text-xs text-stone-400 hover:text-stone-200 transition mb-1"
        >
          <span className="font-semibold">デッキリスト（G1〜G3 共通）</span>
          <span>{showCardList ? '▲' : '▼'}</span>
        </button>

        {showCardList && (
          currentSession?.cardListRaw ? (
            <textarea
              readOnly
              value={currentSession.cardListRaw}
              rows={4}
              className="w-full bg-slate-800 text-stone-400 border border-slate-700 rounded-lg p-2 text-xs resize-none focus:outline-none font-mono"
            />
          ) : (
            <p className="text-xs text-stone-600 py-1">デッキリストの記録なし</p>
          )
        )}
      </div>

      {/* ===== ターン履歴（読み取り専用）===== */}
      <div className="flex-1 min-h-0 overflow-y-auto">

        {/* ヘッダー */}
        <div className="grid grid-cols-2 gap-2 sticky top-0 bg-slate-950 z-10 py-1">
          <p className="text-xs font-semibold text-stone-400">自分</p>
          <p className="text-xs font-semibold text-stone-400 text-right">相手</p>
        </div>

        {currentSession ? (
          currentSession.turns.map((turn, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 items-stretch">
              {/* 自分のターン */}
              <TurnDetailCell
                turnNumber={turn.turnNumber}
                side="my"
                actions={turn.my.actions}
                freeText={turn.my.freeText ?? ''}
                land={turn.my.land}
                life={turn.my.life}
                lifeHistory={turn.my.lifeHistory}
              />
              {/* 相手のターン */}
              <TurnDetailCell
                turnNumber={turn.turnNumber}
                side="opponent"
                actions={turn.opponent.actions}
                freeText={turn.opponent.freeText ?? ''}
                land={turn.opponent.land}
                life={turn.opponent.life}
                lifeHistory={turn.opponent.lifeHistory}
              />
            </div>
          ))
        ) : (
          <p className="text-xs text-stone-600 py-4 text-center">
            ターン履歴の記録なし
          </p>
        )}
      </div>
    </div>
  );
};

// -----------------------------------
// サブコンポーネント: 1ターン分の読み取り専用セル
// -----------------------------------
interface TurnDetailCellProps {
  turnNumber: number;
  side: 'my' | 'opponent';
  actions: import('../../types/turnHistory').ActionChip[];
  freeText: string;
  land: number;
  life: number;
  lifeHistory: import('../../types/turnHistory').LifeHistoryEntry[];
}

function TurnDetailCell({ turnNumber, side: _side, actions, freeText, land, life, lifeHistory }: TurnDetailCellProps) { // eslint-disable-line @typescript-eslint/no-unused-vars
  const isEmpty = actions.length === 0 && !freeText && lifeHistory.length === 0;

  const inner = (
    <div className="h-full flex flex-col gap-1 p-2 rounded-lg border border-slate-800 bg-slate-900/30 min-h-[3rem]">
      {/* ターン番号 */}
      <span className="text-xs font-bold text-stone-600">T{turnNumber}</span>

      {/* チップ一覧 */}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {actions.map((chip) => (
            <span
              key={chip.id}
              className={`
                inline-flex items-center rounded-full text-xs px-2 py-0.5 border
                ${chip.type === 'card'
                  ? 'border-stone-600 text-stone-300 bg-slate-800'
                  : 'border-stone-700 text-stone-500 bg-slate-900'
                }
              `}
            >
              {chip.label}
            </span>
          ))}
        </div>
      )}

      {/* フリーテキスト */}
      {freeText && (
        <p className="text-xs text-stone-400 whitespace-pre-wrap">{freeText}</p>
      )}

      {/* 何もない時のプレースホルダー */}
      {isEmpty && (
        <p className="text-xs text-stone-700">—</p>
      )}

      {/* 土地・ライフ情報 */}
      <div className="flex items-center gap-2 text-xs text-stone-600 mt-auto pt-1 border-t border-slate-800">
        <span>🌲 {land}</span>
        <span>❤ {life}</span>
        {lifeHistory.length > 0 && (
          <span className="text-stone-700">
            ({lifeHistory.map((e) => e.life).join('→')})
          </span>
        )}
      </div>
    </div>
  );

  return inner;
}

export default MatchDetailView;
