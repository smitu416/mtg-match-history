// ==========================================
// CSVインポート機能
// ==========================================
// このファイルでは、既存のCSVファイルをアプリに取り込む機能を提供する。
// /Users/shosaku/MTG/対戦履歴/ にある過去のCSVをインポートするために使う。
//
// CSVの各行を Match オブジェクトに変換する処理がメイン。

import Papa from 'papaparse';
import type { Match, GameOutcome, PlayOrder } from '../types';

// -----------------------------------
// CSVの1行分のデータの型定義
// -----------------------------------
// CSVを読み込むと文字列のオブジェクトが返ってくるので、その型を定義する
interface CsvRow {
  id: string;
  createdAt: string;
  myDeck: string;
  opponentPlayerName: string;
  opponentDeck: string;
  playOrder: string;
  game1_outcome: string;
  game1_notes: string;
  game2_outcome: string;
  game2_notes: string;
  game3_outcome: string;
  game3_notes: string;
}

// -----------------------------------
// 文字列をGameOutcome型に変換する
// -----------------------------------
// CSVの文字列が正しい値かチェックし、正しければGameOutcome型として返す。
// 不正な値の場合はデフォルト値 'ー' を返す。
function parseGameOutcome(value: string): GameOutcome {
  // trim() で前後の空白を除去してから比較する
  const trimmed = value.trim();
  if (trimmed === '勝ち' || trimmed === '負け' || trimmed === 'ー') {
    return trimmed;
  }
  // 認識できない値の場合は 'ー'（未プレイ）として扱う
  return 'ー';
}

// -----------------------------------
// 文字列をPlayOrder型に変換する
// -----------------------------------
function parsePlayOrder(value: string): PlayOrder {
  const trimmed = value.trim();
  if (trimmed === '先攻' || trimmed === '後攻') {
    return trimmed;
  }
  // 認識できない値の場合はデフォルト '先攻' とする
  return '先攻';
}

// -----------------------------------
// CSVの1行（CsvRow）を Match オブジェクトに変換する
// -----------------------------------
function csvRowToMatch(row: CsvRow): Match {
  return {
    id: row.id?.trim() ?? '',
    createdAt: row.createdAt?.trim() ?? new Date().toISOString(),
    myDeck: row.myDeck?.trim() ?? '',
    opponentPlayerName: row.opponentPlayerName?.trim() ?? '',
    opponentDeck: row.opponentDeck?.trim() ?? '',
    playOrder: parsePlayOrder(row.playOrder ?? ''),
    game1: {
      outcome: parseGameOutcome(row.game1_outcome ?? ''),
      notes: row.game1_notes?.trim() ?? '',
    },
    game2: {
      outcome: parseGameOutcome(row.game2_outcome ?? ''),
      notes: row.game2_notes?.trim() ?? '',
    },
    game3: {
      outcome: parseGameOutcome(row.game3_outcome ?? ''),
      notes: row.game3_notes?.trim() ?? '',
    },
  };
}

// -----------------------------------
// インポート結果を表す型
// -----------------------------------
export interface ImportResult {
  success: boolean;   // インポートに成功したか
  matches: Match[];   // 変換後のMatchデータの配列
  errors: string[];   // エラーメッセージの配列（問題があった行など）
  count: number;      // 取り込んだ件数
}

// -----------------------------------
// CSV文字列を解析してMatchの配列を返す
// -----------------------------------
// 引数:
//   csvText: CSVファイルの内容（文字列）
// 戻り値:
//   ImportResult（成功/失敗、データ、エラーメッセージを含む）
export function parseCsvToMatches(csvText: string): ImportResult {
  const errors: string[] = [];

  // PapaParseでCSVをパース（解析）する
  const result = Papa.parse<CsvRow>(csvText, {
    header: true,        // 1行目をヘッダー（列名）として使う
    skipEmptyLines: true, // 空行をスキップする
    transformHeader: (header) => header.trim(), // ヘッダーの前後空白を除去
  });

  // CSVの構造エラーがあれば記録する
  if (result.errors.length > 0) {
    result.errors.forEach((err) => {
      errors.push(`行${err.row}: ${err.message}`);
    });
  }

  // 各行をMatchオブジェクトに変換する
  const matches: Match[] = [];
  result.data.forEach((row, index) => {
    // IDが空の行はスキップする（不完全なデータ）
    if (!row.id) {
      errors.push(`${index + 2}行目: IDが空のためスキップしました`);
      return;
    }

    try {
      // CSV行をMatchオブジェクトに変換して配列に追加
      matches.push(csvRowToMatch(row));
    } catch (e) {
      errors.push(`${index + 2}行目: 変換エラー - ${e}`);
    }
  });

  return {
    success: matches.length > 0,
    matches,
    errors,
    count: matches.length,
  };
}

// -----------------------------------
// ファイルオブジェクトからMatchの配列を取得する
// -----------------------------------
// ブラウザのファイル選択ダイアログで選んだファイルを読み込む
// 引数:
//   file: ユーザーが選択したファイル（Fileオブジェクト）
// 戻り値:
//   Promise<ImportResult>（非同期処理のため Promise を使う）
export function importCsvFile(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    // FileReader を使ってファイルをテキストとして読み込む
    const reader = new FileReader();

    // ファイルの読み込みが完了したときの処理
    reader.onload = (event) => {
      const csvText = event.target?.result as string;
      // 読み込んだテキストをパースしてMatchに変換する
      const result = parseCsvToMatches(csvText);
      resolve(result);
    };

    // ファイル読み込みエラー時の処理
    reader.onerror = () => {
      resolve({
        success: false,
        matches: [],
        errors: ['ファイルの読み込みに失敗しました'],
        count: 0,
      });
    };

    // ファイルをUTF-8テキストとして読み込み開始
    reader.readAsText(file, 'UTF-8');
  });
}
