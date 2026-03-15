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

// -----------------------------------
// データベースのクラス定義
// -----------------------------------
// Dexie を継承（拡張）して、MTGアプリ専用のDBクラスを作る。
class MtgDatabase extends Dexie {
  // テーブルの定義
  // EntityTable<Match, 'id'> = 「Matchの型を持ち、'id'が主キーのテーブル」
  matches!: EntityTable<Match, 'id'>; // 対戦履歴テーブル
  decks!: EntityTable<Deck, 'id'>;   // デッキテーブル

  constructor() {
    // データベース名を指定してDexieを初期化する
    super('MtgMatchHistoryDB');

    // データベースのバージョンとスキーマ（テーブル構造）を定義する
    // バージョンは変更するたびに数字を増やす（マイグレーション管理のため）
    this.version(1).stores({
      // matches テーブルのインデックス設定
      // '&id' = idは主キー（ユニーク、重複不可）
      // createdAt, myDeck, opponentPlayerName, opponentDeck = 検索・ソートに使うフィールド
      matches: '&id, createdAt, myDeck, opponentPlayerName, opponentDeck',

      // decks テーブルのインデックス設定
      // '&id' = idは主キー
      // name = デッキ名で検索できるようにする
      decks: '&id, name',
    });
  }
}

// -----------------------------------
// データベースのインスタンスを作成してエクスポート
// -----------------------------------
// アプリ全体でこの1つのDBインスタンスを共有して使う。
// export することで、他のファイルから import して使えるようになる。
export const db = new MtgDatabase();
