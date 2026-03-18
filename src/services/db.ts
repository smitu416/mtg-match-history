// ==========================================
// データベース定義ファイル（Dexie.js）
// ==========================================
// このファイルでは、ブラウザ内のデータベース（IndexedDB）の構造を定義する。
// IndexedDBとは、ブラウザに内蔵されたデータ保存機能。
// アプリを閉じてもデータが消えない（ローカルストレージより大容量）。
//
// Dexie.js は IndexedDB を使いやすくするライブラリ。
// 難しいIndexedDBの操作を、シンプルなコードで書けるようにしてくれる。

import Dexie, { type EntityTable } from 'dexie';
import type { Match, Deck } from '../types';
import type { GameSession, MatchGroup } from '../types/turnHistory';

// -----------------------------------
// データベースのクラス定義
// -----------------------------------
// Dexie を継承（拡張）して、MTGアプリ専用のDBクラスを作る。
class MtgDatabase extends Dexie {
  // テーブルの定義
  // EntityTable<Match, 'id'> = 「Matchの型を持ち、'id'が主キーのテーブル」
  matches!: EntityTable<Match, 'id'>;           // 対戦履歴テーブル
  decks!: EntityTable<Deck, 'id'>;             // デッキテーブル
  gameSessions!: EntityTable<GameSession, 'id'>; // ターン履歴（ゲームセッション）テーブル
  matchGroups!: EntityTable<MatchGroup, 'id'>;  // 対戦グループテーブル

  constructor() {
    // データベース名を指定してDexieを初期化する
    super('MtgMatchHistoryDB');

    // データベースのバージョンとスキーマ（テーブル構造）を定義する
    // バージョンは変更するたびに数字を増やす（マイグレーション管理のため）
    // version(1) は既存データのまま維持する
    this.version(1).stores({
      matches: '&id, createdAt, myDeck, opponentPlayerName, opponentDeck',
      decks: '&id, name',
    });

    // version(2): ターン履歴とグループ機能を追加
    // 既存のmatchesテーブルに groupId インデックスを追加する
    this.version(2).stores({
      // matches テーブルのインデックス設定（groupIdを追加）
      // '&id' = idは主キー（ユニーク、重複不可）
      // createdAt, myDeck, opponentPlayerName, opponentDeck, groupId = 検索に使うフィールド
      matches: '&id, createdAt, myDeck, opponentPlayerName, opponentDeck, groupId',

      // decks テーブルのインデックス設定（変更なし）
      decks: '&id, name',

      // gameSessions テーブル: ターン履歴を保存する
      // matchId = どの試合のセッションか（Matchのidで検索できる）
      // gameNumber = G1/G2/G3 のどれか（1, 2, 3）
      gameSessions: '&id, matchId, gameNumber, createdAt',

      // matchGroups テーブル: 試合をまとめるグループを保存する
      matchGroups: '&id, createdAt',
    });
  }
}

// -----------------------------------
// データベースのインスタンスを作成してエクスポート
// -----------------------------------
// アプリ全体でこの1つのDBインスタンスを共有して使う。
// export することで、他のファイルから import して使えるようになる。
export const db = new MtgDatabase();
