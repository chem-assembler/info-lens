const problems = [
  {
    id: "sum_1_to_n",
    title: "1からNまでの合計",
    description: "変数 N に代入された値（ここでは10）までの合計（1 + 2 + ... + 10）を計算して表示するプログラムを完成させてください。",
    difficulty: "初級",
    initialState: {
      N: 10,
      arrayData: null
    },
    // 正解のカード構成（インデントレベルも指定）
    correctBlocks: [
      { id: "b1", text: "N = 10", indent: 0 },
      { id: "b2", text: "合計 = 0", indent: 0 },
      { id: "b3", text: "i を 1 から N まで 1 ずつ増やしながら繰り返す:", indent: 0 },
      { id: "b4", text: "合計 = 合計 + i", indent: 1 },
      { id: "b5", text: "合計 を表示する", indent: 0 }
    ],
    // イージーモードで提示するカード（並び替えのみ、正しいカードが過不足なく与えられる）
    easyBlocks: [
      { id: "b4", text: "合計 = 合計 + i" },
      { id: "b1", text: "N = 10" },
      { id: "b5", text: "合計 を表示する" },
      { id: "b3", text: "i を 1 から N まで 1 ずつ増やしながら繰り返す:" },
      { id: "b2", text: "合計 = 0" }
    ],
    // ノーマルモードで提示するカード（ダミーカードが混入する）
    normalBlocks: [
      { id: "b4", text: "合計 = 合計 + i" },
      { id: "b1", text: "N = 10" },
      { id: "b5", text: "合計 を表示する" },
      { id: "b3", text: "i を 1 から N まで 1 ずつ増やしながら繰り返す:" },
      { id: "b2", text: "合計 = 0" },
      // ダミーカード
      { id: "d1", text: "合計 = 合計 + 1", isDummy: true, reason: "これでは毎回1しか足されず、1からNまでの合計になりません。" },
      { id: "d2", text: "i を 1 から N 未満まで 1 ずつ増やしながら繰り返す:", isDummy: true, reason: "「N未満」にすると、N自身（ここでは10）が合計に足されなくなります。" }
    ],
    // ハードモードで提示するカード（一部がテキスト入力の穴埋めになっている）
    hardBlocks: [
      { id: "b4", text: "合計 = 合計 + [input_add]", inputs: { input_add: { placeholder: "足す値", correct: "i" } } },
      { id: "b1", text: "N = 10" },
      { id: "b5", text: "[input_print] を表示する", inputs: { input_print: { placeholder: "表示する変数", correct: "合計" } } },
      { id: "b3", text: "i を 1 から N まで 1 ずつ増やしながら繰り返す:" },
      { id: "b2", text: "合計 = 0" }
    ],
    explanation: "「合計 = 0」で合計値を格納する変数を初期化し、「i を 1 から N まで 1 ずつ増やしながら繰り返す」ループの中で、変数 i の値を「合計」に順番に足し合わせていきます。ループが終わった後に、最終的な「合計」を表示します。"
  },
  {
    id: "find_max",
    title: "配列の最大値を見つける",
    description: "配列 A に格納された6つの数値の中から、最も大きい値（最大値）を見つけて表示するプログラムを完成させてください。",
    difficulty: "中級",
    initialState: {
      A: [12, 45, 78, 34, 89, 56],
      arrayData: { name: "A", values: [12, 45, 78, 34, 89, 56] }
    },
    correctBlocks: [
      { id: "b1", text: "最大値 = A[0]", indent: 0 },
      { id: "b2", text: "i を 1 から 5 まで 1 ずつ増やしながら繰り返す:", indent: 0 },
      { id: "b3", text: "もし A[i] > 最大値 ならば:", indent: 1 },
      { id: "b4", text: "最大値 = A[i]", indent: 2 },
      { id: "b5", text: "最大値 を表示する", indent: 0 }
    ],
    easyBlocks: [
      { id: "b3", text: "もし A[i] > 最大値 ならば:" },
      { id: "b1", text: "最大値 = A[0]" },
      { id: "b5", text: "最大値 を表示する" },
      { id: "b4", text: "最大値 = A[i]" },
      { id: "b2", text: "i を 1 から 5 まで 1 ずつ増やしながら繰り返す:" }
    ],
    normalBlocks: [
      { id: "b3", text: "もし A[i] > 最大値 ならば:" },
      { id: "b1", text: "最大値 = A[0]" },
      { id: "b5", text: "最大値 を表示する" },
      { id: "b4", text: "最大値 = A[i]" },
      { id: "b2", text: "i を 1 から 5 まで 1 ずつ増やしながら繰り返す:" },
      // ダミー
      { id: "d1", text: "最大値 = 0", isDummy: true, reason: "初期値を0にすると、配列の要素がすべてマイナスの数値だった場合に正しく最大値を判定できません。配列の最初の要素（A[0]）で初期化するのが鉄則です。" },
      { id: "d2", text: "もし A[i] < 最大値 ならば:", isDummy: true, reason: "これでは「最大値よりも小さい場合」に中身を更新してしまうため、最小値を求めるプログラム（または意図しない動作）になってしまいます。" }
    ],
    hardBlocks: [
      { id: "b1", text: "最大値 = [input_init]", inputs: { input_init: { placeholder: "初期値", correct: "A[0]" } } },
      { id: "b2", text: "i を 1 から 5 まで 1 ずつ増やしながら繰り返す:" },
      { id: "b3", text: "もし [input_cond] > 最大値 ならば:", inputs: { input_cond: { placeholder: "比較対象", correct: "A[i]" } } },
      { id: "b4", text: "最大値 = A[i]" },
      { id: "b5", text: "最大値 を表示する" }
    ],
    explanation: "最大値を見つけるには、まず仮の最大値として配列の先頭要素「A[0]」を設定します。その後、2番目の要素「A[1]」から最後の要素「A[5]」まで順に見ていき、もし現在の最大値よりも大きい要素「A[i]」が見つかったら、それを新たな「最大値」として更新します。"
  },
  {
    id: "linear_search",
    title: "線形探索（サーチ）",
    description: "配列 A の中から、探したい値 target（ここでは 9）を探し、そのインデックス（位置）を表示するプログラムを完成させてください。見つからない場合は -1 を表示します。",
    difficulty: "上級",
    initialState: {
      A: [8, 3, 5, 9, 2],
      target: 9,
      arrayData: { name: "A", values: [8, 3, 5, 9, 2] }
    },
    correctBlocks: [
      { id: "b1", text: "位置 = -1", indent: 0 },
      { id: "b2", text: "i を 0 から 4 まで 1 ずつ増やしながら繰り返す:", indent: 0 },
      { id: "b3", text: "もし A[i] == target ならば:", indent: 1 },
      { id: "b4", text: "位置 = i", indent: 2 },
      { id: "b5", text: "ループを抜ける", indent: 2 },
      { id: "b6", text: "位置 を表示する", indent: 0 }
    ],
    easyBlocks: [
      { id: "b4", text: "位置 = i" },
      { id: "b1", text: "位置 = -1" },
      { id: "b5", text: "ループを抜ける" },
      { id: "b3", text: "もし A[i] == target ならば:" },
      { id: "b6", text: "位置 を表示する" },
      { id: "b2", text: "i を 0 から 4 まで 1 ずつ増やしながら繰り返す:" }
    ],
    normalBlocks: [
      { id: "b4", text: "位置 = i" },
      { id: "b1", text: "位置 = -1" },
      { id: "b5", text: "ループを抜ける" },
      { id: "b3", text: "もし A[i] == target ならば:" },
      { id: "b6", text: "位置 を表示する" },
      { id: "b2", text: "i を 0 から 4 まで 1 ずつ増やしながら繰り返す:" },
      // ダミー
      { id: "d1", text: "位置 = i + 1", isDummy: true, reason: "共通テストの配列の添字（インデックス）は通常0から始まります。見つかった位置は i そのものになります。" },
      { id: "d2", text: "もし A[i] == i ならば:", isDummy: true, reason: "これでは配列の値ではなく、配列のインデックス番号自身と比較してしまいます。" }
    ],
    hardBlocks: [
      { id: "b1", text: "位置 = [input_notfound]", inputs: { input_notfound: { placeholder: "見つからない時の値", correct: "-1" } } },
      { id: "b2", text: "i を 0 から 4 まで 1 ずつ増やしながら繰り返す:" },
      { id: "b3", text: "もし [input_search] == target ならば:", inputs: { input_search: { placeholder: "探索対象", correct: "A[i]" } } },
      { id: "b4", text: "位置 = i" },
      { id: "b5", text: "ループを抜ける" },
      { id: "b6", text: "位置 を表示する" }
    ],
    explanation: "まず、見つからなかった場合の初期値として「位置 = -1」を設定します。ループで配列の各要素「A[i]」と「target」を順番に比較し、一致した場合はそのインデックス「i」を「位置」に代入し、「ループを抜ける」で探索を終了します。最後にその位置を表示します。"
  }
];

// ブラウザ環境とNode環境の両方に対応
if (typeof module !== "undefined" && module.exports) {
  module.exports = problems;
}
