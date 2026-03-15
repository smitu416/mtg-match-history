// ==========================================
// TurnHistoryPage コンポーネント
// ==========================================
// 「＋ 新規入力」から開く、ターン履歴記録のメイン画面。
//
// 画面構成:
// 1. ヘッダー（基本情報入力: 自分のデッキ・相手プレイヤー・相手デッキ）
// 2. ゲームタブ（G1 / G2 / G3 切り替え）
// 3. 3カラムグリッド:
//    左: 自分のターン列
//    中: カードリスト + 相手行動ボタン（中央パネル）
//    右: 相手のターン列
// 4. ターン増減ボタン

import React, { useState, useCallback } from 'react';
import type { PlayOrder } from '../../types';
import {
  type TurnData,
  type GameSession,
  type ActionChip,
  createDefaultTurns,
  createDefaultTurnData,
} from '../../types/turnHistory';
import { saveGameSession } from '../../hooks/useGameSessions';
import { addMatchToGroup } from '../../hooks/useMatchGroups';
import { addMatch } from '../../hooks/useMatches';
import CardButtonPanel from './CardButtonPanel';
import TurnRow from './TurnRow';

// -----------------------------------
// このコンポーネントが受け取るプロパティの型
// -----------------------------------
interface TurnHistoryPageProps {
  onSave: () => void;    // 保存完了後に呼ばれる（一覧に戻るなど）
  onCancel: () => void;  // キャンセルして一覧に戻るとき
}

// -----------------------------------
// ゲームタブのデータ定義
// -----------------------------------
const GAME_NUMBERS = [1, 2, 3] as const;

// -----------------------------------
// 1ゲーム分の状態
// -----------------------------------
interface GameState {
  playOrder: PlayOrder;
  cardListRaw: string;
  turns: TurnData[];
}

// -----------------------------------
// 初期のゲーム状態を生成するヘルパー
// -----------------------------------
const createInitialGameState = (): GameState => ({
  playOrder: '先攻',
  cardListRaw: '',
  turns: createDefaultTurns(),
});

// -----------------------------------
// TurnHistoryPage コンポーネント
// -----------------------------------
const TurnHistoryPage: React.FC<TurnHistoryPageProps> = ({ onSave, onCancel }) => {
  // -----------------------------------
  // 基本情報（ヘッダー部分）の状態
  // -----------------------------------
  const [myDeck, setMyDeck] = useState('');
  const [opponentPlayerName, setOpponentPlayerName] = useState('');
  const [opponentDeck, setOpponentDeck] = useState('');

  // -----------------------------------
  // 現在選択中のゲームタブ（G1/G2/G3）
  // -----------------------------------
  const [activeGame, setActiveGame] = useState<1 | 2 | 3>(1);

  // -----------------------------------
  // G1/G2/G3 それぞれのゲーム状態
  // key は 1, 2, 3
  // -----------------------------------
  const [gameStates, setGameStates] = useState<Record<1 | 2 | 3, GameState>>({
    1: createInitialGameState(),
    2: createInitialGameState(),
    3: createInitialGameState(),
  });

  // -----------------------------------
  // 現在アクティブなAction欄のID
  // 例: "g1-t3-my" = G1の3ターン目の自分のAction欄
  // null = どのAction欄もアクティブでない
  // -----------------------------------
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  // -----------------------------------
  // 保存中フラグ（二重送信防止）
  // -----------------------------------
  const [isSaving, setIsSaving] = useState(false);

  // -----------------------------------
  // 現在のゲーム状態を取得するヘルパー
  // -----------------------------------
  const currentGame = gameStates[activeGame];

  // -----------------------------------
  // 現在のゲームの状態を更新するヘルパー
  // -----------------------------------
  const updateCurrentGame = useCallback(
    (updater: (prev: GameState) => GameState) => {
      setGameStates((prev) => ({
        ...prev,
        [activeGame]: updater(prev[activeGame]),
      }));
    },
    [activeGame],
  );

  // -----------------------------------
  // カードリスト変更
  // -----------------------------------
  const handleCardListChange = useCallback(
    (raw: string) => {
      updateCurrentGame((g) => ({ ...g, cardListRaw: raw }));
    },
    [updateCurrentGame],
  );

  // -----------------------------------
  // 先攻/後攻トグル
  // -----------------------------------
  const togglePlayOrder = useCallback(() => {
    updateCurrentGame((g) => ({
      ...g,
      playOrder: g.playOrder === '先攻' ? '後攻' : '先攻',
    }));
  }, [updateCurrentGame]);

  // -----------------------------------
  // Action欄をアクティブ化する
  // すでにアクティブな場合は非アクティブにする（トグル）
  // -----------------------------------
  const handleActivateField = useCallback((fieldId: string) => {
    setActiveFieldId((prev) => (prev === fieldId ? null : fieldId));
  }, []);

  // -----------------------------------
  // アクティブなAction欄のインデックスを取得するヘルパー
  // fieldId 形式: "g{gameNum}-t{turnIndex}-{side}"
  // -----------------------------------
  const parseFieldId = (
    fieldId: string,
  ): { turnIndex: number; side: 'my' | 'opponent' } | null => {
    const match = fieldId.match(/^g\d+-t(\d+)-(my|opponent)$/);
    if (!match) return null;
    return { turnIndex: parseInt(match[1], 10), side: match[2] as 'my' | 'opponent' };
  };

  // -----------------------------------
  // カードボタン/相手行動ボタンが押されたとき
  // アクティブなAction欄にチップを追加する
  // -----------------------------------
  const handleChipSelected = useCallback(
    (chipBase: Omit<ActionChip, 'id'>) => {
      if (!activeFieldId) return;
      const parsed = parseFieldId(activeFieldId);
      if (!parsed) return;

      const { turnIndex, side } = parsed;
      const newChip: ActionChip = {
        ...chipBase,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      };

      updateCurrentGame((g) => {
        const newTurns = g.turns.map((t, i) => {
          if (i !== turnIndex) return t;
          // 対象のターン・サイドのアクションにチップを追加
          return {
            ...t,
            [side]: { ...t[side], actions: [...t[side].actions, newChip] },
          };
        });
        return { ...g, turns: newTurns };
      });
    },
    [activeFieldId, updateCurrentGame],
  );

  // -----------------------------------
  // 特定ターン・サイドのPlayerTurnDataを更新する
  // -----------------------------------
  const handleTurnUpdate = useCallback(
    (turnIndex: number, side: 'my' | 'opponent', newData: import('../../types/turnHistory').PlayerTurnData) => {
      updateCurrentGame((g) => {
        const newTurns = g.turns.map((t, i) => {
          if (i !== turnIndex) return t;
          return { ...t, [side]: newData };
        });
        return { ...g, turns: newTurns };
      });
    },
    [updateCurrentGame],
  );

  // -----------------------------------
  // ターンを追加する（末尾に1ターン追加）
  // 前のターンの土地・ライフを引き継ぐ
  // -----------------------------------
  const handleAddTurn = useCallback(() => {
    updateCurrentGame((g) => {
      const prev = g.turns[g.turns.length - 1];
      const newTurn = createDefaultTurnData(
        g.turns.length + 1,
        prev?.my,
        prev?.opponent,
      );
      return { ...g, turns: [...g.turns, newTurn] };
    });
  }, [updateCurrentGame]);

  // -----------------------------------
  // ターンを削除する（末尾から1ターン削除）
  // 最低1ターンは残す
  // -----------------------------------
  const handleRemoveTurn = useCallback(() => {
    updateCurrentGame((g) => {
      if (g.turns.length <= 1) return g;
      return { ...g, turns: g.turns.slice(0, -1) };
    });
  }, [updateCurrentGame]);

  // -----------------------------------
  // 保存処理
  // 1. Matchレコードを作成する
  // 2. G1/G2/G3の GameSession を保存する
  // 3. MatchGroup に追加する
  // -----------------------------------
  const handleSave = async () => {
    if (!myDeck.trim() || !opponentPlayerName.trim()) return;
    if (isSaving) return;

    setIsSaving(true);
    try {
      // Match を作成する（勝敗は「ー」で初期化）
      // addMatch は生成されたIDの文字列を返す
      const now = new Date().toISOString();
      const matchId = await addMatch({
        myDeck: myDeck.trim(),
        opponentPlayerName: opponentPlayerName.trim(),
        opponentDeck: opponentDeck.trim(),
        playOrder: gameStates[1].playOrder, // G1の先攻後攻をデフォルトとして使用
        game1: { outcome: 'ー', notes: '' },
        game2: { outcome: 'ー', notes: '' },
        game3: { outcome: 'ー', notes: '' },
      });

      // 各ゲームの GameSession を保存する
      for (const gameNum of GAME_NUMBERS) {
        const gs = gameStates[gameNum];
        const session: GameSession = {
          id: `${matchId}-g${gameNum}`,
          matchId,
          gameNumber: gameNum,
          playOrder: gs.playOrder,
          cardListRaw: gs.cardListRaw,
          turns: gs.turns,
          createdAt: now,
        };
        await saveGameSession(session);
      }

      // MatchGroup に追加する（日付でグループ化）
      await addMatchToGroup(matchId, now);

      onSave();
    } catch (err) {
      console.error('保存エラー:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // -----------------------------------
  // アクティブなAction欄がどの fieldId に属するか確認して
  // CardButtonPanel に渡す hasActiveField フラグを計算する
  // -----------------------------------
  const hasActiveField =
    activeFieldId !== null && activeFieldId.startsWith(`g${activeGame}-`);

  return (
    // 全体コンテナ: 画面全体を使う
    <div className="flex flex-col h-full gap-3">

      {/* ===== ヘッダー: 基本情報入力 ===== */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-stone-200">新規対戦入力</h2>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-sm border border-slate-600 text-stone-400 rounded-lg hover:bg-slate-800 hover:text-stone-200 hover:border-stone-400 transition"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={!myDeck.trim() || !opponentPlayerName.trim() || isSaving}
              className="px-4 py-1.5 text-sm border border-stone-500 text-stone-200 font-semibold rounded-lg hover:bg-slate-800 hover:border-stone-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>

        {/* 基本情報フォーム */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              自分のデッキ <span className="text-stone-500">*</span>
            </label>
            <input
              value={myDeck}
              onChange={(e) => setMyDeck(e.target.value)}
              placeholder="例: ピナクル"
              className="w-full bg-slate-800 text-stone-200 border border-slate-600 rounded-lg px-3 py-1.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              相手プレイヤー <span className="text-stone-500">*</span>
            </label>
            <input
              value={opponentPlayerName}
              onChange={(e) => setOpponentPlayerName(e.target.value)}
              placeholder="例: まさっち"
              className="w-full bg-slate-800 text-stone-200 border border-slate-600 rounded-lg px-3 py-1.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              相手デッキ
            </label>
            <input
              value={opponentDeck}
              onChange={(e) => setOpponentDeck(e.target.value)}
              placeholder="例: カニL/O"
              className="w-full bg-slate-800 text-stone-200 border border-slate-600 rounded-lg px-3 py-1.5 text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
            />
          </div>
        </div>
      </div>

      {/* ===== ゲームタブ（G1 / G2 / G3） ===== */}
      <div className="flex gap-1 bg-slate-900 rounded-xl border border-slate-700 p-1">
        {GAME_NUMBERS.map((num) => (
          <button
            key={num}
            onClick={() => setActiveGame(num)}
            className={`
              flex-1 py-1.5 rounded-lg text-sm font-semibold transition
              ${
                activeGame === num
                  ? 'bg-slate-800 text-stone-100 border border-slate-600'
                  : 'text-stone-500 hover:text-stone-300'
              }
            `}
          >
            G{num}
          </button>
        ))}
      </div>

      {/* ===== G1/G2/G3 の先攻後攻 ===== */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-stone-400">G{activeGame}の先攻後攻:</span>
        <button
          onClick={togglePlayOrder}
          className={`
            px-3 py-1 text-xs font-semibold rounded-lg border transition
            ${
              currentGame.playOrder === '先攻'
                ? 'border-stone-400 text-stone-200 bg-slate-800'
                : 'border-stone-600 text-stone-400 hover:bg-slate-800 hover:border-stone-400'
            }
          `}
        >
          {currentGame.playOrder}
        </button>
      </div>

      {/* ===== 3カラムグリッド ===== */}
      <div className="flex gap-2 flex-1 min-h-0">

        {/* ----- 左列: 自分のターン ----- */}
        <div className="flex-1 min-w-0 flex flex-col gap-1 overflow-y-auto">
          <p className="text-xs font-semibold text-stone-400 mb-1 sticky top-0 bg-slate-950 py-1">
            自分
          </p>
          {currentGame.turns.map((turn, i) => (
            <TurnRow
              key={i}
              turnNumber={turn.turnNumber}
              data={turn.my}
              side="my"
              isActive={activeFieldId === `g${activeGame}-t${i}-my`}
              activeFieldId={activeFieldId}
              fieldId={`g${activeGame}-t${i}-my`}
              onActivate={handleActivateField}
              onUpdate={(newData) => handleTurnUpdate(i, 'my', newData)}
            />
          ))}
        </div>

        {/* ----- 中央列: カードリスト + 相手行動ボタン ----- */}
        <div className="w-36 shrink-0 bg-slate-900 border border-slate-700 rounded-xl p-3 overflow-y-auto">
          <CardButtonPanel
            hasActiveField={hasActiveField}
            onChipSelected={handleChipSelected}
            cardListRaw={currentGame.cardListRaw}
            onCardListChange={handleCardListChange}
          />
        </div>

        {/* ----- 右列: 相手のターン ----- */}
        <div className="flex-1 min-w-0 flex flex-col gap-1 overflow-y-auto">
          <p className="text-xs font-semibold text-stone-400 mb-1 sticky top-0 bg-slate-950 py-1 text-right">
            相手
          </p>
          {currentGame.turns.map((turn, i) => (
            <TurnRow
              key={i}
              turnNumber={turn.turnNumber}
              data={turn.opponent}
              side="opponent"
              isActive={activeFieldId === `g${activeGame}-t${i}-opponent`}
              activeFieldId={activeFieldId}
              fieldId={`g${activeGame}-t${i}-opponent`}
              onActivate={handleActivateField}
              onUpdate={(newData) => handleTurnUpdate(i, 'opponent', newData)}
            />
          ))}
        </div>
      </div>

      {/* ===== ターン増減ボタン ===== */}
      <div className="flex items-center gap-2 pb-2">
        <span className="text-xs text-stone-500">{currentGame.turns.length}ターン</span>
        <button
          onClick={handleAddTurn}
          className="text-xs px-3 py-1.5 border border-slate-600 text-stone-400 rounded-lg hover:bg-slate-800 hover:text-stone-200 hover:border-stone-500 transition"
        >
          ＋ ターン追加
        </button>
        <button
          onClick={handleRemoveTurn}
          disabled={currentGame.turns.length <= 1}
          className="text-xs px-3 py-1.5 border border-slate-700 text-stone-500 rounded-lg hover:bg-slate-800 hover:text-stone-300 hover:border-stone-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          − ターン削除
        </button>
      </div>
    </div>
  );
};

export default TurnHistoryPage;
