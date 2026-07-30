/**
 * DNCL → Python 変換の検証スクリプト
 *
 * 「それらしい Python が出ている」ではなく、**本当に同じ答えになるか**を見る。
 * 全問題・全構文学習の模範解答について:
 *   1. DNCL インタプリタ（dncl-interpreter.js）で実行して出力を得る
 *   2. 同じカード列を Python に変換し、実際に python で実行して出力を得る
 *   3. 2つの出力が一致することを確かめる
 *
 * さらに、全カード（ダミー・穴埋めを含む）を変換にかけて例外が出ないことも見る。
 * 表示専用の変換器なので、どんな入力でも画面を壊さないことが条件。
 *
 * 使い方: node dncl/verify_python.js
 * python が PATH に無い環境では実行比較を飛ばし、変換の網羅だけを検査する。
 */

const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const DNCLInterpreter = require("./dncl-interpreter.js");
const DNCLToPython = require("./dncl-to-python.js");
const { problems, syntaxLessons } = require("./problems.js");

const conv = new DNCLToPython();
let pass = 0;
let fail = 0;

function fine(msg) { console.log(`  OK   ${msg}`); pass++; }
function bad(msg) { console.log(`  NG   ${msg}`); fail++; }

/** python の実行ファイルを探す */
function findPython() {
  for (const cmd of ["python", "python3", "py"]) {
    const r = spawnSync(cmd, ["-c", "print(1)"], { encoding: "utf8" });
    if (r.status === 0 && r.stdout.trim() === "1") return cmd;
  }
  return null;
}
const PY = findPython();

/**
 * 問題の初期変数を Python の前置きにする。
 * 画面の対照表示には出さない（1行1行の対応を崩さないため）。
 * ここは「同じ条件で走らせて答え合わせをする」ための足場
 */
function preamble(initialState) {
  const lines = ["import math"];
  Object.keys(initialState || {}).forEach(k => {
    const v = initialState[k];
    if (v === null || v === undefined) return;
    if (k === "arrayData" && typeof v === "object") {
      // {name, values} 形式。配列そのものはカード側で代入されるので前置きしない
      return;
    }
    lines.push(`${k} = ${JSON.stringify(v)}`);
  });
  return lines.join("\n");
}

function runPython(source) {
  const file = path.join(os.tmpdir(), `dncl_py_${process.pid}_${Math.random().toString(36).slice(2)}.py`);
  fs.writeFileSync(file, source, "utf8");
  try {
    // Windows の python は既定で stdout を cp932 に落とすので、UTF-8 を明示する
    const out = execFileSync(PY, [file], {
      encoding: "utf8",
      env: { ...process.env, PYTHONIOENCODING: "utf-8" },
    });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: String(e.stderr || e.message) };
  } finally {
    fs.unlinkSync(file);
  }
}

/** DNCL 側の出力（_print のバッファ）を Python の print 出力と同じ形に揃える */
function normalize(lines) {
  return lines.map(s => String(s)).join("\n").trim();
}

/** Windows の python は改行を CRLF で出すので揃える */
function normalizeOut(text) {
  return String(text).replace(/\r\n/g, "\n").trim();
}

/** 「30.0」と「30」を同じとみなす（値ではなく表示の差を吸収するため） */
function dropTrailingZero(text) {
  return text.replace(/(^|[^\d.])(\d+)\.0+(?![\d])/g, "$1$2");
}

// ---------------------------------------------------------------- 実行比較

function checkProblem(item, label) {
  const blocks = item.correctBlocks.map(b => ({
    text: b.text, indent: b.indent || 0, id: b.id,
  }));

  const initial = {};
  Object.keys(item.initialState || {}).forEach(k => {
    const v = item.initialState[k];
    initial[k] = Array.isArray(v) ? [...v] : v;
  });

  const interp = new DNCLInterpreter();
  const res = interp.run(blocks, initial);
  if (!res.success) {
    bad(`${label}: DNCL 側が実行できない（${res.error}）`);
    return;
  }
  const expected = normalize(res.output);

  if (!PY) return; // python が無い環境では比較を飛ばす

  const source = preamble(item.initialState) + "\n" + conv.toSource(blocks) + "\n";
  const got = runPython(source);
  if (!got.ok) {
    bad(`${label}: Python が実行できない\n${indent(got.out)}\n--- 生成した Python ---\n${indent(source)}`);
    return;
  }
  const actual = normalizeOut(got.out);

  if (actual === expected) {
    fine(`${label}  出力一致: ${expected.replace(/\n/g, " / ") || "(出力なし)"}`);
  } else if (dropTrailingZero(actual) === dropTrailingZero(expected)) {
    // 既知の差: 割り算 / の結果の見え方。DNCL の実行は JS 上で動くため数値型が1つしかなく
    // 150/5 は 30 と表示されるが、Python は 30.0 と表示する。値は同じ。
    // 「/ を // に変える」のは誤り（DNCL の / は実数の割り算。整数除算は ÷）なので、
    // ここは変換器を直す話ではなく、表示の差として受け入れる
    fine(`${label}  値は一致（小数の見え方だけ差: DNCL "${expected.replace(/\n/g, " / ")}" / Python "${actual.replace(/\n/g, " / ")}"）`);
  } else {
    bad(`${label}: 出力が違う\n    DNCL   : ${JSON.stringify(expected)}\n    Python : ${JSON.stringify(actual)}\n--- 生成した Python ---\n${indent(source)}`);
  }
}

function indent(s) {
  return String(s).split("\n").map(l => "      " + l).join("\n");
}

// ---------------------------------------------------------------- 網羅検査

function checkAllCardsConvertible() {
  const seen = new Map(); // text -> 変換結果
  const all = [...problems, ...syntaxLessons];
  all.forEach(p => {
    ["correctBlocks", "easyBlocks", "normalBlocks", "hardBlocks", "blocks"].forEach(k => {
      (p[k] || []).forEach(b => {
        if (!seen.has(b.text)) {
          let out;
          try {
            out = conv.convertLine(b.text);
          } catch (e) {
            out = null;
            bad(`変換で例外: ${JSON.stringify(b.text)} → ${e.message}`);
          }
          seen.set(b.text, out);
        }
      });
    });
  });

  const unconverted = [...seen.entries()].filter(([, v]) => v && v.startsWith("# 変換できない行:"));
  console.log(`\n=== 全カードの変換（${seen.size} 種類）===`);
  if (unconverted.length === 0) {
    fine(`${seen.size} 種類すべてが Python の文に変換できた`);
  } else {
    // 変換できない行があること自体は許す（ダミーカードや未入力の穴埋め）。
    // ただし何が落ちているかは必ず見えるようにする
    console.log(`  --   Python 文にならなかったカード ${unconverted.length} 件（コメントとして表示される）:`);
    unconverted.forEach(([text]) => console.log(`         ${text}`));
    fine("変換できない行もコメント1行として返り、例外は出ていない");
  }
}

// ---------------------------------------------------------------- 実行

console.log(PY ? `python: ${PY}\n` : "python が見つからないため、実行比較は飛ばす\n");

console.log("=== 演習問題の模範解答（DNCL と Python の出力比較）===");
problems.forEach(p => checkProblem(p, `[${p.id}] ${p.title}`));

console.log("\n=== 構文学習の模範解答（DNCL と Python の出力比較）===");
syntaxLessons.forEach(p => checkProblem(p, `[${p.id}] ${p.title}`));

checkAllCardsConvertible();

console.log("\n==============================");
console.log(`成功: ${pass} 件 / 失敗: ${fail} 件`);
console.log("==============================");
if (fail > 0) {
  console.log("DNCL と Python の対照がずれている。dncl-to-python.js を直すこと。");
  process.exit(1);
}
console.log(PY
  ? "すべての模範解答で、DNCL と Python が同じ出力になることを確認した。"
  : "変換の網羅は確認した（実行比較は python が無いため未実施）。");
