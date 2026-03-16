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
// 3. チップ末尾のテキスト入力欄に文字を打って Enter でもチップ追加できる
// 4. チップの × ボタンで個別に削除できる

import React, { useState } from 'react';
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
  onAddChip,
  onRemoveChip,
  placeholder = 'タップしてカードを追加',
}) => {
  // フリーテキスト入力欄の内容
  const [inputText, setInputText] = useState('');

  // -----------------------------------
  // Enter キーでフリー入力テキストをチップ化する
  // -----------------------------------
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputText.trim()) {
      // 入力されたテキストをチップとして追加する
      onAddChip({
        id: `free-${Date.now()}`,
        label: inputText.trim(),
        type: 'card',
      });
      setInputText('');
      e.preventDefault(); // フォームのサブミットなどを防ぐ
    }
  };

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

      {/* フリーテキスト入力欄（チップの後ろに inline で配置） */}
      {/* フォーカスするとアクティブになり、Enter でチップ追加できる */}
      <input
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onFocus={onActivate}           // フォーカスしたらこのフィールドをアクティブにする
        onKeyDown={handleKeyDown}      // Enter でチップ化
        onClick={(e) => e.stopPropagation()} // クリックが親の onClick に伝わらないように
        placeholder={chips.length === 0 ? placeholder : 'フリー入力…'}
        className="flex-1 min-w-[5rem] bg-transparent text-stone-200 text-xs outline-none placeholder-stone-600 cursor-text"
      />

      {/* アクティブ時はカーソルのような点滅を表示して「入力受付中」を伝える */}
      {/* テキスト入力欄が表示されているので、入力欄が空の場合のみ表示する */}
      {isActive && !inputText && chips.length > 0 && (
        <span className="w-0.5 h-4 bg-stone-400 animate-pulse rounded-full ml-0.5" />
      )}
    </div>
  );
};

export default ActionChipField;
