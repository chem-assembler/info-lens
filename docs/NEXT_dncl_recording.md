# 録画モード（P13-4）の InfoLens 横展開 — 実装記録

作成: 2026-07-30 / 設計の正: chem リポジトリの `DESIGN_recording_mode.md`

## できるようになったこと

DNCL の紹介動画が **chem 側の収録ツールをそのまま使って2コマンドで作れる**。

```bash
node tools/record/record.mjs --demo=intro-sum --format=short --base=http://localhost:8128/dncl/
```

```bash
node tools/record/mux.mjs --video=video-scripts/out/intro-sum-short.webm --out=video-scripts/out/dncl-intro-sum.mp4
```

前提: InfoLens 直下で静的サーバー（`python -m http.server 8128`）。
コマンド自体は chem リポジトリのルートで実行する（Playwright と ffmpeg はそちらに入っている）。

**`record.mjs` / `mux.mjs` には一切手を入れていない。** `--base` を差し替えるだけで動く。
共通規約（URLパラメータ名・`window.__recState`・`.recording` クラス）を InfoLens 側が
満たしたので、収録ツールは1本で両アプリに使い回せる、という設計どおりの結果になった。

## 追加したファイル

| ファイル | 責務 |
|---|---|
| `dncl/rec.js` | `?rec=` があるときだけ動く自動再生層。パラメータ解釈・`__recState` 管理・クリーン画面クラス付与・最小の再生器 |
| `dncl/demos.json` | 台本4本（下の一覧） |
| `dncl/verify_demos.js` | 台本が問題データと整合しているかの機械検証（ブラウザ不要） |

`dncl/style.css` に `.recording` / `rec-*` のスタイル、`dncl/index.html` に script タグ1本。

## 収録済みの台本

| id | 中身 | 尺 |
|---|---|---|
| `intro-sum` | カードを並べる→字下げ→1行ずつ→自動再生で 55 | 44秒 |
| `syntax-swap` | 構文学習編。作業用を使った入れ替えを空から組み立てる | 30秒 |
| `sort-bubble` | バブルソート。`state.place` で組み上げた状態から始め、配列ビジュアライザが動くところに尺を使う | 37秒 |
| `python-compare` | Python 対照表示の紹介。`showPreview` でペインを出す唯一の台本 | 20秒 |

台本を足すときの勘どころ:
- **カード枚数が多い問題は `state.place` で頭出しする**。バブルソートは8枚・インデント3段で、
  空から組むとタップとインデント操作だけで20回を超える。見せたいのは並べ替えの動きのほう
- **ステップ数の多い問題は `speed` で詰める**。バブルソートは44ステップあり、既定の400msだと
  自動再生だけで18秒かかる
- 既定のクリーン画面は「組み立てたプログラム」と「正解の解説」を隠す。前者は上のカード列と
  同じ内容で、後者は短尺では読まれないうえ正解した瞬間に現れて字幕の下敷きになる

## chem との違い

chem の `assembler/rec.js` は既存の TutorialPlayer を駆動するだけの薄い層だが、
**DNCL にはチュートリアル機構が無い**ので、`rec.js` の中に最小の再生器を持たせている。
外から見えるインターフェースは chem と同一。

アクションDSL も chem（SVG座標ベース・14種）とは別物で、DNCL の操作に合わせた9種:

| type | 意味 |
|---|---|
| `wait {ms}` | 待つ |
| `card {id}` | カードをタップして トレイ⇔エディタ を移動 |
| `indent {id, delta}` | カードのインデントを増減 |
| `click {selector}` | 任意の要素をタップ |
| `select {selector, value}` | セレクトの値を変える |
| `step {times, pause}` | 「1行ずつ」を times 回 |
| `speed {ms}` | 自動再生の間隔（既定400ms）を変える |
| `run {stall}` | 「実行」を押して再生完了まで待つ |
| `scroll {selector}` | 要素が見えるところまでスクロール |

`state`（開始状態）は `{mode, problem, difficulty, place:[カードID…]}`。
`place` は演技を始める前にエディタへ置いておくカードで、chem の `state`（作図状態）にあたる。
台本直下の `showPreview: true` で「組み立てたプログラム」ペインを出す（既定は隠す）。

## 実装で判明したこと

- **`run` の打ち切りは経過時間で見てはいけない**。当初 60秒の上限にしていたが、
  ステップ数の多い問題（整列など）や遅い環境では正常な再生まで失敗扱いになる。
  「ステップ番号が進まなくなったら」（既定20秒）で見るように変えた
- **字幕の位置を vh で決めると実行シートとぶつかる**。シートは `max-height: 46vh` だが
  実際の高さは中身しだい（実測 355px ≒ 25vh）。rec.js が実測値を `--rec-sheet-h` に
  流し込み、CSS は `bottom: calc(var(--rec-sheet-h) + 32px)` で追従する
- **スクロールは `scroll-behavior: smooth` に頼らない**。収録環境によってはアニメーションが
  走らず、座標がずれたままクリックしてしまう。rec.js が自前で補間している
- **固定配置の要素はスクロール対象から外す**。実行を始めるとボタンがシートへ移るので、
  そのまま `scrollIntoView` 相当をやると画面が飛ぶ
- クリーン画面では「組み立てたプログラム」を隠す（上のカード列と同じ内容で、
  画面を食ううえ字幕の下敷きになる）。空になったトレイの枠も畳む

## 検証

- `?rec=intro-sum&format=short` を実収録 → **state=done / 810x1440・30fps・H.264 の 44秒 mp4**。
  抜き出したフレームで、カード配置・字下げ・現在行のハイライトとナレーション・
  実行シートの変数モニター（合計 55）・正解判定・出力 55 を確認
- **`?rec=` が無いときは完全に不活性**: `__recState` は undefined、オーバーレイ無し、
  html のクラス空、ヘッダー等すべて通常表示、通常操作で 23/23・正解・出力 55
- `verify_demos.js` が「存在しないカードID・存在しないセレクタ・模範解答と違う組み上がり・
  インデント違い」の4種を検出することを、わざと壊して確認
- `verify_problems.js` 27件 / `test_notation.js` 37件 / `test_problems_notation.js` 旧表記0件

## これから

- **chem 側 `DEVELOPMENT.md` のフェーズ13 P13-4 に InfoLens ぶんを記録する**。
  今回は chem リポジトリに別セッションの未コミット変更があったため触っていない
  （作業ツリー共有の事故を避けるため）。chem 側が clean になったときに追記する
- ナレーション文字数からのステップ尺自動算出は chem 側 P13-3 の残りに乗る話。
  DNCL の台本にも `narration` を持たせるのはそれが入ってから
- 合成音声（VOICEVOX）での仮ナレーションも chem 側の仕組みに相乗りする
