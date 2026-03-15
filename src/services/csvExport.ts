// ==========================================
// CSVエクスポート機能
// ==========================================
// このファイルでは、アプリ内の対戦データをCSVファイルとして
// バックアップ保存する機能を提供する。
//
// CSVとは「カンマ区切りテキスト」のこと。
// Excelやスプレッドシートで開くことができる汎用フォーマット。
//
// PapaParseというライブラリを使ってCSVへの変換を行う。

import Papa from 'papaparse';
import type { Match } from '../types';

// -----------------------------------
// 対戦データをCSV文字列に変換する
// -----------------------------------
// 引数:
//   matches: エクスポートしたい対戦データの配列
// 戻り値:
//   CSV形式の文字列
export function matchesToCsvString(matches: Match[]): string {
  // MatchオブジェクトをCSVの行データ（フラットなオブジェクト）に変換する
  // 「フラット」とは、入れ子のない1階層のオブジェクトのこと
  // 例: match.game1.outcome → game1_outcome という1つのフィールドにする
  const rows = matches.map((match) => ({
    id: match.id,
    createdAt: match.createdAt,
    myDeck: match.myDeck,
    opponentPlayerName: match.opponentPlayerName,
    opponentDeck: match.opponentDeck,
    playOrder: match.playOrder,
    game1_outcome: match.game1.outcome,
    game1_notes: match.game1.notes,
    game2_outcome: match.game2.outcome,
    game2_notes: match.game2.notes,
    game3_outcome: match.game3.outcome,
    game3_notes: match.game3.notes,
  }));

  // PapaParseの unparse() でオブジェクト配列をCSV文字列に変換する
  return Papa.unparse(rows, {
    // ヘッダー行（列名の行）を含める
    header: true,
  });
}

// -----------------------------------
// CSVファイルをブラウザからダウンロードさせる
// -----------------------------------
// 引数:
//   matches:  エクスポートする対戦データ
//   filename: ダウンロード時のファイル名（省略時は日付を使う）
export function exportMatchesToCsv(matches: Match[], filename?: string): void {
  // CSVデータを文字列に変換する
  const csvString = matchesToCsvString(matches);

  // Blob（バイナリデータのかたまり）としてCSV文字列を包む
  // BOM（\uFEFF）を先頭に付けることで、Excelで開いたとき日本語が文字化けしない
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });

  // ダウンロード用の一時的なURLを作成する
  const url = URL.createObjectURL(blob);

  // ファイル名が指定されていない場合は「今日の日付.csv」にする
  // 例: "mtg_matches_20260306.csv"
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const downloadFilename = filename ?? `mtg_matches_${today}.csv`;

  // 非表示の <a> タグを作り、クリックしてダウンロードを実行する
  // これがブラウザでファイルをダウンロードさせる標準的な方法
  const link = document.createElement('a');
  link.href = url;
  link.download = downloadFilename;
  link.style.display = 'none';

  // <a> タグをDOMに追加してクリック、その後削除する
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // 作成した一時URLを解放してメモリを節約する
  URL.revokeObjectURL(url);
}
