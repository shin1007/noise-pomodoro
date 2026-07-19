// @ts-check
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// バンドルごとに実行環境が違うため（CLAUDE.md参照）、globals もディレクトリ単位で分けます。
// - extension host（Node）: src/{extension.ts,statusBar.ts,ui/,state/,pomodoro/,fileAccess/,scriptRunner/,utils/}
// - webview（ブラウザ、UI + engineClient 同居）: src/media/**
// - AudioWorkletGlobalScope（window/DOM なし）: src/audioEngine/worklets/**
export default tseslint.config(
  {
    ignores: ['dist/**', 'out/**', 'node_modules/**', '.vscode-test/**', '*.vsix'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // AGENTS.md: any 型の使用を禁止する
      '@typescript-eslint/no-explicit-any': 'error',
      'no-new-func': 'error',
    },
  },
  {
    files: ['src/media/**/*.ts'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  {
    files: ['src/audioEngine/worklets/**/*.ts'],
    languageOptions: {
      globals: { ...globals.worker },
    },
  },
  {
    files: ['src/{extension,statusBar}.ts', 'src/{ui,state,pomodoro,fileAccess,scriptRunner,utils}/**/*.ts', 'src/protocol.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: ['src/test/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node, ...globals.mocha },
    },
  },
  {
    // esbuild.js / scripts/**: バンドル対象外の素の Node CommonJS スクリプトです。
    files: ['esbuild.js', 'scripts/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
