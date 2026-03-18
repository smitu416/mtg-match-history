// ==========================================
// TurnRow コンポーネント
// ==========================================
// 1ターン分の行を表示するコンポーネント。
// 自分側と相手側それぞれで使い回す。
//
// レイアウト（1ターン = 2段構成）:
// 上段: [ターン番号] [Action欄（チップ + フリーメモ）] [土地: −/数/+]
//                                                        [ライフ: −/数/+]
// 下段:             [ライフ履歴: 20→18→15 × × ×] [記録ボタン]
//
// 注意: 外側の div に h-full を持たせることで、
//       親の grid セル（TurnHistoryPage の paired grid）の高さいっぱいに伸びる。
//
// inheritedLife: 前ターンから引き継ぐライフ値。ユーザーが操作するまで
//               このターンのライフとして表示する（lifeIsSet=false のとき）。

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
  activeFieldId: string | null; // 現在アクティブなフィールドのID（未使用だが将来拡張用）
  fieldId: string;           // このAction欄のユニークID（例: "t1-my"）
  onActivate: (fieldId: string) => void; // アクティブにするときのコールバック
  onUpdate: (data: PlayerTurnData) => void; // データを更新するときのコールバック
  inheritedLife?: number;    // 前ターンから引き継ぐライフ値（未操作時に表示する）
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
  inheritedLife,
}) => {
  // -----------------------------------
  // 実際に表示・操作に使うライフ値を決定する
  // lifeIsSet=true ならユーザーが明示的に設定した data.life を使う
  // lifeIsSet=false/undefined なら前ターンから引き継いだ inheritedLife を使う
  // inheritedLife も undefined なら data.life にフォールバックする
  // -----------------------------------
  const displayedLife = (data.lifeIsSet ?? false)
    ? data.life
    : (inheritedLife ?? data.life);

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
  // フリーテキストを更新する処理
  // -----------------------------------
  const handleFreeTextChange = useCallback(
    (text: string) => {
      onUpdate({ ...data, freeText: text });
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
  // displayedLife を起点にすることで、前ターン引き継ぎ値から正しく増減できる
  // -----------------------------------
  const handleLifeChange = useCallback(
    (delta: number) => {
      // displayedLife（表示値）を起点に増減し、以降は data.life として管理する
      onUpdate({ ...data, life: displayedLife + delta, lifeIsSet: true });
    },
    [data, onUpdate, displayedLife],
  );

  const handleLifeInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      onUpdate({ ...data, life: isNaN(val) ? 0 : val, lifeIsSet: true });
    },
    [data, onUpdate],
  );

  // -----------------------------------
  // ライフ履歴を記録する処理（「記録」ボタンを押したとき）
  // displayedLife を記録する（前ターン引き継ぎ値も正しく記録される）
  // -----------------------------------
  const handleRecordLife = useCallback(() => {
    const entry = { life: displayedLife, recordedAt: new Date().toISOString() };
    onUpdate({ ...data, lifeHistory: [...data.lifeHistory, entry] });
  }, [data, onUpdate, displayedLife]);

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
  // 土地コントロール（縦並び上段）
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
  // ライフコントロール（縦並び下段）
  // displayedLife を表示・操作の起点にする
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
        value={displayedLife}
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
  // 土地・ライフを上下に積んだコントロール列
  // 上: 土地（🌲）、下: ライフ（❤）
  // -----------------------------------
  const counters = (
    <div className="flex flex-col gap-0.5 shrink-0">
      {landControl}
      {lifeControl}
    </div>
  );

  // -----------------------------------
  // ライフ履歴の下段
  // レイアウト: [記録ボタン（左固定）] [履歴エントリ（右側・flex-wrap）]
  // 記録ボタンは shrink-0 で常に左端に固定される
  // -----------------------------------
  const lifeHistoryRow = (
    <div className="flex items-start gap-1">
      {/* 記録ボタン: 左端に固定（位置が変わらない） */}
      <button
        onClick={handleRecordLife}
        title="現在のライフを履歴に記録する"
        className="text-xs px-1.5 py-0.5 border border-slate-700 text-stone-500 rounded hover:bg-slate-700 hover:text-stone-300 hover:border-stone-600 transition whitespace-nowrap shrink-0"
      >
        記録
      </button>
      {/* 履歴エントリ: 右側に並べ、溢れたら折り返す */}
      <div className="flex flex-wrap items-center gap-0.5">
        {data.lifeHistory.map((entry, idx) => (
          <span key={idx} className="inline-flex items-center text-xs text-stone-500">
            {idx > 0 && <span className="text-stone-700 mx-0.5">→</span>}
            {entry.life}
            <button
              onClick={() => handleRemoveLifeHistory(idx)}
              title="この記録を削除"
              className="text-stone-700 hover:text-stone-400 transition leading-none ml-0.5"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );

  return (
    // h-full: 親 grid の stretch で同ターン行が同じ高さになる
    <div
      className={`
        h-full flex flex-col gap-1 p-2 rounded-lg border
        ${isActive ? 'border-slate-600 bg-slate-900/60' : 'border-transparent'}
        transition-colors duration-150
      `}
    >
      {/* ===== 自分側（左）レイアウト ===== */}
      {side === 'my' && (
        <>
          {/* 上段: [T番号] [Action欄（チップ+メモ）] [土地/ライフ 縦並び] */}
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
                freeText={data.freeText ?? ''}
                onFreeTextChange={handleFreeTextChange}
                placeholder="カードをタップして追加"
              />
            </div>
            {/* 土地(上) + ライフ(下) の縦並び */}
            {counters}
          </div>
          {/* 下段: ライフ履歴 */}
          <div className="ml-7">
            {lifeHistoryRow}
          </div>
        </>
      )}

      {/* ===== 相手側（右）レイアウト ===== */}
      {side === 'opponent' && (
        <>
          {/* 上段: [土地/ライフ 縦並び] [Action欄（チップ+メモ）] [T番号] */}
          <div className="flex items-start gap-1">
            {/* 土地(上) + ライフ(下) の縦並び */}
            {counters}
            <div className="flex-1 min-w-0">
              <ActionChipField
                chips={data.actions}
                isActive={isActive}
                onActivate={() => onActivate(fieldId)}
                onAddChip={handleAddChip}
                onRemoveChip={handleRemoveChip}
                freeText={data.freeText ?? ''}
                onFreeTextChange={handleFreeTextChange}
                placeholder="相手の行動を追加"
              />
            </div>
            <span className="text-xs font-bold text-stone-500 w-6 shrink-0 pt-2 text-center">
              T{turnNumber}
            </span>
          </div>
          {/* 下段: ライフ履歴 */}
          <div className="mr-7">
            {lifeHistoryRow}
          </div>
        </>
      )}
    </div>
  );
};

export default TurnRow;
