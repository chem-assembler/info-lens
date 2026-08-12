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

/**
 * 演習編の問題データ（データ量の計算。共通テスト型）。
 *
 * 各問のキー:
 *   given … 条件。画面の「条件」欄は **この値から自動生成する**
 *           （問題文と数値が食い違う事故を構造的に防ぐ）
 *           sampleRate(Hz) / bitDepth / channels / seconds / dataBytes（逆算問題のみ）
 *   ask   … 何を答えさせるか: "bits" | "bytes" | "sampleRate"
 *   answer… 正解。verify_lessons.js が given から**再計算して照合する**ので、
 *           手計算の書き間違いは機械が止める
 */
const exercises = [
  {
    id: "ex_basic_1sec",
    title: "演1. 1秒分のデータ量（基本）",
    scenario: "ある音声を、次の設定で1秒間デジタル録音する。データ量は何バイトになるか。",
    given: { sampleRate: 8000, bitDepth: 8, channels: 1, seconds: 1 },
    ask: "bytes",
    answer: 8000,
    explanation:
      "1秒間の標本は 8000 個。1標本が 8 ビットなので 8000 × 8 × 1 × 1 = 64000 ビット。8 ビット = 1 バイトだから 64000 ÷ 8 = 8000 バイト。",
  },
  {
    id: "ex_ten_seconds",
    title: "演2. 10秒分のデータ量",
    scenario: "次の設定で10秒間デジタル録音する。データ量は何バイトになるか。",
    given: { sampleRate: 4000, bitDepth: 8, channels: 1, seconds: 10 },
    ask: "bytes",
    answer: 40000,
    explanation:
      "4000 × 8 × 1 × 10 = 320000 ビット。バイトに直すと 320000 ÷ 8 = 40000 バイト。時間を掛け忘れないこと。",
  },
  {
    id: "ex_bits",
    title: "演3. ビットで答える",
    scenario: "次の設定で1秒間デジタル録音する。データ量は何ビットになるか。",
    given: { sampleRate: 44100, bitDepth: 16, channels: 1, seconds: 1 },
    ask: "bits",
    answer: 705600,
    explanation:
      "44100 × 16 × 1 × 1 = 705600 ビット。問われている単位がビットかバイトかを、答える前に必ず確かめること。",
  },
  {
    id: "ex_cd",
    title: "演4. 音楽CDの1秒",
    scenario: "音楽CDは次の設定である。1秒あたりのデータ量は何バイトになるか。",
    given: { sampleRate: 44100, bitDepth: 16, channels: 2, seconds: 1 },
    ask: "bytes",
    answer: 176400,
    explanation:
      "44100 × 16 × 2 × 1 = 1411200 ビット、÷8 で 176400 バイト。ステレオはチャンネル数 2 を掛けるのを忘れやすい。",
  },
  {
    id: "ex_reverse",
    title: "演5. 標本化周波数を逆算",
    scenario:
      "8ビット・モノラルで3秒間録音したところ、データ量は 24000 バイトだった。標本化周波数は何 Hz だったか。",
    given: { bitDepth: 8, channels: 1, seconds: 3, dataBytes: 24000 },
    ask: "sampleRate",
    answer: 8000,
    explanation:
      "24000 バイト × 8 = 192000 ビット。これを 8 ビット × 1 チャンネル × 3 秒 = 24 で割ると 8000。1秒間に 8000 回読み取っていた（8000 Hz）。",
  },
];

// ブラウザ環境とNode環境の両方に対応
if (typeof module !== "undefined" && module.exports) {
  module.exports = { lessons, exercises };
}
