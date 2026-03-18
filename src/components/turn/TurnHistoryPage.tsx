// ==========================================
// TurnHistoryPage コンポーネント
// ==========================================
// 「＋ 新規入力」または「編集」から開く、ターン履歴記録のメイン画面。
// initialMatch が渡された場合は編集モード、なければ新規作成モード。
//
// 画面構成:
// 1. ヘッダー（基本情報入力: 自分のデッキ・相手プレイヤー・相手デッキ）
// 2. ゲームタブ（G1 / G2 / G3）+ 先攻後攻トグル + 勝敗ボタン
// 3. デッキリスト + カードボタンパネル（横スクロール、上部固定）
// 4. 2カラムグリッド（自分 / 相手）← 単一スクロール
// 5. ターン増減ボタン

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Match, PlayOrder } from '../../types';
import type { GameOutcome } from '../../types';
import {
  type TurnData,
  type GameSession,
  type ActionChip,
  createDefaultTurns,
  createDefaultTurnData,
} from '../../types/turnHistory';
import { saveGameSession, useGameSessionsByMatchId } from '../../hooks/useGameSessions';
import { addMatchToGroup } from '../../hooks/useMatchGroups';
import { addMatch, updateMatch } from '../../hooks/useMatches';
import { useMyDeckNames, useOpponentPlayerNames, useOpponentDeckNames } from '../../hooks/useDecks';
import AutocompleteInput from '../AutocompleteInput';
import TurnRow from './TurnRow';

// -----------------------------------
// このコンポーネントが受け取るプロパティの型
// -----------------------------------
interface TurnHistoryPageProps {
  onSave: () => void;          // 保存完了後に呼ばれる（一覧に戻るなど）
  onCancel: () => void;        // キャンセルして一覧に戻るとき
  initialMatch?: Match;        // 編集対象の試合（undefined = 新規作成）
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
// デッキリストをパースしてカード名一覧を返すヘルパー関数
// 入力例: "4 稲妻\n24 山\n渦まく知識" （数字なしにも対応）
// 出力例: ["稲妻", "山", "渦まく知識"]（重複なし）
// -----------------------------------
const parseCardList = (raw: string): string[] => {
  const names = raw
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return null;
      // 「数字 スペース カード名」の形式にマッチする場合はカード名だけ取り出す
      const match = trimmed.match(/^\d+\s+(.+)$/);
      if (match) return match[1].trim();
      // 数字なし（カード名だけ）の場合はそのまま使用する
      return trimmed;
    })
    .filter((name): name is string => name !== null && name.length > 0);

  // Set で重複を除去する
  return [...new Set(names)];
};

// -----------------------------------
// 相手の行動ボタンの定義（固定3種類）
// -----------------------------------
const OPPONENT_ACTIONS = ['クリーチャー', '呪文', '除去'] as const;

// -----------------------------------
// 勝敗ボタンの定義
// -----------------------------------
const OUTCOMES: GameOutcome[] = ['勝ち', '負け', 'ー'];

// -----------------------------------
// TurnHistoryPage コンポーネント
// -----------------------------------
const TurnHistoryPage: React.FC<TurnHistoryPageProps> = ({ onSave, onCancel, initialMatch }) => {
  // 編集モードかどうか
  const isEditMode = Boolean(initialMatch);

  // -----------------------------------
  // 基本情報（ヘッダー部分）の状態
  // -----------------------------------
  const [myDeck, setMyDeck] = useState(initialMatch?.myDeck ?? '');
  const [opponentPlayerName, setOpponentPlayerName] = useState(initialMatch?.opponentPlayerName ?? '');
  const [opponentDeck, setOpponentDeck] = useState(initialMatch?.opponentDeck ?? '');

  // -----------------------------------
  // datalist 候補（過去の入力から自動収集）
  // -----------------------------------
  const myDeckNames = useMyDeckNames();
  const opponentPlayerNames = useOpponentPlayerNames();
  const opponentDeckNames = useOpponentDeckNames();

  // -----------------------------------
  // デッキリスト（G1〜G3 共通）
  // -----------------------------------
  const [cardListRaw, setCardListRaw] = useState('');
  const [showCardList, setShowCardList] = useState(true);
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
  // G1/G2/G3 それぞれの勝敗
  // -----------------------------------
  const [gameOutcomes, setGameOutcomes] = useState<Record<1 | 2 | 3, GameOutcome>>({
    1: initialMatch?.game1.outcome ?? 'ー',
    2: initialMatch?.game2.outcome ?? 'ー',
    3: initialMatch?.game3.outcome ?? 'ー',
  });

  // -----------------------------------
  // 現在アクティブなAction欄のID
  // -----------------------------------
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);

  // -----------------------------------
  // 保存中フラグ（二重送信防止）
  // -----------------------------------
  const [isSaving, setIsSaving] = useState(false);

  // -----------------------------------
  // 編集モード: 既存のGameSessionをDBから取得する
  // -----------------------------------
  const existingSessions = useGameSessionsByMatchId(initialMatch?.id ?? '');

  // -----------------------------------
  // 編集モード: セッションが読み込まれたら state を初期化する
  // hasInitialized で2回目以降の実行を防ぐ
  // -----------------------------------
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!initialMatch || !existingSessions || hasInitialized.current) return;
    hasInitialized.current = true;

    // G1 セッションからカードリストを復元する
    const g1Session = existingSessions.find((s) => s.gameNumber === 1);
    if (g1Session) setCardListRaw(g1Session.cardListRaw);

    // 各ゲームの turns と playOrder を復元する
    if (existingSessions.length > 0) {
      setGameStates((prev) => {
        const next = { ...prev };
        for (const session of existingSessions) {
          next[session.gameNumber] = {
            playOrder: session.playOrder,
            // 保存済みデータは lifeIsSet が undefined の場合があるため true で補完する
            // （ユーザーが明示的に保存した値なので、常に lifeIsSet=true 扱い）
            turns: session.turns.map((turn) => ({
              ...turn,
              my: { ...turn.my, lifeIsSet: turn.my.lifeIsSet ?? true },
              opponent: { ...turn.opponent, lifeIsSet: turn.opponent.lifeIsSet ?? true },
            })),
          };
        }
        return next;
      });
    }
  }, [initialMatch, existingSessions]);

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
  // Action欄をアクティブ化する（トグル）
  // -----------------------------------
  const handleActivateField = useCallback((fId: string) => {
    setActiveFieldId((prev) => (prev === fId ? null : fId));
  }, []);

  // -----------------------------------
  // fieldId をパースして turnIndex と side を取り出す
  // fieldId 形式: "g{gameNum}-t{turnIndex}-{side}"
  // -----------------------------------
  const parseFieldId = (
    fId: string,
  ): { turnIndex: number; side: 'my' | 'opponent' } | null => {
    const matchResult = fId.match(/^g\d+-t(\d+)-(my|opponent)$/);
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
          return { ...t, [side]: { ...t[side], actions: [...t[side].actions, newChip] } };
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
  // ターンを追加する（末尾に1ターン追加、前のターンの値を引き継ぐ）
  // -----------------------------------
  const handleAddTurn = useCallback(() => {
    updateCurrentGame((g) => {
      const prev = g.turns[g.turns.length - 1];
      const newTurn = createDefaultTurnData(g.turns.length + 1, prev?.my, prev?.opponent);
      return { ...g, turns: [...g.turns, newTurn] };
    });
  }, [updateCurrentGame]);

  // -----------------------------------
  // ターンを削除する（末尾から1ターン削除、最低1ターン残す）
  // -----------------------------------
  const handleRemoveTurn = useCallback(() => {
    updateCurrentGame((g) => {
      if (g.turns.length <= 1) return g;
      return { ...g, turns: g.turns.slice(0, -1) };
    });
  }, [updateCurrentGame]);

  // -----------------------------------
  // 保存処理
  // 新規: addMatch → saveGameSession × 3 → addMatchToGroup
  // 編集: updateMatch → saveGameSession × 3（同IDで上書き）
  // -----------------------------------
  const handleSave = async () => {
    if (!myDeck.trim() || !opponentPlayerName.trim()) return;
    if (isSaving) return;

    setIsSaving(true);
    try {
      const now = new Date().toISOString();

      let matchId: string;

      if (isEditMode && initialMatch) {
        // ===== 編集モード: Match を更新する =====
        matchId = initialMatch.id;
        await updateMatch({
          ...initialMatch,
          myDeck: myDeck.trim(),
          opponentPlayerName: opponentPlayerName.trim(),
          opponentDeck: opponentDeck.trim(),
          playOrder: gameStates[1].playOrder,
          game1: { ...initialMatch.game1, outcome: gameOutcomes[1] },
          game2: { ...initialMatch.game2, outcome: gameOutcomes[2] },
          game3: { ...initialMatch.game3, outcome: gameOutcomes[3] },
        });
      } else {
        // ===== 新規作成モード: Match を作成する =====
        matchId = await addMatch({
          myDeck: myDeck.trim(),
          opponentPlayerName: opponentPlayerName.trim(),
          opponentDeck: opponentDeck.trim(),
          playOrder: gameStates[1].playOrder,
          game1: { outcome: gameOutcomes[1], notes: '' },
          game2: { outcome: gameOutcomes[2], notes: '' },
          game3: { outcome: gameOutcomes[3], notes: '' },
        });
        // MatchGroup に追加する（新規のみ）
        await addMatchToGroup(matchId, now);
      }

      // G1/G2/G3 の GameSession を保存する（put で存在すれば上書き）
      for (const gameNum of GAME_NUMBERS) {
        const gs = gameStates[gameNum];
        const session: GameSession = {
          id: `${matchId}-g${gameNum}`,
          matchId,
          gameNumber: gameNum,
          playOrder: gs.playOrder,
          cardListRaw,
          turns: gs.turns,
          createdAt: now,
        };
        await saveGameSession(session);
      }

      onSave();
    } catch (err) {
      console.error('保存エラー:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // アクティブなAction欄が現在のゲームに属するかチェック（ボタン有効/無効に使う）
  const hasActiveField =
    activeFieldId !== null && activeFieldId.startsWith(`g${activeGame}-`);

  // -----------------------------------
  // ターンiの前ターンデータから「引き継ぐライフ値」を計算するヘルパー
  // 優先順位: lifeHistory の最後 > data.life（lifeIsSet=true）> 20（未操作）
  // -----------------------------------
  const computeInheritedLife = (prevData: import('../../types/turnHistory').PlayerTurnData): number => {
    // 前ターンでライフ履歴が記録されていればその最後のエントリを引き継ぐ
    if (prevData.lifeHistory.length > 0) {
      return prevData.lifeHistory[prevData.lifeHistory.length - 1].life;
    }
    // ライフカウンターを操作済みならその値を引き継ぐ
    if (prevData.lifeIsSet) return prevData.life;
    // 前ターン自体も未操作なら 20 を維持する
    return 20;
  };

  // 入力欄の共通スタイル
  const inputClass =
    'w-full bg-slate-800 text-stone-200 border border-slate-600 rounded-lg px-2 py-1 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-stone-500';

  return (
    <div className="flex flex-col h-full gap-2">

      {/* ===== ヘッダー: 基本情報入力 ===== */}
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-stone-200">
            {isEditMode ? '対戦編集' : '新規対戦入力'}
          </h2>
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

        {/* 基本情報フォーム（AutocompleteInput でカスタム補完） */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-semibold text-stone-400 mb-0.5">
              自分のデッキ <span className="text-stone-600">*</span>
            </label>
            <AutocompleteInput
              value={myDeck}
              onChange={setMyDeck}
              suggestions={myDeckNames}
              placeholder="例: ピナクル"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-400 mb-0.5">
              相手プレイヤー <span className="text-stone-600">*</span>
            </label>
            <AutocompleteInput
              value={opponentPlayerName}
              onChange={setOpponentPlayerName}
              suggestions={opponentPlayerNames}
              placeholder="例: まさっち"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-400 mb-0.5">
              相手デッキ
            </label>
            <AutocompleteInput
              value={opponentDeck}
              onChange={setOpponentDeck}
              suggestions={opponentDeckNames}
              placeholder="例: カニL/O"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* ===== ゲームタブ + 先攻後攻 ===== */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* G1/G2/G3 タブ（ターン履歴の表示切り替え用） */}
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

        {/* 先攻後攻トグル（アクティブなゲームの先攻/後攻を切り替え） */}
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

      {/* ===== 勝敗入力（G1/G2/G3 を横並びで全て表示） ===== */}
      {/* G1 勝ち 負け - , G2 勝ち 負け - , G3 勝ち 負け - の順で並べる */}
      <div className="flex items-center gap-3 flex-wrap">
        {GAME_NUMBERS.map((num) => (
          <div key={num} className="flex items-center gap-1">
            {/* ゲーム番号ラベル */}
            <span className="text-xs font-semibold text-stone-500 w-5 shrink-0">G{num}</span>
            {/* 勝ち / 負け / ー の3ボタン */}
            {OUTCOMES.map((outcome) => {
              const isSelected = gameOutcomes[num] === outcome;
              const selectedStyle =
                outcome === '勝ち'
                  ? 'border-green-600 text-green-400 bg-green-900/20'
                  : outcome === '負け'
                    ? 'border-red-700 text-red-400 bg-red-900/20'
                    : 'border-stone-500 text-stone-200 bg-slate-800';
              return (
                <button
                  key={outcome}
                  onClick={() => setGameOutcomes((prev) => ({ ...prev, [num]: outcome }))}
                  className={`
                    text-xs px-2.5 py-1 rounded border transition
                    ${
                      isSelected
                        ? selectedStyle
                        : 'border-slate-700 text-stone-500 hover:border-slate-600 hover:text-stone-400'
                    }
                  `}
                >
                  {outcome}
                </button>
              );
            })}
          </div>
        ))}
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
            placeholder={'4 稲妻\n4 渦まく知識\n稲妻 （数字なしも可）'}
            rows={4}
            className="w-full bg-slate-800 text-stone-300 border border-slate-700 rounded-lg p-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-stone-500 placeholder-slate-600 font-mono"
          />
        )}

        {/* カードボタン + 相手行動ボタン */}
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
                {showCardList
                  ? 'デッキリストを入力するとボタンが表示されます（数字なしも可）'
                  : 'デッキリストを開いてカードを入力'}
              </p>
            )}
          </div>

          {/* 相手行動ボタン（右端） */}
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

        {!hasActiveField && (
          <p className="text-xs text-stone-700 mt-1">
            Action欄をタップして有効化するとボタンが使えます
          </p>
        )}
      </div>

      {/* ===== ターン列（自分と相手を同一行に配置して高さを揃える）===== */}
      {/* 各ターンを grid-cols-2 の 1 行に入れることで、*/}
      {/* 一方のAction欄が伸びても対応するターン行が同じ高さになる */}
      <div className="flex-1 min-h-0 overflow-y-auto">

        {/* ヘッダー（スクロールに追従する固定行） */}
        <div className="grid grid-cols-2 gap-2 sticky top-0 bg-slate-950 z-10 py-1">
          <p className="text-xs font-semibold text-stone-400">自分</p>
          <p className="text-xs font-semibold text-stone-400 text-right">相手</p>
        </div>

        {/* ターンペア: 同ターンの自分と相手を 1 行に並べる */}
        {currentGame.turns.map((turn, i) => {
          // 前ターンのデータ（T1は前ターンなし → undefined）
          const prevTurn = i > 0 ? currentGame.turns[i - 1] : null;
          // 各サイドの「前ターン最終ライフ」を引き継ぎ値として計算する
          const myInheritedLife = prevTurn ? computeInheritedLife(prevTurn.my) : undefined;
          const opponentInheritedLife = prevTurn ? computeInheritedLife(prevTurn.opponent) : undefined;

          return (
            <div key={i} className="grid grid-cols-2 gap-2 items-stretch">
              <TurnRow
                turnNumber={turn.turnNumber}
                data={turn.my}
                side="my"
                isActive={activeFieldId === `g${activeGame}-t${i}-my`}
                activeFieldId={activeFieldId}
                fieldId={`g${activeGame}-t${i}-my`}
                onActivate={handleActivateField}
                onUpdate={(newData) => handleTurnUpdate(i, 'my', newData)}
                inheritedLife={myInheritedLife}
              />
              <TurnRow
                turnNumber={turn.turnNumber}
                data={turn.opponent}
                side="opponent"
                isActive={activeFieldId === `g${activeGame}-t${i}-opponent`}
                activeFieldId={activeFieldId}
                fieldId={`g${activeGame}-t${i}-opponent`}
                onActivate={handleActivateField}
                onUpdate={(newData) => handleTurnUpdate(i, 'opponent', newData)}
                inheritedLife={opponentInheritedLife}
              />
            </div>
          );
        })}
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
