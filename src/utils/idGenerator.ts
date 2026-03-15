// ==========================================
// 対戦IDを生成するユーティリティ
// ==========================================
// 対戦IDとは、1試合ごとに割り当てる固有の番号のこと。
// フォーマット: "YYYYMMDD-NNN"
//   - YYYYMMDD = 試合の日付（例: 20260306 = 2026年3月6日）
//   - NNN      = その日の何試合目か（3桁ゼロ埋め 例: 001, 002, 012）
// 例: 2026年3月6日の2試合目 → "20260306-002"

// -----------------------------------
// 日付を "YYYYMMDD" 形式の文字列に変換する
// -----------------------------------
// 引数:
//   date: JavaScript の Date オブジェクト（日時情報を持つ）
// 戻り値:
//   "20260306" のような8桁の文字列
export function formatDateToYMD(date: Date): string {
  // toISOString() は "2026-03-06T16:47:20.093Z" のような文字列を返す
  // slice(0, 10) で "2026-03-06" の部分だけ切り出す
  // replace(/-/g, '') でハイフンを除去し "20260306" にする
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

// -----------------------------------
// 対戦IDを生成する
// -----------------------------------
// 引数:
//   date:           試合の日付
//   sequenceNumber: その日の何試合目か（1始まり）
// 戻り値:
//   "20260306-001" のようなID文字列
export function generateMatchId(date: Date, sequenceNumber: number): string {
  // 日付部分を "YYYYMMDD" 形式に変換する
  const dateStr = formatDateToYMD(date);

  // 追い番を3桁にゼロ埋めする
  // padStart(3, '0') は「3桁になるまで先頭に '0' を追加する」という意味
  // 例: 1 → "001", 12 → "012", 100 → "100"
  const seq = String(sequenceNumber).padStart(3, '0');

  // "YYYYMMDD-NNN" 形式で結合して返す
  return `${dateStr}-${seq}`;
}

// -----------------------------------
// 既存の対戦リストから、今日の次の追い番を計算する
// -----------------------------------
// 例: 今日すでに "20260306-001", "20260306-002" があれば 3 を返す
// 引数:
//   existingIds: すでに存在する対戦IDのリスト
//   date:        今日の日付
// 戻り値:
//   次に使う追い番（1始まり）
export function getNextSequenceNumber(existingIds: string[], date: Date): number {
  // 今日の日付部分（例: "20260306"）
  const today = formatDateToYMD(date);

  // 既存IDの中から今日の日付のものだけ絞り込む
  // filter() は条件に一致する要素だけ残す
  const todayIds = existingIds.filter((id) => id.startsWith(today));

  // 今日の試合が1つもなければ、追い番は 1 から始める
  if (todayIds.length === 0) return 1;

  // 今日の試合の追い番（例: "20260306-003" → 3）を全て取得し、最大値+1 を返す
  const sequences = todayIds.map((id) => {
    // IDの末尾3文字が追い番（例: "001" → 1）
    const seqStr = id.slice(-3);
    return parseInt(seqStr, 10); // 文字列 "001" を数値 1 に変換する
  });

  // Math.max(...sequences) で最大値を取得し、+1 した値が次の追い番
  return Math.max(...sequences) + 1;
}
