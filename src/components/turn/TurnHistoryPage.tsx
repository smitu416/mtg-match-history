// ==========================================
// TurnHistoryPage コンポーネント
// ==========================================
// 「＋ 新規入力」から開く、ターン履歴記録のメイン画面。
//
// 画面構成:
// 1. ヘッダー（基本情報入力: 自分のデッキ・相手プレイヤー・相手デッキ）
// 2. ゲームタブ（G1 / G2 / G3）+ 先攻後攻トグル
// 3. デッキリスト + カードボタンパネル（横スクロール、上部固定）
// 4. 2カラムグリッド（自分 / 相手）← 同期スクロール
// 5. ターン増減ボタン

import React, { useState, useCallback, useRef } from 'react';
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
import { useMyDeckNames, useOpponentPlayerNames, useOpponentDeckNames } from '../../hooks/useDecks';
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
// 1ゲーム分の状態（カードリストは共通化したので含まない）
// -----------------------------------
interface GameState {
  playOrder: PlayOrder;
  turns: TurnData[];
}

// -----------------------------------
// 初期のゲーム状態を生成するヘルパー
// -----------------------------------
const createInitialGameState = (): GameState => ({
  playOrder: '先攻',
  turns: createDefaultTurns(),
});

// -----------------------------------
// デッキリストをパースするヘルパー関数
// 入力例: "4 稲妻\n24 山\n4 渦まく知識"
// 出力例: ["稲妻", "山", "渦まく知識"] （重複なし）
// -----------------------------------
const parseCardList = (raw: string): string[] => {
  const names = raw
    .split('\n')
    .map((line) => {
      const match = line.trim().match(/^\d+\s+(.+)$/);
      return match ? match[1].trim() : null;
    })
    .filter((name): name is string => name !== null);
  return [...new Set(names)];
};

// -----------------------------------
// 相手の行動ボタンの定義（固定3種類）
// -----------------------------------
const OPPONENT_ACTIONS = ['クリーチャー', '呪文', '除去'] as const;

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
  // datalist 候補（過去の入力から自動収集）
  // -----------------------------------
  const myDeckNames = useMyDeckNames();
  const opponentPlayerNames = useOpponentPlayerNames();
  const opponentDeckNames = useOpponentDeckNames();

  // -----------------------------------
  // デッキリスト（G1〜G3 共通）
  // カードボタンを生成するために使う。
  // -----------------------------------
  const [cardListRaw, setCardListRaw] = useState('');

  // デッキリスト表示/非表示の折りたたみ状態
  const [showCardList, setShowCardList] = useState(true);

  // デッキリストをパースしたカード名一覧
  const cardNames = parseCardList(cardListRaw);

  // -----------------------------------
  // 現在選択中のゲームタブ（G1/G2/G3）
  // -----------------------------------
  const [activeGame, setActiveGame] = useState<1 | 2 | 3>(1);

  // -----------------------------------
  // G1/G2/G3 それぞれのゲーム状態
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
  // 同期スクロール用の ref
  // leftColRef / rightColRef: 各列の scroll コンテナ
  // isSyncingRef: スクロールイベントが無限ループしないようにするフラグ
  // -----------------------------------
  const leftColRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

  // -----------------------------------
  // 左列がスクロールされたとき → 右列を同じ位置に合わせる
  // -----------------------------------
  const handleLeftScroll = useCallback(() => {
    // isSyncingRef が true の場合は右→左の同期中なのでスキップ（無限ループ防止）
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    if (rightColRef.current && leftColRef.current) {
      rightColRef.current.scrollTop = leftColRef.current.scrollTop;
    }
    isSyncingRef.current = false;
  }, []);

  // -----------------------------------
  // 右列がスクロールされたとき → 左列を同じ位置に合わせる
  // -----------------------------------
  const handleRightScroll = useCallback(() => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    if (leftColRef.current && rightColRef.current) {
      leftColRef.current.scrollTop = rightColRef.current.scrollTop;
    }
    isSyncingRef.current = false;
  }, []);

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
    const matchResult = fieldId.match(/^g\d+-t(\d+)-(my|opponent)$/);
    if (!matchResult) return null;
    return { turnIndex: parseInt(matchResult[1], 10), side: matchResult[2] as 'my' | 'opponent' };
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
    (
      turnIndex: number,
      side: 'my' | 'opponent',
      newData: import('../../types/turnHistory').PlayerTurnData,
    ) => {
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
      const newTurn = createDefaultTurnData(g.turns.length + 1, prev?.my, prev?.opponent);
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
  // 2. G1/G2/G3 の GameSession を保存する（cardListRaw は共通）
  // 3. MatchGroup に追加する
  // -----------------------------------
  const handleSave = async () => {
    if (!myDeck.trim() || !opponentPlayerName.trim()) return;
    if (isSaving) return;

    setIsSaving(true);
    try {
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

      // 各ゲームの GameSession を保存する（カードリストは共通）
      for (const gameNum of GAME_NUMBERS) {
        const gs = gameStates[gameNum];
        const session: GameSession = {
          id: `${matchId}-g${gameNum}`,
          matchId,
          gameNumber: gameNum,
          playOrder: gs.playOrder,
          cardListRaw,   // G1〜G3 共通のカードリスト
          turns: gs.turns,
          createdAt: now,
        };
        await saveGameSession(session);
      }

      await addMatchToGroup(matchId, now);
      onSave();
    } catch (err) {
      console.error('保存エラー:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // -----------------------------------
  // アクティブなAction欄が現在のゲームに属するかを確認する
  // カードボタンの有効/無効に使う
  // -----------------------------------
  const hasActiveField =
    activeFieldId !== null && activeFieldId.startsWith(`g${activeGame}-`);

  return (
    <div className="flex flex-col h-full gap-2">

      {/* ===== ヘッダー: 基本情報入力 ===== */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-stone-200">新規対戦入力</h2>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1 text-xs border border-slate-600 text-stone-400 rounded-lg hover:bg-slate-800 hover:text-stone-200 hover:border-stone-400 transition"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={!myDeck.trim() || !opponentPlayerName.trim() || isSaving}
              className="px-4 py-1 text-xs border border-stone-500 text-stone-200 font-semibold rounded-lg hover:bg-slate-800 hover:border-stone-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>

        {/* 基本情報フォーム */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-semibold text-stone-400 mb-0.5">
              自分のデッキ <span className="text-stone-600">*</span>
            </label>
            {/* list="..." で datalist と紐付ける → 過去の入力候補が表示される */}
            <input
              list="my-deck-list"
              value={myDeck}
              onChange={(e) => setMyDeck(e.target.value)}
              placeholder="例: ピナクル"
              className="w-full bg-slate-800 text-stone-200 border border-slate-600 rounded-lg px-2 py-1 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
            />
            <datalist id="my-deck-list">
              {myDeckNames.map((n) => <option key={n} value={n} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-400 mb-0.5">
              相手プレイヤー <span className="text-stone-600">*</span>
            </label>
            <input
              list="opponent-player-list"
              value={opponentPlayerName}
              onChange={(e) => setOpponentPlayerName(e.target.value)}
              placeholder="例: まさっち"
              className="w-full bg-slate-800 text-stone-200 border border-slate-600 rounded-lg px-2 py-1 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
            />
            <datalist id="opponent-player-list">
              {opponentPlayerNames.map((n) => <option key={n} value={n} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-400 mb-0.5">
              相手デッキ
            </label>
            <input
              list="opponent-deck-list"
              value={opponentDeck}
              onChange={(e) => setOpponentDeck(e.target.value)}
              placeholder="例: カニL/O"
              className="w-full bg-slate-800 text-stone-200 border border-slate-600 rounded-lg px-2 py-1 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
            />
            <datalist id="opponent-deck-list">
              {opponentDeckNames.map((n) => <option key={n} value={n} />)}
            </datalist>
          </div>
        </div>
      </div>

      {/* ===== ゲームタブ（G1 / G2 / G3）+ 先攻後攻トグル ===== */}
      <div className="flex items-center gap-2">
        {/* タブ */}
        <div className="flex gap-0.5 bg-slate-900 rounded-lg border border-slate-700 p-0.5">
          {GAME_NUMBERS.map((num) => (
            <button
              key={num}
              onClick={() => setActiveGame(num)}
              className={`
                px-4 py-1 rounded-md text-xs font-semibold transition
                ${
                  activeGame === num
                    ? 'bg-slate-700 text-stone-100'
                    : 'text-stone-500 hover:text-stone-300'
                }
              `}
            >
              G{num}
            </button>
          ))}
        </div>

        {/* 先攻後攻 */}
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
          G{activeGame}: {currentGame.playOrder}
        </button>
      </div>

      {/* ===== デッキリスト + カードボタンパネル（上部横長固定） ===== */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-2">

        {/* デッキリスト折りたたみ */}
        <button
          onClick={() => setShowCardList((prev) => !prev)}
          className="w-full flex items-center justify-between text-xs text-stone-400 hover:text-stone-200 transition mb-1"
        >
          <span className="font-semibold">デッキリスト（G1〜G3 共通）</span>
          <span>{showCardList ? '▲' : '▼'}</span>
        </button>

        {showCardList && (
          <textarea
            value={cardListRaw}
            onChange={(e) => setCardListRaw(e.target.value)}
            placeholder={'4 稲妻\n4 渦まく知識\n24 山'}
            rows={4}
            className="w-full bg-slate-800 text-stone-300 border border-slate-700 rounded-lg p-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-stone-500 placeholder-slate-600 font-mono"
          />
        )}

        {/* カードボタン + 相手行動ボタン（横スクロール） */}
        <div className="flex items-start gap-2 mt-1.5">

          {/* 自分のカードボタン（横スクロール） */}
          <div className="flex-1 min-w-0 overflow-x-auto">
            {cardNames.length > 0 ? (
              <div className="flex gap-1 pb-1">
                {cardNames.map((name) => (
                  <button
                    key={name}
                    onClick={() => handleChipSelected({ label: name, type: 'card' })}
                    disabled={!hasActiveField}
                    className={`
                      text-xs px-2 py-1 rounded-full border transition whitespace-nowrap
                      ${
                        hasActiveField
                          ? 'border-stone-500 text-stone-200 bg-slate-800 hover:bg-slate-700 hover:border-stone-400 cursor-pointer'
                          : 'border-slate-700 text-stone-600 bg-slate-900 cursor-not-allowed'
                      }
                    `}
                  >
                    {name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-stone-600 py-1">
                {showCardList ? 'デッキリストを入力するとボタンが表示されます' : 'デッキリストを開いてカードを入力'}
              </p>
            )}
          </div>

          {/* 相手行動ボタン（右端、縦並び） */}
          <div className="flex gap-1 shrink-0">
            {OPPONENT_ACTIONS.map((action) => (
              <button
                key={action}
                onClick={() => handleChipSelected({ label: action, type: 'opponent_action' })}
                disabled={!hasActiveField}
                className={`
                  text-xs px-2 py-1 rounded-lg border transition whitespace-nowrap
                  ${
                    hasActiveField
                      ? 'border-stone-600 text-stone-300 bg-slate-800 hover:bg-slate-700 hover:border-stone-400 cursor-pointer'
                      : 'border-slate-700 text-stone-600 bg-slate-900 cursor-not-allowed'
                  }
                `}
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        {/* アクティブフィールドがない時のヒント */}
        {!hasActiveField && (
          <p className="text-xs text-stone-700 mt-1">
            Action欄をタップして有効化するとボタンが使えます
          </p>
        )}
      </div>

      {/* ===== 2カラム: 自分のターン列 / 相手のターン列（同期スクロール） ===== */}
      <div className="flex gap-2 flex-1 min-h-0">

        {/* ----- 左列: 自分のターン ----- */}
        <div
          ref={leftColRef}
          onScroll={handleLeftScroll}
          className="flex-1 min-w-0 flex flex-col gap-1 overflow-y-auto"
        >
          {/* ヘッダー行（sticky で常に見える） */}
          <p className="text-xs font-semibold text-stone-400 sticky top-0 bg-slate-950 py-1 z-10">
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

        {/* ----- 右列: 相手のターン ----- */}
        <div
          ref={rightColRef}
          onScroll={handleRightScroll}
          className="flex-1 min-w-0 flex flex-col gap-1 overflow-y-auto"
        >
          <p className="text-xs font-semibold text-stone-400 sticky top-0 bg-slate-950 py-1 text-right z-10">
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
      <div className="flex items-center gap-2 pb-1">
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
