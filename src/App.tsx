// ==========================================
// MTG対戦履歴アプリ - メインコンポーネント
// ==========================================
// このファイルはアプリ全体の骨格となるコンポーネント。
// ナビゲーション（タブ切り替え）とページの出し分けを管理する。

import { useState } from 'react';
import { MatchList } from './components/match/MatchList';
import { MatchForm } from './components/match/MatchForm';
import type { Match } from './types';
import { PlayerStats } from './components/stats/PlayerStats';
import { DeckStats, DeckDetailStats } from './components/stats/DeckStats';
import { OverallStats } from './components/stats/OverallStats';
import { CsvImportModal } from './components/CsvImportModal';
import TurnHistoryPage from './components/turn/TurnHistoryPage';
import './index.css';

// -----------------------------------
// 表示するページを表す型
// 'turn-history' = ターン履歴入力ページ（新規入力の拡張版）
// -----------------------------------
type Page = 'list' | 'new' | 'stats' | 'turn-history';

// -----------------------------------
// App コンポーネント本体
// -----------------------------------
function App() {
  // 現在表示しているページ（デフォルトは対戦一覧）
  const [currentPage, setCurrentPage] = useState<Page>('list');

  // CSVインポートモーダルを表示するかどうか
  const [showImportModal, setShowImportModal] = useState(false);

  // 編集中の対戦データ（TurnHistoryPage に渡す）
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  // ===================================
  // 表示部分（JSX）
  // ===================================
  return (
    <div className="min-h-screen bg-slate-950">

      {/* ===== ヘッダー ===== */}
      <header className="bg-slate-900 border-b border-slate-700 shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* アプリタイトル */}
          <h1 className="text-xl font-bold text-stone-100 tracking-wide">MTG 対戦履歴</h1>

          {/* 右側のボタン群 */}
          <div className="flex gap-2">
            {/* CSVインポートボタン */}
            <button
              onClick={() => setShowImportModal(true)}
              className="border border-stone-600 text-stone-400 hover:text-stone-200 hover:border-stone-400
                         text-sm transition px-3 py-1.5 rounded-lg"
            >
              CSVインポート
            </button>

            {/* 新規入力ボタン（クリックするとターン履歴入力ページに遷移） */}
            <button
              onClick={() => { setEditingMatch(null); setCurrentPage('turn-history'); }}
              className="border border-stone-500 text-stone-200 font-semibold px-4 py-1.5 rounded-lg
                         text-sm hover:bg-slate-800 hover:border-stone-300 transition"
            >
              ＋ 新規入力
            </button>
          </div>
        </div>

        {/* タブナビゲーション */}
        <nav className="max-w-2xl mx-auto px-4">
          <div className="flex gap-1">
            <TabButton
              label="対戦一覧"
              active={currentPage === 'list'}
              onClick={() => setCurrentPage('list')}
            />
            <TabButton
              label="戦績"
              active={currentPage === 'stats'}
              onClick={() => setCurrentPage('stats')}
            />
          </div>
        </nav>
      </header>

      {/* ===== メインコンテンツ ===== */}
      {/* ターン履歴ページは画面を広く使うので max-w-2xl の制限を外す */}
      <main className={currentPage === 'turn-history' ? 'px-3 py-3 h-[calc(100vh-7rem)] flex flex-col' : 'max-w-2xl mx-auto px-4 py-5'}>

        {/* 対戦一覧ページ */}
        {currentPage === 'list' && (
          <MatchList
            onEditMatch={(match) => {
              setEditingMatch(match);
              setCurrentPage('turn-history');
            }}
          />
        )}

        {/* 新規入力ページ（旧 MatchForm: 簡易入力用に残す） */}
        {currentPage === 'new' && (
          <MatchForm
            onSave={() => setCurrentPage('list')}   // 保存後は一覧に戻る
            onCancel={() => setCurrentPage('list')} // キャンセルも一覧に戻る
          />
        )}

        {/* ターン履歴入力ページ（新規 or 編集） */}
        {currentPage === 'turn-history' && (
          <TurnHistoryPage
            initialMatch={editingMatch ?? undefined}
            onSave={() => { setCurrentPage('list'); setEditingMatch(null); }}
            onCancel={() => { setCurrentPage('list'); setEditingMatch(null); }}
          />
        )}

        {/* 戦績ページ */}
        {currentPage === 'stats' && <StatsPage />}
      </main>

      {/* CSVインポートモーダル（表示/非表示は showImportModal で切り替え） */}
      {showImportModal && (
        <CsvImportModal onClose={() => setShowImportModal(false)} />
      )}
    </div>
  );
}

// ===================================
// 戦績ページコンポーネント（2×2 グリッド）
// ===================================
// 総合戦績 | プレイヤー別戦績
// デッキ別戦績 | 相手デッキ別戦績（選択中のデッキに対応）
function StatsPage() {
  // 選択中のデッキ名（DeckStats と DeckDetailStats で共有する）
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-2 gap-4">
      <OverallStats />
      <PlayerStats />
      <DeckStats selectedDeck={selectedDeck} onSelectDeck={setSelectedDeck} />
      <DeckDetailStats selectedDeck={selectedDeck} />
    </div>
  );
}

// ===================================
// タブボタンコンポーネント
// ===================================
interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
        active
          ? 'bg-slate-950 text-stone-100 border-t border-x border-slate-600'
          : 'text-stone-500 hover:text-stone-300'
      }`}
    >
      {label}
    </button>
  );
}

export default App;
