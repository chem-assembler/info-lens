/**
 * DNCL → Python 変換器（対照表示用）
 *
 * 共通テスト「情報I」の疑似言語（DNCL）と Python はほぼ1行1行が対応する。
 * その対応を画面で見せるための変換器で、**1行が必ず1行になる**ように作ってある
 * （import 行の差し込みなどで行数がずれると「対照」にならないため）。
 *
 * 実行には使わない。実行は dncl-interpreter.js（DNCL→JS）が担当する。
 * こちらは「見比べるための表示」専用。
 *
 * 変換できない行は落とさず、Python のコメントとして1行返す。
 * ノーマルモードのダミーカード（例:「N 未満まで」）やハードモードの
 * 未入力プレースホルダ（例: [input_cond]）がそのまま並ぶことがあるため、
 * どんな入力でも例外を投げないこと（＝全域関数であること）を守る。
 *
 * 2次元配列の添字 A[i,j] → A[i][j] の解釈は dncl-interpreter.js と共有する
 * （2つの窓で解釈が食い違わないようにするため）。読み込み順に注意:
 * index.html では dncl-interpreter.js を先に読む。
 */

class DNCLToPython {
  constructor() {
    this._interp = null;
  }

  /** 2次元添字の解釈はインタプリタと共有する（実装を二重に持たない） */
  interpreter() {
    if (this._interp) return this._interp;
    const C = (typeof DNCLInterpreter !== "undefined")
      ? DNCLInterpreter
      : require("./dncl-interpreter.js");
    this._interp = new C();
    return this._interp;
  }

  /**
   * 組み立て済みのカード列を、DNCL と Python の対で返す。
   * [{ indent, dncl, python, same }]
   */
  convertBlocks(blocks) {
    return (blocks || []).map(b => {
      const dncl = (b.text || "").trim();
      const python = this.convertLine(dncl);
      return {
        indent: b.indent || 0,
        dncl,
        python,
        same: dncl === python,
      };
    });
  }

  /** インデント付きの Python ソースとして書き出す（コピー用） */
  toSource(blocks) {
    return this.convertBlocks(blocks)
      .map(r => "    ".repeat(r.indent) + r.python)
      .join("\n");
  }

  /**
   * DNCL の1行を Python の1行に変換する。例外は投げない
   */
  convertLine(text) {
    const s = (text || "").trim();
    if (!s) return "";

    try {
      // 1. 〜 を表示する
      if (s.endsWith("を表示する")) {
        return `print(${this.expr(s.slice(0, -5).trim())})`;
      }

      // 2. 表示する(...)
      //    DNCL の表示は引数を区切りなしで連結する（dncl-interpreter.js の _print）。
      //    Python の print は既定で空白を挟むので、複数引数のときは sep="" を足す
      const printCall = s.match(/^表示する\s*\((.*)\)$/);
      if (printCall) {
        const args = this.expr(printCall[1].trim());
        return this.hasTopLevelComma(args)
          ? `print(${args}, sep="")`
          : `print(${args})`;
      }

      // 3. ループを抜ける
      if (s === "ループを抜ける") return "break";

      // 4. もし 〜 ならば:
      if (s.startsWith("もし") && s.endsWith("ならば:")) {
        return `if ${this.expr(s.slice(2, -4).trim())}:`;
      }

      // 5. そうでなければ:
      if (s === "そうでなければ:") return "else:";

      // 6. そうではなくもし / そうでなくもし 〜 ならば:
      if ((s.startsWith("そうではなくもし") || s.startsWith("そうでなくもし")) && s.endsWith("ならば:")) {
        const head = s.startsWith("そうではなくもし") ? 8 : 7;
        return `elif ${this.expr(s.slice(head, -4).trim())}:`;
      }

      // 7. 〜 の間、繰り返す:
      if (s.endsWith("の間、繰り返す:") || s.endsWith("の間，繰り返す:")) {
        return `while ${this.expr(s.slice(0, -8).trim())}:`;
      }

      // 8. 関数 f(x) を定義する:
      const func = s.match(/^関数\s*([a-zA-Z\u30a0-\u30ff\u3040-\u309f\u4e00-\u9faf_0-9]+)\((.*?)\)\s*を定義する:$/);
      if (func) {
        return `def ${this.safeName(func[1])}(${func[2].trim()}):`;
      }

      // 9. 返す 〜
      if (s.startsWith("返す ")) {
        return `return ${this.expr(s.slice(3).trim())}`;
      }

      // 10. v を a から b まで s ずつ増やし（減らし）ながら繰り返す:
      const forLoop = s.match(/^([a-zA-Z\u30a0-\u30ff\u3040-\u309f\u4e00-\u9faf_]+)\s*を\s*(.+?)\s*から\s*(.+?)\s*まで\s*(.+?)\s*ずつ(増やし|減らし)ながら(?:，|,)?繰り返す:$/);
      if (forLoop) {
        const [, name, rawStart, rawEnd, rawStep, dir] = forLoop;
        // 「N 未満まで」はノーマルモードのダミーカード。公式DNCLの繰り返しは終値を含む
        // 「〜まで」だけで、未満は無い。DNCL 側も解釈できないので Python にもしない
        if (/未満\s*$/.test(rawEnd)) return `# 変換できない行: ${s}`;
        const start = this.expr(rawStart);
        const step = this.expr(rawStep);
        const up = dir === "増やし";
        // DNCL の繰り返しは終値を含む。Python の range は含まないので終値を1つずらす
        const stop = this.shift(this.expr(rawEnd), up ? 1 : -1);
        const args = up
          ? (step === "1" ? `${start}, ${stop}` : `${start}, ${stop}, ${step}`)
          : `${start}, ${stop}, ${step === "1" ? "-1" : `-${step}`}`;
        return `for ${name} in range(${args}):`;
      }

      // 11. 代入文
      if (s.includes("=") && !/[=!<>]=|==/.test(s)) {
        const eq = s.indexOf("=");
        const left = s.slice(0, eq).trim();
        const right = s.slice(eq + 1).trim();
        return `${this.expr(left)} = ${this.expr(right)}`;
      }
    } catch (e) {
      // 表示のための変換で画面を壊さない
      return `# 変換できない行: ${s}`;
    }

    // ダミーカードや未入力の穴埋めなど、文型に当てはまらないもの
    return `# 変換できない行: ${s}`;
  }

  /** 先頭が数字の名前は Python の識別子にできない（DNCL→JS 側と同じ逃がし方） */
  safeName(name) {
    return /^[0-9]/.test(name) ? `_${name}` : name;
  }

  /** range の終値をずらす。数値リテラルならその場で計算して読みやすくする */
  shift(end, delta) {
    if (/^-?\d+$/.test(end.trim())) return String(parseInt(end, 10) + delta);
    return delta > 0 ? `${end} + 1` : `${end} - 1`;
  }

  /** 文字列リテラルの外側にカンマがあるか（print の sep 判定用） */
  hasTopLevelComma(s) {
    let depth = 0;
    let quote = null;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (quote) {
        if (c === "\\") i++;
        else if (c === quote) quote = null;
      } else if (c === '"' || c === "'") quote = c;
      else if (c === "(" || c === "[") depth++;
      else if (c === ")" || c === "]") depth--;
      else if (c === "," && depth === 0) return true;
    }
    return false;
  }

  /**
   * DNCL の式を Python の式にする。
   * 比較演算子・算術演算子・配列リテラルは Python と同じ書き方なので触らない
   */
  expr(input) {
    let s = String(input);

    // 文字列リテラルを退避（中身を書き換えないため）
    const literals = [];
    s = s.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, m => {
      literals.push(m);
      return `__STR_${literals.length - 1}__`;
    });

    // 2次元配列 A[i, j] → A[i][j]（インタプリタと同じ解釈を使う）
    s = this.interpreter().transform2DArrayIndices(s);

    // 整数除算。Python は // を持っているので、JS 側のような Math.floor 包みは要らない
    // （÷ も // も floor 除算で、優先順位も / と同じ）
    s = s.replace(/÷/g, "//");

    // 論理演算子。and / or / not はそのまま Python
    s = s.replace(/\s+かつ\s+/g, " and ");
    s = s.replace(/\s+または\s+/g, " or ");

    // 商の整数部分。
    // 注: math.floor は import math が要る。1行1行の対応を崩さないため import 行は足さない
    // （現在の問題データに「の整数部分」は無い。使う問題を足すときはここを見直すこと）
    s = s.replace(/(.+?)\s*の整数部分/g, (m, inner) => `math.floor(${inner.trim()})`);

    // 先頭が数字の関数呼び出し
    s = s.replace(/\b([0-9][a-zA-Z\u30a0-\u30ff\u3040-\u309f\u4e00-\u9faf_0-9]*)\s*\(/g, "_$1(");

    // 余分な空白を整えるのは、文字列リテラルを戻す前に行う
    // （後だと "平均は　" のような文字列の中身まで詰めてしまう）
    s = s.replace(/\s+/g, " ").trim();

    // 文字列リテラルを戻す
    return s.replace(/__STR_(\d+)__/g, (_, i) => literals[parseInt(i, 10)]);
  }
}

// ブラウザ環境とNode環境の両方に対応
if (typeof module !== "undefined" && module.exports) {
  module.exports = DNCLToPython;
}
