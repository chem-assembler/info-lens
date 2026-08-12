/**
 * しくみ編の全課題を digitize.js で実行して検証する CLI スクリプト。
 *
 *   node digitize/verify_lessons.js
 *
 * 検査（設計書 9 節）:
 *   a. トレースの標本数が指定どおり
 *   b. ビット列の合計長 = 標本の数 × ビット数
 *   c. すべての段階が 0 .. 2^bit - 1 に収まる
 *   d. 標本点での量子化誤差が段階幅の半分以下（丸めが正しければ数学的に必ず成り立つ）
 *   e. 課題データの形（つまみの範囲・固定値のつじつま）が合っている
 * つまみのある課は、範囲の両端と初期値の全組み合わせで a〜d を回す。
 */

const Digitize = require("./digitize.js");
const { lessons } = require("./lessons.js");

let passed = 0;
let failed = 0;
const EPS = 1e-9;

function fail(id, msg) {
  console.error(`❌ [${id}] ${msg}`);
  failed++;
}

function candidates(control, fixedValue) {
  if (control === null || control === undefined) return [fixedValue];
  return [...new Set([control.min, control.value, control.max])];
}

lessons.forEach(lesson => {
  const errors = [];

  // e. データの形
  if (!lesson.id || !lesson.title || !lesson.wave) errors.push("id / title / wave が欠けている");
  ["sampleCount", "bitDepth"].forEach(key => {
    const c = lesson.controls ? lesson.controls[key] : undefined;
    if (c === null || c === undefined) {
      if (!(key in (lesson.fixed || {}))) errors.push(`${key} がつまみにも fixed にも無い`);
    } else {
      if (!(c.min < c.max)) errors.push(`${key} の範囲が不正 (min ${c.min} / max ${c.max})`);
      if (c.value < c.min || c.value > c.max) errors.push(`${key} の初期値 ${c.value} が範囲外`);
    }
  });
  if (errors.length > 0) {
    errors.forEach(e => fail(lesson.id, e));
    return;
  }

  // a〜d. 全組み合わせで実行
  const sampleCounts = candidates(lesson.controls.sampleCount, lesson.fixed.sampleCount);
  const bitDepths = candidates(lesson.controls.bitDepth, lesson.fixed.bitDepth);
  let combos = 0;

  for (const n of sampleCounts) {
    for (const bit of bitDepths) {
      combos++;
      const label = `${lesson.id} n=${n} bit=${bit}`;
      let trace;
      try {
        trace = Digitize.run(lesson.wave, n, bit);
      } catch (e) {
        fail(label, "実行が例外: " + e.message);
        continue;
      }

      if (trace.length !== n) {
        fail(label, `標本数 ${trace.length}（期待 ${n}）`);
        continue;
      }
      const allBits = trace.map(s => s.bits).join("");
      if (allBits.length !== n * bit) {
        fail(label, `ビット列の長さ ${allBits.length}（期待 ${n * bit}）`);
        continue;
      }
      if (/[^01]/.test(allBits)) {
        fail(label, "ビット列に 0/1 以外が混ざっている");
        continue;
      }
      const top = Digitize.levels(bit) - 1;
      if (!trace.every(s => Number.isInteger(s.level) && s.level >= 0 && s.level <= top)) {
        fail(label, "段階が 0.." + top + " の範囲を外れている");
        continue;
      }
      const maxErr = Digitize.maxError(trace);
      const limit = Digitize.stepWidth(bit) / 2 + EPS;
      if (maxErr > limit) {
        fail(label, `量子化誤差 ${maxErr.toFixed(4)} が段階幅の半分 ${limit.toFixed(4)} を超えている`);
        continue;
      }
      const size = Digitize.dataSize(n, bit);
      if (size.bits !== allBits.length) {
        fail(label, `dataSize ${size.bits} とビット列 ${allBits.length} が食い違う`);
        continue;
      }
    }
  }

  console.log(`   ✅ [${lesson.id}] ${combos} 通りの設定で検査`);
  passed++;
});

console.log("\n==============================");
console.log(`成功: ${passed} 件 / 失敗: ${failed} 件`);
console.log("==============================");
if (failed > 0) {
  process.exit(1);
} else {
  console.log("すべての課題が正しくデジタル化できることを確認した。");
}
