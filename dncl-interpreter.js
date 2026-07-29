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
    // 例: 合計 を表示する -> _print(合計)
    if (js.endsWith("を表示する")) {
      const expr = js.substring(0, js.length - 5).trim();
      return `_print(${this.translateExpression(expr)});`;
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

    // 5. そうではなくもし 〜 ならば：
    if (js.startsWith("そうではなくもし") && js.endsWith("ならば:")) {
      const cond = js.substring(8, js.length - 4).trim();
      return `} else if (${this.translateExpression(cond)}) {`;
    }

    // 6. 〜 の間、繰り返す：
    if (js.endsWith("の間、繰り返す:") || js.endsWith("の間，繰り返す:")) {
      const cond = js.substring(0, js.length - 8).trim();
      return `while (${this.translateExpression(cond)}) {`;
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
    if (js.includes("=") && !js.includes("==") && !js.includes(">=") && !js.includes("<=")) {
      const parts = js.split("=");
      const left = parts[0].trim();
      const right = parts.slice(1).join("=").trim();
      return `${left} = ${this.translateExpression(right)};`;
    }

    // 変換できない場合はそのままJSとして出力（エラーハンドリングは実行時に委ねる）
    return js;
  }

  /**
   * DNCL特有の表記をJS式に翻訳
   * - 「かつ」「または」などの論理演算子の変換
   * - 「!=」「==」などは適宜調整
   */
  translateExpression(expr) {
    let result = expr;
    // 論理演算子
    result = result.replace(/\s+かつ\s+/g, " && ");
    result = result.replace(/\s+または\s+/g, " || ");
    // 等価演算子（DNCLでは単一の「=」が比較に使われることもあるが、基本「==」か「と等しい」）
    // 既に == になっているものはそのまま、= のみで比較になっているものを修正したいが、代入と混同しないよう注意
    // 共通テスト本番では比較は「==」や「が〜と等しい」等。ここでは単純にJS互換にする
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
      const nextBlock = blocks[i + 1];
      const curIndent = currentBlock.indent || 0;
      const nextIndent = nextBlock ? (nextBlock.indent || 0) : 0;

      let jsLine = this.convertLineToJS(currentBlock.text, nextIndent, curIndent);

      // 次のインデントが現在のインデントより浅くなる場合、閉じる必要がある中かっこを検出
      let closeBracesCode = "";
      const isBlockStart = jsLine.endsWith("{");

      // ブロック開始行ではない場合（または次の行のインデントが浅くなる場合）、
      // スタック内の現在のインデント以上のブロックをすべて閉じる
      if (!isBlockStart) {
        while (openBlocks.length > 0 && openBlocks[openBlocks.length - 1] >= nextIndent) {
          openBlocks.pop();
          closeBracesCode += "}\n";
        }
      }

      // トレースログを仕込む
      if (isBlockStart) {
        codeLines.push(jsLine);
        codeLines.push(`_trace(${i}, ${getVarsStateCode()});`);
        openBlocks.push(curIndent); // ブロックを開始したインデントを積む
      } else if (jsLine.startsWith("} else")) {
        codeLines.push(jsLine);
        codeLines.push(`_trace(${i}, ${getVarsStateCode()});`);
      } else {
        codeLines.push(jsLine);
        codeLines.push(`_trace(${i}, ${getVarsStateCode()});`);
        if (closeBracesCode) {
          codeLines.push(closeBracesCode);
        }
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

        function _print(value) {
          const formatted = Array.isArray(value) ? "[" + value.join(", ") + "]" : String(value);
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
      return result;
    } catch (compileError) {
      return {
        success: false,
        error: "構文エラー: プログラムの組み立てまたは入力値に誤りがあります。 (" + compileError.message + ")",
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
