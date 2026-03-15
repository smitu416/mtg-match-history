// ==========================================
// idGenerator のユニットテスト
// ==========================================
// ユニットテストとは「小さな機能1つを単体でテストすること」。
// 「この関数にこの入力を渡すと、この出力が返るか」を確認する。
//
// Vitest を使っている。
// describe() = テストをグループ化する
// it() または test() = 1つのテストケース
// expect() = 結果を検証する

import { describe, it, expect } from 'vitest';
import {
  formatDateToYMD,
  generateMatchId,
  getNextSequenceNumber,
} from '../../src/utils/idGenerator';

// -----------------------------------
// formatDateToYMD のテスト
// -----------------------------------
describe('formatDateToYMD', () => {
  it('日付を YYYYMMDD 形式に変換する', () => {
    // 2026年3月6日のDateオブジェクトを作る
    const date = new Date('2026-03-06T00:00:00.000Z');
    // formatDateToYMD を呼んで結果を検証する
    expect(formatDateToYMD(date)).toBe('20260306');
  });

  it('1桁の月・日はゼロ埋めされる', () => {
    const date = new Date('2026-01-05T00:00:00.000Z');
    expect(formatDateToYMD(date)).toBe('20260105');
  });
});

// -----------------------------------
// generateMatchId のテスト
// -----------------------------------
describe('generateMatchId', () => {
  it('日付と追い番からIDを生成する', () => {
    const date = new Date('2026-03-06T00:00:00.000Z');
    // 1試合目のID
    expect(generateMatchId(date, 1)).toBe('20260306-001');
  });

  it('追い番が2桁でも3桁にゼロ埋めされる', () => {
    const date = new Date('2026-03-06T00:00:00.000Z');
    expect(generateMatchId(date, 12)).toBe('20260306-012');
  });

  it('追い番が3桁のときもIDが生成される', () => {
    const date = new Date('2026-03-06T00:00:00.000Z');
    expect(generateMatchId(date, 100)).toBe('20260306-100');
  });
});

// -----------------------------------
// getNextSequenceNumber のテスト
// -----------------------------------
describe('getNextSequenceNumber', () => {
  it('今日のIDが1つもないとき、1を返す', () => {
    const date = new Date('2026-03-06T00:00:00.000Z');
    // 今日のIDがない（別の日のIDのみ）
    const existingIds = ['20260305-001', '20260304-001'];
    expect(getNextSequenceNumber(existingIds, date)).toBe(1);
  });

  it('今日のIDが2つあるとき、3を返す', () => {
    const date = new Date('2026-03-06T00:00:00.000Z');
    const existingIds = ['20260306-001', '20260306-002'];
    expect(getNextSequenceNumber(existingIds, date)).toBe(3);
  });

  it('IDリストが空のとき、1を返す', () => {
    const date = new Date('2026-03-06T00:00:00.000Z');
    expect(getNextSequenceNumber([], date)).toBe(1);
  });
});
