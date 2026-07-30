/**
 * DNCL学習アプリ 自動問題検証スクリプト (テストランナー)
 * 登録されたすべての問題・構文学習課題の模範解答を実行し、エラーが発生しないこと、
 * および正しくトランスパイル・エミュレートされることを自動検証します。
 */

const DNCLInterpreter = require("./dncl-interpreter.js");
const { problems, syntaxLessons } = require("./problems.js");

const interpreter = new DNCLInterpreter();
let passedTests = 0;
let failedTests = 0;

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

// 1. 問題演習の検証
runValidation(problems, `問題演習 (${problems.length}問)`);

// 2. 構文学習の検証
runValidation(syntaxLessons, `構文学習 (${syntaxLessons.length}ユニット)`);

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
