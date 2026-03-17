// ==========================================
// AutocompleteInput コンポーネント
// ==========================================
// テキスト入力欄に補完候補ドロップダウンを付けたコンポーネント。
// ブラウザ標準の <datalist> は表示位置がブラウザ依存なので、
// 入力欄の直下に確実に表示されるカスタム実装を使用する。
//
// 使い方:
//   <AutocompleteInput
//     value={myDeck}
//     onChange={setMyDeck}
//     suggestions={myDeckNames}
//     placeholder="例: ピナクル"
//     className="..."
//   />

import React, { useState, useRef, useCallback } from 'react';

// -----------------------------------
// このコンポーネントが受け取るプロパティの型
// -----------------------------------
interface AutocompleteInputProps {
  value: string;                      // 入力欄の現在値
  onChange: (value: string) => void;  // 値が変わったときのコールバック
  suggestions: string[];              // 補完候補の一覧
  placeholder?: string;               // プレースホルダーテキスト
  className?: string;                 // 入力欄に追加するCSSクラス
}

// -----------------------------------
// AutocompleteInput コンポーネント
// -----------------------------------
const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  suggestions,
  placeholder,
  className = '',
}) => {
  // ドロップダウンを表示するかどうか
  const [showDropdown, setShowDropdown] = useState(false);
  // キーボード操作でフォーカスしている候補のインデックス（-1 = 未選択）
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // -----------------------------------
  // 入力値でフィルターした候補一覧
  // 入力が空なら全候補を表示する
  // -----------------------------------
  const filtered = suggestions.filter((s) =>
    s.toLowerCase().includes(value.toLowerCase()),
  );

  // -----------------------------------
  // フォーカス時: ドロップダウンを表示する
  // -----------------------------------
  const handleFocus = useCallback(() => {
    setShowDropdown(true);
    setFocusedIndex(-1);
  }, []);

  // -----------------------------------
  // フォーカスが外れたとき: ドロップダウンを閉じる
  // mousedown より blur が先に発火するので、
  // 少し遅延させてクリックイベントを先に処理させる
  // -----------------------------------
  const handleBlur = useCallback(() => {
    setTimeout(() => setShowDropdown(false), 150);
  }, []);

  // -----------------------------------
  // キーボード操作
  // ArrowDown/Up: 候補をナビゲート
  // Enter: 選択確定
  // Escape: ドロップダウンを閉じる
  // -----------------------------------
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showDropdown || filtered.length === 0) return;

      if (e.key === 'ArrowDown') {
        setFocusedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        setFocusedIndex((prev) => Math.max(prev - 1, -1));
        e.preventDefault();
      } else if (e.key === 'Enter' && focusedIndex >= 0) {
        onChange(filtered[focusedIndex]);
        setShowDropdown(false);
        e.preventDefault();
      } else if (e.key === 'Escape') {
        setShowDropdown(false);
      }
    },
    [showDropdown, filtered, focusedIndex, onChange],
  );

  // -----------------------------------
  // 候補クリック: 値を確定してドロップダウンを閉じる
  // onMouseDown を使う（blur より先に発火するため）
  // -----------------------------------
  const handleSelect = useCallback(
    (suggestion: string) => {
      onChange(suggestion);
      setShowDropdown(false);
      inputRef.current?.focus();
    },
    [onChange],
  );

  return (
    // relative にして、ドロップダウンを絶対位置で入力欄の真下に表示する
    <div className="relative">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setFocusedIndex(-1); // 入力が変わったらキーボード選択をリセット
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoComplete="off"  // ブラウザ標準の補完を無効にする
      />

      {/* ===== ドロップダウン ===== */}
      {showDropdown && filtered.length > 0 && (
        <div
          className="absolute top-full left-0 right-0 z-50 mt-0.5
                     bg-slate-800 border border-slate-600 rounded-lg shadow-2xl
                     max-h-40 overflow-y-auto"
        >
          {filtered.map((suggestion, idx) => (
            <button
              key={suggestion}
              onMouseDown={() => handleSelect(suggestion)}
              className={`
                w-full text-left px-3 py-1.5 text-xs transition
                ${
                  focusedIndex === idx
                    ? 'bg-slate-600 text-stone-100'
                    : 'text-stone-300 hover:bg-slate-700 hover:text-stone-100'
                }
              `}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;
