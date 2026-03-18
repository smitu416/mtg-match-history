// ==========================================
// ActionChipField コンポーネント
// ==========================================
// Action欄のコンポーネント。
// カード名や相手の行動を「チップ（タグ）」として表示する。
// また、改行可能なフリーテキストメモ欄を下段に持つ。
//
// 使い方の流れ:
// 1. ユーザーがこのAction欄をクリックすると「アクティブ」になる
// 2. アクティブな状態でカード名ボタンや相手行動ボタンを押すと
//    そのラベルがチップとして追加される
// 3. メモ欄（textarea）に自由記述できる（Enter = 改行、チップ化しない）
// 4. チップの × ボタンで個別に削除できる

import React, { useRef, useCallback } from 'react';
import type { ActionChip } from '../../types/turnHistory';

// -----------------------------------
// このコンポーネントが受け取るプロパティ（引数）の型
// -----------------------------------
interface ActionChipFieldProps {
  chips: ActionChip[];                        // 現在表示されているチップの配列
  isActive: boolean;                         // このフィールドが現在アクティブかどうか
  onActivate: () => void;                    // このフィールドをアクティブにするときに呼ばれる
  onAddChip: (chip: ActionChip) => void;     // チップを追加するときに呼ばれる（カードボタンから）
  onRemoveChip: (chipId: string) => void;    // チップを削除するときに呼ばれる
  freeText: string;                          // フリーテキストの現在値
  onFreeTextChange: (text: string) => void;  // フリーテキストが変わったときに呼ばれる
  placeholder?: string;                      // チップもテキストも空の時の説明テキスト
}

// -----------------------------------
// ActionChipField コンポーネント
// -----------------------------------
const ActionChipField: React.FC<ActionChipFieldProps> = ({
  chips,
  isActive,
  onActivate,
  onAddChip: _onAddChip, // eslint-disable-line @typescript-eslint/no-unused-vars
  onRemoveChip,
  freeText,
  onFreeTextChange,
  placeholder = 'タップしてカードを追加',
}) => {
  // textarea の DOM 参照（高さの自動調整に使う）
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // -----------------------------------
  // フリーテキストが変わったとき:
  // 1. 値を親に通知する
  // 2. textarea の高さを内容に合わせて自動調整する
  // -----------------------------------
  const handleFreeTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onFreeTextChange(e.target.value);
      // 高さを一旦 auto にリセットしてから scrollHeight に合わせる
      e.target.style.height = 'auto';
      e.target.style.height = `${e.target.scrollHeight}px`;
    },
    [onFreeTextChange],
  );

  return (
    <div
      onClick={onActivate}
      className={`
        min-h-[2.5rem] flex flex-col gap-1 p-1.5 rounded-lg border cursor-pointer
        transition-all duration-150 select-none
        ${
          isActive
            ? 'border-stone-400 bg-slate-800 ring-1 ring-stone-500'
            : 'border-slate-700 bg-slate-900 hover:border-slate-600'
        }
      `}
    >
      {/* ===== チップ一覧（上段）===== */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {chips.map((chip) => (
            <span
              key={chip.id}
              className={`
                inline-flex items-center gap-0.5 rounded-full text-xs px-2 py-0.5 border
                ${
                  chip.type === 'card'
                    ? 'border-stone-500 text-stone-200 bg-slate-800'
                    : 'border-stone-600 text-stone-400 bg-slate-900'
                }
              `}
            >
              {chip.label}
              <button
                onClick={(e) => {
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
          {isActive && (
            <span className="w-0.5 h-4 bg-stone-400 animate-pulse rounded-full self-center" />
          )}
        </div>
      )}

      {/* ===== フリーテキスト入力欄（下段）===== */}
      {/* Enter = 改行（チップ化しない）。内容に応じて高さが自動で伸びる。 */}
      <textarea
        ref={textareaRef}
        value={freeText}
        onChange={handleFreeTextChange}
        onFocus={onActivate}
        onClick={(e) => e.stopPropagation()}
        placeholder={chips.length === 0 && !freeText ? placeholder : 'メモ…'}
        rows={1}
        className="
          w-full bg-transparent text-stone-200 text-xs outline-none
          placeholder-stone-600 cursor-text resize-none leading-relaxed overflow-hidden
        "
        style={{ height: 'auto' }}
      />
    </div>
  );
};

export type { ActionChipFieldProps };
export default ActionChipField;
