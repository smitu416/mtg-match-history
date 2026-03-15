// ==========================================
// MTG対戦履歴アプリ - メインコンポーネント
// ==========================================
// このファイルはアプリ全体の骨格となるコンポーネント。
// ナビゲーション（タブ切り替え）とページの出し分けを管理する。

import { useState } from 'react';
import { MatchList } from './components/match/MatchList';
import { MatchForm } from './components/match/MatchForm';
import { PlayerStats } from './components/stats/PlayerStats';
import { DeckStats } from './components/stats/DeckStats';
import { CsvImportModal } from './components/CsvImportModal';
import './index.css';

// -----------------------------------
// 表示するページを表す型
// -----------------------------------
type Page = 'list' | 'new' | 'stats';

// -----------------------------------
// App コンポーネント本体
// -----------------------------------
function App() {
  // 現在表示しているページ（デフォルトは対戦一覧）
  const [currentPage, setCurrentPage] = useState<Page>('list');

  // CSVインポートモーダルを表示するかどうか
  const [showImportModal, setShowImportModal] = useState(false);

  // ===================================
  // 表示部分（JSX）
  // ===================================
  return (
    <div className="min-h-screen bg-slate-950">

      {/* ===== ヘッダー ===== */}
      <header className="bg-slate-900 border-b border-slate-700 shadow-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* アプリタイトル */}
          <h1 className="text-xl font-bold text-amber-400 tracking-wide">MTG 対戦履歴</h1>

          {/* 右側のボタン群 */}
          <div className="flex gap-2">
            {/* CSVインポートボタン */}
            <button
              onClick={() => setShowImportModal(true)}
              className="text-slate-400 hover:text-amber-400 text-sm transition px-2 py-1"
            >
              CSVインポート
            </button>

            {/* 新規入力ボタン */}
            <button
              onClick={() => setCurrentPage('new')}
              className="bg-amber-500 text-slate-900 font-semibold px-4 py-1.5 rounded-lg
                         text-sm hover:bg-amber-400 transition"
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
      <main className="max-w-2xl mx-auto px-4 py-5">

        {/* 対戦一覧ページ */}
        {currentPage === 'list' && <MatchList />}

        {/* 新規入力ページ */}
        {currentPage === 'new' && (
          <MatchForm
            onSave={() => setCurrentPage('list')}   // 保存後は一覧に戻る
            onCancel={() => setCurrentPage('list')} // キャンセルも一覧に戻る
          />
        )}

        {/* 戦績ページ */}
        {currentPage === 'stats' && (
          <div className="space-y-5">
            <PlayerStats />
            <DeckStats />
          </div>
        )}
      </main>

      {/* CSVインポートモーダル（表示/非表示は showImportModal で切り替え） */}
      {showImportModal && (
        <CsvImportModal onClose={() => setShowImportModal(false)} />
      )}
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
          ? 'bg-slate-950 text-amber-400 border-t border-x border-slate-700'
          : 'text-slate-500 hover:text-stone-300'
      }`}
    >
      {label}
    </button>
  );
}

export default App;
