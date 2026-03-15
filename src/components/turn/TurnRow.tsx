// ==========================================
// TurnRow コンポーネント
// ==========================================
// 1ターン分の行を表示するコンポーネント。
// 自分側と相手側それぞれで使い回す。
//
// 1行の構成:
// [ターン番号] [Action欄（チップ表示）] [土地 −/数値/+]
// [ライフ −/数値/+] [履歴: 20→18] [記録ボタン]

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
  // 外部（CardButtonPanel）から ActionChipField 経由で呼ばれる
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
      const newLand = Math.max(0, data.land + delta); // 0以下にはならないようにする
      onUpdate({ ...data, land: newLand });
    },
    [data, onUpdate],
  );

  const handleLandInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      // 数値でない場合や負の値は 0 にする
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
  // ライフ履歴を "20→18→15" 形式の文字列に変換する
  // -----------------------------------
  const lifeHistoryText = data.lifeHistory.map((e) => e.life).join('→');

  // -----------------------------------
  // 土地・ライフの操作UI（自分・相手共通）
  // -----------------------------------
  const landLifeControls = (
    <div className="flex flex-col gap-1 shrink-0">
      {/* 土地 */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-stone-500 w-4">🌲</span>
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
          className="w-8 bg-slate-800 text-stone-200 text-xs text-center border border-slate-700 rounded px-0.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-stone-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={() => handleLandChange(1)}
          className="w-5 h-5 flex items-center justify-center rounded border border-slate-700 text-stone-400 hover:bg-slate-700 hover:text-stone-200 text-xs transition"
        >
          ＋
        </button>
      </div>

      {/* ライフ */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-stone-500 w-4">❤</span>
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
          className="w-8 bg-slate-800 text-stone-200 text-xs text-center border border-slate-700 rounded px-0.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-stone-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={() => handleLifeChange(1)}
          className="w-5 h-5 flex items-center justify-center rounded border border-slate-700 text-stone-400 hover:bg-slate-700 hover:text-stone-200 text-xs transition"
        >
          ＋
        </button>
      </div>

      {/* ライフ履歴 */}
      <div className="flex items-center gap-1">
        {lifeHistoryText && (
          <span className="text-xs text-stone-500 truncate max-w-[5rem]" title={lifeHistoryText}>
            {lifeHistoryText}
          </span>
        )}
        <button
          onClick={handleRecordLife}
          title="現在のライフを履歴に記録する"
          className="text-xs px-1.5 py-0.5 border border-slate-700 text-stone-500 rounded hover:bg-slate-700 hover:text-stone-300 hover:border-stone-600 transition whitespace-nowrap"
        >
          記録
        </button>
      </div>
    </div>
  );

  return (
    <div
      className={`
        flex items-start gap-2 p-2 rounded-lg border
        ${isActive ? 'border-slate-600 bg-slate-900/60' : 'border-transparent'}
        transition-colors duration-150
      `}
    >
      {/* ===== 自分側（左）レイアウト ===== */}
      {side === 'my' && (
        <>
          {/* ターン番号 */}
          <span className="text-xs font-bold text-stone-500 w-6 shrink-0 pt-2 text-center">
            T{turnNumber}
          </span>

          {/* Action欄 */}
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

          {/* 土地・ライフ操作 */}
          {landLifeControls}
        </>
      )}

      {/* ===== 相手側（右）レイアウト ===== */}
      {side === 'opponent' && (
        <>
          {/* 土地・ライフ操作（相手側は左に配置） */}
          {landLifeControls}

          {/* Action欄 */}
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

          {/* ターン番号（相手側は右に配置） */}
          <span className="text-xs font-bold text-stone-500 w-6 shrink-0 pt-2 text-center">
            T{turnNumber}
          </span>
        </>
      )}
    </div>
  );
};

export default TurnRow;
