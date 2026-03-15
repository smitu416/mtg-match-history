// ==========================================
// ゲーム結果入力行コンポーネント
// ==========================================
// G1・G2・G3 それぞれの「勝ち/負け/ー」とメモを入力するUI。
// 勝敗は1クリックでボタンを選択するだけで入力できる。

import type { Game, GameOutcome } from '../../types';

// -----------------------------------
// このコンポーネントが受け取るデータの型定義（Props）
// -----------------------------------
interface GameResultRowProps {
  gameNumber: 1 | 2 | 3;           // ゲーム番号（G1, G2, G3）
  game: Game;                        // このゲームの現在のデータ
  onChange: (game: Game) => void;   // データが変更されたときに呼ぶ関数
}

// -----------------------------------
// 勝敗の選択肢
// -----------------------------------
// ゲームボタンに表示する勝敗の選択肢
const OUTCOMES: GameOutcome[] = ['勝ち', '負け', 'ー'];

// -----------------------------------
// 各勝敗ボタンの色設定
// -----------------------------------
// 勝ち=緑、負け=赤、ー=グレーで色分けする
const OUTCOME_STYLES: Record<GameOutcome, { active: string; inactive: string }> = {
  '勝ち': {
    active: 'bg-green-500 text-white border-green-500',   // 選択中
    inactive: 'bg-white text-green-600 border-green-300 hover:bg-green-50', // 非選択
  },
  '負け': {
    active: 'bg-red-500 text-white border-red-500',
    inactive: 'bg-white text-red-600 border-red-300 hover:bg-red-50',
  },
  'ー': {
    active: 'bg-gray-400 text-white border-gray-400',
    inactive: 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50',
  },
};

// -----------------------------------
// GameResultRow コンポーネント本体
// -----------------------------------
export function GameResultRow({ gameNumber, game, onChange }: GameResultRowProps) {
  // 勝敗ボタンがクリックされたときの処理
  // 現在選択中のものを再クリックしたら 'ー'（未選択）に戻す
  const handleOutcomeClick = (outcome: GameOutcome) => {
    const newOutcome = game.outcome === outcome ? 'ー' : outcome;
    onChange({ ...game, outcome: newOutcome });
    // 「...game」はスプレッド構文。gameオブジェクトを展開して、
    // outcomeだけを新しい値に置き換えた新しいオブジェクトを作る。
  };

  // メモテキストエリアの変更時の処理
  const handleNotesChange = (notes: string) => {
    onChange({ ...game, notes });
  };

  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      {/* ゲーム番号とボタン行 */}
      <div className="flex items-center gap-3 mb-2">
        {/* ゲーム番号ラベル（例: "G1"） */}
        <span className="font-bold text-gray-700 w-6 shrink-0">
          G{gameNumber}
        </span>

        {/* 勝敗ボタン群 */}
        <div className="flex gap-1.5">
          {OUTCOMES.map((outcome) => {
            // 現在選択中かどうかを判定する
            const isActive = game.outcome === outcome;
            const styles = OUTCOME_STYLES[outcome];

            return (
              <button
                key={outcome}
                type="button"  // form の submit を防ぐため type="button" を指定
                onClick={() => handleOutcomeClick(outcome)}
                className={`
                  px-3 py-1 rounded-full border text-sm font-medium
                  transition-all duration-100
                  ${isActive ? styles.active : styles.inactive}
                `}
              >
                {outcome}
              </button>
            );
          })}
        </div>
      </div>

      {/* メモ入力欄 */}
      <textarea
        value={game.notes}
        onChange={(e) => handleNotesChange(e.target.value)}
        placeholder={`G${gameNumber} のメモ（使ったカード、決め手など）`}
        rows={2}
        className="w-full text-sm border border-gray-200 rounded p-2 resize-none
                   focus:outline-none focus:ring-2 focus:ring-indigo-300
                   bg-white placeholder-gray-400"
      />
    </div>
  );
}
