/**
 * DNCL学習アプリ 自動問題検証スクリプト (テストランナー)
 * 登録されたすべての問題・構文学習課題の模範解答を実行し、エラーが発生しないこと、
 * および正しくトランスパイル・エミュレートされることを自動検証します。
 */

const DNCLInterpreter = require("./dncl-interpreter.js");
const DNCLOrder = require("./order-rules.js");
const { problems, syntaxLessons } = require("./problems.js");

const interpreter = new DNCLInterpreter();
let passedTests = 0;
let failedTests = 0;
let warnings = [];

function runValidation(targetList, modeName) {
  console.log(`\n=== ${modeName} の検証開始 ===`);
  
  targetList.forEach(item => {
    console.log(`検証中: [${item.id}] ${item.title}`);
    
    // 初期値の準備
    const initialVars = {};
    if (item.initialState) {
      Object.keys(item.initialState).forEach(key => {
        const val = item.initialState[key];
        initialVars[key] = Array.isArray(val) ? [...val] : val;
      });
    }

    // 模範解答の実行
    const result = interpreter.run(item.correctBlocks, initialVars);

    if (!result.success) {
      console.error(`❌ テスト失敗 [${item.id}]: 実行エラーが発生しました。`);
      console.error(`   エラー内容: ${result.error}`);
      console.log("   --- 生成されたコード ---");
      console.log(interpreter.generateExecutableJS(item.correctBlocks, initialVars));
      console.log("   ------------------------");
      failedTests++;
    } else {
      console.log(`   ✅ 実行成功 (ステップ数: ${result.trace.length}, 出力: [${result.output.join(", ")}])`);
      passedTests++;
    }
  });
}

/** 初期値をコピーして並びを実行し、出力を返す（実行に失敗したら null） */
function outputOf(blocks, initialState) {
  const vars = {};
  Object.keys(initialState || {}).forEach(key => {
    const val = initialState[key];
    vars[key] = (val !== null && typeof val === "object") ? JSON.parse(JSON.stringify(val)) : val;
  });
  const result = new DNCLInterpreter().run(blocks, vars);
  return result.success ? JSON.stringify(result.output) : null;
}

/**
 * 並び順の判定（app.js の checkSolution が使う order-rules.js）を検査する。
 *
 * ここが見張るのは2つ:
 *   ・宣言した `swappable` が本当に無害か（許される並びを全通り実行して出力を突き合わせる）
 *   ・宣言し忘れがないか（1枚動かしても出力が同じになる並びを警告として出す。
 *     「入れ替えても正しい」なら swappable に足す、「たまたま同じ」なら放置＝不正解のままでよい）
 */
function runOrderValidation(targetList, modeName) {
  console.log(`\n=== ${modeName} の並び順ルール検証 ===`);

  targetList.forEach(item => {
    const correct = item.correctBlocks;
    const ids = correct.map(b => b.id);
    const expected = outputOf(correct, item.initialState);

    // a. swappable に書いたカードIDが実在するか（書き間違いの検出）
    const unknown = (item.swappable || []).flat().filter(id => !ids.includes(id));
    if (unknown.length > 0) {
      console.error(`❌ [${item.id}] swappable に無いカードID: ${unknown.join(", ")}`);
      failedTests++;
      return;
    }

    // b. 許される並びを全部実行して、模範解答と同じ出力になるか
    const orders = Array.from(DNCLOrder.allowedOrders(item));
    if (orders.length > DNCLOrder.MAX_ORDERS) {
      console.error(`❌ [${item.id}] 入れ替えの組み合わせが多すぎる（${orders.length} 通り）`);
      failedTests++;
      return;
    }
    const broken = orders.filter(key => {
      const arranged = key.split(" ").map(id => correct.find(b => b.id === id));
      return outputOf(arranged, item.initialState) !== expected;
    });
    if (broken.length > 0) {
      console.error(`❌ [${item.id}] swappable が無害でない（出力が変わる並びが ${broken.length} 通り）`);
      broken.slice(0, 3).forEach(key => console.error(`     ${key}`));
      failedTests++;
      return;
    }

    // c. 宣言し忘れの候補を洗い出す（カード1枚を別の位置へ動かして出力が同じになる並び）
    const movable = correct.filter(b => !b.isLocked); // ロックされたカードは生徒が動かせない
    const suspects = [];
    movable.forEach(card => {
      const from = ids.indexOf(card.id);
      for (let to = 0; to < ids.length; to++) {
        if (to === from) continue;
        const arranged = correct.slice();
        arranged.splice(from, 1);
        arranged.splice(to, 0, card);
        const key = arranged.map(b => b.id).join(" ");
        if (DNCLOrder.allowedOrders(item).has(key)) continue; // 宣言ずみ＝正解にしてよい並び
        if (outputOf(arranged, item.initialState) === expected) {
          suspects.push(`${card.id}（${card.text}）を ${from + 1} 枚目から ${to + 1} 枚目へ`);
        }
      }
    });

    console.log(`   ✅ [${item.id}] 許される並び ${orders.length} 通り / 出力はすべて一致`);
    if (suspects.length > 0) {
      warnings.push({ id: item.id, suspects });
    }
    passedTests++;
  });
}

// 1. 問題演習の検証
runValidation(problems, `問題演習 (${problems.length}問)`);

// 2. 構文学習の検証
runValidation(syntaxLessons, `構文学習 (${syntaxLessons.length}ユニット)`);

// 3. 並び順ルールの検証
runOrderValidation(problems, `問題演習 (${problems.length}問)`);
runOrderValidation(syntaxLessons, `構文学習 (${syntaxLessons.length}ユニット)`);

if (warnings.length > 0) {
  console.log("\n--- 参考: 出力が同じになるが不正解にしている並び（人が確認する）---");
  console.log("    正しいプログラムだと判断したら problems.js の swappable に足す。");
  console.log("    たまたま出力が同じなだけなら、このままでよい（不正解のまま）。");
  warnings.forEach(w => {
    console.log(`  [${w.id}] ${w.suspects.length} 件`);
    w.suspects.slice(0, 4).forEach(s => console.log(`     ${s}`));
    if (w.suspects.length > 4) console.log(`     …ほか ${w.suspects.length - 4} 件`);
  });
}

console.log("\n==============================");
console.log(`検証結果サマリー:`);
console.log(`成功: ${passedTests} 件`);
console.log(`失敗: ${failedTests} 件`);
console.log("==============================");

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log("🎉 すべてのDNCL問題の模範解答が正常に動作することを確認しました！");
  process.exit(0);
}
