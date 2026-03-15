// ==========================================
// csvExport のユニットテスト
// ==========================================

import { describe, it, expect } from 'vitest';
import { matchesToCsvString } from '../../src/services/csvExport';
import type { Match } from '../../src/types';

// テスト用のサンプル対戦データ
const sampleMatch: Match = {
  id: '20260306-001',
  createdAt: '2026-03-06T16:47:20.093Z',
  myDeck: 'ピナクル',
  opponentPlayerName: 'まさっち',
  opponentDeck: 'ビビ',
  playOrder: '先攻',
  game1: { outcome: '勝ち', notes: 'キーカードなし' },
  game2: { outcome: '負け', notes: '兄弟仲の終焉で負け' },
  game3: { outcome: '勝ち', notes: '強迫でコジレックを落として勝ち' },
};

describe('matchesToCsvString', () => {
  it('ヘッダー行が含まれる', () => {
    const csv = matchesToCsvString([sampleMatch]);
    // ヘッダーに必要なフィールドが含まれているか確認する
    expect(csv).toContain('id');
    expect(csv).toContain('myDeck');
    expect(csv).toContain('game1_outcome');
  });

  it('データが正しくCSVに変換される', () => {
    const csv = matchesToCsvString([sampleMatch]);
    expect(csv).toContain('20260306-001');
    expect(csv).toContain('ピナクル');
    expect(csv).toContain('まさっち');
    expect(csv).toContain('勝ち');
  });

  it('空配列を渡してもエラーにならない', () => {
    // エラーが発生しないことを確認する
    expect(() => matchesToCsvString([])).not.toThrow();
  });
});
