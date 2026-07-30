/**
 * 録画モードの台本（demos.json）検証スクリプト
 *
 * 台本は座標ではなく「問題ID・カードID・セレクタ」で書かれているので、
 * 問題データを差し替えたときに壊れやすい。ブラウザを起動せずに、
 * 参照先が実在するか・アクションの形が正しいかだけを機械で確かめる。
 * （実際に完走するかは tools/record での収録が最終確認）
 *
 * 使い方: node dncl/verify_demos.js
 */

const fs = require("fs");
const path = require("path");
const { problems, syntaxLessons } = require("./problems.js");

const demosPath = path.join(__dirname, "demos.json");
const indexHtml = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");

const ACTION_TYPES = ["wait", "card", "indent", "click", "select", "step", "run", "scroll"];

let errors = 0;
let checks = 0;

function fail(msg) {
  console.log(`  NG   ${msg}`);
  errors++;
}
function ok(msg) {
  console.log(`  OK   ${msg}`);
  checks++;
}

/** index.html に id / クラスが存在するか（ざっくりでよい。誤字を止めるのが目的） */
function selectorExists(sel) {
  const id = sel.match(/^#([\w-]+)$/);
  if (id) return indexHtml.includes(`id="${id[1]}"`);
  const cls = sel.match(/^\.([\w-]+)$/);
  if (cls) return indexHtml.includes(cls[1]);
  return true; // 複雑なセレクタは検査しない
}

const demos = JSON.parse(fs.readFileSync(demosPath, "utf8"));
console.log(`=== demos.json の検証（${demos.length} 本）===\n`);

const seenIds = new Set();

demos.forEach(demo => {
  console.log(`[${demo.id}] ${demo.title || ""}`);

  if (!demo.id) fail("id が無い");
  if (seenIds.has(demo.id)) fail(`id が重複している: ${demo.id}`);
  seenIds.add(demo.id);
  if (!Array.isArray(demo.steps) || demo.steps.length === 0) {
    fail("steps が空");
    return;
  }

  // --- 開始状態 ---
  const st = demo.state || {};
  const mode = st.mode || "exercise";
  if (!["exercise", "syntax"].includes(mode)) fail(`state.mode が不正: ${mode}`);
  const list = mode === "syntax" ? syntaxLessons : problems;

  let problem = null;
  if (st.problem) {
    problem = list.find(p => p.id === st.problem);
    if (!problem) fail(`state.problem が存在しない: ${st.problem}`);
    else ok(`問題 ${st.problem} を参照`);
  } else {
    problem = list[0];
  }
  if (st.difficulty && !["easy", "normal", "hard"].includes(st.difficulty)) {
    fail(`state.difficulty が不正: ${st.difficulty}`);
  }

  if (!problem) return;

  // その難易度でトレイに並ぶカードの集合（＝台本が触れるカード）
  const difficulty = st.difficulty || "easy";
  const source = mode === "syntax"
    ? problem.blocks
    : (difficulty === "easy" ? problem.easyBlocks
      : difficulty === "normal" ? problem.normalBlocks : problem.hardBlocks);
  if (!source) {
    fail(`難易度 ${difficulty} のカードが問題側に無い`);
    return;
  }
  const cardIds = new Set(source.map(b => b.id));
  const lockedIds = new Set(source.filter(b => b.isLocked).map(b => b.id));

  (st.place || []).forEach(id => {
    if (!cardIds.has(id)) fail(`state.place のカードが存在しない: ${id}`);
    else if (lockedIds.has(id)) fail(`state.place が固定カードを指している（動かせない）: ${id}`);
  });

  // --- 各ステップ ---
  let actionCount = 0;
  demo.steps.forEach((step, si) => {
    const where = `step${si + 1}`;
    if (!Array.isArray(step.actions)) {
      fail(`${where}: actions が配列でない`);
      return;
    }
    step.actions.forEach((a, ai) => {
      actionCount++;
      const at = `${where}.action${ai + 1}(${a.type})`;
      if (!ACTION_TYPES.includes(a.type)) {
        fail(`${at}: 未知のアクション`);
        return;
      }
      if (a.type === "card" || a.type === "indent") {
        if (!cardIds.has(a.id)) fail(`${at}: カードIDが存在しない: ${a.id}`);
        else if (lockedIds.has(a.id)) fail(`${at}: 固定カードは動かせない: ${a.id}`);
      }
      if (a.type === "indent" && !a.delta) fail(`${at}: delta が無い`);
      if ((a.type === "click" || a.type === "scroll" || a.type === "select")) {
        if (!a.selector) fail(`${at}: selector が無い`);
        else if (!selectorExists(a.selector)) fail(`${at}: セレクタが index.html に無い: ${a.selector}`);
      }
      if (a.type === "select" && a.value === undefined) fail(`${at}: value が無い`);
    });
  });

  // --- 台本が組み上げるカードが模範解答と一致するか ---
  // （card アクションは奇数回タップで配置・偶数回で戻る）
  const taps = {};
  (st.place || []).forEach(id => { taps[id] = 1; });
  demo.steps.forEach(step => (step.actions || []).forEach(a => {
    if (a.type === "card") taps[a.id] = (taps[a.id] || 0) + 1;
  }));
  const placed = new Set(Object.keys(taps).filter(id => taps[id] % 2 === 1));
  lockedIds.forEach(id => placed.add(id)); // 固定カードは最初から置かれている

  const answer = new Set((problem.correctBlocks || []).map(b => b.id));
  const missing = [...answer].filter(id => !placed.has(id));
  const extra = [...placed].filter(id => !answer.has(id));

  if (missing.length || extra.length) {
    fail(`組み上がりが模範解答と違う（不足: ${missing.join(",") || "なし"} / 余分: ${extra.join(",") || "なし"}）`);
  } else {
    ok(`カード ${placed.size} 枚が模範解答どおりに揃う`);
  }

  // --- インデントが模範解答と一致するか ---
  const indent = {};
  (st.place || []).forEach(id => {
    const spec = (problem.correctBlocks || []).find(b => b.id === id);
    indent[id] = (spec && spec.indent) || 0;
  });
  demo.steps.forEach(step => (step.actions || []).forEach(a => {
    if (a.type === "card") {
      // トレイへ戻すとインデントは 0 に戻る（app.js: handleCardTap）
      indent[a.id] = 0;
    } else if (a.type === "indent") {
      indent[a.id] = Math.max(0, Math.min(3, (indent[a.id] || 0) + a.delta));
    }
  }));
  const wrong = (problem.correctBlocks || [])
    .filter(b => !b.isLocked && placed.has(b.id))
    .filter(b => (indent[b.id] || 0) !== (b.indent || 0))
    .map(b => `${b.id}:${indent[b.id] || 0}→正${b.indent || 0}`);
  if (wrong.length) fail(`インデントが模範解答と違う（${wrong.join(", ")}）`);
  else ok("インデントが模範解答どおり");

  console.log(`       ステップ ${demo.steps.length} / アクション ${actionCount}\n`);
});

console.log("==============================");
console.log(`検査: ${checks} 件成功 / ${errors} 件失敗`);
console.log("==============================");
if (errors > 0) {
  console.log("台本が問題データとずれている。demos.json を直すこと。");
  process.exit(1);
}
console.log("すべての台本が問題データと整合している。");
