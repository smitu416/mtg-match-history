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
import { useMatchGroups, updateGroupName } from '../../hooks/useMatchGroups';
import { MatchForm } from './MatchForm';
import type { Match, FilterOptions, SortOptions, SortField } from '../../types';

// -----------------------------------
// MatchList コンポーネント本体
// -----------------------------------
// onEditMatch が渡されると、編集ボタン押下時に外部コールバックを呼ぶ。
// 渡されない場合は内部の MatchForm にフォールバックする（後方互換性のため）。
interface MatchListProps {
  onEditMatch?: (match: Match) => void;
  onViewMatch?: (match: Match) => void; // 行クリックで詳細ビューを開く
}

export function MatchList({ onEditMatch, onViewMatch }: MatchListProps = {}) {
  // ===================================
  // フィルター・ソートの状態
  // ===================================
  const [filter, setFilter] = useState<FilterOptions>({});
  const [sort, setSort] = useState<SortOptions>({ field: 'id', order: 'desc' });

  // 編集中の対戦データ（onEditMatch が渡されない場合のみ使用）
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

  // グループ一覧をDBから取得する
  const matchGroups = useMatchGroups();

  // グループ表示モード（true=グループ別, false=フラットリスト）
  const [isGroupView, setIsGroupView] = useState(true);

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
  // 編集ハンドラー
  // onEditMatch が渡されている → App.tsx に委譲して TurnHistoryPage を開く
  // 渡されていない → 内部の MatchForm を表示（後方互換）
  // -----------------------------------
  const handleEdit = (match: Match) => {
    if (onEditMatch) {
      onEditMatch(match);
    } else {
      setEditingMatch(match);
    }
  };

  // -----------------------------------
  // 詳細表示ハンドラー（行クリック）
  // -----------------------------------
  const handleView = (match: Match) => {
    onViewMatch?.(match);
  };

  // -----------------------------------
  // 内部フォールバック: editingMatch がある場合は MatchForm を表示する
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
            className="px-3 py-1.5 text-sm text-stone-400 border border-stone-600
                       rounded-lg hover:bg-slate-800 hover:text-stone-200 hover:border-stone-400 transition"
          >
            クリア
          </button>

          {/* CSVエクスポートボタン */}
          <button
            onClick={handleExport}
            className="ml-auto px-3 py-1.5 text-sm border border-stone-600 text-stone-400
                       rounded-lg hover:bg-slate-800 hover:text-stone-200 hover:border-stone-400 transition"
          >
            CSVバックアップ
          </button>
        </div>

        {/* 件数表示 */}
        <p className="text-xs text-stone-500 mt-2">{matches.length} 件</p>
      </div>

      {/* ===== 表示切り替えボタン ===== */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-stone-500">表示:</span>
        <button
          onClick={() => setIsGroupView(true)}
          className={`text-xs px-3 py-1 rounded-lg border transition ${
            isGroupView
              ? 'border-stone-400 text-stone-200 bg-slate-800'
              : 'border-slate-700 text-stone-500 hover:border-stone-600 hover:text-stone-400'
          }`}
        >
          グループ
        </button>
        <button
          onClick={() => setIsGroupView(false)}
          className={`text-xs px-3 py-1 rounded-lg border transition ${
            !isGroupView
              ? 'border-stone-400 text-stone-200 bg-slate-800'
              : 'border-slate-700 text-stone-500 hover:border-stone-600 hover:text-stone-400'
          }`}
        >
          リスト
        </button>
      </div>

      {/* ===== 対戦一覧 ===== */}
      {matches.length === 0 ? (
        // データがない場合の表示
        <div className="text-center py-16 text-stone-500">
          <p className="text-lg">対戦データがありません</p>
          <p className="text-sm mt-1">「＋ 新規入力」から追加してください</p>
        </div>
      ) : isGroupView ? (
        // ===== グループ表示モード =====
        <GroupedMatchList
          matches={matches}
          matchGroups={matchGroups ?? []}
          onEdit={(match) => handleEdit(match)}
          onView={onViewMatch ? (match) => handleView(match) : undefined}
          onDelete={handleDelete}
        />
      ) : (
        // ===== フラットリスト表示モード =====
        <div className="space-y-2">
          {/* ソートボタン行 */}
          <div className="flex gap-2 text-xs text-stone-500 px-1">
            <SortButton label="ID" field="id" current={sort} onClick={handleSortChange} />
            <SortButton label="自分のデッキ" field="myDeck" current={sort} onClick={handleSortChange} />
            <SortButton label="相手" field="opponentPlayerName" current={sort} onClick={handleSortChange} />
          </div>

          {/* ヘッダー行 */}
          <div className="grid grid-cols-[1fr_3rem_2.5rem_2.5rem_2.5rem_5rem] px-3 py-1 text-xs text-stone-600 border-b border-slate-800">
            <span>対戦</span>
            <span className="text-center">先攻</span>
            <span className="text-center">G1</span>
            <span className="text-center">G2</span>
            <span className="text-center">G3</span>
            <span></span>
          </div>

          {/* 対戦カード一覧 */}
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onEdit={() => handleEdit(match)}
              onView={onViewMatch ? () => handleView(match) : undefined}
              onDelete={() => handleDelete(match)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ===================================
// サブコンポーネント: グループ別対戦一覧
// ===================================
// 試合を日付（createdAt）でグループ分けして表示する。
// DBに対応するMatchGroupがあればそのnameを使い、
// なければ createdAt から "yyyy/mm/dd" 形式のグループ名を生成する。
interface GroupedMatchListProps {
  matches: Match[];
  matchGroups: import('../../types/turnHistory').MatchGroup[];
  onEdit: (match: Match) => void;
  onView?: (match: Match) => void;
  onDelete: (match: Match) => void;
}

function GroupedMatchList({ matches, matchGroups, onEdit, onView, onDelete }: GroupedMatchListProps) {
  // 編集中のグループ名を管理する（groupId → 編集中テキスト）
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  // -----------------------------------
  // 試合を日付ごとにグループ化する（クライアントサイド処理）
  // DBのMatchGroupがあればそのnameを使う
  // -----------------------------------
  // 日付文字列（"2026-03-15"）からグループIDを生成する
  const getGroupId = (dateStr: string) => `group-${dateStr.replace(/-/g, '')}`;

  // 試合の createdAt から日付部分（"2026-03-15"）を取り出す
  const getDateKey = (createdAt: string) => createdAt.slice(0, 10);

  // 試合を日付ごとにグループ化する
  const grouped = matches.reduce<Map<string, Match[]>>((acc, match) => {
    const dateKey = getDateKey(match.createdAt);
    if (!acc.has(dateKey)) acc.set(dateKey, []);
    acc.get(dateKey)!.push(match);
    return acc;
  }, new Map());

  // グループを日付の新しい順にソートする
  const sortedDateKeys = [...grouped.keys()].sort((a, b) => b.localeCompare(a));

  // DBのMatchGroupをIDでマップ化しておく（O(1)検索のため）
  const groupMap = new Map(matchGroups.map((g) => [g.id, g]));

  // -----------------------------------
  // グループ名の取得（DBにあればDB名、なければ日付形式）
  // -----------------------------------
  const getGroupName = (dateKey: string): string => {
    const groupId = getGroupId(dateKey);
    const dbGroup = groupMap.get(groupId);
    if (dbGroup) return dbGroup.name;
    // DBにない場合は "yyyy/mm/dd" 形式に変換する
    const [yyyy, mm, dd] = dateKey.split('-');
    return `${yyyy}/${mm}/${dd}`;
  };

  // -----------------------------------
  // グループ名の編集開始
  // -----------------------------------
  const handleStartEdit = (dateKey: string) => {
    const groupId = getGroupId(dateKey);
    setEditingGroupId(groupId);
    setEditingGroupName(getGroupName(dateKey));
  };

  // -----------------------------------
  // グループ名の保存（Enter / blur 時）
  // -----------------------------------
  const handleSaveGroupName = async (groupId: string) => {
    if (editingGroupName.trim()) {
      await updateGroupName(groupId, editingGroupName.trim());
    }
    setEditingGroupId(null);
  };

  return (
    <div className="space-y-4">
      {sortedDateKeys.map((dateKey) => {
        const groupMatches = grouped.get(dateKey)!;
        const groupId = getGroupId(dateKey);
        const isEditing = editingGroupId === groupId;

        return (
          <div key={dateKey} className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden">
            {/* グループヘッダー（日付・グループ名） */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-700 bg-slate-800/50">
              {isEditing ? (
                // 編集中: テキスト入力を表示する
                <input
                  autoFocus
                  value={editingGroupName}
                  onChange={(e) => setEditingGroupName(e.target.value)}
                  onBlur={() => handleSaveGroupName(groupId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveGroupName(groupId);
                    if (e.key === 'Escape') setEditingGroupId(null);
                  }}
                  className="flex-1 bg-slate-800 text-stone-200 border border-stone-500 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
              ) : (
                // 通常時: グループ名をクリックで編集開始
                <button
                  onClick={() => handleStartEdit(dateKey)}
                  className="flex-1 text-left text-sm font-semibold text-stone-300 hover:text-stone-100 transition"
                  title="クリックしてグループ名を編集"
                >
                  {getGroupName(dateKey)}
                  <span className="ml-2 text-xs text-stone-600 font-normal">✏️</span>
                </button>
              )}
              {/* グループ内の件数 */}
              <span className="text-xs text-stone-500 shrink-0">{groupMatches.length}件</span>
            </div>

            {/* ヘッダー行（対戦 / 先攻 / G1 / G2 / G3 / 操作） */}
            <div className="grid grid-cols-[1fr_3rem_2.5rem_2.5rem_2.5rem_5rem] px-3 py-1 text-xs text-stone-600 border-b border-slate-800">
              <span>対戦</span>
              <span className="text-center">先攻</span>
              <span className="text-center">G1</span>
              <span className="text-center">G2</span>
              <span className="text-center">G3</span>
              <span></span>
            </div>

            {/* グループ内の対戦カード一覧 */}
            <div>
              {groupMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onEdit={() => onEdit(match)}
                  onView={onView ? () => onView(match) : undefined}
                  onDelete={() => onDelete(match)}
                />
              ))}
            </div>
          </div>
        );
      })}
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
  onView?: () => void;  // 行クリックで詳細ビューを開く
  onDelete: () => void;
}

function MatchCard({ match, onEdit, onView, onDelete }: MatchCardProps) {
  // 試合の勝敗（マッチ全体の結果）を計算する
  const wins = [match.game1, match.game2, match.game3].filter(
    (g) => g.outcome === '勝ち'
  ).length;
  const losses = [match.game1, match.game2, match.game3].filter(
    (g) => g.outcome === '負け'
  ).length;

  // マッチ全体の勝ち負けで左枠線の色を変える
  const borderColor =
    wins > losses ? 'border-l-green-600' : losses > wins ? 'border-l-red-700' : 'border-l-slate-600';

  return (
    // 1行グリッドレイアウト: [対戦] [先攻] [G1] [G2] [G3] [操作]
    // onView が渡されていれば行全体をクリック可能にする
    <div
      onClick={onView}
      className={`
        grid grid-cols-[1fr_3rem_2.5rem_2.5rem_2.5rem_5rem]
        items-center gap-1 px-3 py-2 border-l-4 ${borderColor}
        hover:bg-slate-800/30 transition
        ${onView ? 'cursor-pointer' : ''}
      `}
    >
      {/* 対戦の概要 */}
      <span className="text-sm text-stone-100 truncate min-w-0">
        {match.myDeck}
        <span className="text-stone-500 mx-1 text-xs">vs</span>
        {match.opponentDeck || '（不明）'}
        <span className="text-stone-500 text-xs ml-1">({match.opponentPlayerName})</span>
      </span>

      {/* 先攻/後攻 */}
      <span className="text-xs text-stone-400 text-center">{match.playOrder}</span>

      {/* G1 / G2 / G3 の結果バッジ */}
      <GameOutcomeBadge outcome={match.game1.outcome} />
      <GameOutcomeBadge outcome={match.game2.outcome} />
      <GameOutcomeBadge outcome={match.game3.outcome} />

      {/* 編集・削除ボタン */}
      <div className="flex gap-1 justify-end">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="text-xs px-2 py-0.5 border border-stone-600 text-stone-400
                     rounded hover:bg-slate-800 hover:text-stone-200 hover:border-stone-400 transition"
        >
          編集
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="text-xs px-2 py-0.5 border border-slate-700 text-stone-500
                     rounded hover:bg-slate-800 hover:text-red-400 hover:border-red-800 transition"
        >
          削除
        </button>
      </div>
    </div>
  );
}

// ===================================
// サブコンポーネント: ゲーム結果バッジ
// ===================================
// 勝ち=緑, 負け=赤, ー=グレー
type GameOutcome = '勝ち' | '負け' | 'ー';

function GameOutcomeBadge({ outcome }: { outcome: GameOutcome | string }) {
  // 結果ごとにスタイルを切り替える
  const styleMap: Record<string, string> = {
    '勝ち': 'text-green-400 font-semibold',
    '負け': 'text-red-400 font-semibold',
    'ー': 'text-stone-600',
  };
  const style = styleMap[outcome] ?? 'text-stone-600';
  return <span className={`text-xs text-center ${style}`}>{outcome}</span>;
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
      <label className="block text-xs text-stone-400 mb-0.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm bg-slate-800 text-stone-200 border border-slate-600 rounded-lg px-2 py-1.5
                   focus:outline-none focus:ring-2 focus:ring-stone-500"
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
      className={`flex items-center gap-0.5 hover:text-stone-200 transition ${
        isActive ? 'text-stone-200 font-medium' : ''
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
