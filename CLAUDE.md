# 情報レンズ（InfoLenz）

SchoolLenz の情報系サブブランド。公開URL: https://info.schoollenz.com/
（親ポータル: https://schoollenz.com/ ／ 姉妹: 化学レンズ https://chem.schoollenz.com/）

ビルドツールなし・静的配信（GitHub Pages）。ブランド階層とURL階層を1:1に保つ方針:
**ポータル（schoollenz.com）→ 教科サブドメイン（info.schoollenz.com）→ アプリはサブディレクトリ**。

## 構成

| パス | 中身 |
|---|---|
| `index.html` | 情報レンズのハブ（アプリ一覧＋単元別インデックス）。自己完結・外部アセットなし |
| `dncl/` | **1行ずつみるアルゴリズム（DNCL）** — 共通テスト「情報I」の疑似言語エミュレータ |
| `CNAME` | info.schoollenz.com |
| `docs/handover_notes.md` | 元の開発エージェントからの引き継ぎメモ（統合前の想定なので、配置手順の記述は現状と異なる） |

### dncl/ の内訳

| ファイル | 責務 |
|---|---|
| `index.html` | UI構造 |
| `style.css` | スタイル（ダークテーマ・モバイル対応） |
| `icons.css` | アイコン（CSSマスク＋インラインSVG。FontAwesome CDN の置き換え） |
| `sortable-lite.js` | ドラッグ＆ドロップ（SortableJS CDN の置き換え・自前実装） |
| `problems.js` | 演習問題15問＋構文学習12ユニットのデータ |
| `dncl-interpreter.js` | DNCLの解析・実行エンジン（DNCL→JS。実行はこちら） |
| `dncl-to-python.js` | DNCL→Python 変換（対照表示のための1行1行の対応。実行には使わない） |
| `app.js` | UI制御・ステップ実行・変数可視化 |
| `rec.js` / `demos.json` | 録画モード（`?rec=` があるときだけ動くSNS素材収録用の自動再生層と台本） |
| `verify_problems.js` | 全問題の模範解答を実行して検証するCLIスクリプト |
| `verify_demos.js` | 録画台本が問題データと整合しているか検証するCLIスクリプト |
| `verify_python.js` | 変換した Python を実際に走らせ、DNCL と同じ出力になるか検証するCLIスクリプト |

## 重要ルール

- **外部アセットゼロ**。CDN・ウェブフォント・解析タグを入れない（オフラインで動く／閲覧者のIPを第三者に渡さない）。
  アイコンとドラッグ＆ドロップを自前に置き換えたのはこのため。復活させないこと
- 全ファイル **UTF-8（BOMなし）**
- 問題データを触ったら `node dncl/verify_problems.js` を実行し、全件成功を確認してからコミット。
  問題データや UI のセレクタを変えたときは `node dncl/verify_demos.js` も通す（録画台本が追随できているか）。
  DNCL の文法や `dncl-to-python.js` を触ったときは `node dncl/verify_python.js`
  （変換した Python を実際に走らせて DNCL と出力を突き合わせる）
- **録画モードは `?rec=` が無ければ完全に不活性であること**が絶対条件。
  通常利用・テストに影響を与えない（詳細は `docs/NEXT_dncl_recording.md`、設計の正は chem 側 `DESIGN_recording_mode.md`）
- 公開名は **「1行ずつみるアルゴリズム」**（副題に DNCL を添える）。SchoolLenz の
  「〈X〉でみる〈Y〉」命名規約に沿う。コードネーム "DNCL Playground" は旧称
- ローカル確認: リポジトリルートで `python -m http.server 8128` → http://localhost:8128/
- **UIに書いた機能名と実装を一致させる**。実装していない機能の名前をボタンやペインに出さない
  （初版には「Python 変換プレビュー」というペインがあったが、Python変換のコードは存在せず
  組み立てたDNCLをそのまま表示していた。2026-07-29 に「組み立てたプログラム」へ改称）

## 作業の進めかた（2026-07-29 合意）

このリポジトリは Claude Code と Gemini（Antigravity）の両方で触る。**必ずリポジトリ直下で作業する**こと
（初版が scratch ディレクトリで作られたため、この CLAUDE.md が見えず外部アセット禁止の方針を
知らないまま CDN を3つ入れてしまった。配置がルール違反の原因だった）。

- **Claude Code で進めるもの**: 公開・リリース系（コミット儀式・push・DNS・Pages設定）、
  複数リポジトリにまたがる作業（portal / chem との横断）、本番で実際に動かして確かめる必要がある変更
- **Gemini で進めてよいもの**: `dncl/problems.js` への問題追加のように、
  `node dncl/verify_problems.js` の機械検証が事故を止めてくれる定型のコンテンツ拡充。
  リポジトリ内で完結する単発のUI改善
- **同じリポジトリで両方を同時に走らせない**。作業ツリーを共有すると、
  片方の `commit -a` が相手の変更を吸い込む（2026-07-25 に別リポジトリで実発生）。
  切り替えるときは必ず片方を **コミット済み・clean** にしてから
- Gemini は `CLAUDE.md` を読まないので、同内容の入口として **`GEMINI.md`** を置いてある。
  絶対ルール（外部アセットゼロ・UTF-8・UIの機能名と実装の一致・公開名）と作業サイクルは両方に書いてあるので、
  **これらを変更したときは2ファイルとも直すこと**

## これから

- 「組み立てたプログラム」ペインの **Python コピーボタン**（生徒が実習環境に貼れるように）
- 録画台本（`demos.json`）の追加。構文学習編・整列アルゴリズムなど
- 情報Iの他領域（情報デザイン／ネットワーク／データの活用）のレンズ

済んだもの: 整列アルゴリズムの問題追加（`bubble_sort` ほか。演習15問・構文学習12項目）、
Python 対照表示（`dncl-to-python.js`）、小画面レイアウトの立て直し、録画モード（P13-4）
