// ==========================================
// 対戦データを操作するカスタムフック
// ==========================================
// フックとは、Reactコンポーネントの中でデータ操作や副作用を扱う仕組み。
// "use" で始まる関数がフックの慣習。
//
// このフックは:
//   - DBから対戦データを取得する
//   - 新規追加・更新・削除を行う
//   - IndexedDB（Dexie）の操作をコンポーネントから隠蔽する
//
// コンポーネント側は「どうやって保存するか」を意識せず、
// このフックの関数を呼ぶだけでOKになる。

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { generateMatchId, getNextSequenceNumber } from '../utils/idGenerator';
import type { Match, FilterOptions, SortOptions } from '../types';

// -----------------------------------
// 対戦一覧を取得・操作するフック
// -----------------------------------
// 引数:
//   filter: 絞り込み条件（省略可）
//   sort:   並び替え条件（省略可）
export function useMatches(filter?: FilterOptions, sort?: SortOptions) {
  // useLiveQuery はDexieのフック。
  // DBのデータが変わると自動的にコンポーネントを再描画してくれる。
  const matches = useLiveQuery(async () => {
    // まず全件取得する
    let query = db.matches.toCollection();

    // toArray() で実際のデータ配列を取得する
    let result = await query.toArray();

    // -----------------------------------
    // フィルター処理（絞り込み）
    // -----------------------------------
    if (filter?.myDeck) {
      // 自分のデッキ名でフィルター（部分一致）
      result = result.filter((m) =>
        m.myDeck.includes(filter.myDeck!)
      );
    }
    if (filter?.opponentPlayerName) {
      // 相手プレイヤー名でフィルター（部分一致）
      result = result.filter((m) =>
        m.opponentPlayerName.includes(filter.opponentPlayerName!)
      );
    }
    if (filter?.opponentDeck) {
      // 相手デッキ名でフィルター（部分一致）
      result = result.filter((m) =>
        m.opponentDeck.includes(filter.opponentDeck!)
      );
    }

    // -----------------------------------
    // ソート処理（並び替え）
    // -----------------------------------
    if (sort) {
      result.sort((a, b) => {
        // 比較する値を取り出す
        const aVal = String(a[sort.field] ?? '');
        const bVal = String(b[sort.field] ?? '');

        // 文字列を辞書順で比較する
        const cmp = aVal.localeCompare(bVal, 'ja'); // 'ja' = 日本語対応の比較

        // order が 'desc'（降順）なら比較結果を逆にする
        return sort.order === 'desc' ? -cmp : cmp;
      });
    } else {
      // デフォルトは新しい順（降順）で表示
      result.sort((a, b) => b.id.localeCompare(a.id));
    }

    return result;
  }, [filter?.myDeck, filter?.opponentPlayerName, filter?.opponentDeck, sort?.field, sort?.order]);
  // 依存配列: これらの値が変わったときだけクエリを再実行する

  return matches ?? []; // undefinedの場合は空配列を返す
}

// -----------------------------------
// 対戦を新規追加する関数
// -----------------------------------
// 引数: フォームのデータ（idとcreatedAt以外）
// 戻り値: 生成されたIDの文字列
export async function addMatch(
  data: Omit<Match, 'id' | 'createdAt'>
): Promise<string> {
  // 現在日時を取得する
  const now = new Date();

  // 今日すでに存在するIDを取得して、次の追い番を計算する
  const allMatches = await db.matches.toArray();
  const allIds = allMatches.map((m) => m.id);
  const seq = getNextSequenceNumber(allIds, now);

  // 新しいIDを生成する（例: "20260306-003"）
  const id = generateMatchId(now, seq);

  // DBに保存する
  // put() は「あれば更新、なければ追加」する操作
  await db.matches.put({
    ...data,           // フォームのデータを展開する
    id,                // 生成したIDをセット
    createdAt: now.toISOString(), // 現在日時をISO形式でセット
  });

  return id;
}

// -----------------------------------
// 対戦データを更新する関数
// -----------------------------------
// 引数: 更新したいMatchデータ（idは必須）
export async function updateMatch(match: Match): Promise<void> {
  // put() で既存データを上書き更新する
  await db.matches.put(match);
}

// -----------------------------------
// 対戦データを削除する関数
// -----------------------------------
// 引数: 削除したいMatchのid
export async function deleteMatch(id: string): Promise<void> {
  await db.matches.delete(id);
}

// -----------------------------------
// 全対戦データを取得する（CSVエクスポート用）
// -----------------------------------
export async function getAllMatches(): Promise<Match[]> {
  return db.matches.toArray();
}

// -----------------------------------
// 複数の対戦データを一括追加する（CSVインポート用）
// -----------------------------------
// 引数:
//   matches: インポートするMatchデータの配列
// 戻り値:
//   { added: 追加件数, skipped: スキップ件数（IDが重複したもの） }
export async function bulkImportMatches(
  matches: Match[]
): Promise<{ added: number; skipped: number }> {
  // 既存IDを取得する
  const existingIds = new Set(
    (await db.matches.toArray()).map((m) => m.id)
  );

  // 新規データ（IDが重複していないもの）だけ抽出する
  const newMatches = matches.filter((m) => !existingIds.has(m.id));
  const skipped = matches.length - newMatches.length;

  // bulkPut() で一括追加する（1件ずつより高速）
  if (newMatches.length > 0) {
    await db.matches.bulkPut(newMatches);
  }

  return { added: newMatches.length, skipped };
}
