// ==========================================
// CSVインポートモーダルコンポーネント
// ==========================================
// 過去のCSVファイルをアプリに取り込むためのダイアログ（モーダル）。
// ファイルを選択して「インポート」ボタンを押すと、DBに一括追加される。

import { useState, useRef } from 'react';
import { importCsvFile } from '../services/csvImport';
import { bulkImportMatches } from '../hooks/useMatches';

// -----------------------------------
// Props
// -----------------------------------
interface CsvImportModalProps {
  onClose: () => void; // モーダルを閉じるときに呼ぶ関数
}

// -----------------------------------
// CsvImportModal コンポーネント本体
// -----------------------------------
export function CsvImportModal({ onClose }: CsvImportModalProps) {
  // 選択されたファイル
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // 処理中かどうか
  const [isImporting, setIsImporting] = useState(false);
  // 完了メッセージ
  const [result, setResult] = useState<string>('');
  // エラーメッセージのリスト
  const [errors, setErrors] = useState<string[]>([]);

  // ファイル入力エレメントへの参照（プログラムからクリックするために使う）
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -----------------------------------
  // ファイルが選択されたときの処理
  // -----------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setResult('');
    setErrors([]);
  };

  // -----------------------------------
  // インポートボタンが押されたときの処理
  // -----------------------------------
  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setResult('');
    setErrors([]);

    try {
      // CSVファイルを解析してMatchオブジェクトの配列に変換する
      const importResult = await importCsvFile(selectedFile);

      if (!importResult.success || importResult.matches.length === 0) {
        setErrors(importResult.errors.length > 0
          ? importResult.errors
          : ['CSVから有効なデータを取得できませんでした']
        );
        return;
      }

      // DBに一括インポートする
      const { added, skipped } = await bulkImportMatches(importResult.matches);

      // 結果メッセージを設定する
      setResult(
        `インポート完了: ${added}件追加` +
        (skipped > 0 ? `、${skipped}件スキップ（ID重複）` : '')
      );

      // エラー（警告）があれば表示する
      if (importResult.errors.length > 0) {
        setErrors(importResult.errors);
      }
    } catch (e) {
      setErrors([`インポート中にエラーが発生しました: ${e}`]);
    } finally {
      setIsImporting(false);
    }
  };

  // ===================================
  // 表示部分（JSX）
  // ===================================
  return (
    // モーダルの背景（クリックで閉じる）
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // 背景（モーダル外）をクリックしたときだけ閉じる
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* モーダル本体 */}
      <div className="bg-white rounded-xl shadow-xl p-5 w-full max-w-md">
        <h2 className="text-lg font-bold text-gray-800 mb-4">CSVインポート</h2>
        <p className="text-sm text-gray-600 mb-4">
          過去の対戦履歴CSVファイルをインポートします。<br />
          同じIDのデータは上書きされません（スキップ）。
        </p>

        {/* ファイル選択エリア */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6
                     text-center cursor-pointer hover:border-indigo-400 transition"
        >
          {selectedFile ? (
            <p className="text-sm text-indigo-600 font-medium">{selectedFile.name}</p>
          ) : (
            <>
              <p className="text-gray-500 text-sm">クリックしてCSVファイルを選択</p>
              <p className="text-gray-400 text-xs mt-1">（例: 2026_03_06_matches.csv）</p>
            </>
          )}
        </div>

        {/* 非表示のファイル入力 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* 成功メッセージ */}
        {result && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg
                          text-green-700 text-sm">
            {result}
          </div>
        )}

        {/* エラー・警告メッセージ */}
        {errors.length > 0 && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            <p className="font-medium text-yellow-800 mb-1">警告:</p>
            <ul className="list-disc list-inside text-yellow-700 space-y-0.5">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ボタン */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700
                       hover:bg-gray-50 transition text-sm"
          >
            閉じる
          </button>
          <button
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
            className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg
                       hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                       transition text-sm font-semibold"
          >
            {isImporting ? 'インポート中...' : 'インポート'}
          </button>
        </div>
      </div>
    </div>
  );
}
