/**
 * 問題カードの表記が共通テスト仕様（新DNCL）になっているかを検査する lint
 *
 *   node dncl/test_problems_notation.js
 *
 * 【この検査の位置づけ】
 * インタプリタ側は 2026-07-30 に新旧どちらの表記でも動くようになった（test_notation.js）。
 * 残っているのは **生徒が最初に目にするカード・問題文の表記**。
 * ここが旧表記のままだと「共通テストと同じ表記で練習できる」と言えないため、
 * problems.js のカード文言を公式表記へ統一する。その進捗をこの lint で測る。
 *
 * FAIL するのはカードの text（と入力欄の correct / placeholder）のみ。
 * 解説文（description / explanation / narratives）は日本語の散文なので
 * 機械判定に向かず、**警告として一覧するだけ**にしている。
 * ただし解説がカードを「」で引用している箇所は、カードと食い違うと生徒が混乱するので
 * 警告を見て人が直すこと。
 */
const path = require("path");
const { problems, syntaxLessons } = require("./problems.js");

// カード text に残っていてはいけない旧表記
const RULES = [
  { re: /を表示する/, ng: "「〈式〉 を表示する」", ok: '「表示する(〈式〉)」' },
  { re: /かつ/, ng: "「かつ」", ok: "「and」" },
  { re: /または/, ng: "「または」", ok: "「or」" },
  { re: /の整数部分/, ng: "「〈式〉 の整数部分」", ok: "整数除算の「÷」" },
  { re: /\]\s*\[/, ng: "2次元添字の A[i][j]", ok: "A[i,j]" },
  { re: /そうではなくもし/, ng: "「そうではなくもし」", ok: "「そうでなくもし」" },
];

const BLOCK_KEYS = ["correctBlocks", "easyBlocks", "normalBlocks", "hardBlocks"];

/**
 * 人が見て「このままでよい」と決めた箇所（2026-08-12 確認）。
 * 旧表記を引用しているが、それ自体が説明の中身なので直すと文が成り立たない。
 *   lesson_logic_ops … 「かつ」「または」を and / or に言い換える、という説明そのもの
 * ここに足すときは、なぜ直さないのかを必ず書くこと（黙って消さない）
 */
const REVIEWED = new Set([
  "[lesson:lesson_logic_ops] description（カードを「」で引用している箇所）",
]);
let ngCount = 0;
let cardCount = 0;
const warnings = [];

function checkText(where, text) {
  if (typeof text !== "string") return;
  cardCount++;
  RULES.forEach(r => {
    if (r.re.test(text)) {
      ngCount++;
      console.log(`NG  ${where}`);
      console.log(`      "${text}"`);
      console.log(`      → ${r.ng} は使わない。${r.ok} に直す`);
    }
  });
}

function checkItem(item, kind) {
  BLOCK_KEYS.forEach(key => {
    (item[key] || []).forEach(b => {
      checkText(`[${kind}:${item.id}] ${key} ${b.id}`, b.text);
      if (b.inputs) {
        Object.entries(b.inputs).forEach(([name, spec]) => {
          checkText(`[${kind}:${item.id}] ${key} ${b.id} inputs.${name}.correct`, spec.correct);
          checkText(`[${kind}:${item.id}] ${key} ${b.id} inputs.${name}.placeholder`, spec.placeholder);
        });
      }
      // ダミーカードの理由文もカード表記を引用しがちなので警告対象に
      if (typeof b.reason === "string" && /を表示する|かつ|または|の整数部分/.test(b.reason)) {
        warnings.push(`[${kind}:${item.id}] ${key} ${b.id}.reason`);
      }
    });
  });
  // 解説文は警告のみ（散文なので機械判定しない）
  ["description", "explanation"].forEach(k => {
    if (typeof item[k] === "string" && /「[^」]*(を表示する|かつ|または|の整数部分)[^」]*」/.test(item[k])) {
      warnings.push(`[${kind}:${item.id}] ${k}（カードを「」で引用している箇所）`);
    }
  });
  if (item.narratives) {
    Object.entries(item.narratives).forEach(([k, v]) => {
      if (typeof v === "string" && /「[^」]*(を表示する|かつ|または|の整数部分)[^」]*」/.test(v)) {
        warnings.push(`[${kind}:${item.id}] narratives.${k}`);
      }
    });
  }
}

console.log("=== 問題カードの表記検査（共通テスト仕様）===\n");
(problems || []).forEach(p => checkItem(p, "problem"));
(syntaxLessons || []).forEach(l => checkItem(l, "lesson"));

const pending = [...new Set(warnings)].filter(w => !REVIEWED.has(w));
const reviewed = [...new Set(warnings)].filter(w => REVIEWED.has(w));

if (pending.length) {
  console.log("\n--- 警告: 解説文がカードを引用している可能性がある箇所（人が確認して直す）---");
  pending.forEach(w => console.log(`WARN  ${w}`));
}
if (reviewed.length) {
  console.log("\n--- 確認ずみ（意図して旧表記を引用している）---");
  reviewed.forEach(w => console.log(`OK    ${w}`));
}

/**
 * app.js のアドバイス文もカード名を「」で引用している（例:「合計 を表示する」）。
 * カードの表記を変えたらここも直さないと、**生徒が画面で見ているカード名と
 * アドバイスの文言が食い違う**（2026-07-30 の第3ラウンドで実際に4箇所残った）。
 */
{
  const fs = require("fs");
  const appPath = path.join(__dirname, "app.js");
  if (fs.existsSync(appPath)) {
    const src = fs.readFileSync(appPath, "utf8");
    src.split("\n").forEach((line, i) => {
      // 「〈式〉 を表示する」のようにカードを引用している箇所だけを拾う
      const m = line.match(/「[^」]{0,30}(?:を表示する|の整数部分)[^」]{0,10}」/g);
      if (m) {
        m.forEach(q => {
          ngCount++;
          console.log(`NG  app.js:${i + 1} アドバイス文がカードを旧表記で引用している`);
          console.log(`      ${q}`);
          console.log(`      → カードの新表記（例「表示する(合計)」）に合わせる`);
        });
      }
    });
  }
}

console.log("\n==============================");
console.log(`検査したカード: ${cardCount} 件 / 旧表記の残り: ${ngCount} 件`);
console.log(`解説文の要確認: ${pending.length} 箇所（FAILには数えない） / 確認ずみ: ${reviewed.length} 箇所`);
console.log("==============================");
if (ngCount > 0) {
  console.log("\nカードの表記が公式（新DNCL）に統一されていない。");
  process.exitCode = 1;
} else {
  console.log("\nカードの表記はすべて公式（新DNCL）に統一されている。");
}
