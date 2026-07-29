/**
 * DNCLパーサー ＆ インタプリタ
 * ドラッグ＆ドロップされたカードの順序とインデントを解釈し、JavaScriptコードに変換して実行・トレースします。
 */

class DNCLInterpreter {
  constructor() {
    this.variables = {};
    this.traceLog = [];
    this.printBuffer = [];
    this.maxSteps = 1000; // 無限ループ対策
  }

  /**
   * 変数名のリストを自動抽出する
   */
  detectVariables(blocks) {
    const varSet = new Set();
    
    blocks.forEach(block => {
      const text = block.text;
      
      // 代入文 (例: 変数 = 値, ただし == や >=, <= は除く)
      // 行頭またはスペースの後の「変数名 = 」を検出
      const assignMatch = text.match(/(?:^|[^><=!])=\s*([^=].*)/);
      if (assignMatch) {
        const leftSide = text.split("=")[0].trim();
        // 配列への代入 (例: A[i] = 10) の場合は、配列名自体を登録
        const arrayMatch = leftSide.match(/^([a-zA-Z\u30a0-\u30ff\u3040-\u309f\u4e00-\u9faf_]+)\[/);
        if (arrayMatch) {
          varSet.add(arrayMatch[1]);
        } else if (/^[a-zA-Z\u30a0-\u30ff\u3040-\u309f\u4e00-\u9faf_]+$/.test(leftSide)) {
          varSet.add(leftSide);
        }
      }

      // ループ変数 (例: i を 1 から N まで...)
      const loopMatch = text.match(/^([a-zA-Z\u30a0-\u30ff\u3040-\u309f\u4e00-\u9faf_]+)\s*を/);
      if (loopMatch) {
        varSet.add(loopMatch[1]);
      }
    });

    return Array.from(varSet);
  }

  /**
   * 単一のDNCL行をJSに変換する
   */
  convertLineToJS(text, nextIndent, currentIndent) {
    let js = text.trim();

    // 1. 表示する
    // 例1: 合計 を表示する -> _print(合計)
    if (js.endsWith("を表示する")) {
      const expr = js.substring(0, js.length - 5).trim();
      return `_print(${this.translateExpression(expr)});`;
    }

    // 例2: 表示する("こんにちは") / 表示する("計は", x)
    const printFuncMatch = js.match(/^表示する\s*\((.*)\)$/);
    if (printFuncMatch) {
      const args = printFuncMatch[1].trim();
      return `_print(${this.translateExpression(args)});`;
    }

    // 2. ループを抜ける -> break;
    if (js === "ループを抜ける") {
      return "break;";
    }

    // 3. もし 〜 ならば：
    // 例: もし A[i] > 最大値 ならば: -> if (A[i] > 最大値) {
    if (js.startsWith("もし") && js.endsWith("ならば:")) {
      const cond = js.substring(2, js.length - 4).trim();
      return `if (${this.translateExpression(cond)}) {`;
    }

    // 4. そうでなければ： -> } else {
    if (js === "そうでなければ:") {
      return "} else {";
    }

    // 5. そうではなくもし / そうでなくもし 〜 ならば：
    if ((js.startsWith("そうではなくもし") || js.startsWith("そうでなくもし")) && js.endsWith("ならば:")) {
      const isSorede = js.startsWith("そうでなくもし");
      const cond = js.substring(isSorede ? 7 : 8, js.length - 4).trim();
      return `} else if (${this.translateExpression(cond)}) {`;
    }

    // 6. 〜 の間、繰り返す：
    if (js.endsWith("の間、繰り返す:") || js.endsWith("の間，繰り返す:")) {
      const cond = js.substring(0, js.length - 8).trim();
      return `while (${this.translateExpression(cond)}) {`;
    }

    // 6.5. 自作関数の定義
    // 例: 関数 2倍にする(x) を定義する: -> function _2倍にする(x) {  (先頭数字は _ でエスケープ)
    const funcMatch = js.match(/^関数\s*([a-zA-Z\u30a0-\u30ff\u3040-\u309f\u4e00-\u9faf_0-9]+)\((.*?)\)\s*を定義する:$/);
    if (funcMatch) {
      const rawName = funcMatch[1];
      const funcName = /^[0-9]/.test(rawName) ? `_${rawName}` : rawName;
      const args = funcMatch[2].trim();
      return `function ${funcName}(${args}) {`;
    }

    // 6.6. 返り値 (返す)
    // 例: 返す x * 2 -> return x * 2;
    if (js.startsWith("返す ")) {
      const expr = js.substring(3).trim();
      return `return ${this.translateExpression(expr)};`;
    }

    // 7. i を 1 から N まで 1 ずつ増やしながら繰り返す:
    // 例: i を 1 から N まで 1 ずつ増やしながら繰り返す:
    // DNCL規格: 「変数 を 初期値 から 目標値 まで 増分 ずつ増やしながら（減らしながら）、繰り返す:」
    const forMatch = js.match(/^([a-zA-Z\u30a0-\u30ff\u3040-\u309f\u4e00-\u9faf_]+)\s*を\s*(.+?)\s*から\s*(.+?)\s*まで\s*(.+?)\s*ずつ(増やし|減らし)ながら(?:，|,)?繰り返す:$/);
    if (forMatch) {
      const varName = forMatch[1];
      const start = this.translateExpression(forMatch[2]);
      const end = this.translateExpression(forMatch[3]);
      const step = this.translateExpression(forMatch[4]);
      const isIncrease = forMatch[5] === "増やし";
      
      if (isIncrease) {
        return `for (${varName} = ${start}; ${varName} <= ${end}; ${varName} += ${step}) {`;
      } else {
        return `for (${varName} = ${start}; ${varName} >= ${end}; ${varName} -= ${step}) {`;
      }
    }

    // 8. 普通の代入文
    // 例: 最大値 = A[0] -> 最大値 = A[0];
    if (js.includes("=") && !js.includes("==") && !js.includes(">=") && !js.includes("<=") && !js.includes("!=")) {
      const parts = js.split("=");
      const left = parts[0].trim();
      const right = parts.slice(1).join("=").trim();
      return `${this.translateExpression(left)} = ${this.translateExpression(right)};`;
    }

    // 変換できない場合はそのままJSとして出力（エラーハンドリングは実行時に委ねる）
    return js;
  }

  /**
   * DNCL特有の表記をJS式に翻訳
   * - 「かつ」「または」「and」「or」「not」などの論理演算子の変換
   * - カンマ添字2次元配列 A[i,j] -> A[i][j]
   * - 整数除算 ÷ の変換
   */
  translateExpression(expr) {
    let result = expr;

    // 2次元配列 A[i, j] -> A[i][j] (配列リテラル [1, 2] と区別するため直前に識別子)
    result = result.replace(/([a-zA-Z\u30a0-\u30ff\u3040-\u309f\u4e00-\u9faf_0-9]+)\[([^\]]+?),\s*([^\]]+?)\]/g, "$1[$2][$3]");

    // 整数除算 ÷ (例: 7 ÷ 2 -> Math.floor((7) / (2)))
    while (result.includes("÷")) {
      const next = result.replace(/((?:\([^()]*\)|[a-zA-Z\u30a0-\u30ff\u3040-\u309f\u4e00-\u9faf_0-9\.\[\]]+))\s*÷\s*((?:\([^()]*\)|[a-zA-Z\u30a0-\u30ff\u3040-\u309f\u4e00-\u9faf_0-9\.\[\]]+))/g, "Math.floor(($1) / ($2))");
      if (next === result) break;
      result = next;
    }

    // 論理演算子 (公式: and / or / not)
    result = result.replace(/\bnot\b/gi, " !");
    result = result.replace(/\band\b/gi, " && ");
    result = result.replace(/\bor\b/gi, " || ");
    result = result.replace(/\s+かつ\s+/g, " && ");
    result = result.replace(/\s+または\s+/g, " || ");

    // 商の整数部分 (例: A / B の整数部分 -> Math.floor(A / B))
    result = result.replace(/(.+?)\s*の整数部分/g, "Math.floor($1)");

    // 数字始まりの関数呼び出しを安全な識別子に変換 (例: 2倍にする(5) -> _2倍にする(5))
    result = result.replace(/\b([0-9][a-zA-Z\u30a0-\u30ff\u3040-\u309f\u4e00-\u9faf_0-9]*)\s*\(/g, '_$1(');

    return result;
  }

  /**
   * カード群から実行可能なJavaScriptコードを生成する
   */
  generateExecutableJS(blocks, initialVars = {}) {
    const detectedVars = this.detectVariables(blocks);
    
    // 初期値に含まれるが検出されなかった変数も追加
    Object.keys(initialVars).forEach(v => {
      if (!detectedVars.includes(v)) {
        detectedVars.push(v);
      }
    });

    let codeLines = [];
    
    // 変数の初期化宣言
    detectedVars.forEach(v => {
      if (v in initialVars) {
        const val = JSON.stringify(initialVars[v]);
        codeLines.push(`let ${v} = ${val};`);
      } else {
        codeLines.push(`let ${v} = undefined;`);
      }
    });

    // トレース関数のために検出された変数をオブジェクトとしてダンプするコード
    const getVarsStateCode = () => {
      const elements = detectedVars.map(v => `"${v}": typeof ${v} !== 'undefined' ? (Array.isArray(${v}) ? [...${v}] : (typeof ${v} === 'object' && ${v} !== null ? JSON.parse(JSON.stringify(${v})) : ${v})) : undefined`);
      return `{${elements.join(", ")}}`;
    };

    let openBlocks = []; // 開いたブロックのインデントをスタックで管理

    // ユーザーコードブロックをJSに変換して流し込む
    for (let i = 0; i < blocks.length; i++) {
      const currentBlock = blocks[i];
      const curIndent = currentBlock.indent || 0;

      let jsLine = this.convertLineToJS(currentBlock.text, 0, curIndent);

      // 現在の行を処理する前に、インデントの減少をチェックして } を補完する
      let closeBracesCode = "";
      const textTrim = currentBlock.text.trim();
      const isElse = textTrim.startsWith("そうでなければ:") || textTrim.startsWith("そうではなくもし") || textTrim.startsWith("そうでなくもし");
      
      // else系のときは、対応する if ブロックと同じインデントなので、スタック上の if (curIndent) はまだ閉じない。
      // 通常の行のときは、スタック内の curIndent 以上のブロックをすべて閉じる。
      while (openBlocks.length > 0 && (
        isElse ? openBlocks[openBlocks.length - 1] > curIndent : openBlocks[openBlocks.length - 1] >= curIndent
      )) {
        openBlocks.pop();
        closeBracesCode += "}\n";
      }

      if (closeBracesCode) {
        codeLines.push(closeBracesCode);
      }

      // トレースログを仕込む
      if (jsLine.startsWith("} else")) {
        codeLines.push(jsLine);
        codeLines.push(`_trace(${i}, ${getVarsStateCode()});`);
        if (openBlocks.length > 0) openBlocks.pop();
        openBlocks.push(curIndent); // else用のブロックインデントを積み直す
      } else if (jsLine.endsWith("{")) {
        codeLines.push(jsLine);
        codeLines.push(`_trace(${i}, ${getVarsStateCode()});`);
        openBlocks.push(curIndent); // ブロックを開始したインデントを積む
      } else {
        codeLines.push(jsLine);
        codeLines.push(`_trace(${i}, ${getVarsStateCode()});`);
      }
    }

    // 残っているすべてのブロックを閉じる
    while (openBlocks.length > 0) {
      openBlocks.pop();
      codeLines.push("}");
    }

    return codeLines.join("\n");
  }

  /**
   * エラーメッセージを初心者向けに分かりやすい日本語に翻訳する
   */
  translateError(errMsg) {
    if (!errMsg) return "プログラムの実行中に未知のエラーが発生しました。";

    const errLower = errMsg.toLowerCase();

    // 1. ReferenceError (変数未定義)
    const refMatch = errMsg.match(/([a-zA-Z\u30a0-\u30ff\u3040-\u309f\u4e00-\u9faf_]+)\s+is\s+not\s+defined/);
    if (refMatch) {
      return `エラー: 変数「${refMatch[1]}」が定義されていません。初期化処理のカードを配置しているか、変数名のスペルが合っているか確認してください。`;
    }

    // 2. TypeError (未定義オブジェクト・配列へのアクセス)
    if (errLower.includes("cannot read properties") || errLower.includes("is undefined")) {
      return "エラー: 未定義の変数、または存在しない配列の要素（インデックスが範囲外など）を参照しようとしています。";
    }

    // 3. SyntaxError (インデント崩れや使えない記号など)
    if (
      errLower.includes("invalid or unexpected token") ||
      errLower.includes("unexpected token") ||
      errLower.includes("unexpected identifier") ||
      errLower.includes("missing catch or finally") ||
      errLower.includes("unexpected end of input") ||
      errLower.includes("missing ) after argument list")
    ) {
      return "構文エラー: 使えない記号が含まれているか、プログラムの組み立て（もし、繰り返し、インデントの対応関係）に誤りがあります。全角記号（× や ≠ など）やスペース、カードの並び順を確認してください。";
    }

    // 4. その他の関数呼び出しエラー
    if (errLower.includes("is not a function")) {
      return "エラー: 関数ではないオブジェクトを関数として呼び出そうとしています。記述ミスがないか確認してください。";
    }

    return "実行エラー: " + errMsg;
  }

  /**
   * DNCLコードの実行トレースを生成する
   */
  run(blocks, initialVars = {}) {
    this.traceLog = [];
    this.printBuffer = [];
    
    const jsCode = this.generateExecutableJS(blocks, initialVars);

    // 実行サンドボックス関数を構築
    const sandboxCode = `
      return (function() {
        let _stepCount = 0;
        const _traceLog = [];
        const _printBuffer = [];

        function _trace(blockIndex, vars) {
          _stepCount++;
          if (_stepCount > ${this.maxSteps}) {
            throw new Error("無限ループが検出されたか、実行ステップ数が上限（${this.maxSteps}）を超えました。");
          }
          // 配列やオブジェクトをクローンしてディープコピーを保存
          const clonedVars = {};
          for (const key in vars) {
            if (Array.isArray(vars[key])) {
              clonedVars[key] = [...vars[key]];
            } else if (typeof vars[key] === 'object' && vars[key] !== null) {
              clonedVars[key] = JSON.parse(JSON.stringify(vars[key]));
            } else {
              clonedVars[key] = vars[key];
            }
          }
          _traceLog.push({
            step: _stepCount,
            blockIndex: blockIndex,
            variables: clonedVars,
            output: [..._printBuffer]
          });
        }

        function _print(...values) {
          const formatted = values.map(v => {
            if (Array.isArray(v)) {
              return "[" + v.join(", ") + "]";
            }
            return String(v);
          }).join("");
          _printBuffer.push(formatted);
        }

        try {
          ${jsCode}
          return { success: true, trace: _traceLog, output: _printBuffer };
        } catch (err) {
          return { success: false, error: err.message, trace: _traceLog, output: _printBuffer };
        }
      })();
    `;

    try {
      const runner = new Function(sandboxCode);
      const result = runner();
      if (result && !result.success) {
        result.error = this.translateError(result.error);
      }
      return result;
    } catch (compileError) {
      return {
        success: false,
        error: this.translateError(compileError.message),
        trace: [],
        output: []
      };
    }
  }
}

// ブラウザ環境とNode環境の両方に対応
if (typeof module !== "undefined" && module.exports) {
  module.exports = DNCLInterpreter;
}
