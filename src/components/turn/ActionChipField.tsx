// ==========================================
// ActionChipField コンポーネント
// ==========================================
// Action欄のコンポーネント。
// カード名や相手の行動を「チップ（タグ）」として表示する。
//
// 使い方の流れ:
// 1. ユーザーがこのAction欄をクリックすると「アクティブ」になる
// 2. アクティブな状態でカード名ボタンや相手行動ボタンを押すと
//    そのラベルがチップとして追加される
// 3. チップの × ボタンで個別に削除できる

import React from 'react';
import type { ActionChip } from '../../types/turnHistory';

// -----------------------------------
// このコンポーネントが受け取るプロパティ（引数）の型
// -----------------------------------
interface ActionChipFieldProps {
  chips: ActionChip[];                         // 現在表示されているチップの配列
  isActive: boolean;                           // このフィールドが現在アクティブかどうか
  onActivate: () => void;                      // このフィールドをアクティブにするときに呼ばれる
  onAddChip: (chip: ActionChip) => void;       // チップを追加するときに呼ばれる（外部から呼ばれる）
  onRemoveChip: (chipId: string) => void;      // チップを削除するときに呼ばれる
  placeholder?: string;                        // 何もない時の説明テキスト
}

// -----------------------------------
// ActionChipField コンポーネント
// -----------------------------------
const ActionChipField: React.FC<ActionChipFieldProps> = ({
  chips,
  isActive,
  onActivate,
  onRemoveChip,
  placeholder = 'タップしてカードを追加',
}) => {
  return (
    <div
      // クリックするとアクティブになる
      onClick={onActivate}
      className={`
        min-h-[2.5rem] flex flex-wrap gap-1 items-center p-1.5 rounded-lg border cursor-pointer
        transition-all duration-150 select-none
        ${
          // アクティブな時は枠が光る（ユーザーが「ここに入力できる」とわかるように）
          isActive
            ? 'border-stone-400 bg-slate-800 ring-1 ring-stone-500'
            : 'border-slate-700 bg-slate-900 hover:border-slate-600'
        }
      `}
    >
      {/* チップ一覧を表示する */}
      {chips.map((chip) => (
        <span
          key={chip.id}
          className={`
            inline-flex items-center gap-0.5 rounded-full text-xs px-2 py-0.5 border
            ${
              // カードのチップと相手行動のチップで色を変える
              chip.type === 'card'
                ? 'border-stone-500 text-stone-200 bg-slate-800'
                : 'border-stone-600 text-stone-400 bg-slate-900'
            }
          `}
        >
          {chip.label}
          {/* × ボタン: クリックするとこのチップだけ削除する */}
          <button
            onClick={(e) => {
              // クリックイベントが親要素（ActionChipField全体）に伝わらないようにする
              // 伝わってしまうと、アクティブ化処理が走ってしまう
              e.stopPropagation();
              onRemoveChip(chip.id);
            }}
            className="ml-0.5 text-stone-500 hover:text-stone-200 transition leading-none"
            aria-label={`${chip.label}を削除`}
          >
            ×
          </button>
        </span>
      ))}

      {/* チップが0件の場合はプレースホルダーを表示する */}
      {chips.length === 0 && (
        <span className="text-xs text-stone-600 pointer-events-none">
          {placeholder}
        </span>
      )}

      {/* アクティブ時はカーソルのような点滅を表示して「入力受付中」を伝える */}
      {isActive && (
        <span className="w-0.5 h-4 bg-stone-400 animate-pulse rounded-full ml-0.5" />
      )}
    </div>
  );
};

export default ActionChipField;
