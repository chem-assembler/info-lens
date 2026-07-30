# GEMINI.md — このリポジトリで作業するときの決まり

**情報レンズ（InfoLenz）** — SchoolLenz の情報系サブブランド。公開URL: https://info.schoollenz.com/
このファイルは Gemini 向けの入口。**規約の正は同じフォルダの `CLAUDE.md`**（構成表・背景・今後の課題まで書いてある）。
作業を始める前に `CLAUDE.md` も読むこと。ここには、それを読まなかった場合でも事故が起きないよう、
絶対に外せない項目だけを再掲する。

---

## 0. 大前提：このフォルダの中で作業する

作業ディレクトリは `C:\Users\maequ\マイドライブ\Antigravity\InfoLens` そのもの。
**別の場所（scratch など）にコピーして作業しないこと。**

初版はそうやって作られた結果、このファイル群が視界に入らず、下の「絶対ルール1」を知らないまま
CDN依存が3つ混入した（公開前に全て自前実装へ置き換える手戻りが発生）。配置が原因の事故だった。

## 1. 絶対ルール（破ると公開できない）

1. **外部アセットゼロ。** CDN・ウェブフォント・解析タグ・外部API を一切追加しない。
   `<script src="https://...">`、`<link href="https://fonts.googleapis...">`、CSS の `@import url('https://...')` は全て禁止。
   理由：オフラインで動くこと、学校端末で使えること、閲覧者のIPを第三者に渡さないこと。
   - アイコンが要るなら `dncl/icons.css` に自前のSVGを足す（FontAwesome を戻さない）
   - ドラッグ＆ドロップは `dncl/sortable-lite.js` を使う（SortableJS を戻さない）
   - フォントは OS 標準のみ（`--font-sans` / `--font-mono` を使う）
2. **全ファイル UTF-8（BOMなし）。**
3. **UIに書いた機能名と実装を一致させる。** 実装していない機能の名前をボタンやペインに出さない。
   （初版には「Python 変換プレビュー」というペインがあったが、Python変換のコードは存在せず、
   組み立てたDNCLをそのまま表示していた。現在は「組み立てたプログラム」に改称済み）
4. **アプリの公開名は「1行ずつみるアルゴリズム」**（副題に DNCL）。
   コードネーム "DNCL Playground" は旧称。UIやメタ情報で復活させない。
5. **録画モード（`dncl/rec.js`）は `?rec=` が無ければ完全に不活性であること。**
   SNS素材の収録用であって学習機能ではない。通常利用・テストに影響を与えてはいけない。
   `.recording` クラス配下の CSS も、`?rec=` 付きでしか当たらないようにする。

## 2. 作業サイクル（毎回これを回す）

```bash
# 1) 変更前：作業ツリーがきれいか確認
git status --short

# 2) 変更後：全問題の模範解答が通るか（問題データを触っていなくても実行してよい）
node dncl/verify_problems.js      # 「失敗: 0 件」が出れば合格
node dncl/verify_demos.js         # 録画台本が問題データに追随できているか

# 3) 実物をブラウザで確認（別ターミナルで起動しっぱなしにする）
python -m http.server 8128        # → http://localhost:8128/dncl/

# 4) 1つの変更 = 1コミット。確認した内容をコミットメッセージに書く
git add -A && git commit
git push origin main
```

**「動きます」と書く前に、必ず 2) と 3) を実際に実行すること。** 特に 3) は、
組み立て→インデント→実行まで自分で操作して、期待した出力が出ることを目で見る。

## 3. どこを触ればいいか

| ファイル | 役割 |
|---|---|
| `dncl/problems.js` | 問題データ。**足す作業はほぼここだけで完結する** |
| `dncl/dncl-interpreter.js` | DNCLの解析・実行エンジン。新しい構文を足すときだけ触る |
| `dncl/app.js` | UI制御・ステップ実行・変数モニター |
| `dncl/style.css` | 見た目。フォントは追加しない |
| `dncl/icons.css` | アイコン（CSSマスク＋インラインSVG） |
| `dncl/sortable-lite.js` | ドラッグ＆ドロップの自前実装 |
| `index.html`（ルート） | 情報レンズのハブ。アプリを増やしたらカードと単元表を更新する |

### 問題を1問追加する手順

`dncl/problems.js` の `problems` 配列（演習用）または `syntaxLessons` 配列（構文学習用）に
オブジェクトを1つ足すだけ。UI側のドロップダウン・難易度タブ・カード生成は自動で連動する。

オブジェクトのキー：

- `id` … 一意の英小文字スネークケース
- `title` / `description` … 表示名と問題文
- `difficulty` … `"初級"` / `"中級"` / `"上級"`（演習用のみ）
- `initialState` … 実行開始時の変数（例 `{ N: 10, arrayData: null }`）
- `correctBlocks` … 正解の並び。各要素は `{ id, text, indent, isLocked? }`。
  `isLocked: true` は動かせない前提のカード
- `easyBlocks` / `normalBlocks` / `hardBlocks` … 各難易度でトレイに出すカード。
  normal 以上は `isDummy: true` と `reason`（なぜ間違いかの説明）を持つダミーを混ぜる。
  hard は `inputs` で穴埋めにする
- `narratives` … ブロックIDごとの、実行中に出す日本語のナレーション（`(vars) => "..."`）
- `explanation` … 正解後に出す解説

構文学習用（`syntaxLessons`）は難易度を持たない。`difficulty` と `easyBlocks` 等の代わりに
`blocks` を1つだけ持つ。それ以外のキーは演習用と同じ。

追加したら必ず `node dncl/verify_problems.js` を実行する。構文エラーや、
模範解答が動かない問題はここで止まる。

## 4. やらないこと

- 上の「絶対ルール」に反する変更
- ビルドツール（npm / webpack / vite など）の導入。**ビルド不要の静的配信のまま維持する**
- `CNAME` の変更（`info.schoollenz.com`）
- ルートの `index.html`（ハブ）のブランド表記を変えること。「情報レンズ / InfoLenz」「SchoolLenz」が正
- 大規模なリファクタリングを、依頼されていないのに同じコミットに混ぜること

## 5. 次にやるとよいこと

`CLAUDE.md` の「これから」節に一覧がある。手を付けやすい順に：

1. **整列（ソート）アルゴリズムの問題追加** … `problems.js` に足すだけ。機械検証が効くので事故りにくい
2. **Python 対照表示** … 「組み立てたプログラム」ペインに、DNCLから変換したPythonを並べる。
   DNCL→Python はほぼ1:1（`表示する`→`print`、`もし〜ならば`→`if`、
   `〜から〜まで〜ずつ増やしながら繰り返す`→`for range`、`の整数部分`→`//`）。
   情報Iの実習言語がPythonの学校が多く、価値が高い
3. 情報Iの他領域（情報デザイン／ネットワーク／データの活用）の新しいレンズ

## 6. 他のエージェントとの受け渡し

このリポジトリは Claude Code とも共有している。**同時に走らせない。**
作業ツリーを共有したまま両方が動くと、片方のコミットがもう片方に吸い込まれる事故が起きる。

- 作業を始める前に `git status --short` が空であることを確認する
- 作業を終えたら **必ずコミットして `git push origin main` し、clean な状態で手放す**
- 公開・リリース系（DNS、GitHub Pages の設定、他リポジトリ（portal / chem）との横断作業）は
  Claude Code 側で行う取り決めになっている。これらには手を出さない
