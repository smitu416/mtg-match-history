// Vite の設定ファイル
// ビルドツールの動作をカスタマイズする
// `vitest` の型定義を読み込むことで、`test` プロパティを TypeScript に認識させる
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    // Reactの高速リフレッシュ機能を有効にする
    react(),
    // TailwindCSSをViteのプラグインとして利用する
    tailwindcss(),
  ],
  // テスト環境の設定
  test: {
    // ブラウザに近い環境でテストを実行する（DOMが使える）
    environment: 'jsdom',
    // テスト前にjest-domの便利なマッチャーを読み込む
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
