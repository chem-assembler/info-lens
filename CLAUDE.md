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
| `problems.js` | 演習問題7問＋構文学習7ユニットのデータ |
| `dncl-interpreter.js` | DNCLの解析・実行エンジン |
| `app.js` | UI制御・ステップ実行・変数可視化 |
| `verify_problems.js` | 全問題の模範解答を実行して検証するCLIスクリプト |

## 重要ルール

- **外部アセットゼロ**。CDN・ウェブフォント・解析タグを入れない（オフラインで動く／閲覧者のIPを第三者に渡さない）。
  アイコンとドラッグ＆ドロップを自前に置き換えたのはこのため。復活させないこと
- 全ファイル **UTF-8（BOMなし）**
- 問題データを触ったら `node dncl/verify_problems.js` を実行し、全件成功を確認してからコミット
- 公開名は **「1行ずつみるアルゴリズム」**（副題に DNCL を添える）。SchoolLenz の
  「〈X〉でみる〈Y〉」命名規約に沿う。コードネーム "DNCL Playground" は旧称
- ローカル確認: リポジトリルートで `python -m http.server 8128` → http://localhost:8128/

## これから

- 整列（ソート）アルゴリズムの問題追加
- 「組み立てたプログラム」ペインを **Python 対照表示** にする（DNCL→Python は
  ほぼ1:1。情報Iの実習言語がPythonの学校が多く、価値が高い。現状は組み立てたDNCLをそのまま表示）
- 情報Iの他領域（情報デザイン／ネットワーク／データの活用）のレンズ
