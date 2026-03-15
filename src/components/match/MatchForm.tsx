// ==========================================
// 対戦入力・編集フォームコンポーネント
// ==========================================
// 新規の対戦を入力したり、既存の対戦を編集するためのフォーム。
// 保存ボタンを押すとDBに保存される。

import { useState } from 'react';
import { GameResultRow } from './GameResultRow';
import { addMatch, updateMatch } from '../../hooks/useMatches';
import { useMyDeckNames, useOpponentPlayerNames, useOpponentDeckNames } from '../../hooks/useDecks';
import type { Match, Game, PlayOrder } from '../../types';

// -----------------------------------
// Props（このコンポーネントへの入力）
// -----------------------------------
interface MatchFormProps {
  // 編集モードのときは既存のMatchデータを渡す。
  // 新規作成のときは undefined。
  initialMatch?: Match;

  // 保存完了・キャンセル時に呼ばれるコールバック関数
  onSave: () => void;
  onCancel: () => void;
}

// -----------------------------------
// デフォルトのゲームデータ（初期値）
// -----------------------------------
const DEFAULT_GAME: Game = {
  outcome: 'ー',
  notes: '',
};

// -----------------------------------
// MatchForm コンポーネント本体
// -----------------------------------
export function MatchForm({ initialMatch, onSave, onCancel }: MatchFormProps) {
  // ===================================
  // フォームの状態（state）管理
  // ===================================
  // stateとは、コンポーネントが記憶しておくデータのこと。
  // setState関数を呼ぶと画面が再描画される。

  // 自分のデッキ名
  const [myDeck, setMyDeck] = useState(initialMatch?.myDeck ?? '');
  // 相手のプレイヤー名
  const [opponentPlayerName, setOpponentPlayerName] = useState(
    initialMatch?.opponentPlayerName ?? ''
  );
  // 相手のデッキ名
  const [opponentDeck, setOpponentDeck] = useState(initialMatch?.opponentDeck ?? '');
  // 先攻・後攻
  const [playOrder, setPlayOrder] = useState<PlayOrder>(initialMatch?.playOrder ?? '先攻');
  // G1, G2, G3 の結果
  const [game1, setGame1] = useState<Game>(initialMatch?.game1 ?? { ...DEFAULT_GAME });
  const [game2, setGame2] = useState<Game>(initialMatch?.game2 ?? { ...DEFAULT_GAME });
  const [game3, setGame3] = useState<Game>(initialMatch?.game3 ?? { ...DEFAULT_GAME });
  // 保存処理中かどうか（2重送信を防ぐため）
  const [isSaving, setIsSaving] = useState(false);
  // エラーメッセージ
  const [error, setError] = useState('');

  // -----------------------------------
  // 補完候補を取得するフック
  // -----------------------------------
  // 過去に入力したデッキ名・プレイヤー名を候補として表示する
  const myDeckNames = useMyDeckNames();
  const opponentPlayerNames = useOpponentPlayerNames();
  const opponentDeckNames = useOpponentDeckNames();

  // -----------------------------------
  // 保存ボタンが押されたときの処理
  // -----------------------------------
  const handleSave = async () => {
    // 入力チェック（バリデーション）
    if (!myDeck.trim()) {
      setError('自分のデッキ名を入力してください');
      return;
    }
    if (!opponentPlayerName.trim()) {
      setError('相手のプレイヤー名を入力してください');
      return;
    }

    setIsSaving(true); // ボタンを無効化して2重送信を防ぐ
    setError('');

    try {
      if (initialMatch) {
        // 編集モード: 既存データを更新する
        await updateMatch({
          ...initialMatch,
          myDeck: myDeck.trim(),
          opponentPlayerName: opponentPlayerName.trim(),
          opponentDeck: opponentDeck.trim(),
          playOrder,
          game1,
          game2,
          game3,
        });
      } else {
        // 新規作成モード: 新しいデータを追加する
        await addMatch({
          myDeck: myDeck.trim(),
          opponentPlayerName: opponentPlayerName.trim(),
          opponentDeck: opponentDeck.trim(),
          playOrder,
          game1,
          game2,
          game3,
        });
      }
      // 保存成功 → 親コンポーネントに通知する
      onSave();
    } catch (e) {
      setError(`保存に失敗しました: ${e}`);
    } finally {
      // 成功・失敗どちらでも保存中フラグを解除する
      setIsSaving(false);
    }
  };

  // -----------------------------------
  // 先攻・後攻トグルボタン
  // -----------------------------------
  const togglePlayOrder = () => {
    setPlayOrder((prev) => (prev === '先攻' ? '後攻' : '先攻'));
  };

  // ===================================
  // 表示部分（JSX）
  // ===================================
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 p-5 max-w-lg mx-auto">
      {/* タイトル */}
      <h2 className="text-lg font-bold text-amber-400 mb-4">
        {initialMatch ? '対戦を編集' : '新規対戦を入力'}
      </h2>

      {/* エラーメッセージ */}
      {error && (
        <div className="mb-4 p-3 bg-red-950 border border-red-700 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* ===== 自分のデッキ ===== */}
        <FormField label="自分のデッキ" required>
          <DatalistInput
            value={myDeck}
            onChange={setMyDeck}
            placeholder="例: ピナクル"
            listId="my-deck-list"
            options={myDeckNames}
          />
        </FormField>

        {/* ===== 相手のプレイヤー名 ===== */}
        <FormField label="相手のプレイヤー" required>
          <DatalistInput
            value={opponentPlayerName}
            onChange={setOpponentPlayerName}
            placeholder="例: まさっち"
            listId="opponent-player-list"
            options={opponentPlayerNames}
          />
        </FormField>

        {/* ===== 相手のデッキ ===== */}
        <FormField label="相手のデッキ">
          <DatalistInput
            value={opponentDeck}
            onChange={setOpponentDeck}
            placeholder="例: カニL/O"
            listId="opponent-deck-list"
            options={opponentDeckNames}
          />
        </FormField>

        {/* ===== 先攻・後攻 ===== */}
        <FormField label="先攻/後攻">
          <button
            type="button"
            onClick={togglePlayOrder}
            className={`
              px-6 py-2 rounded-full border-2 font-semibold text-sm transition-all
              ${playOrder === '先攻'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-orange-500 text-white border-orange-500'
              }
            `}
          >
            {playOrder} （クリックで切り替え）
          </button>
        </FormField>

        {/* ===== ゲーム結果 ===== */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-stone-300">ゲーム結果</label>
          <GameResultRow gameNumber={1} game={game1} onChange={setGame1} />
          <GameResultRow gameNumber={2} game={game2} onChange={setGame2} />
          <GameResultRow gameNumber={3} game={game3} onChange={setGame3} />
        </div>
      </div>

      {/* ===== ボタン ===== */}
      <div className="flex gap-3 mt-6">
        {/* キャンセルボタン */}
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 px-4 border border-slate-600 rounded-lg text-slate-400
                     hover:bg-slate-800 transition text-sm font-medium"
        >
          キャンセル
        </button>

        {/* 保存ボタン */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving} // 保存中は押せないようにする
          className="flex-1 py-2 px-4 bg-amber-500 text-slate-900 rounded-lg
                     hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed
                     transition text-sm font-semibold"
        >
          {isSaving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}

// ===================================
// サブコンポーネント: フォームフィールド
// ===================================
// ラベルと入力欄をセットにしたコンポーネント
interface FormFieldProps {
  label: string;        // ラベルテキスト
  required?: boolean;   // 必須項目かどうか
  children: React.ReactNode; // 入力欄（子要素）
}

function FormField({ label, required, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-stone-300 mb-1">
        {label}
        {/* 必須マーク */}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

// ===================================
// サブコンポーネント: 補完候補付きテキスト入力
// ===================================
// HTMLの <datalist> を使って入力補完を実装する
interface DatalistInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  listId: string;       // datalistのid（inputと紐付けるため）
  options: string[];    // 補完候補のリスト
}

function DatalistInput({ value, onChange, placeholder, listId, options }: DatalistInputProps) {
  return (
    <>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        list={listId} // datalistと紐付ける
        className="w-full bg-slate-800 text-stone-200 border border-slate-600 rounded-lg px-3 py-2 text-sm
                   placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
      />
      {/* datalist: inputに入力補完候補を提供する（ブラウザが候補を表示してくれる） */}
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </>
  );
}
