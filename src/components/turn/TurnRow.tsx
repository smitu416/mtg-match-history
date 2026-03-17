// ==========================================
// TurnRow コンポーネント
// ==========================================
// 1ターン分の行を表示するコンポーネント。
// 自分側と相手側それぞれで使い回す。
//
// レイアウト（1ターン = 2段構成）:
// 上段: [ターン番号] [Action欄（チップ + フリー入力）] [土地 −/数/+] [ライフ −/数/+]
// 下段:             [ライフ履歴: 20→18→15 × × ×] [記録ボタン]
// ※ ライフ履歴を下段に分離することで、Action欄の幅が変動しないようにする

import React, { useCallback } from 'react';
import type { ActionChip, PlayerTurnData } from '../../types/turnHistory';
import ActionChipField from './ActionChipField';

// -----------------------------------
// このコンポーネントが受け取るプロパティの型
// -----------------------------------
interface TurnRowProps {
  turnNumber: number;        // 何ターン目か（1, 2, 3...）
  data: PlayerTurnData;      // このターンのプレイヤーデータ
  side: 'my' | 'opponent';   // 自分側か相手側か（レイアウトの向きが変わる）
  isActive: boolean;         // このAction欄がアクティブかどうか
  activeFieldId: string | null; // 現在アクティブなフィールドのID
  fieldId: string;           // このAction欄のユニークID（例: "t1-my"）
  onActivate: (fieldId: string) => void; // アクティブにするときのコールバック
  onUpdate: (data: PlayerTurnData) => void; // データを更新するときのコールバック
}

// -----------------------------------
// TurnRow コンポーネント
// -----------------------------------
const TurnRow: React.FC<TurnRowProps> = ({
  turnNumber,
  data,
  side,
  isActive,
  fieldId,
  onActivate,
  onUpdate,
}) => {
  // -----------------------------------
  // チップを追加する処理
  // -----------------------------------
  const handleAddChip = useCallback(
    (chip: ActionChip) => {
      onUpdate({ ...data, actions: [...data.actions, chip] });
    },
    [data, onUpdate],
  );

  // -----------------------------------
  // チップを削除する処理
  // -----------------------------------
  const handleRemoveChip = useCallback(
    (chipId: string) => {
      onUpdate({ ...data, actions: data.actions.filter((c) => c.id !== chipId) });
    },
    [data, onUpdate],
  );

  // -----------------------------------
  // 土地を増減する処理
  // -----------------------------------
  const handleLandChange = useCallback(
    (delta: number) => {
      const newLand = Math.max(0, data.land + delta);
      onUpdate({ ...data, land: newLand });
    },
    [data, onUpdate],
  );

  const handleLandInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      onUpdate({ ...data, land: isNaN(val) || val < 0 ? 0 : val });
    },
    [data, onUpdate],
  );

  // -----------------------------------
  // ライフを増減する処理
  // -----------------------------------
  const handleLifeChange = useCallback(
    (delta: number) => {
      onUpdate({ ...data, life: data.life + delta });
    },
    [data, onUpdate],
  );

  const handleLifeInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      onUpdate({ ...data, life: isNaN(val) ? 0 : val });
    },
    [data, onUpdate],
  );

  // -----------------------------------
  // ライフ履歴を記録する処理（「記録」ボタンを押したとき）
  // -----------------------------------
  const handleRecordLife = useCallback(() => {
    const entry = { life: data.life, recordedAt: new Date().toISOString() };
    onUpdate({ ...data, lifeHistory: [...data.lifeHistory, entry] });
  }, [data, onUpdate]);

  // -----------------------------------
  // ライフ履歴の特定エントリを削除する処理
  // -----------------------------------
  const handleRemoveLifeHistory = useCallback(
    (idx: number) => {
      const newHistory = data.lifeHistory.filter((_, i) => i !== idx);
      onUpdate({ ...data, lifeHistory: newHistory });
    },
    [data, onUpdate],
  );

  // -----------------------------------
  // 土地コントロール（上段に表示）
  // -----------------------------------
  const landControl = (
    <div className="flex items-center gap-0.5 shrink-0">
      <span className="text-xs text-stone-500 w-3.5 leading-none">🌲</span>
      <button
        onClick={() => handleLandChange(-1)}
        className="w-5 h-5 flex items-center justify-center rounded border border-slate-700 text-stone-400 hover:bg-slate-700 hover:text-stone-200 text-xs transition"
      >
        −
      </button>
      <input
        type="number"
        value={data.land}
        onChange={handleLandInput}
        className="w-7 bg-slate-800 text-stone-200 text-xs text-center border border-slate-700 rounded px-0 py-0.5 focus:outline-none focus:ring-1 focus:ring-stone-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        onClick={() => handleLandChange(1)}
        className="w-5 h-5 flex items-center justify-center rounded border border-slate-700 text-stone-400 hover:bg-slate-700 hover:text-stone-200 text-xs transition"
      >
        ＋
      </button>
    </div>
  );

  // -----------------------------------
  // ライフコントロール（上段に表示）
  // -----------------------------------
  const lifeControl = (
    <div className="flex items-center gap-0.5 shrink-0">
      <span className="text-xs text-stone-500 w-3.5 leading-none">❤</span>
      <button
        onClick={() => handleLifeChange(-1)}
        className="w-5 h-5 flex items-center justify-center rounded border border-slate-700 text-stone-400 hover:bg-slate-700 hover:text-stone-200 text-xs transition"
      >
        −
      </button>
      <input
        type="number"
        value={data.life}
        onChange={handleLifeInput}
        className="w-7 bg-slate-800 text-stone-200 text-xs text-center border border-slate-700 rounded px-0 py-0.5 focus:outline-none focus:ring-1 focus:ring-stone-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        onClick={() => handleLifeChange(1)}
        className="w-5 h-5 flex items-center justify-center rounded border border-slate-700 text-stone-400 hover:bg-slate-700 hover:text-stone-200 text-xs transition"
      >
        ＋
      </button>
    </div>
  );

  // -----------------------------------
  // ライフ履歴の下段（flex-wrap で幅が足りなければ改行する）
  // 個別 × ボタン + 記録ボタン
  // -----------------------------------
  const lifeHistoryRow = (
    <div className="flex flex-wrap items-center gap-0.5">
      {data.lifeHistory.map((entry, idx) => (
        <span key={idx} className="inline-flex items-center text-xs text-stone-500">
          {/* → 区切り（最初のエントリ以外に表示） */}
          {idx > 0 && <span className="text-stone-700 mx-0.5">→</span>}
          {entry.life}
          {/* このエントリを削除するボタン */}
          <button
            onClick={() => handleRemoveLifeHistory(idx)}
            title="この記録を削除"
            className="text-stone-700 hover:text-stone-400 transition leading-none ml-0.5"
          >
            ×
          </button>
        </span>
      ))}
      {/* 現在のライフ値を履歴に追記するボタン */}
      <button
        onClick={handleRecordLife}
        title="現在のライフを履歴に記録する"
        className="text-xs px-1.5 py-0.5 border border-slate-700 text-stone-500 rounded hover:bg-slate-700 hover:text-stone-300 hover:border-stone-600 transition whitespace-nowrap"
      >
        記録
      </button>
    </div>
  );

  return (
    <div
      className={`
        flex flex-col gap-1 p-2 rounded-lg border
        ${isActive ? 'border-slate-600 bg-slate-900/60' : 'border-transparent'}
        transition-colors duration-150
      `}
    >
      {/* ===== 自分側（左）レイアウト ===== */}
      {side === 'my' && (
        <>
          {/* 上段: [T番号] [Action欄] [土地] [ライフ] */}
          <div className="flex items-start gap-1">
            <span className="text-xs font-bold text-stone-500 w-6 shrink-0 pt-2 text-center">
              T{turnNumber}
            </span>
            <div className="flex-1 min-w-0">
              <ActionChipField
                chips={data.actions}
                isActive={isActive}
                onActivate={() => onActivate(fieldId)}
                onAddChip={handleAddChip}
                onRemoveChip={handleRemoveChip}
                placeholder="カードをタップして追加"
              />
            </div>
            {landControl}
            {lifeControl}
          </div>
          {/* 下段: ライフ履歴（T番号の幅分インデント） */}
          <div className="ml-7">
            {lifeHistoryRow}
          </div>
        </>
      )}

      {/* ===== 相手側（右）レイアウト ===== */}
      {side === 'opponent' && (
        <>
          {/* 上段: [ライフ] [土地] [Action欄] [T番号] */}
          <div className="flex items-start gap-1">
            {lifeControl}
            {landControl}
            <div className="flex-1 min-w-0">
              <ActionChipField
                chips={data.actions}
                isActive={isActive}
                onActivate={() => onActivate(fieldId)}
                onAddChip={handleAddChip}
                onRemoveChip={handleRemoveChip}
                placeholder="相手の行動を追加"
              />
            </div>
            <span className="text-xs font-bold text-stone-500 w-6 shrink-0 pt-2 text-center">
              T{turnNumber}
            </span>
          </div>
          {/* 下段: ライフ履歴（T番号の幅分インデント） */}
          <div className="mr-7">
            {lifeHistoryRow}
          </div>
        </>
      )}
    </div>
  );
};

export default TurnRow;
