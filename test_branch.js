const DNCLInterpreter = require("./dncl-interpreter.js");
const interpreter = new DNCLInterpreter();

const blocks = [
  { id: "l1", text: "得点 = 85", indent: 0 },
  { id: "l2", text: "もし 得点 >= 80 ならば:", indent: 0 },
  { id: "l3", text: "\"合格\" を表示する", indent: 1 },
  { id: "l4", text: "そうでなければ:", indent: 0 },
  { id: "l5", text: "\"不合格\" を表示する", indent: 1 }
];

// generateExecutableJS のトレース用
console.log("=== generateExecutableJS Trace ===");
const detectedVars = interpreter.detectVariables(blocks);
const initialVars = { 得点: 85 };
let codeLines = [];
let openBlocks = [];

const getVarsStateCode = () => {
  const elements = detectedVars.map(v => `"${v}": typeof ${v} !== 'undefined' ? ${v} : undefined`);
  return `{${elements.join(", ")}}`;
};

detectedVars.forEach(v => {
  codeLines.push(`let ${v} = ${JSON.stringify(initialVars[v])};`);
});

for (let i = 0; i < blocks.length; i++) {
  const currentBlock = blocks[i];
  const curIndent = currentBlock.indent || 0;
  let jsLine = interpreter.convertLineToJS(currentBlock.text, 0, curIndent);

  let closeBracesCode = "";
  const textTrim = currentBlock.text.trim();
  const isElse = textTrim.startsWith("そうでなければ:") || textTrim.startsWith("そうではなくもし");
  
  while (openBlocks.length > 0 && (
    isElse ? openBlocks[openBlocks.length - 1] > curIndent : openBlocks[openBlocks.length - 1] >= curIndent
  )) {
    const popped = openBlocks.pop();
    closeBracesCode += "}\n";
    console.log(`[Line ${i}] Pop indent ${popped} from stack. Stack now:`, openBlocks);
  }

  if (closeBracesCode) {
    codeLines.push(closeBracesCode.trim());
  }

  if (jsLine.startsWith("} else")) {
    codeLines.push(jsLine);
    codeLines.push(`_trace(${i}, ...);`);
    if (openBlocks.length > 0) openBlocks.pop();
    openBlocks.push(curIndent);
    console.log(`[Line ${i}] Else block. Stack popped and pushed. Stack now:`, openBlocks);
  } else if (jsLine.endsWith("{")) {
    codeLines.push(jsLine);
    codeLines.push(`_trace(${i}, ...);`);
    openBlocks.push(curIndent);
    console.log(`[Line ${i}] Push indent ${curIndent} to stack. Stack now:`, openBlocks);
  } else {
    codeLines.push(jsLine);
    codeLines.push(`_trace(${i}, ...);`);
  }
}

while (openBlocks.length > 0) {
  const popped = openBlocks.pop();
  codeLines.push("}");
  console.log(`[End] Pop indent ${popped} from stack. Stack now:`, openBlocks);
}

console.log("\n--- Result Code ---");
console.log(codeLines.join("\n"));
