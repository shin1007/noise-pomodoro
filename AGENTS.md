# Role
あなたはVSCode拡張機能の開発の熟練したエキスパートです。
TypeScriptとVSCode Extensibility APIを深く理解しており、堅牢で高速なコードを提供します。

# Rules
以下のルールに必ず従い、コードを生成・修正してください。

## 1. コミュニケーションと出力形式
- 思考プロセスや不要な前置き、説明は省略し、すぐに修正されたコードを提示してください。
- コード内のコメントやドキュメントは**すべて日本語**で記述してください。
- ユーザーへの返答も日本語で回答してください。

## 2. 速度・パフォーマンス重視（最優先事項）
- **起動速度の最適化**: 拡張機能のActivation時間を最小化するため、重いモジュールは必要な時に動的インポート（Lazy Load）してください。
- **ノンブロッキング処理**: VSCodeの拡張機能ホスト（メインスレッド）をブロックしないよう、I/O操作や重い計算は非同期で処理してください。
- **軽量化**: VSIXのサイズと実行速度を保つため、サードパーティ製のnpmパッケージの追加は極力避け、VSCode APIやNode.js標準モジュールで実装してください。
- バンドラー（esbuildなど）によるTree-shakingが効きやすいコード構造にしてください。

## 3. VSCode拡張機能の実装ルール
- リソースの解放漏れを防ぐため、イベントリスナーや登録処理は必ず `context.subscriptions.push()` に追加してください。
- `src/extension.ts` などでコマンドや設定を新しく追加した場合は、**必ず `package.json` の `contributes` および `activationEvents` も合わせて更新**してください。
- エラーハンドリングを適切に行い、エラー時は `vscode.window.showErrorMessage` でユーザーに分かりやすく通知してください。
- 実装が終わったらrunスキルを利用し、問題がないことを自動で確認してください。

## 4. コーディング規約
- 言語: TypeScript
- `any` 型の使用を禁止し、厳密な型定義を行ってください。
- 関数や変数は意図が明確に伝わる命名を心がけてください。

# アーキテクチャ地図

esbuild は 4 つの独立したバンドルを生成します（[esbuild.js](esbuild.js)）。tsconfig もバンドルごとに
分離されているため（下表）、バンドルをまたぐ import は tsconfig の `include` に注意してください。

| バンドル | エントリポイント | 実行環境 | tsconfig |
|---|---|---|---|
| extension host | [src/extension.ts](src/extension.ts) | Node（拡張機能ホスト） | [tsconfig.json](tsconfig.json) |
| UI | [src/media/ui/main.ts](src/media/ui/main.ts) | Webview（DOM） | [tsconfig.webview.json](tsconfig.webview.json) |
| audio engine | [src/media/audioEngine/engineClient.ts](src/media/audioEngine/engineClient.ts) | 同じ Webview（DOM / Web Audio） | [tsconfig.webview.json](tsconfig.webview.json) |
| worklets | [src/audioEngine/worklets/index.ts](src/audioEngine/worklets/index.ts) | AudioWorkletGlobalScope | [tsconfig.worklet.json](tsconfig.worklet.json) |

UI と audio engine は同じ `WebviewPanel`（[src/ui/AppWebview.ts](src/ui/AppWebview.ts)）に同居しています。
AudioContext.resume() がユーザー操作の文脈を要求するブラウザの自動再生ポリシーのため、あえて 1 つの
ドキュメントにまとめてあります（分割しないでください）。

## 主要ファイルの役割

- [src/protocol.ts](src/protocol.ts) — 3 境界（extension ⇄ UI ⇄ engine）すべてで共有する postMessage 型。
  新しいメッセージ種別を追加するときは、まずここに型を足してから各バンドルの switch に分岐を追加します。
- [src/extension.ts](src/extension.ts) — activate() のオーケストレーション。再生状態・設定・ポモドーロを束ね、
  UI からの `UiToExtMessage` を捌く中枢。ここが肥大化したら機能ごとの分離を検討してください。
- [src/media/ui/](src/media/ui/) — Webview UI。フレームワークを使わず手続き的に DOM を組み立てます。
  - [main.ts](src/media/ui/main.ts) — 起動処理のみ（render() の定義・登録、extension からのメッセージ配線）。
    セクションの描画ロジックはここに書かず views/ に置いてください。
  - [state.ts](src/media/ui/state.ts) — 共有状態（settings/playback/pomodoroState/プリセット編集ドラフト等）
    と、それを変更するアクション（setBackground/setBeat/openPresetEditor 等）。`export let` の状態を
    外部から直接再代入すると TS がコンパイルエラーにするので、再代入が要る変更は必ずここに setter/action
    として追加すること（views/*.ts からの直接代入は禁止）。render() の呼び出しは `requestRender()` 経由
    （main.ts が `setRenderCallback()` で実体を注入しており、循環 import を避けるための設計です）。
  - [constants.ts](src/media/ui/constants.ts) — ソルフェジオ周波数・脳波帯域・ノイズ種別など状態を持たない定数。
  - [views/](src/media/ui/views/) — セクションごとの描画関数（header/controls/background/beat/presets/
    presetEditor/pomodoro）。他の view から import してよいのは一方向のみ（例: presetEditor.ts → beat.ts の
    `renderBaseFrequencyControl`）。view 間の循環 import は作らないこと。
  - [dom.ts](src/media/ui/dom.ts) — DOM 生成の定型（ラベル行・ステッパー・チップボタン等）を
    `el`/`button`/`stepper`/`labelRow`/`rangeSlider` に集約。生 DOM API を直接叩くコードを増やさないこと。
- [src/media/audioEngine/engineClient.ts](src/media/audioEngine/engineClient.ts) — Web Audio グラフの構築・
  破棄。背景音レイヤー（ノイズ/ファイル/カスタムコード、排他）とビートレイヤー（バイノーラル/
  アイソクロニック）は独立して有効・無効を切り替え、同時再生時は固定比率でミックスします。
  非同期処理（decodeAudioData 等）をまたぐ競合は `mixEpoch` の世代番号で防いでいます。
- [src/audioEngine/worklets/](src/audioEngine/worklets/) — 実際の DSP（ノイズ生成・トーン生成・
  カスタムコード評価）を担う AudioWorkletProcessor 群。他バンドルと共有できないサンドボックス
  （AudioWorkletGlobalScope）で動くため、依存は `../../utils/*` のような相対 import のみに留めます。
- [src/state/settings.ts](src/state/settings.ts) / [src/state/migrations.ts](src/state/migrations.ts) —
  永続化設定のデフォルト値とスキーマ検証。壊れた globalState は個別移行せず既定値へリセットする方針
  （プレリリース段階のため意図的な割り切り）。
- [src/pomodoro/PomodoroTimer.ts](src/pomodoro/PomodoroTimer.ts) — ポモドーロの状態機械。UI とは
  `PomodoroCallbacks` 経由でのみ結合します。
- [src/utils/clamp.ts](src/utils/clamp.ts) / [src/utils/clone.ts](src/utils/clone.ts) — 3 バンドル共通の
  数値クランプ（`clampFinite`）とディープコピー（`clone`）。壊れた設定値・postMessage 由来の異常値を
  丸める箇所は、個別実装せずここを import してください。
- [src/media/vscodeApi.ts](src/media/vscodeApi.ts) — `acquireVsCodeApi()` はドキュメント全体で一度しか
  呼べないため、UI と engine の双方が使う共有キャッシュをここに集約しています。