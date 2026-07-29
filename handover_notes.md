# DNCL Playground 統合・引き継ぎ手順書 (Handover Notes)

本ドキュメントは、別プロジェクト `chem.schoollenz.com` を担当する別エージェントに、本リポジトリ（DNCL Playground）の成果物を引き継ぎ、サブディレクトリ配下に統合・デプロイするためのガイドラインです。

---

## 1. アプリケーションの特徴と技術スタック

*   **アーキテクチャ**: 完全な静的フロントエンドSPA（シングルページアプリケーション）。
*   **ビルドプロセス不要**: React/Vue等のフレームワークを使用せず、Vanilla HTML/CSS/JavaScriptで書かれています。WebpackやViteなどのビルド・コンパイル手順を踏むことなく、**ファイルをそのままWebサーバーに配置するだけで即座に稼働**します。
*   **パスの互換性**: HTMLやJS内のローカルファイル参照はすべて「相対パス（`./style.css` 等）」で記述されており、外部ライブラリ（SortableJSやFontAwesome）はCDN経由で絶対URLで読み込んでいます。そのため、ドメイン直下だけでなく、任意のサブディレクトリ（例: `chem.schoollenz.com/dncl/` 等）の配下に配置してもパスエラーが発生しません。

---

## 2. ファイル構成と役割

統合に必要なファイルは以下の通りです。フォルダ丸ごとコピーして統合先に配置してください。

| ファイル名 | 役割 |
| :--- | :--- |
| `index.html` | アプリケーションのUI構造（Semantic HTML & SEO対応） |
| `style.css` | 画面のスタイリング（プレミアム・ガラスモーフィズム、モバイルレスポンシブ） |
| `problems.js` | 演習問題（全6問）および構文学習用ミニ課題（全4ユニット）のデータ |
| `dncl-interpreter.js` | DNCL（疑似言語）を解析・トランスパイル・実行するエミュレータエンジン |
| `app.js` | UIイベント、SortableJS連携、ステップ実行、タップ簡単移動、変数可視化などのコア制御 |
| `verify_problems.js` | CLI用の全問題自動検証スクリプト（テストランナー） |

---

## 3. 統合手順（別エージェントへのお願い）

### ステップ1: ファイルの配置
`chem.schoollenz.com` の公開用ディレクトリ（Nginxのルート、Apacheのドキュメントルート、またはVercel等のプロジェクト公開ディレクトリ）配下に、新しいサブディレクトリ（例: `dncl/` または `playground/`）を作成し、本プロジェクトのファイルをすべてコピーして配置してください。

```bash
# 配置例 (chem.schoollenz.com の公開ルート配下に dncl フォルダを作る場合)
/var/www/chem.schoollenz.com/
  ├── (既存の化学関連ファイル)
  └── dncl/
        ├── index.html
        ├── style.css
        ├── problems.js
        ├── dncl-interpreter.js
        ├── app.js
        └── verify_problems.js
```

### ステップ2: メインサイトとの往来ナビゲーションの追加
ユーザーがメインサイトとDNCL Playgroundを行き来できるようにするため、以下の修正を行ってください。

1.  **メインサイト（化学側）からDNCLへのリンク追加**:
    化学側のメニューやヘッダーに「DNCL学習」等のナビゲーション項目を作り、URLを `/dncl/` (または配置したパス) に設定してください。
2.  **DNCL側からメインサイト（化学側）に戻るリンクの追加**:
    `index.html` のロゴセクション（18〜21行目付近）を以下のように書き換えて、メインサイトに戻るリンク（「化学サイトに戻る」など）を設置してください。

```diff
  <header>
    <div class="logo-section">
+     <a href="https://chem.schoollenz.com" class="back-link" style="color: var(--text-secondary); text-decoration: none; margin-right: 1rem; font-size: 0.9rem;">
+       <i class="fas fa-arrow-left"></i> 化学サイトに戻る
+     </a>
      <h1><i class="fas fa-graduation-cap"></i> DNCL Playground</h1>
      <span>共通テスト情報I 疑似言語エミュレータ</span>
    </div>
```

### ステップ3: デプロイ前の動作テスト
配置後、正常に動作するかを検証するため、Node.jsで問題検証スクリプトを実行してください。

```bash
# 問題データおよびインタプリタが正常にトランスパイルできるか確認
node verify_problems.js
```
出力の最後に `🎉 すべてのDNCL問題の模範解答が正常に動作することを確認しました！` と表示されれば、プログラム論理は正常です。

---

## 4. 保守・拡張時のガイド（他エージェント向け）

### 新しい問題・構文学習課題を追加したい場合
`problems.js` の `problems` 配列（演習用）または `syntaxLessons` 配列（構文学習用）に新しい問題オブジェクトを追加するだけで、UI側のドロップダウンや難易度タブ、カード生成が自動的に連動してロードされます。
追加後は必ず `node verify_problems.js` を実行し、構文エラー（SyntaxError）が出ないことを確認してください。
