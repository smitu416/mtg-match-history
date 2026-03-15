// ==========================================
// CardButtonPanel コンポーネント（中央列）
// ==========================================
// 3カラムレイアウトの中央に配置するパネル。
// ・デッキリスト入力エリア（テキスト）
// ・解析されたカード名のボタン一覧
// ・相手の行動ボタン（クリーチャー・呪文・除去）
//
// アクティブなAction欄がある状態でボタンを押すと、
// そのAction欄にチップが追加される。

import React, { useState } from 'react';
import type { ActionChip } from '../../types/turnHistory';

// -----------------------------------
// デッキリストをパースするヘルパー関数
// 入力例: "4 稲妻\n24 山\n4 渦まく知識"
// 出力例: ["稲妻", "山", "渦まく知識"] （重複なし）
// -----------------------------------
const parseCardList = (raw: string): string[] => {
  const names = raw
    .split('\n')
    .map((line) => {
      // 正規表現で「数字 スペース カード名」の形式をパースする
      // ^\d+ = 行の先頭から数字が1つ以上
      // \s+ = 空白が1つ以上
      // (.+)$ = 残りの全文字列（カード名）
      const match = line.trim().match(/^\d+\s+(.+)$/);
      return match ? match[1].trim() : null;
    })
    .filter((name): name is string => name !== null);

  // Set を使って重複を取り除く（同じカードが複数行ある場合）
  return [...new Set(names)];
};

// -----------------------------------
// このコンポーネントが受け取るプロパティの型
// -----------------------------------
interface CardButtonPanelProps {
  // 現在どのAction欄がアクティブか（アクティブなら true）
  // null の場合はどのAction欄もアクティブでない
  hasActiveField: boolean;
  // カードまたは相手行動のボタンが押されたときのコールバック
  onChipSelected: (chip: Omit<ActionChip, 'id'>) => void;
  // 外部から cardListRaw を管理する（GameSession に保存するため）
  cardListRaw: string;
  onCardListChange: (raw: string) => void;
}

// -----------------------------------
// 相手の行動ボタンの定義（固定3種類）
// -----------------------------------
const OPPONENT_ACTIONS = ['クリーチャー', '呪文', '除去'] as const;

// -----------------------------------
// CardButtonPanel コンポーネント
// -----------------------------------
const CardButtonPanel: React.FC<CardButtonPanelProps> = ({
  hasActiveField,
  onChipSelected,
  cardListRaw,
  onCardListChange,
}) => {
  // テキストエリアの表示/非表示を切り替える状態
  // デフォルトは折りたたんで、カードボタンだけ見えるようにする
  const [showInput, setShowInput] = useState(true);

  // デッキリストをパースしてカード名一覧を取得する
  const cardNames = parseCardList(cardListRaw);

  // -----------------------------------
  // カードボタンがクリックされたときの処理
  // -----------------------------------
  const handleCardClick = (cardName: string) => {
    // アクティブなAction欄がない場合は何もしない
    if (!hasActiveField) return;
    onChipSelected({ label: cardName, type: 'card' });
  };

  // -----------------------------------
  // 相手行動ボタンがクリックされたときの処理
  // -----------------------------------
  const handleOpponentActionClick = (action: string) => {
    if (!hasActiveField) return;
    onChipSelected({ label: action, type: 'opponent_action' });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* ===== デッキリスト入力エリア ===== */}
      <div>
        {/* 折りたたみボタン */}
        <button
          onClick={() => setShowInput((prev) => !prev)}
          className="w-full flex items-center justify-between text-xs text-stone-400 hover:text-stone-200 transition mb-1"
        >
          <span className="font-semibold">デッキリスト</span>
          {/* ▼ / ▲ で開閉を表現する */}
          <span>{showInput ? '▲' : '▼'}</span>
        </button>

        {showInput && (
          <textarea
            value={cardListRaw}
            onChange={(e) => onCardListChange(e.target.value)}
            placeholder={'4 稲妻\n4 渦まく知識\n24 山'}
            rows={6}
            className="w-full bg-slate-900 text-stone-300 border border-slate-700 rounded-lg p-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-stone-500 placeholder-slate-600 font-mono"
          />
        )}
      </div>

      {/* ===== カード名ボタン一覧 ===== */}
      {cardNames.length > 0 && (
        <div>
          <p className="text-xs text-stone-500 mb-1.5 font-semibold">自分のカード</p>
          <div className="flex flex-wrap gap-1">
            {cardNames.map((name) => (
              <button
                key={name}
                onClick={() => handleCardClick(name)}
                disabled={!hasActiveField}
                className={`
                  text-xs px-2 py-1 rounded-full border transition
                  ${
                    hasActiveField
                      // アクティブ時: クリックできる（明るく表示）
                      ? 'border-stone-500 text-stone-200 bg-slate-800 hover:bg-slate-700 hover:border-stone-400 cursor-pointer'
                      // 非アクティブ時: クリックできない（暗く表示）
                      : 'border-slate-700 text-stone-600 bg-slate-900 cursor-not-allowed'
                  }
                `}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== 相手の行動ボタン ===== */}
      <div>
        <p className="text-xs text-stone-500 mb-1.5 font-semibold">相手の行動</p>
        <div className="flex flex-col gap-1">
          {OPPONENT_ACTIONS.map((action) => (
            <button
              key={action}
              onClick={() => handleOpponentActionClick(action)}
              disabled={!hasActiveField}
              className={`
                text-xs px-2 py-1.5 rounded-lg border transition text-left
                ${
                  hasActiveField
                    ? 'border-stone-600 text-stone-300 bg-slate-800 hover:bg-slate-700 hover:border-stone-400 cursor-pointer'
                    : 'border-slate-700 text-stone-600 bg-slate-900 cursor-not-allowed'
                }
              `}
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* アクティブなAction欄がない場合のヒント表示 */}
      {!hasActiveField && (
        <p className="text-xs text-stone-600 text-center leading-relaxed">
          ターン行のAction欄を<br />タップして有効化
        </p>
      )}
    </div>
  );
};

export default CardButtonPanel;
