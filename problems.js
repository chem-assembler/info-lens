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
    correctBlocks: [
      { id: "b1", text: "N = 10", indent: 0 },
      { id: "b2", text: "合計 = 0", indent: 0 },
      { id: "b3", text: "i を 1 から N まで 1 ずつ増やしながら繰り返す:", indent: 0 },
      { id: "b4", text: "合計 = 合計 + i", indent: 1 },
      { id: "b5", text: "合計 を表示する", indent: 0 }
    ],
    easyBlocks: [
      { id: "b4", text: "合計 = 合計 + i" },
      { id: "b1", text: "N = 10" },
      { id: "b5", text: "合計 を表示する" },
      { id: "b3", text: "i を 1 から N まで 1 ずつ増やしながら繰り返す:" },
      { id: "b2", text: "合計 = 0" }
    ],
    normalBlocks: [
      { id: "b4", text: "合計 = 合計 + i" },
      { id: "b1", text: "N = 10" },
      { id: "b5", text: "合計 を表示する" },
      { id: "b3", text: "i を 1 から N まで 1 ずつ増やしながら繰り返す:" },
      { id: "b2", text: "合計 = 0" },
      { id: "d1", text: "合計 = 合計 + 1", isDummy: true, reason: "これでは毎回1しか足されず、1からNまでの合計になりません。" },
      { id: "d2", text: "i を 1 から N 未満まで 1 ずつ増やしながら繰り返す:", isDummy: true, reason: "「N未満」にすると、N自身（ここでは10）が合計に足されなくなります。" }
    ],
    hardBlocks: [
      { id: "b4", text: "合計 = 合計 + [input_add]", inputs: { input_add: { placeholder: "足す値", correct: "i" } } },
      { id: "b1", text: "N = 10" },
      { id: "b5", text: "[input_print] を表示する", inputs: { input_print: { placeholder: "表示する変数", correct: "合計" } } },
      { id: "b3", text: "i を 1 から N まで 1 ずつ増やしながら繰り返す:" },
      { id: "b2", text: "合計 = 0" }
    ],
    explanation: "「合計 = 0」で合計値を格納する変数を初期化し、「i を 1 から N まで 1 ずつ増やしながら繰り返す」ループの中で、変数 i の値を「合計」に順番に足し合わせていきます。ループが終わった後に、最終的な「合計」を表示します。【入れ替え可能な箇所】1行目の「N = 10」と2行目の「合計 = 0」は、どちらもループが始まる前に変数を初期化する処理であるため、順序を入れ替えても正しく動作します。"
  },
  {
    id: "count_multiples_of_3",
    title: "3の倍数の個数を数える",
    description: "1から20までの整数のうち、3の倍数である数値が何個あるかを数えて表示するプログラムを完成させてください。（DNCLでは「余り」を求める演算として % を使います）",
    difficulty: "初級",
    initialState: {
      N: 20,
      個数: 0
    },
    correctBlocks: [
      { id: "b1", text: "N = 20", indent: 0 },
      { id: "b2", text: "個数 = 0", indent: 0 },
      { id: "b3", text: "i を 1 から N まで 1 ずつ増やしながら繰り返す:", indent: 0 },
      { id: "b4", text: "もし i % 3 == 0 ならば:", indent: 1 },
      { id: "b5", text: "個数 = 個数 + 1", indent: 2 },
      { id: "b6", text: "個数 を表示する", indent: 0 }
    ],
    easyBlocks: [
      { id: "b5", text: "個数 = 個数 + 1" },
      { id: "b1", text: "N = 20" },
      { id: "b6", text: "個数 を表示する" },
      { id: "b3", text: "i を 1 から N まで 1 ずつ増やしながら繰り返す:" },
      { id: "b2", text: "個数 = 0" },
      { id: "b4", text: "もし i % 3 == 0 ならば:" }
    ],
    normalBlocks: [
      { id: "b5", text: "個数 = 個数 + 1" },
      { id: "b1", text: "N = 20" },
      { id: "b6", text: "個数 を表示する" },
      { id: "b3", text: "i を 1 から N まで 1 ずつ増やしながら繰り返す:" },
      { id: "b2", text: "個数 = 0" },
      { id: "b4", text: "もし i % 3 == 0 ならば:" },
      { id: "d1", text: "個数 = i", isDummy: true, reason: "これでは数え上げた個数ではなく、現在の値 i が代入されてしまいます。個数を1つずつ増やすには「個数 = 個数 + 1」とする必要があります。" },
      { id: "d2", text: "もし i % 3 == 1 ならば:", isDummy: true, reason: "「3で割った余りが1」の条件では、3の倍数ではなく「3で割って1余る数（1, 4, 7, ...）」を数えてしまいます。" }
    ],
    hardBlocks: [
      { id: "b1", text: "N = 20" },
      { id: "b2", text: "個数 = 0" },
      { id: "b3", text: "i を 1 から N まで 1 ずつ増やしながら繰り返す:" },
      { id: "b4", text: "もし [input_cond] == 0 ならば:", inputs: { input_cond: { placeholder: "条件式 (例: i % 3)", correct: "i % 3" } } },
      { id: "b5", text: "個数 = [input_inc]", inputs: { input_inc: { placeholder: "加算式 (例: 個数 + 1)", correct: "個数 + 1" } } },
      { id: "b6", text: "個数 を表示する" }
    ],
    explanation: "「個数 = 0」でカウント用の変数を初期化し、ループ内で「i % 3 == 0」（3で割った余りが0、すなわち3の倍数）の判定を行います。条件を満たしたときだけ「個数 = 個数 + 1」でカウントを1増やします。【入れ替え可能な箇所】1行目の「N = 20」と2行目の「個数 = 0」は、どちらもループが始まる前に変数を初期化する処理であるため、順序を入れ替えても正しく動作します。"
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
    explanation: "最大値を見つけるには、まず仮の最大値として配列の先頭要素「A[0]」を設定します。その後、2番目の要素「A[1]」から最後の要素「A[5]」まで順に見ていき、もし現在の最大値よりも大きい要素「A[i]」が見つかったら、それを新たな「最大値」として更新します。【入れ替え可能な箇所】このアルゴリズムでは処理の順番やインデント構造（ネスト）が厳密に決まっているため、ブロック同士の配置順を入れ替え可能な箇所はありません。"
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
    explanation: "まず、見つからなかった場合の初期値として「位置 = -1」を設定します。ループで配列の各要素「A[i]」と「target」を順番に比較し、一致した場合はそのインデックス「i」を「位置」に代入し、「ループを抜ける」で探索を終了します。最後にその位置を表示します。【入れ替え可能な箇所】条件分岐の中の「位置 = i」と「ループを抜ける」は、どちらが先でも最終的な結果は変わらないため、順序を入れ替えても正しく動作します（ただし同じインデント2である必要があります）。"
  }
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = problems;
}
