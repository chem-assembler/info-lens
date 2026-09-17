/**
 * ハードの穴埋め欄の「案内」と「例」の検査
 *
 *   node dncl/test_input_hints.js
 *
 * 【背景（2026-09-17）】
 * 案内（placeholder）に「条件式 (例: i % 3)」のように例まで書いていたので、
 * 欄の幅（80px）で「表示する変」のように途中で切れ、入力すると消えて見返せなかった。
 * 決めたこと:
 *   - 案内は「変数」「条件式」のように短くし、欄の幅に収める
 *   - 例は `hint` に分け、欄を押したとき（フォーカスしたとき）だけ札で出す（app.js の showInputHint）。
 *     ハードは自分で考える難易度で、例は答えそのものに近いので、常に見せない
 *
 * 【見ること】
 *   1. 全問の案内が、欄の幅（style.css の .block-input の em）に収まる字数である
 *   2. 案内に例（「例」・かっこ書き）を書き戻していない
 *   3. 例は hint にあり、空でなく、案内と別物である
 *   4. 否定対照: 直す前の案内をこの検査にかけると、ちゃんと NG になる
 *
 * 字数は「全角1・半角0.6」で数える（等幅フォントの実測で、半角は全角の 0.55 倍）。
 * 実際のブラウザでの実測（1280px / 375px）は、この検査より厳しくないことを確認してある。
 */
const fs = require("fs");
const path = require("path");
const { problems, syntaxLessons } = require("./problems.js");

const BLOCK_KEYS = ["correctBlocks", "easyBlocks", "normalBlocks", "hardBlocks"];

let ngCount = 0;
let okCount = 0;
function ng(msg) { ngCount++; console.log(`NG  ${msg}`); }

// --- 欄の幅（字数）を style.css から読む ---
const css = fs.readFileSync(path.join(__dirname, "style.css"), "utf8");
const widthRule = css.match(/\.block-card \.block-input\s*\{[^}]*width:[^;]*calc\(\s*([\d.]+)em/);
if (!widthRule) {
  ng("style.css に `.block-card .block-input { width: ... calc(<N>em ...) }` が無い（欄の幅を em で決めていない）");
}
// 欄の中身の幅（padding と枠を除いた部分）が N em。その中に入る全角の字数
const BUDGET = widthRule ? parseFloat(widthRule[1]) : 0;

function displayWidth(s) {
  let w = 0;
  for (const ch of s) w += ch.charCodeAt(0) < 0x80 ? 0.6 : 1;
  return w;
}

/** 1つの欄の定義を調べ、見つけた問題を配列で返す（否定対照でも同じ関数を使う） */
function problemsOf(spec) {
  const out = [];
  if (typeof spec.placeholder !== "string" || spec.placeholder.trim() === "") {
    out.push("案内（placeholder）が空");
    return out;
  }
  const w = displayWidth(spec.placeholder);
  if (w > BUDGET) out.push(`案内「${spec.placeholder}」が欄の幅を超える（${w.toFixed(1)} 字 > ${BUDGET} 字）`);
  if (/例|[()（）]/.test(spec.placeholder)) out.push(`案内「${spec.placeholder}」に例やかっこ書きが入っている（例は hint に分ける）`);
  if ("hint" in spec) {
    if (typeof spec.hint !== "string" || spec.hint.trim() === "") out.push("hint があるのに空");
    else if (spec.hint === spec.placeholder) out.push(`hint が案内と同じ「${spec.hint}」`);
  }
  return out;
}

console.log("=== ハードの穴埋め欄: 案内と例の検査 ===");
console.log(`欄の幅: ${BUDGET} 字（style.css の .block-input）\n`);

let inputCount = 0;
let hintCount = 0;
function checkItem(item, kind) {
  BLOCK_KEYS.forEach(key => {
    (item[key] || []).forEach(b => {
      if (!b.inputs) return;
      Object.entries(b.inputs).forEach(([name, spec]) => {
        inputCount++;
        if ("hint" in spec) hintCount++;
        const found = problemsOf(spec);
        found.forEach(f => ng(`[${kind}:${item.id}] ${key} ${b.id} inputs.${name}: ${f}`));
        if (!found.length) okCount++;
      });
    });
  });
}
(problems || []).forEach(p => checkItem(p, "problem"));
(syntaxLessons || []).forEach(l => checkItem(l, "lesson"));

if (inputCount === 0) ng("穴埋め欄が1つも見つからない（problems.js の読み方が変わった？）");

// --- app.js が hint を案内や読み上げラベルに混ぜていないか ---
{
  const src = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");
  if (!/input\.placeholder\s*=\s*spec\.placeholder/.test(src)) ng("app.js: 欄の案内に spec.placeholder を入れていない");
  if (/(placeholder\s*=|aria-label",)\s*[^;\n]*spec\.hint/.test(src)) ng("app.js: spec.hint を案内か読み上げラベルに入れている（例が常に見えてしまう）");
  if (!/showInputHint\s*\(/.test(src)) ng("app.js: 例を出す showInputHint が無い");
}

// --- 否定対照: 直す前の案内は NG にならなければならない ---
console.log("--- 否定対照（直す前の案内。NG になるのが正しい）---");
const CONTROLS = [
  { spec: { placeholder: "表示する変数", correct: "合計" }, expectNg: true, why: "6字で欄に入らない" },
  { spec: { placeholder: "外側の条件", correct: "x" }, expectNg: true, why: "5字で欄に入らない（小画面で欄が次の行へ落ちる）" },
  { spec: { placeholder: "次のA", correct: "B" }, expectNg: false, why: "半角まじりの短い案内（通るのが正しい）" },
  { spec: { placeholder: "条件式 (例: i % 3)", correct: "i % 3" }, expectNg: true, why: "例を案内に書いている" },
  { spec: { placeholder: "ネストの条件 (例: 西暦 % 100 != 0 or 西暦 % 400 == 0)", correct: "x" }, expectNg: true, why: "長すぎる" },
  { spec: { placeholder: "条件式", hint: "", correct: "i % 3" }, expectNg: true, why: "hint が空" },
  { spec: { placeholder: "条件式", hint: "条件式", correct: "i % 3" }, expectNg: true, why: "hint が案内と同じ" },
  { spec: { placeholder: "条件式", hint: "例: i % 3", correct: "i % 3" }, expectNg: false, why: "直した形（通るのが正しい）" },
];
CONTROLS.forEach(c => {
  const got = problemsOf(c.spec).length > 0;
  if (got === c.expectNg) console.log(`OK  「${c.spec.placeholder}」→ ${got ? "NG" : "通過"}（${c.why}）`);
  else ng(`否定対照「${c.spec.placeholder}」が ${got ? "NG" : "通過"} になった（期待: ${c.expectNg ? "NG" : "通過"}・${c.why}）`);
});

console.log("\n==============================");
console.log(`穴埋め欄: ${inputCount} 件（例つき ${hintCount} 件） / 合格 ${okCount} 件 / NG ${ngCount} 件`);
console.log("==============================");
if (ngCount > 0) {
  console.log("\n案内が欄に収まっていないか、例の分け方が崩れている。");
  process.exitCode = 1;
} else {
  console.log("\nすべての案内が欄に収まり、例は hint に分かれている。");
}
