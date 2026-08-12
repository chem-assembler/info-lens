/**
 * しくみ編の課題データ。データを足すだけで課が増える（dncl の problems.js と同じ思想）。
 *
 * 各課のキー:
 *   id / title / description … 表示
 *   wave                     … 元の波（digitize.js の waveValue が解釈する。乱数は禁止）
 *   controls                 … 操作できるつまみ。null はこの課では固定
 *                              sampleCount: {min, max, value}（標本の数。表示は周波数に換算）
 *                              bitDepth:    {min, max, value}
 *   fixed                    … 固定側の値
 *   focus                    … "sampling" | "quantization" | "encoding" | "all"
 *                              （画面の説明の強調に使う。ロジックには影響しない）
 *   explanation              … 課の下に常時出す解説
 */

const lessons = [
  {
    id: "sampling_basics",
    title: "1. 標本化 — 波を一定の間隔で読み取る",
    description:
      "アナログの波は連続していて、そのままでは数値にできません。一定の間隔で高さを読み取ることを「標本化（サンプリング）」といいます。標本化周波数のつまみを動かして、間隔を細かくしたり粗くしたりしてみましょう。",
    wave: { type: "sine", freq: 3, amp: 0.8 },
    controls: { sampleCount: { min: 4, max: 32, value: 8 }, bitDepth: null },
    fixed: { bitDepth: 4 },
    focus: "sampling",
    explanation:
      "標本化周波数（1秒あたりに読み取る回数）が高いほど、もとの波の形を細かく追えます。逆に粗くしすぎると、復元した波はもとの波と違う、ゆっくりした別の波のように見えてしまいます。",
  },
  {
    id: "quantization_basics",
    title: "2. 量子化 — 高さを決まった段階に丸める",
    description:
      "読み取った高さはまだ小数の連続量です。あらかじめ決めた段階（目盛り）のうち、いちばん近いものに丸めることを「量子化」といいます。量子化ビット数のつまみを動かして、段階の数を変えてみましょう。",
    wave: { type: "duo" },
    controls: { sampleCount: null, bitDepth: { min: 1, max: 4, value: 2 } },
    fixed: { sampleCount: 16 },
    focus: "quantization",
    explanation:
      "nビットでは 2のn乗 個の段階が使えます（2ビットなら4段階、4ビットなら16段階）。段階が少ないと、丸めたときのずれ（量子化誤差・赤い線）が大きくなり、復元した波が粗くなります。",
  },
  {
    id: "encoding_basics",
    title: "3. 符号化 — 段階番号を2進数で表す",
    description:
      "量子化でどの段階になったかが決まれば、あとはその番号を2進数にして並べるだけです。これを「符号化」といいます。「1標本ずつ」ボタンで、1つの標本が 標本化 → 量子化 → 符号化 と進む様子を確かめましょう。",
    wave: { type: "sine", freq: 1, amp: 0.9 },
    controls: { sampleCount: null, bitDepth: null },
    fixed: { sampleCount: 8, bitDepth: 3 },
    focus: "encoding",
    explanation:
      "3ビットなら段階 0〜7 を 000〜111 で表します。標本1つにつきビット数ぶんの 0/1 が増えるので、ビット列の長さは 標本の数 × ビット数 になります。",
  },
  {
    id: "full_pipeline",
    title: "4. 3段階を通しで — きめ細かさとデータ量",
    description:
      "標本化周波数と量子化ビット数の両方を自由に動かして、復元した波のきめ細かさと、データ量がどう変わるかを見比べましょう。",
    wave: { type: "duo" },
    controls: {
      sampleCount: { min: 4, max: 32, value: 16 },
      bitDepth: { min: 1, max: 4, value: 3 },
    },
    fixed: {},
    focus: "all",
    explanation:
      "データ量は 標本の数 × 量子化ビット数 で決まります。細かくするほど音は正確になりますが、データ量も増えます。実際の音楽CDは標本化周波数 44100Hz・16ビット・2チャンネルで、1秒あたり 44100 × 16 × 2 ビット＝ 176400 バイトです。",
  },
];

// ブラウザ環境とNode環境の両方に対応
if (typeof module !== "undefined" && module.exports) {
  module.exports = { lessons };
}
