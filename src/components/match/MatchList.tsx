// ==========================================
// 対戦一覧コンポーネント
// ==========================================
// 保存済みの対戦履歴を一覧表示する。
// ソート・フィルター・編集・削除機能も含む。

import { useState } from 'react';
import { useMatches, deleteMatch } from '../../hooks/useMatches';
import { useMyDeckNames, useOpponentPlayerNames, useOpponentDeckNames } from '../../hooks/useDecks';
import { exportMatchesToCsv } from '../../services/csvExport';
import { getAllMatches } from '../../hooks/useMatches';
import { MatchForm } from './MatchForm';
import type { Match, FilterOptions, SortOptions, SortField } from '../../types';

// -----------------------------------
// MatchList コンポーネント本体
// -----------------------------------
export function MatchList() {
  // ===================================
  // フィルター・ソートの状態
  // ===================================
  const [filter, setFilter] = useState<FilterOptions>({});
  const [sort, setSort] = useState<SortOptions>({ field: 'id', order: 'desc' });

  // 編集中の対戦データ（nullなら編集モードでない）
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  // -----------------------------------
  // DBから対戦データを取得する
  // -----------------------------------
  // useMatches は自動的にDBの変更を監視してくれる
  const matches = useMatches(filter, sort);

  // 補完候補（フィルタードロップダウン用）
  const myDeckNames = useMyDeckNames();
  const opponentPlayerNames = useOpponentPlayerNames();
  const opponentDeckNames = useOpponentDeckNames();

  // -----------------------------------
  // 削除ボタンが押されたときの処理
  // -----------------------------------
  const handleDelete = async (match: Match) => {
    // window.confirm でユーザーに確認を取る
    const ok = window.confirm(
      `「${match.myDeck} vs ${match.opponentDeck}（${match.id}）」を削除しますか？`
    );
    if (!ok) return;

    await deleteMatch(match.id);
  };

  // -----------------------------------
  // ソート変更の処理
  // -----------------------------------
  // 同じフィールドをクリックしたら昇順/降順を切り替える
  const handleSortChange = (field: SortField) => {
    setSort((prev) => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  // -----------------------------------
  // CSVエクスポートボタンの処理
  // -----------------------------------
  const handleExport = async () => {
    const allMatches = await getAllMatches();
    if (allMatches.length === 0) {
      alert('エクスポートする対戦データがありません');
      return;
    }
    exportMatchesToCsv(allMatches);
  };

  // -----------------------------------
  // 編集モードのとき MatchForm を表示する
  // -----------------------------------
  if (editingMatch) {
    return (
      <MatchForm
        initialMatch={editingMatch}
        onSave={() => setEditingMatch(null)}
        onCancel={() => setEditingMatch(null)}
      />
    );
  }

  // ===================================
  // 表示部分（JSX）
  // ===================================
  return (
    <div>
      {/* ===== フィルター・操作バー ===== */}
      <div className="bg-slate-900 rounded-xl border border-slate-700 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* 自分のデッキフィルター */}
          <FilterSelect
            label="自分のデッキ"
            value={filter.myDeck ?? ''}
            onChange={(v) => setFilter((f) => ({ ...f, myDeck: v || undefined }))}
            options={myDeckNames}
          />

          {/* 相手プレイヤーフィルター */}
          <FilterSelect
            label="相手プレイヤー"
            value={filter.opponentPlayerName ?? ''}
            onChange={(v) => setFilter((f) => ({ ...f, opponentPlayerName: v || undefined }))}
            options={opponentPlayerNames}
          />

          {/* 相手デッキフィルター */}
          <FilterSelect
            label="相手デッキ"
            value={filter.opponentDeck ?? ''}
            onChange={(v) => setFilter((f) => ({ ...f, opponentDeck: v || undefined }))}
            options={opponentDeckNames}
          />

          {/* フィルタークリアボタン */}
          <button
            onClick={() => setFilter({})}
            className="px-3 py-1.5 text-sm text-slate-400 border border-slate-600
                       rounded-lg hover:bg-slate-800 transition"
          >
            クリア
          </button>

          {/* CSVエクスポートボタン */}
          <button
            onClick={handleExport}
            className="ml-auto px-3 py-1.5 text-sm bg-green-700 text-white
                       rounded-lg hover:bg-green-600 transition"
          >
            CSVバックアップ
          </button>
        </div>

        {/* 件数表示 */}
        <p className="text-xs text-slate-500 mt-2">{matches.length} 件</p>
      </div>

      {/* ===== 対戦一覧テーブル ===== */}
      {matches.length === 0 ? (
        // データがない場合の表示
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg">対戦データがありません</p>
          <p className="text-sm mt-1">「＋ 新規入力」から追加してください</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* ソートボタン行 */}
          <div className="flex gap-2 text-xs text-slate-500 px-1">
            <SortButton label="ID" field="id" current={sort} onClick={handleSortChange} />
            <SortButton label="自分のデッキ" field="myDeck" current={sort} onClick={handleSortChange} />
            <SortButton label="相手" field="opponentPlayerName" current={sort} onClick={handleSortChange} />
          </div>

          {/* 対戦カード一覧 */}
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onEdit={() => setEditingMatch(match)}
              onDelete={() => handleDelete(match)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ===================================
// サブコンポーネント: 対戦カード
// ===================================
// 1試合分のデータをカード形式で表示する
interface MatchCardProps {
  match: Match;
  onEdit: () => void;
  onDelete: () => void;
}

function MatchCard({ match, onEdit, onDelete }: MatchCardProps) {
  // 試合の結果サマリー（G1/G2/G3）を表示用文字列に変換する
  const gameSummary = [match.game1, match.game2, match.game3]
    .map((g) => g.outcome)
    .join(' / ');

  // 試合の勝敗（マッチ全体の結果）を計算する
  const wins = [match.game1, match.game2, match.game3].filter(
    (g) => g.outcome === '勝ち'
  ).length;
  const losses = [match.game1, match.game2, match.game3].filter(
    (g) => g.outcome === '負け'
  ).length;

  // マッチ全体の勝ち負けで枠線の色を変える
  const borderColor =
    wins > losses ? 'border-l-green-500' : losses > wins ? 'border-l-red-500' : 'border-l-slate-600';

  return (
    <div className={`bg-slate-900 rounded-xl border border-slate-700 border-l-4 ${borderColor} p-4`}>
      {/* 上段: ID・デッキ情報・先攻後攻 */}
      <div className="flex items-start justify-between">
        <div>
          {/* ID（小さく表示） */}
          <span className="text-xs text-slate-500 font-mono">{match.id}</span>

          {/* 対戦の概要 */}
          <p className="font-semibold text-amber-100 mt-0.5">
            {match.myDeck}
            <span className="text-amber-700 mx-1 font-normal">vs</span>
            {match.opponentPlayerName}
            <span className="text-amber-300/70 text-sm font-normal ml-1">
              （{match.opponentDeck}）
            </span>
          </p>
        </div>

        {/* 先攻/後攻バッジ */}
        <span className={`
          text-xs px-2 py-0.5 rounded-full font-medium shrink-0
          ${match.playOrder === '先攻' ? 'bg-blue-900 text-blue-300' : 'bg-orange-900 text-orange-300'}
        `}>
          {match.playOrder}
        </span>
      </div>

      {/* 下段: ゲーム結果とボタン */}
      <div className="flex items-center justify-between mt-2">
        {/* ゲーム結果サマリー */}
        <span className="text-sm text-amber-300/80">{gameSummary}</span>

        {/* 編集・削除ボタン */}
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-xs px-2.5 py-1 border border-amber-700 text-amber-400
                       rounded-lg hover:bg-amber-900/30 transition"
          >
            編集
          </button>
          <button
            onClick={onDelete}
            className="text-xs px-2.5 py-1 border border-red-800 text-red-400
                       rounded-lg hover:bg-red-900/30 transition"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}

// ===================================
// サブコンポーネント: フィルタードロップダウン
// ===================================
interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-0.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm bg-slate-800 text-amber-100 border border-slate-600 rounded-lg px-2 py-1.5
                   focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        <option value="">すべて</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

// ===================================
// サブコンポーネント: ソートボタン
// ===================================
interface SortButtonProps {
  label: string;
  field: SortField;
  current: SortOptions;
  onClick: (field: SortField) => void;
}

function SortButton({ label, field, current, onClick }: SortButtonProps) {
  // このフィールドが現在のソート対象かどうか
  const isActive = current.field === field;

  return (
    <button
      onClick={() => onClick(field)}
      className={`flex items-center gap-0.5 hover:text-amber-400 transition ${
        isActive ? 'text-amber-400 font-medium' : ''
      }`}
    >
      {label}
      {/* ソートの向き矢印 */}
      {isActive && (
        <span>{current.order === 'asc' ? '↑' : '↓'}</span>
      )}
    </button>
  );
}
