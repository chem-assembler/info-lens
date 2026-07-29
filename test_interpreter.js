const DNCLInterpreter = require("./dncl-interpreter.js");
const interpreter = new DNCLInterpreter();

// 1. 正しいインデントのケース
const correctBlocks = [
  { id: "b1", text: "N = 10", indent: 0 },
  { id: "b2", text: "合計 = 0", indent: 0 },
  { id: "b3", text: "i を 1 から N まで 1 ずつ増やしながら繰り返す:", indent: 0 },
  { id: "b4", text: "合計 = 合計 + i", indent: 1 },
  { id: "b5", text: "合計 を表示する", indent: 0 }
];

console.log("=== Test 1: Correct Indents ===");
const res1 = interpreter.run(correctBlocks, { N: 10 });
console.log("Success:", res1.success);
if (!res1.success) console.error("Error:", res1.error);
console.log("Output:", res1.output);

// 2. インデント設定ミスのケース（すべて 0）
// 旧ロジックで Unexpected token 'catch' の SyntaxError が発生していたケース
const badBlocks = [
  { id: "b1", text: "N = 10", indent: 0 },
  { id: "b2", text: "合計 = 0", indent: 0 },
  { id: "b3", text: "i を 1 から N まで 1 ずつ増やしながら繰り返す:", indent: 0 },
  { id: "b4", text: "合計 = 合計 + i", indent: 0 }, // ここが 0 だと、forループのブロックが閉じられない問題が起きていた
  { id: "b5", text: "合計 を表示する", indent: 0 }
];

console.log("\n=== Test 2: Missing Indents (All 0) ===");
const res2 = interpreter.run(badBlocks, { N: 10 });
console.log("Success:", res2.success);
if (!res2.success) {
  console.log("Expected compile failure caught nicely:", res2.error);
} else {
  console.log("Output:", res2.output); // 構文エラーにならずに実行され、ループの外で合計を計算したため期待と異なる出力になる
}

// 生成されたJSコード（インデントなし）の確認
const jsBad = interpreter.generateExecutableJS(badBlocks, { N: 10 });
console.log("\n--- Generated JS for Missing Indents ---");
console.log(jsBad);
console.log("-------------------------");
