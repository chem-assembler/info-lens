/**
 * 問題データ。
 *
 * `correctBlocks` はカードの並び・インデントの正解そのもので、判定の基準になる。
 * 並び順は原則この通りでなければ正解にしない（順番が違えばプログラムとして別物のため）。
 *
 * `swappable` … 入れ替えても論理的に同じプログラムになるカードの組。
 *   例: `[["b1", "b2"]]` は「b1 と b2 は隣どうしなら入れ替えてよい」。
 *   3枚以上を1組に書けば、その並びの中では自由（互いに独立な初期化など）。
 *   ここに書いた組が本当に無害か（模範解答と同じ出力になるか）は
 *   `node verify_problems.js` が全通り実行して確かめる。
 *   出力がたまたま同じになるだけの誤った並び（初期化をループの後ろに置くなど）は
 *   ここに書かないこと。書かなければ不正解になる。
 */
const problems = [
  {
    id: "sum_1_to_n",
    title: "1からNまでの合計",
    description: "あらかじめ設定された変数 N に代入された値（ここでは10）までの合計（1 + 2 + ... + 10）を計算して表示するプログラムを完成させてください。",
    difficulty: "初級",
    initialState: {
      N: 10,
      arrayData: null
    },
    correctBlocks: [
      { id: "b1", text: "N = 10", indent: 0, isLocked: true },
      { id: "b2", text: "合計 = 0", indent: 0 },
      { id: "b3", text: "i を 1 から N まで 1 ずつ増やしながら繰り返す:", indent: 0 },
      { id: "b4", text: "合計 = 合計 + i", indent: 1 },
      { id: "b5", text: "表示する(合計)", indent: 0 }
    ],
    // 「合計 = 0」は N の値に関係しないので、N = 10 の上でも下でもよい
    swappable: [["b1", "b2"]],
    easyBlocks: [
      { id: "b4", text: "合計 = 合計 + i" },
      { id: "b1", text: "N = 10", isLocked: true },
      { id: "b5", text: "表示する(合計)" },
      { id: "b3", text: "i を 1 から N まで 1 ずつ増やしながら繰り返す:" },
      { id: "b2", text: "合計 = 0" }
    ],
    normalBlocks: [
      { id: "b4", text: "合計 = 合計 + i" },
      { id: "b1", text: "N = 10", isLocked: true },
      { id: "b5", text: "表示する(合計)" },
      { id: "b3", text: "i を 1 から N まで 1 ずつ増やしながら繰り返す:" },
      { id: "b2", text: "合計 = 0" },
      { id: "d1", text: "合計 = 合計 + 1", isDummy: true, reason: "これでは毎回1しか足されず、1からNまでの合計になりません。" },
      { id: "d2", text: "i を 1 から N 未満まで 1 ずつ増やしながら繰り返す:", isDummy: true, reason: "「N未満」にすると、N自身（ここでは10）が合計に足されなくなります。" }
    ],
    hardBlocks: [
      { id: "b4", text: "合計 = 合計 + [input_add]", inputs: { input_add: { placeholder: "足す値", correct: "i" } } },
      { id: "b1", text: "N = 10", isLocked: true },
      { id: "b5", text: "表示する([input_print])", inputs: { input_print: { placeholder: "表示する変数", correct: "合計" } } },
      { id: "b3", text: "i を 1 から N まで 1 ずつ増やしながら繰り返す:" },
      { id: "b2", text: "合計 = 0" }
    ],
    narratives: {
      b1: (vars) => `変数 N に 10 を代入する`,
      b2: (vars) => `変数 合計 に 0 を代入する`,
      b3: (vars) => `変数 i の値を 1 から N (${vars.N || 10}) まで 1 ずつ増やしながら繰り返す`,
      b4: (vars) => {
        const currentSum = vars.合計 || 0;
        const currentI = vars.i || 0;
        const prevSum = currentSum - currentI;
        return `変数 合計 に、現在の合計 (${prevSum}) と i (${currentI}) を足した値 (${currentSum}) を代入する`;
      },
      b5: (vars) => `変数 合計 の値 (${vars.合計 || 0}) を表示する`
    },
    explanation: "「合計 = 0」で合計値を格納する変数を初期化し、「i を 1 から N まで 1 ずつ増やしながら繰り返す」ループの中で、変数 i の値を「合計」に順番に足し合わせていきます。ループが終わった後に、最終的な「合計」を表示します。【入れ替え可能な箇所】初期化「合計 = 0」はループが始まる前の任意の位置（固定されている N = 10 の下など）に配置できます。"
  },
  {
    id: "count_multiples_of_3",
    title: "3の倍数の個数を数える",
    description: "あらかじめ設定された変数 N に代入された値（ここでは20）までの整数のうち、3の倍数である数値が何個あるかを数えて表示するプログラムを完成させてください。（DNCLでは「余り」を求める演算として % を使います）",
    difficulty: "初級",
    initialState: {
      N: 20,
      個数: 0
    },
    correctBlocks: [
      { id: "b1", text: "N = 20", indent: 0, isLocked: true },
      { id: "b2", text: "個数 = 0", indent: 0 },
      { id: "b3", text: "i を 1 から N まで 1 ずつ増やしながら繰り返す:", indent: 0 },
      { id: "b4", text: "もし i % 3 == 0 ならば:", indent: 1 },
      { id: "b5", text: "個数 = 個数 + 1", indent: 2 },
      { id: "b6", text: "表示する(個数)", indent: 0 }
    ],
    // 「個数 = 0」は N の値に関係しないので、N = 20 の上でも下でもよい
    swappable: [["b1", "b2"]],
    easyBlocks: [
      { id: "b5", text: "個数 = 個数 + 1" },
      { id: "b1", text: "N = 20", isLocked: true },
      { id: "b6", text: "表示する(個数)" },
      { id: "b3", text: "i を 1 から N まで 1 ずつ増やしながら繰り返す:" },
      { id: "b2", text: "個数 = 0" },
      { id: "b4", text: "もし i % 3 == 0 ならば:" }
    ],
    normalBlocks: [
      { id: "b5", text: "個数 = 個数 + 1" },
      { id: "b1", text: "N = 20", isLocked: true },
      { id: "b6", text: "表示する(個数)" },
      { id: "b3", text: "i を 1 から N まで 1 ずつ増やしながら繰り返す:" },
      { id: "b2", text: "個数 = 0" },
      { id: "b4", text: "もし i % 3 == 0 ならば:" },
      { id: "d1", text: "個数 = i", isDummy: true, reason: "これでは数え上げた個数ではなく、現在の値 i が代入されてしまいます。個数を1つずつ増やすには「個数 = 個数 + 1」とする必要があります。" },
      { id: "d2", text: "もし i % 3 == 1 ならば:", isDummy: true, reason: "「3で割った余りが1」の条件では、3の倍数ではなく「3で割って1余る数（1, 4, 7, ...）」を数えてしまいます。" }
    ],
    hardBlocks: [
      { id: "b1", text: "N = 20", isLocked: true },
      { id: "b2", text: "個数 = 0" },
      { id: "b3", text: "i を 1 から N まで 1 ずつ増やしながら繰り返す:" },
      { id: "b4", text: "もし [input_cond] == 0 ならば:", inputs: { input_cond: { placeholder: "条件式 (例: i % 3)", correct: "i % 3" } } },
      { id: "b5", text: "個数 = [input_inc]", inputs: { input_inc: { placeholder: "加算式 (例: 個数 + 1)", correct: "個数 + 1" } } },
      { id: "b6", text: "表示する(個数)" }
    ],
    narratives: {
      b1: (vars) => `変数 N に 20 を代入する`,
      b2: (vars) => `変数 個数 に 0 を代入する`,
      b3: (vars) => `変数 i の値を 1 から N (${vars.N || 20}) まで 1 ずつ増やしながら繰り返す`,
      b4: (vars) => {
        const valI = vars.i || 1;
        const check = valI % 3 === 0;
        return `もし i (${valI}) を 3 で割った余り (${valI % 3}) が 0 ならば（3の倍数なら）: [判定結果: ${check ? '真' : '偽'}]`;
      },
      b5: (vars) => `変数 個数 に、現在の個数 (${vars.個数 - 1}) に 1 を足した値 (${vars.個数}) を代入する`,
      b6: (vars) => `変数 個数 の値 (${vars.個数 || 0}) を表示する`
    },
    explanation: "「個数 = 0」でカウント用の変数を初期化し、ループ内で「i % 3 == 0」（3で割った余りが0、すなわち3の倍数）の判定を行います。条件を満たしたときだけ「個数 = 個数 + 1」でカウントを1増やします。【入れ替え可能な箇所】初期化「個数 = 0」は繰り返し（ループ）が始まる前の任意の位置に配置可能です。"
  },
  {
    id: "leap_year",
    title: "うるう年の判定",
    description: "あらかじめ設定された変数 西暦（ここでは2024）が「うるう年」であるか判定するプログラムを完成させてください。うるう年の場合は「1」、そうでない場合は「0」を表示します。（4で割り切れ、かつ100で割り切れない、または400で割り切れる年がうるう年です）",
    difficulty: "中級",
    initialState: {
      西暦: 2024,
      うるう年: 0
    },
    correctBlocks: [
      { id: "b1", text: "西暦 = 2024", indent: 0, isLocked: true },
      { id: "b2", text: "うるう年 = 0", indent: 0 },
      { id: "b3", text: "もし 西暦 % 4 == 0 ならば:", indent: 0 },
      { id: "b4", text: "もし 西暦 % 100 != 0 or 西暦 % 400 == 0 ならば:", indent: 1 },
      { id: "b5", text: "うるう年 = 1", indent: 2 },
      { id: "b6", text: "表示する(うるう年)", indent: 0 }
    ],
    // 「うるう年 = 0」は西暦の値に関係しないので、西暦 = 2024 の上でも下でもよい
    swappable: [["b1", "b2"]],
    easyBlocks: [
      { id: "b5", text: "うるう年 = 1" },
      { id: "b1", text: "西暦 = 2024", isLocked: true },
      { id: "b6", text: "表示する(うるう年)" },
      { id: "b3", text: "もし 西暦 % 4 == 0 ならば:" },
      { id: "b4", text: "もし 西暦 % 100 != 0 or 西暦 % 400 == 0 ならば:" },
      { id: "b2", text: "うるう年 = 0" }
    ],
    normalBlocks: [
      { id: "b5", text: "うるう年 = 1" },
      { id: "b1", text: "西暦 = 2024", isLocked: true },
      { id: "b6", text: "表示する(うるう年)" },
      { id: "b3", text: "もし 西暦 % 4 == 0 ならば:" },
      { id: "b4", text: "もし 西暦 % 100 != 0 or 西暦 % 400 == 0 ならば:" },
      { id: "b2", text: "うるう年 = 0" },
      { id: "d1", text: "もし 西暦 % 4 == 0 or 西暦 % 400 == 0 ならば:", isDummy: true, reason: "100の倍数である年を除外する条件（西暦 % 100 != 0）が抜けているため、1900年など（うるう年ではない）をうるう年と誤判定してしまいます。" },
      { id: "d2", text: "うるう年 = 0", isDummy: true, reason: "この初期化カードはすでに2行目に配置されているため重複してしまい不要です。" }
    ],
    hardBlocks: [
      { id: "b1", text: "西暦 = 2024", isLocked: true },
      { id: "b2", text: "うるう年 = 0" },
      { id: "b3", text: "もし [input_cond1] ならば:", inputs: { input_cond1: { placeholder: "最初の条件 (例: 西暦 % 4 == 0)", correct: "西暦 % 4 == 0" } } },
      { id: "b4", text: "もし [input_cond2] ならば:", inputs: { input_cond2: { placeholder: "ネストの条件 (例: 西暦 % 100 != 0 or 西暦 % 400 == 0)", correct: "西暦 % 100 != 0 or 西暦 % 400 == 0" } } },
      { id: "b5", text: "うるう年 = 1" },
      { id: "b6", text: "表示する(うるう年)" }
    ],
    narratives: {
      b1: (vars) => `変数 西暦 に 2024 を代入する`,
      b2: (vars) => `変数 うるう年 に 0 を代入する`,
      b3: (vars) => `もし 西暦 (${vars.西暦 || 2024}) を 4 で割った余り (${(vars.西暦 || 2024) % 4}) が 0 ならば: [判定: ${(vars.西暦 || 2024) % 4 === 0 ? '真' : '偽'}]`,
      b4: (vars) => {
        const year = vars.西暦 || 2024;
        const check = (year % 100 !== 0) || (year % 400 === 0);
        return `もし 西暦 (${year}) を 100 で割った余りが 0 でない、または 400 で割った余りが 0 ならば: [判定: ${check ? '真' : '偽'}]`;
      },
      b5: (vars) => `変数 うるう年 に 1 を代入する`,
      b6: (vars) => `変数 うるう年 の値 (${vars.うるう年 || 0}) を表示する`
    },
    explanation: "「うるう年 = 0」で非うるう年を初期状態とします。4の倍数の場合に最初の条件に入り、さらに「西暦 % 100 != 0 or 西暦 % 400 == 0」（100の倍数ではない、または400の倍数である）という条件をネスト（入れ子）で判定し、適合すれば「うるう年 = 1」に変更して最後に表示します。【入れ替え可能な箇所】初期化「うるう年 = 0」は、判定文が始まる前（固定されている 西暦 = 2024 の下など）の任意の位置に配置できます。"
  },
  {
    id: "find_max",
    title: "配列の最大値を見つける",
    description: "あらかじめ定義された配列 A に格納された6つの数値の中から、最も大きい値（最大値）を見つけて表示するプログラムを完成させてください。",
    difficulty: "中級",
    initialState: {
      A: [12, 45, 78, 34, 89, 56],
      arrayData: { name: "A", values: [12, 45, 78, 34, 89, 56] }
    },
    correctBlocks: [
      { id: "b0", text: "A = [12, 45, 78, 34, 89, 56]", indent: 0, isLocked: true },
      { id: "b1", text: "最大値 = A[0]", indent: 0 },
      { id: "b2", text: "i を 1 から 5 まで 1 ずつ増やしながら繰り返す:", indent: 0 },
      { id: "b3", text: "もし A[i] > 最大値 ならば:", indent: 1 },
      { id: "b4", text: "最大値 = A[i]", indent: 2 },
      { id: "b5", text: "表示する(最大値)", indent: 0 }
    ],
    easyBlocks: [
      { id: "b3", text: "もし A[i] > 最大値 ならば:" },
      { id: "b0", text: "A = [12, 45, 78, 34, 89, 56]", isLocked: true },
      { id: "b1", text: "最大値 = A[0]" },
      { id: "b5", text: "表示する(最大値)" },
      { id: "b4", text: "最大値 = A[i]" },
      { id: "b2", text: "i を 1 から 5 まで 1 ずつ増やしながら繰り返す:" }
    ],
    normalBlocks: [
      { id: "b3", text: "もし A[i] > 最大値 ならば:" },
      { id: "b0", text: "A = [12, 45, 78, 34, 89, 56]", isLocked: true },
      { id: "b1", text: "最大値 = A[0]" },
      { id: "b5", text: "表示する(最大値)" },
      { id: "b4", text: "最大値 = A[i]" },
      { id: "b2", text: "i を 1 から 5 まで 1 ずつ増やしながら繰り返す:" },
      { id: "d1", text: "最大値 = 0", isDummy: true, reason: "初期値を0にすると、配列の要素がすべてマイナスの数値だった場合に正しく最大値を判定できません。配列の最初の要素（A[0]）で初期化するのが鉄則です。" },
      { id: "d2", text: "もし A[i] < 最大値 ならば:", isDummy: true, reason: "これでは「最大値よりも小さい場合」に中身を更新してしまうため、最小値を求めるプログラム（あるいは意図しない動作）になってしまいます。" }
    ],
    hardBlocks: [
      { id: "b0", text: "A = [12, 45, 78, 34, 89, 56]", isLocked: true },
      { id: "b1", text: "最大値 = [input_init]", inputs: { input_init: { placeholder: "初期値", correct: "A[0]" } } },
      { id: "b2", text: "i を 1 から 5 まで 1 ずつ増やしながら繰り返す:" },
      { id: "b3", text: "もし [input_cond] > 最大値 ならば:", inputs: { input_cond: { placeholder: "比較対象", correct: "A[i]" } } },
      { id: "b4", text: "最大値 = A[i]" },
      { id: "b5", text: "表示する(最大値)" }
    ],
    narratives: {
      b0: (vars) => `配列 A に [12, 45, 78, 34, 89, 56] を代入する`,
      b1: (vars) => `変数 最大値 に A[0] の値 (${vars.A ? vars.A[0] : 12}) を代入する`,
      b2: (vars) => `変数 i の値を 1 から 5 まで 1 ずつ増やしながら繰り返す`,
      b3: (vars) => {
        const valI = vars.i || 1;
        const valA = vars.A ? vars.A[valI] : 0;
        const max = vars.最大値 || 0;
        return `もし A[${valI}] の値 (${valA}) が 最大値 (${max}) より大きければ: [判定: ${valA > max ? '真' : '偽'}]`;
      },
      b4: (vars) => {
        const valI = vars.i || 1;
        const valA = vars.A ? vars.A[valI] : 0;
        return `変数 最大値 に A[${valI}] の値 (${valA}) を代入する`;
      },
      b5: (vars) => `変数 最大値 の値 (${vars.最大値 || 0}) を表示する`
    },
    explanation: "最大値を見つけるには、まず仮の最大値として配列の先頭要素「A[0]」を設定します。その後、2番目の要素「A[1]」から最後の要素「A[5]」まで順に見ていき、もし現在の最大値よりも大きい要素「A[i]」が見つかったら、それを新たな「最大値」として更新します。【入れ替え可能な箇所】このアルゴリズムでは処理の順番やインデント構造（ネスト）が厳密に決まっているため、ブロック同士の配置順を入れ替え可能な箇所はありません。"
  },
  {
    id: "euclidean_algorithm",
    title: "最大公約数（ユークリッドの互除法）",
    description: "あらかじめ設定された変数 A（48）と B（18）の最大公約数（GCD）を、ユークリッドの互除法を使って計算し表示するプログラムを完成させてください。Bが0になるまで、AをBで割った余りを求め続けます。",
    difficulty: "中級",
    initialState: {
      A: 48,
      B: 18
    },
    correctBlocks: [
      { id: "b1", text: "A = 48", indent: 0, isLocked: true },
      { id: "b2", text: "B = 18", indent: 0, isLocked: true },
      { id: "b3", text: "B > 0 の間、繰り返す:", indent: 0 },
      { id: "b4", text: "余り = A % B", indent: 1 },
      { id: "b5", text: "A = B", indent: 1 },
      { id: "b6", text: "B = 余り", indent: 1 },
      { id: "b7", text: "表示する(A)", indent: 0 }
    ],
    easyBlocks: [
      { id: "b5", text: "A = B" },
      { id: "b1", text: "A = 48", isLocked: true },
      { id: "b6", text: "B = 余り" },
      { id: "b3", text: "B > 0 の間、繰り返す:" },
      { id: "b2", text: "B = 18", isLocked: true },
      { id: "b4", text: "余り = A % B" },
      { id: "b7", text: "表示する(A)" }
    ],
    normalBlocks: [
      { id: "b5", text: "A = B" },
      { id: "b1", text: "A = 48", isLocked: true },
      { id: "b6", text: "B = 余り" },
      { id: "b3", text: "B > 0 の間、繰り返す:" },
      { id: "b2", text: "B = 18", isLocked: true },
      { id: "b4", text: "余り = A % B" },
      { id: "b7", text: "表示する(A)" },
      { id: "d1", text: "B = A % B", isDummy: true, reason: "これではAの値が更新される前にBの値を余りで上書きしてしまい、正しい互除計算が行えません。一時変数「余り」を使いましょう。" },
      { id: "d2", text: "A = 余り", isDummy: true, reason: "これではBの値をAに引き継ぐ前に、Aの値を余りで上書きしてしまいます。" }
    ],
    hardBlocks: [
      { id: "b1", text: "A = 48", isLocked: true },
      { id: "b2", text: "B = 18", isLocked: true },
      { id: "b3", text: "[input_cond] の間、繰り返す:", inputs: { input_cond: { placeholder: "繰り返し条件 (例: B > 0)", correct: "B > 0" } } },
      { id: "b4", text: "余り = A % B" },
      { id: "b5", text: "A = [input_a]", inputs: { input_a: { placeholder: "次のAに入る値", correct: "B" } } },
      { id: "b6", text: "B = [input_b]", inputs: { input_b: { placeholder: "次のBに入る値", correct: "余り" } } },
      { id: "b7", text: "表示する(A)" }
    ],
    narratives: {
      b1: (vars) => `変数 A に 48 を代入する`,
      b2: (vars) => `変数 B に 18 を代入する`,
      b3: (vars) => `変数 B の値 (${vars.B || 0}) が 0 より大きい間、繰り返す`,
      b4: (vars) => {
        const valA = vars.A || 0;
        const valB = vars.B || 1;
        return `変数 余り に、A (${valA}) を B (${valB}) で割った余り (${valA % valB}) の値を代入する`;
      },
      b5: (vars) => `変数 A に変数 B の値 (${vars.B || 0}) を代入する`,
      b6: (vars) => `変数 B に変数 余り の値 (${vars.余り !== undefined ? vars.余り : 0}) を代入する`,
      b7: (vars) => `変数 A の値 (${vars.A || 0}) を表示する`
    },
    explanation: "ユークリッドの互除法では、「AをBで割った余りを求め、AにB、Bに余りを代入する」という操作を、余りが0（すなわち、割る数Bが0）になるまで繰り返します。ループ終了時の「A」に最大公約数が残っています。【入れ替え可能な箇所】固定設定されている初期化「A = 48」と「B = 18」以外のブロックについては、配置順を変更できる箇所はありません。"
  },
  {
    id: "linear_search",
    title: "線形探索（サーチ）",
    description: "あらかじめ定義された配列 A の中から、探したい値 target（ここでは 9）を探し、そのインデックス（位置）を表示するプログラムを完成させてください。見つからない場合は -1 を表示します。",
    difficulty: "上級",
    initialState: {
      A: [8, 3, 5, 9, 2],
      target: 9,
      arrayData: { name: "A", values: [8, 3, 5, 9, 2] }
    },
    correctBlocks: [
      { id: "b0_1", text: "A = [8, 3, 5, 9, 2]", indent: 0, isLocked: true },
      { id: "b0_2", text: "target = 9", indent: 0, isLocked: true },
      { id: "b1", text: "位置 = -1", indent: 0 },
      { id: "b2", text: "i を 0 から 4 まで 1 ずつ増やしながら繰り返す:", indent: 0 },
      { id: "b3", text: "もし A[i] == target ならば:", indent: 1 },
      { id: "b4", text: "位置 = i", indent: 2 },
      { id: "b5", text: "ループを抜ける", indent: 2 },
      { id: "b6", text: "表示する(位置)", indent: 0 }
    ],
    // 前提の3枚（配列・探す値・位置の初期値）は互いに独立なので順不同。
    // 「位置 = i」と「ループを抜ける」は入れ替えられない（先に抜けると位置が -1 のまま）
    swappable: [["b0_1", "b0_2", "b1"]],
    easyBlocks: [
      { id: "b4", text: "位置 = i" },
      { id: "b0_1", text: "A = [8, 3, 5, 9, 2]", isLocked: true },
      { id: "b1", text: "位置 = -1" },
      { id: "b0_2", text: "target = 9", isLocked: true },
      { id: "b5", text: "ループを抜ける" },
      { id: "b3", text: "もし A[i] == target ならば:" },
      { id: "b6", text: "表示する(位置)" },
      { id: "b2", text: "i を 0 から 4 まで 1 ずつ増やしながら繰り返す:" }
    ],
    normalBlocks: [
      { id: "b4", text: "位置 = i" },
      { id: "b0_1", text: "A = [8, 3, 5, 9, 2]", isLocked: true },
      { id: "b1", text: "位置 = -1" },
      { id: "b0_2", text: "target = 9", isLocked: true },
      { id: "b5", text: "ループを抜ける" },
      { id: "b3", text: "もし A[i] == target ならば:" },
      { id: "b6", text: "表示する(位置)" },
      { id: "b2", text: "i を 0 から 4 まで 1 ずつ増やしながら繰り返す:" },
      { id: "d1", text: "位置 = i + 1", isDummy: true, reason: "共通テストの配列の添字（インデックス）は通常0から始まります。見つかった位置は i そのものになります。" },
      { id: "d2", text: "もし A[i] == i ならば:", isDummy: true, reason: "これでは配列の値ではなく、配列のインデックス番号自身と比較してしまいます。" }
    ],
    hardBlocks: [
      { id: "b0_1", text: "A = [8, 3, 5, 9, 2]", isLocked: true },
      { id: "b0_2", text: "target = 9", isLocked: true },
      { id: "b1", text: "位置 = [input_notfound]", inputs: { input_notfound: { placeholder: "見つからない時の値", correct: "-1" } } },
      { id: "b2", text: "i を 0 から 4 まで 1 ずつ増やしながら繰り返す:" },
      { id: "b3", text: "もし [input_search] == target ならば:", inputs: { input_search: { placeholder: "探索対象", correct: "A[i]" } } },
      { id: "b4", text: "位置 = i" },
      { id: "b5", text: "ループを抜ける" },
      { id: "b6", text: "表示する(位置)" }
    ],
    narratives: {
      b0_1: (vars) => `配列 A に [8, 3, 5, 9, 2] を代入する`,
      b0_2: (vars) => `変数 target に 9 を代入する`,
      b1: (vars) => `変数 位置 に -1 を代入する`,
      b2: (vars) => `変数 i の値を 0 から 4 まで 1 ずつ増やしながら繰り返す`,
      b3: (vars) => {
        const valI = vars.i || 0;
        const valA = vars.A ? vars.A[valI] : 0;
        const target = vars.target || 9;
        return `もし A[${valI}] の値 (${valA}) が target (${target}) と等しければ: [判定: ${valA === target ? '真（発見）' : '偽'}]`;
      },
      b4: (vars) => `変数 位置 に i の値 (${vars.i || 0}) を代入する`,
      b5: (vars) => `繰り返し（ループ）を抜ける`,
      b6: (vars) => `変数 位置 の値 (${vars.位置 !== undefined ? vars.位置 : -1}) を表示する`
    },
    explanation: "まず、見つからなかった場合の初期値として「位置 = -1」を設定します。ループで配列の各要素「A[i]」と「target」を順番に比較し、一致した場合はそのインデックス「i」を「位置」に代入し、「ループを抜ける」で探索を終了します。最後にその位置を表示します。【入れ替え可能な箇所】繰り返しに入る前の「A = [8, 3, 5, 9, 2]」「target = 9」「位置 = -1」は互いに関係しないので、この3枚の順序は入れ替えられます。逆に条件分岐の中は入れ替えられません。「ループを抜ける」を先にすると、「位置 = i」を実行しないまま繰り返しから出てしまい、位置が -1 のままになります。"
  },
  {
    id: "coin_change",
    title: "最小硬貨枚数（お釣り計算）",
    description: "あらかじめ設定されたお釣り金額 780 円を、500円、100円、50円、10円硬貨を使って、最小の枚数で支払う際、各硬貨の枚数を計算し表示するプログラムを完成させてください。（DNCLでは整数除算に ÷ を使います）",
    difficulty: "上級",
    initialState: {
      金額: 780,
      硬貨: [500, 100, 50, 10],
      arrayData: { name: "硬貨", values: [500, 100, 50, 10] }
    },
    correctBlocks: [
      { id: "b1", text: "金額 = 780", indent: 0, isLocked: true },
      { id: "b0", text: "硬貨 = [500, 100, 50, 10]", indent: 0, isLocked: true },
      { id: "b2", text: "i を 0 から 3 まで 1 ずつ増やしながら繰り返す:", indent: 0 },
      { id: "b3", text: "枚数 = 金額 ÷ 硬貨[i]", indent: 1 },
      { id: "b4", text: "金額 = 金額 % 硬貨[i]", indent: 1 },
      { id: "b5", text: "表示する(枚数)", indent: 1 }
    ],
    // 残額の更新と枚数の表示は互いに影響しない（表示は枚数しか見ない）
    swappable: [["b4", "b5"]],
    easyBlocks: [
      { id: "b3", text: "枚数 = 金額 ÷ 硬貨[i]" },
      { id: "b1", text: "金額 = 780", isLocked: true },
      { id: "b0", text: "硬貨 = [500, 100, 50, 10]", isLocked: true },
      { id: "b5", text: "表示する(枚数)" },
      { id: "b4", text: "金額 = 金額 % 硬貨[i]" },
      { id: "b2", text: "i を 0 から 3 まで 1 ずつ増やしながら繰り返す:" }
    ],
    normalBlocks: [
      { id: "b3", text: "枚数 = 金額 ÷ 硬貨[i]" },
      { id: "b1", text: "金額 = 780", isLocked: true },
      { id: "b0", text: "硬貨 = [500, 100, 50, 10]", isLocked: true },
      { id: "b5", text: "表示する(枚数)" },
      { id: "b4", text: "金額 = 金額 % 硬貨[i]" },
      { id: "b2", text: "i を 0 から 3 まで 1 ずつ増やしながら繰り返す:" },
      { id: "d1", text: "枚数 = 金額 / 硬貨[i]", isDummy: true, reason: "通常の除算 / を使うと枚数が小数（例: 780 / 500 = 1.56枚）になってしまいます。整数除算には ÷ を使います。" },
      { id: "d2", text: "金額 = 金額 / 硬貨[i]", isDummy: true, reason: "これでは金額が減るのではなく、金額自体が割られた値になってしまいます。残りの金額を計算するには余り（%）を使います。" }
    ],
    hardBlocks: [
      { id: "b1", text: "金額 = 780", isLocked: true },
      { id: "b0", text: "硬貨 = [500, 100, 50, 10]", isLocked: true },
      { id: "b2", text: "i を 0 から 3 まで 1 ずつ増やしながら繰り返す:" },
      { id: "b3", text: "枚数 = [input_div]", inputs: { input_div: { placeholder: "金額を硬貨で割る整数除算の式 (例: 金額 ÷ 硬貨[i])", correct: "金額 ÷ 硬貨[i]" } } },
      { id: "b4", text: "金額 = [input_mod]", inputs: { input_mod: { placeholder: "余り金額の式 (例: 金額 % 硬貨[i])", correct: "金額 % 硬貨[i]" } } },
      { id: "b5", text: "表示する(枚数)" }
    ],
    narratives: {
      b1: (vars) => `変数 金額 に 780 を代入する`,
      b0: (vars) => `配列 硬貨 に [500, 100, 50, 10] を代入する`,
      b2: (vars) => {
        const coins = vars.硬貨 || [500, 100, 50, 10];
        const currentI = vars.i || 0;
        return `変数 i の値を 0 から 3 まで 1 ずつ増やしながら繰り返す（現在の額面: ${coins[currentI]}円）`;
      },
      b3: (vars) => {
        const coins = vars.硬貨 || [500, 100, 50, 10];
        const currentI = vars.i || 0;
        const currentCoin = coins[currentI];
        const currentAmount = vars.金額 !== undefined ? vars.金額 : 780;
        return `変数 枚数 に、金額 (${currentAmount}) を 硬貨[${currentI}] (${currentCoin}) で割った商の整数部分 (${Math.floor(currentAmount / currentCoin)}) を代入する`;
      },
      b4: (vars) => {
        const coins = vars.硬貨 || [500, 100, 50, 10];
        const currentI = vars.i || 0;
        const currentCoin = coins[currentI];
        return `変数 金額 に、金額を 硬貨[${currentI}] (${currentCoin}) で割った余りの値 (${vars.金額}) を代入する`;
      },
      b5: (vars) => `変数 枚数 の値 (${vars.枚数 || 0}) を表示する`
    },
    explanation: "大きい額面の硬貨（500円）から順番に、「金額を硬貨の額面で割った商（整数除算 ÷）」を枚数とし、「割った余り」を次の硬貨で支払う残額とします。ループ内で各硬貨の枚数を順次表示していきます。【入れ替え可能な箇所】ループの中の「金額 = 金額 % 硬貨[i]」と「表示する(枚数)」は、互いに影響しないので順序を入れ替えても同じ結果になります。それ以外は入れ替えられません。"
  },
  {
    id: "array_sum_avg",
    title: "配列の合計と平均",
    description: "配列 A に格納された5つの数値（[10, 20, 30, 40, 50]）の合計と平均を計算し、表示するプログラムを完成させてください。",
    difficulty: "初級",
    initialState: {
      A: [10, 20, 30, 40, 50],
      合計: 0,
      平均: 0,
      arrayData: { name: "A", values: [10, 20, 30, 40, 50] }
    },
    correctBlocks: [
      { id: "b0", text: "A = [10, 20, 30, 40, 50]", indent: 0, isLocked: true },
      { id: "b1", text: "合計 = 0", indent: 0 },
      { id: "b2", text: "i を 0 から 4 まで 1 ずつ増やしながら繰り返す:", indent: 0 },
      { id: "b3", text: "合計 = 合計 + A[i]", indent: 1 },
      { id: "b4", text: "平均 = 合計 / 5", indent: 0 },
      { id: "b5", text: "表示する(\"平均は\", 平均)", indent: 0 }
    ],
    // 「合計 = 0」は配列の中身に関係しないので、A の定義の上でも下でもよい
    swappable: [["b0", "b1"]],
    easyBlocks: [
      { id: "b3", text: "合計 = 合計 + A[i]" },
      { id: "b0", text: "A = [10, 20, 30, 40, 50]", isLocked: true },
      { id: "b4", text: "平均 = 合計 / 5" },
      { id: "b5", text: "表示する(\"平均は\", 平均)" },
      { id: "b2", text: "i を 0 から 4 まで 1 ずつ増やしながら繰り返す:" },
      { id: "b1", text: "合計 = 0" }
    ],
    normalBlocks: [
      { id: "b3", text: "合計 = 合計 + A[i]" },
      { id: "b0", text: "A = [10, 20, 30, 40, 50]", isLocked: true },
      { id: "b4", text: "平均 = 合計 / 5" },
      { id: "b5", text: "表示する(\"平均は\", 平均)" },
      { id: "b2", text: "i を 0 から 4 まで 1 ずつ増やしながら繰り返す:" },
      { id: "b1", text: "合計 = 0" },
      { id: "d1", text: "平均 = 合計 ÷ 5", isDummy: true, reason: "平均値は小数になる可能性があるため、整数除算 ÷ ではなく通常の除算 / を使います。" },
      { id: "d2", text: "合計 = 合計 + i", isDummy: true, reason: "これではインデックス番号 i を足してしまい、配列の数値の合計になりません。" }
    ],
    hardBlocks: [
      { id: "b0", text: "A = [10, 20, 30, 40, 50]", isLocked: true },
      { id: "b1", text: "合計 = 0" },
      { id: "b2", text: "i を 0 から 4 まで 1 ずつ増やしながら繰り返す:" },
      { id: "b3", text: "合計 = 合計 + [input_add]", inputs: { input_add: { placeholder: "加算する要素", correct: "A[i]" } } },
      { id: "b4", text: "平均 = [input_avg]", inputs: { input_avg: { placeholder: "平均の計算式", correct: "合計 / 5" } } },
      { id: "b5", text: "表示する(\"平均は\", 平均)" }
    ],
    narratives: {
      b0: (vars) => `配列 A に [10, 20, 30, 40, 50] を代入する`,
      b1: (vars) => `変数 合計 に 0 を代入する`,
      b2: (vars) => `変数 i の値を 0 から 4 まで 1 ずつ増やしながら繰り返す`,
      b3: (vars) => `変数 合計 に A[${vars.i || 0}] の値 (${vars.A ? vars.A[vars.i || 0] : 0}) を足した値 (${vars.合計}) を代入する`,
      b4: (vars) => `変数 平均 に 合計 (${vars.合計 || 150}) を 5 で割った値 (${vars.平均}) を代入する`,
      b5: (vars) => `文字列 '平均は' と変数 平均 の値 (${vars.平均 || 30}) を表示する`
    },
    explanation: "配列の要素をループで順に走査し、「合計 = 合計 + A[i]」で総和を求めます。ループ終了後に要素数（5）で割って平均を求め、表示する関数形式「表示する(\"平均は\", 平均)」で出力します。【入れ替え可能な箇所】初期化「合計 = 0」は配列の中身に関係しないので、固定されている「A = [10, 20, 30, 40, 50]」の上でも下でもかまいません（繰り返しより前であることは必要です）。"
  },
  {
    id: "even_odd_count",
    title: "偶数・奇数の判定と個数",
    description: "配列 A（[1, 2, 3, 4, 5, 6]）に含まれる偶数の個数を数えて表示するプログラムを完成させてください。",
    difficulty: "初級",
    initialState: {
      A: [1, 2, 3, 4, 5, 6],
      偶数個数: 0,
      arrayData: { name: "A", values: [1, 2, 3, 4, 5, 6] }
    },
    correctBlocks: [
      { id: "b0", text: "A = [1, 2, 3, 4, 5, 6]", indent: 0, isLocked: true },
      { id: "b1", text: "偶数個数 = 0", indent: 0 },
      { id: "b2", text: "i を 0 から 5 まで 1 ずつ増やしながら繰り返す:", indent: 0 },
      { id: "b3", text: "もし A[i] % 2 == 0 ならば:", indent: 1 },
      { id: "b4", text: "偶数個数 = 偶数個数 + 1", indent: 2 },
      { id: "b5", text: "表示する(偶数個数)", indent: 0 }
    ],
    // 「偶数個数 = 0」は配列の中身に関係しないので、A の定義の上でも下でもよい
    swappable: [["b0", "b1"]],
    easyBlocks: [
      { id: "b4", text: "偶数個数 = 偶数個数 + 1" },
      { id: "b0", text: "A = [1, 2, 3, 4, 5, 6]", isLocked: true },
      { id: "b5", text: "表示する(偶数個数)" },
      { id: "b3", text: "もし A[i] % 2 == 0 ならば:" },
      { id: "b1", text: "偶数個数 = 0" },
      { id: "b2", text: "i を 0 から 5 まで 1 ずつ増やしながら繰り返す:" }
    ],
    normalBlocks: [
      { id: "b4", text: "偶数個数 = 偶数個数 + 1" },
      { id: "b0", text: "A = [1, 2, 3, 4, 5, 6]", isLocked: true },
      { id: "b5", text: "表示する(偶数個数)" },
      { id: "b3", text: "もし A[i] % 2 == 0 ならば:" },
      { id: "b1", text: "偶数個数 = 0" },
      { id: "b2", text: "i を 0 から 5 まで 1 ずつ増やしながら繰り返す:" },
      { id: "d1", text: "もし A[i] % 2 == 1 ならば:", isDummy: true, reason: "2で割った余りが1の条件は奇数の判定になります。偶数を数えるには余りが0である「A[i] % 2 == 0」を使います。" }
    ],
    hardBlocks: [
      { id: "b0", text: "A = [1, 2, 3, 4, 5, 6]", isLocked: true },
      { id: "b1", text: "偶数個数 = 0" },
      { id: "b2", text: "i を 0 から 5 まで 1 ずつ増やしながら繰り返す:" },
      { id: "b3", text: "もし [input_cond] == 0 ならば:", inputs: { input_cond: { placeholder: "偶数判定の式", correct: "A[i] % 2" } } },
      { id: "b4", text: "偶数個数 = 偶数個数 + 1" },
      { id: "b5", text: "表示する(偶数個数)" }
    ],
    narratives: {
      b0: (vars) => `配列 A に [1, 2, 3, 4, 5, 6] を代入する`,
      b1: (vars) => `変数 偶数個数 に 0 を代入する`,
      b2: (vars) => `変数 i の値を 0 から 5 まで 1 ずつ増やしながら繰り返す`,
      b3: (vars) => `もし A[${vars.i || 0}] の値 (${vars.A ? vars.A[vars.i || 0] : 0}) を 2 で割った余りが 0 ならば: [判定: ${(vars.A ? vars.A[vars.i || 0] : 0) % 2 === 0 ? '真' : '偽'}]`,
      b4: (vars) => `変数 偶数個数 に 1 を足して ${vars.偶数個数} に更新する`,
      b5: (vars) => `変数 偶数個数 の値 (${vars.偶数個数 || 0}) を表示する`
    },
    explanation: "偶数であるかどうかの判定には「A[i] % 2 == 0」（2で割った余りが0）を使用します。条件が成立したときのみ「偶数個数 = 偶数個数 + 1」でカウントを増やします。【入れ替え可能な箇所】初期化「偶数個数 = 0」は配列の中身に関係しないので、固定されている「A = [1, 2, 3, 4, 5, 6]」の上でも下でもかまいません（繰り返しより前であることは必要です）。"
  },
  {
    id: "find_min",
    title: "最小値を見つける",
    description: "配列 A（[45, 12, 78, 34, 89, 56]）の中から、最も小さい値（最小値）を見つけて表示するプログラムを完成させてください。",
    difficulty: "中級",
    initialState: {
      A: [45, 12, 78, 34, 89, 56],
      arrayData: { name: "A", values: [45, 12, 78, 34, 89, 56] }
    },
    correctBlocks: [
      { id: "b0", text: "A = [45, 12, 78, 34, 89, 56]", indent: 0, isLocked: true },
      { id: "b1", text: "最小値 = A[0]", indent: 0 },
      { id: "b2", text: "i を 1 から 5 まで 1 ずつ増やしながら繰り返す:", indent: 0 },
      { id: "b3", text: "もし A[i] < 最小値 ならば:", indent: 1 },
      { id: "b4", text: "最小値 = A[i]", indent: 2 },
      { id: "b5", text: "表示する(最小値)", indent: 0 }
    ],
    easyBlocks: [
      { id: "b3", text: "もし A[i] < 最小値 ならば:" },
      { id: "b0", text: "A = [45, 12, 78, 34, 89, 56]", isLocked: true },
      { id: "b1", text: "最小値 = A[0]" },
      { id: "b5", text: "表示する(最小値)" },
      { id: "b4", text: "最小値 = A[i]" },
      { id: "b2", text: "i を 1 から 5 まで 1 ずつ増やしながら繰り返す:" }
    ],
    normalBlocks: [
      { id: "b3", text: "もし A[i] < 最小値 ならば:" },
      { id: "b0", text: "A = [45, 12, 78, 34, 89, 56]", isLocked: true },
      { id: "b1", text: "最小値 = A[0]" },
      { id: "b5", text: "表示する(最小値)" },
      { id: "b4", text: "最小値 = A[i]" },
      { id: "b2", text: "i を 1 から 5 まで 1 ずつ増やしながら繰り返す:" },
      { id: "d1", text: "最小値 = 0", isDummy: true, reason: "初期値を0にすると、正の数のみの配列では0より小さい要素が存在しないため、正しく最小値を見つけられません。配列の先頭要素 A[0] で初期化します。" }
    ],
    hardBlocks: [
      { id: "b0", text: "A = [45, 12, 78, 34, 89, 56]", isLocked: true },
      { id: "b1", text: "最小値 = [input_init]", inputs: { input_init: { placeholder: "初期値", correct: "A[0]" } } },
      { id: "b2", text: "i を 1 から 5 まで 1 ずつ増やしながら繰り返す:" },
      { id: "b3", text: "もし [input_cond] < 最小値 ならば:", inputs: { input_cond: { placeholder: "比較対象", correct: "A[i]" } } },
      { id: "b4", text: "最小値 = A[i]" },
      { id: "b5", text: "表示する(最小値)" }
    ],
    narratives: {
      b0: (vars) => `配列 A に [45, 12, 78, 34, 89, 56] を代入する`,
      b1: (vars) => `変数 最小値 に A[0] の値 (${vars.A ? vars.A[0] : 45}) を代入する`,
      b2: (vars) => `変数 i の値を 1 から 5 まで 1 ずつ増やしながら繰り返す`,
      b3: (vars) => `もし A[${vars.i || 1}] の値 (${vars.A ? vars.A[vars.i || 1] : 0}) が 最小値 (${vars.最小値}) より小さければ: [判定: ${(vars.A ? vars.A[vars.i || 1] : 0) < vars.最小値 ? '真' : '偽'}]`,
      b4: (vars) => `変数 最小値 に A[${vars.i || 1}] の値 (${vars.最小値}) を代入する`,
      b5: (vars) => `変数 最小値 の値 (${vars.最小値 || 0}) を表示する`
    },
    explanation: "仮の最小値として先頭の要素 A[0] を設定し、2番目の要素 A[1] から順に比較していきます。より小さな要素が見つかったら「最小値 = A[i]」で更新します。"
  },
  {
    id: "reverse_print",
    title: "逆順に表示する",
    description: "配列 A（[10, 20, 30, 40, 50]）の要素を末尾（インデックス 4）から先頭（インデックス 0）に向かって逆順に表示するプログラムを完成させてください。",
    difficulty: "中級",
    initialState: {
      A: [10, 20, 30, 40, 50],
      arrayData: { name: "A", values: [10, 20, 30, 40, 50] }
    },
    correctBlocks: [
      { id: "b0", text: "A = [10, 20, 30, 40, 50]", indent: 0, isLocked: true },
      { id: "b1", text: "i を 4 から 0 まで 1 ずつ減らしながら繰り返す:", indent: 0 },
      { id: "b2", text: "表示する(A[i])", indent: 1 }
    ],
    easyBlocks: [
      { id: "b2", text: "表示する(A[i])" },
      { id: "b0", text: "A = [10, 20, 30, 40, 50]", isLocked: true },
      { id: "b1", text: "i を 4 から 0 まで 1 ずつ減らしながら繰り返す:" }
    ],
    normalBlocks: [
      { id: "b2", text: "表示する(A[i])" },
      { id: "b0", text: "A = [10, 20, 30, 40, 50]", isLocked: true },
      { id: "b1", text: "i を 4 から 0 まで 1 ずつ減らしながら繰り返す:" },
      { id: "d1", text: "i を 4 から 0 まで 1 ずつ増やしながら繰り返す:", isDummy: true, reason: "4から0へカウントダウンする場合は「1ずつ減らしながら繰り返す」にする必要があります。" }
    ],
    hardBlocks: [
      { id: "b0", text: "A = [10, 20, 30, 40, 50]", isLocked: true },
      { id: "b1", text: "i を 4 から 0 まで 1 ずつ[input_step]ながら繰り返す:", inputs: { input_step: { placeholder: "増減指定 (増やし/減らし)", correct: "減らし" } } },
      { id: "b2", text: "表示する(A[i])" }
    ],
    narratives: {
      b0: (vars) => `配列 A に [10, 20, 30, 40, 50] を代入する`,
      b1: (vars) => `変数 i の値を 4 から 0 まで 1 ずつ減らしながら繰り返す (現在の i: ${vars.i !== undefined ? vars.i : 4})`,
      b2: (vars) => `A[${vars.i !== undefined ? vars.i : 4}] の値 (${vars.A ? vars.A[vars.i !== undefined ? vars.i : 4] : 50}) を表示する`
    },
    explanation: "「i を 4 から 0 まで 1 ずつ減らしながら繰り返す:」を使うことで、末尾のインデックス 4 から 3, 2, 1, 0 へと逆順にアクセスして表示できます。"
  },
  {
    id: "binary_search",
    title: "二分探索",
    description: "昇順に並んだ配列 A から、target（40）のインデックスを二分探索で探すプログラムを完成させてください。見つかればそのインデックス、見つからなければ -1 を表示します。",
    difficulty: "上級",
    initialState: {
      A: [10, 20, 30, 40, 50, 60, 70],
      target: 40,
      左: 0,
      右: 6,
      位置: -1,
      arrayData: { name: "A", values: [10, 20, 30, 40, 50, 60, 70] }
    },
    correctBlocks: [
      { id: "b0", text: "A = [10, 20, 30, 40, 50, 60, 70]", indent: 0, isLocked: true },
      { id: "b1", text: "target = 40", indent: 0, isLocked: true },
      { id: "b2", text: "左 = 0", indent: 0 },
      { id: "b3", text: "右 = 6", indent: 0 },
      { id: "b4", text: "位置 = -1", indent: 0 },
      { id: "b5", text: "左 <= 右 の間、繰り返す:", indent: 0 },
      { id: "b6", text: "中央 = (左 + 右) ÷ 2", indent: 1 },
      { id: "b7", text: "もし A[中央] == target ならば:", indent: 1 },
      { id: "b8", text: "位置 = 中央", indent: 2 },
      { id: "b9", text: "ループを抜ける", indent: 2 },
      { id: "b10", text: "そうでなくもし A[中央] < target ならば:", indent: 1 },
      { id: "b11", text: "左 = 中央 + 1", indent: 2 },
      { id: "b12", text: "そうでなければ:", indent: 1 },
      { id: "b13", text: "右 = 中央 - 1", indent: 2 },
      { id: "b14", text: "表示する(位置)", indent: 0 }
    ],
    // 繰り返しに入る前の5枚（配列・探す値・左・右・位置）は互いに独立なので順不同
    swappable: [["b0", "b1", "b2", "b3", "b4"]],
    easyBlocks: [
      { id: "b6", text: "中央 = (左 + 右) ÷ 2" },
      { id: "b0", text: "A = [10, 20, 30, 40, 50, 60, 70]", isLocked: true },
      { id: "b1", text: "target = 40", isLocked: true },
      { id: "b8", text: "位置 = 中央" },
      { id: "b14", text: "表示する(位置)" },
      { id: "b5", text: "左 <= 右 の間、繰り返す:" },
      { id: "b11", text: "左 = 中央 + 1" },
      { id: "b7", text: "もし A[中央] == target ならば:" },
      { id: "b10", text: "そうでなくもし A[中央] < target ならば:" },
      { id: "b12", text: "そうでなければ:" },
      { id: "b13", text: "右 = 中央 - 1" },
      { id: "b2", text: "左 = 0" },
      { id: "b3", text: "右 = 6" },
      { id: "b4", text: "位置 = -1" },
      { id: "b9", text: "ループを抜ける" }
    ],
    normalBlocks: [
      { id: "b6", text: "中央 = (左 + 右) ÷ 2" },
      { id: "b0", text: "A = [10, 20, 30, 40, 50, 60, 70]", isLocked: true },
      { id: "b1", text: "target = 40", isLocked: true },
      { id: "b8", text: "位置 = 中央" },
      { id: "b14", text: "表示する(位置)" },
      { id: "b5", text: "左 <= 右 の間、繰り返す:" },
      { id: "b11", text: "左 = 中央 + 1" },
      { id: "b7", text: "もし A[中央] == target ならば:" },
      { id: "b10", text: "そうでなくもし A[中央] < target ならば:" },
      { id: "b12", text: "そうでなければ:" },
      { id: "b13", text: "右 = 中央 - 1" },
      { id: "b2", text: "左 = 0" },
      { id: "b3", text: "右 = 6" },
      { id: "b4", text: "位置 = -1" },
      { id: "b9", text: "ループを抜ける" },
      { id: "d1", text: "中央 = (左 + 右) / 2", isDummy: true, reason: "インデックスは整数である必要があるため、端数を切り捨てる整数除算 ÷ を使います。" }
    ],
    hardBlocks: [
      { id: "b0", text: "A = [10, 20, 30, 40, 50, 60, 70]", isLocked: true },
      { id: "b1", text: "target = 40", isLocked: true },
      { id: "b2", text: "左 = 0" },
      { id: "b3", text: "右 = 6" },
      { id: "b4", text: "位置 = -1" },
      { id: "b5", text: "左 <= 右 の間、繰り返す:" },
      { id: "b6", text: "中央 = [input_mid]", inputs: { input_mid: { placeholder: "中央位置の計算式", correct: "(左 + 右) ÷ 2" } } },
      { id: "b7", text: "もし A[中央] == target ならば:" },
      { id: "b8", text: "位置 = 中央" },
      { id: "b9", text: "ループを抜ける" },
      { id: "b10", text: "そうでなくもし A[中央] < target ならば:" },
      { id: "b11", text: "左 = 中央 + 1" },
      { id: "b12", text: "そうでなければ:" },
      { id: "b13", text: "右 = 中央 - 1" },
      { id: "b14", text: "表示する(位置)" }
    ],
    narratives: {
      b0: (vars) => `配列 A にソート済みデータを代入する`,
      b1: (vars) => `探索ターゲット target に 40 を代入する`,
      b2: (vars) => `探索範囲の左端 左 に 0 を代入する`,
      b3: (vars) => `探索範囲の右端 右 に 6 を代入する`,
      b4: (vars) => `変数 位置 に初期値 -1 を代入する`,
      b5: (vars) => `左 (${vars.左}) <= 右 (${vars.右}) の間、繰り返す`,
      b6: (vars) => `中央位置 中央 に (${vars.左} + ${vars.右}) ÷ 2 = ${vars.中央} を計算して代入する`,
      b7: (vars) => `もし A[${vars.中央}] (${vars.A ? vars.A[vars.中央] : 0}) が target (${vars.target}) と等しければ`,
      b8: (vars) => `変数 位置 に ${vars.中央} を代入する`,
      b9: (vars) => `ループを抜ける`,
      b10: (vars) => `そうでなくもし A[${vars.中央}] (${vars.A ? vars.A[vars.中央] : 0}) < target (${vars.target}) ならば`,
      b11: (vars) => `探索範囲の左端 左 を ${vars.中央 + 1} に更新する`,
      b12: (vars) => `そうでなければ（targetの方が小さい場合）:`,
      b13: (vars) => `探索範囲の右端 右 を ${vars.中央 - 1} に更新する`,
      b14: (vars) => `変数 位置 の値 (${vars.位置}) を表示する`
    },
    explanation: "二分探索では、中央の要素 A[中央] と探したい値 target を比較し、target の方が大きければ左端を「中央 + 1」に、小さければ右端を「中央 - 1」に狭めていくことで高速に検索します。【入れ替え可能な箇所】繰り返しに入る前の「左 = 0」「右 = 6」「位置 = -1」は互いに関係しないので、固定されている2枚も含めて順序は自由です。"
  },
  {
    id: "bubble_sort",
    title: "交換法による並べ替え（バブルソート）",
    description: "配列 A（[5, 3, 8, 4, 1]）の要素を隣り合う要素と比較・交換しながら昇順に並べ替え、結果を表示するプログラムを完成させてください。",
    difficulty: "上級",
    initialState: {
      A: [5, 3, 8, 4, 1],
      作業用: undefined,
      arrayData: { name: "A", values: [5, 3, 8, 4, 1] }
    },
    correctBlocks: [
      { id: "b0", text: "A = [5, 3, 8, 4, 1]", indent: 0, isLocked: true },
      { id: "b1", text: "i を 0 から 3 まで 1 ずつ増やしながら繰り返す:", indent: 0 },
      { id: "b2", text: "j を 0 から 3 - i まで 1 ずつ増やしながら繰り返す:", indent: 1 },
      { id: "b3", text: "もし A[j] > A[j + 1] ならば:", indent: 2 },
      { id: "b4", text: "作業用 = A[j]", indent: 3 },
      { id: "b5", text: "A[j] = A[j + 1]", indent: 3 },
      { id: "b6", text: "A[j + 1] = 作業用", indent: 3 },
      { id: "b7", text: "表示する(A)", indent: 0 }
    ],
    easyBlocks: [
      { id: "b4", text: "作業用 = A[j]" },
      { id: "b0", text: "A = [5, 3, 8, 4, 1]", isLocked: true },
      { id: "b7", text: "表示する(A)" },
      { id: "b1", text: "i を 0 から 3 まで 1 ずつ増やしながら繰り返す:" },
      { id: "b5", text: "A[j] = A[j + 1]" },
      { id: "b3", text: "もし A[j] > A[j + 1] ならば:" },
      { id: "b6", text: "A[j + 1] = 作業用" },
      { id: "b2", text: "j を 0 から 3 - i まで 1 ずつ増やしながら繰り返す:" }
    ],
    normalBlocks: [
      { id: "b4", text: "作業用 = A[j]" },
      { id: "b0", text: "A = [5, 3, 8, 4, 1]", isLocked: true },
      { id: "b7", text: "表示する(A)" },
      { id: "b1", text: "i を 0 から 3 まで 1 ずつ増やしながら繰り返す:" },
      { id: "b5", text: "A[j] = A[j + 1]" },
      { id: "b3", text: "もし A[j] > A[j + 1] ならば:" },
      { id: "b6", text: "A[j + 1] = 作業用" },
      { id: "b2", text: "j を 0 から 3 - i まで 1 ずつ増やしながら繰り返す:" },
      { id: "d1", text: "A[j] = A[j + 1]", isDummy: true, reason: "一時変数「作業用」に退避させずに直接代入すると、A[j] の元の値が消えてしまい、正しい交換ができません。" }
    ],
    hardBlocks: [
      { id: "b0", text: "A = [5, 3, 8, 4, 1]", isLocked: true },
      { id: "b1", text: "i を 0 から 3 まで 1 ずつ増やしながら繰り返す:" },
      { id: "b2", text: "j を 0 から 3 - i まで 1 ずつ増やしながら繰り返す:" },
      { id: "b3", text: "もし [input_cond] ならば:", inputs: { input_cond: { placeholder: "隣接要素の比較式", correct: "A[j] > A[j + 1]" } } },
      { id: "b4", text: "作業用 = A[j]" },
      { id: "b5", text: "A[j] = A[j + 1]" },
      { id: "b6", text: "A[j + 1] = 作業用" },
      { id: "b7", text: "表示する(A)" }
    ],
    narratives: {
      b0: (vars) => `配列 A に未ソートデータ [5, 3, 8, 4, 1] を代入する`,
      b1: (vars) => `外側ループ i (${vars.i || 0}) 回目のパスを開始`,
      b2: (vars) => `内側ループ j の値を 0 から ${3 - (vars.i || 0)} まで進める (現在 j: ${vars.j || 0})`,
      b3: (vars) => `もし A[${vars.j || 0}] (${vars.A ? vars.A[vars.j || 0] : 0}) > A[${(vars.j || 0) + 1}] (${vars.A ? vars.A[(vars.j || 0) + 1] : 0}) ならば`,
      b4: (vars) => `変数 作業用 に A[${vars.j || 0}] の値を退避する`,
      b5: (vars) => `A[${vars.j || 0}] に A[${(vars.j || 0) + 1}] の値をコピーする`,
      b6: (vars) => `A[${(vars.j || 0) + 1}] に退避しておいた作業用の値を書き込み、交換を完了する`,
      b7: (vars) => `ソート完了した配列 A (${JSON.stringify(vars.A)}) を表示する`
    },
    explanation: "バブルソート（交換法）は、隣り合う要素 A[j] と A[j+1] を比較し、左側の方が大きければ「作業用」変数を用いて要素の交換を繰り返します。外側ループが1回終わるごとに最大値が右端に確定していきます。"
  },
  {
    id: "matrix_row_sum",
    title: "2次元配列の行ごとの合計",
    description: "2行3列の2次元配列 A（[[1, 2, 3], [4, 5, 6]]）の各行の要素の合計を計算し、行ごとに順に表示するプログラムを完成させてください。",
    difficulty: "上級",
    initialState: {
      A: [[1, 2, 3], [4, 5, 6]],
      arrayData: { name: "A", values: [[1, 2, 3], [4, 5, 6]] }
    },
    correctBlocks: [
      { id: "b0", text: "A = [[1, 2, 3], [4, 5, 6]]", indent: 0, isLocked: true },
      { id: "b1", text: "i を 0 から 1 まで 1 ずつ増やしながら繰り返す:", indent: 0 },
      { id: "b2", text: "行合計 = 0", indent: 1 },
      { id: "b3", text: "j を 0 から 2 まで 1 ずつ増やしながら繰り返す:", indent: 1 },
      { id: "b4", text: "行合計 = 行合計 + A[i,j]", indent: 2 },
      { id: "b5", text: "表示する(行合計)", indent: 1 }
    ],
    easyBlocks: [
      { id: "b4", text: "行合計 = 行合計 + A[i,j]" },
      { id: "b0", text: "A = [[1, 2, 3], [4, 5, 6]]", isLocked: true },
      { id: "b2", text: "行合計 = 0" },
      { id: "b5", text: "表示する(行合計)" },
      { id: "b1", text: "i を 0 から 1 まで 1 ずつ増やしながら繰り返す:" },
      { id: "b3", text: "j を 0 から 2 まで 1 ずつ増やしながら繰り返す:" }
    ],
    normalBlocks: [
      { id: "b4", text: "行合計 = 行合計 + A[i,j]" },
      { id: "b0", text: "A = [[1, 2, 3], [4, 5, 6]]", isLocked: true },
      { id: "b2", text: "行合計 = 0" },
      { id: "b5", text: "表示する(行合計)" },
      { id: "b1", text: "i を 0 から 1 まで 1 ずつ増やしながら繰り返す:" },
      { id: "b3", text: "j を 0 から 2 まで 1 ずつ増やしながら繰り返す:" },
      { id: "d1", text: "行合計 = 行合計 + A[j,i]", isDummy: true, reason: "A[j,i] にすると行と列の指定が逆になります。新DNCLの2次元配列添字は A[行,列] すなわち A[i,j] と書きます。" }
    ],
    hardBlocks: [
      { id: "b0", text: "A = [[1, 2, 3], [4, 5, 6]]", isLocked: true },
      { id: "b1", text: "i を 0 から 1 まで 1 ずつ増やしながら繰り返す:" },
      { id: "b2", text: "行合計 = 0" },
      { id: "b3", text: "j を 0 から 2 まで 1 ずつ増やしながら繰り返す:" },
      { id: "b4", text: "行合計 = 行合計 + [input_elem]", inputs: { input_elem: { placeholder: "2次元配列のアクセス", correct: "A[i,j]" } } },
      { id: "b5", text: "表示する(行合計)" }
    ],
    narratives: {
      b0: (vars) => `2次元配列 A に [[1, 2, 3], [4, 5, 6]] を代入する`,
      b1: (vars) => `行ループ i (${vars.i || 0}) 行目の処理を開始する`,
      b2: (vars) => `変数 行合計 に 0 をセットする`,
      b3: (vars) => `列ループ j の値を 0 から 2 まで進める (現在 j: ${vars.j || 0})`,
      b4: (vars) => `行合計 に A[${vars.i || 0},${vars.j || 0}] の値 (${vars.A ? vars.A[vars.i || 0][vars.j || 0] : 0}) を足して ${vars.行合計} に更新する`,
      b5: (vars) => `第 ${vars.i || 0} 行の合計値 (${vars.行合計}) を表示する`
    },
    explanation: "2次元配列のアクセスには A[行,列] 表記（公式新DNCL）を使用します。行ループ i の中で「行合計 = 0」とリセットしてから列ループ j で加算することで、行ごとの集計を行います。"
  },
  {
    id: "prime_check",
    title: "素数判定",
    description: "あらかじめ設定された数値 N（ここでは 13）が素数であるかを判定するプログラムを完成させてください。素数なら 1、素数でなければ 0 を表示します。",
    difficulty: "上級",
    initialState: {
      N: 13,
      フラグ: 1
    },
    correctBlocks: [
      { id: "b1", text: "N = 13", indent: 0, isLocked: true },
      { id: "b2", text: "フラグ = 1", indent: 0 },
      { id: "b3", text: "i を 2 から N - 1 まで 1 ずつ増やしながら繰り返す:", indent: 0 },
      { id: "b4", text: "もし N % i == 0 ならば:", indent: 1 },
      { id: "b5", text: "フラグ = 0", indent: 2 },
      { id: "b6", text: "ループを抜ける", indent: 2 },
      { id: "b7", text: "表示する(フラグ)", indent: 0 }
    ],
    // 「フラグ = 1」は N の値に関係しないので、N = 13 の上でも下でもよい
    swappable: [["b1", "b2"]],
    easyBlocks: [
      { id: "b5", text: "フラグ = 0" },
      { id: "b1", text: "N = 13", isLocked: true },
      { id: "b7", text: "表示する(フラグ)" },
      { id: "b3", text: "i を 2 から N - 1 まで 1 ずつ増やしながら繰り返す:" },
      { id: "b6", text: "ループを抜ける" },
      { id: "b2", text: "フラグ = 1" },
      { id: "b4", text: "もし N % i == 0 ならば:" }
    ],
    normalBlocks: [
      { id: "b5", text: "フラグ = 0" },
      { id: "b1", text: "N = 13", isLocked: true },
      { id: "b7", text: "表示する(フラグ)" },
      { id: "b3", text: "i を 2 から N - 1 まで 1 ずつ増やしながら繰り返す:" },
      { id: "b6", text: "ループを抜ける" },
      { id: "b2", text: "フラグ = 1" },
      { id: "b4", text: "もし N % i == 0 ならば:" },
      { id: "d1", text: "もし N % i != 0 ならば:", isDummy: true, reason: "割り切れない場合にフラグを0にしてしまうと、正しく割り切れる（約数がある）ことの判定になりません。" }
    ],
    hardBlocks: [
      { id: "b1", text: "N = 13", isLocked: true },
      { id: "b2", text: "フラグ = 1" },
      { id: "b3", text: "i を 2 から N - 1 まで 1 ずつ増やしながら繰り返す:" },
      { id: "b4", text: "もし [input_mod] == 0 ならば:", inputs: { input_mod: { placeholder: "割り切れ判定の式", correct: "N % i" } } },
      { id: "b5", text: "フラグ = 0" },
      { id: "b6", text: "ループを抜ける" },
      { id: "b7", text: "表示する(フラグ)" }
    ],
    narratives: {
      b1: (vars) => `変数 N に 13 を代入する`,
      b2: (vars) => `素数フラグ「フラグ」に初期値 1 (素数と仮定) を代入する`,
      b3: (vars) => `i の値を 2 から ${vars.N - 1} まで進めて約数があるか確認する (現在 i: ${vars.i || 2})`,
      b4: (vars) => `もし N (${vars.N}) を i (${vars.i || 2}) で割った余りが 0 ならば: [判定: ${vars.N % (vars.i || 2) === 0 ? '真（割り切れた）' : '偽'}]`,
      b5: (vars) => `約数が見つかったため、フラグ を 0 (素数ではない) に変更する`,
      b6: (vars) => `ループを抜ける`,
      b7: (vars) => `判定結果の フラグ (${vars.フラグ}) を表示する`
    },
    explanation: "2 から N - 1 までの範囲で割った余り「N % i」を判定し、一度でも余りが 0（割り切れる）になれば素数ではないため「フラグ = 0」にして早期にループを抜けます。【入れ替え可能な箇所】初期化「フラグ = 1」は N の値に関係しないので、固定されている「N = 13」の上でも下でもかまいません（繰り返しより前であることは必要です）。"
  }
];

const syntaxLessons = [
  {
    id: "lesson_swap",
    title: "1. 順次処理と変数（スワップ）",
    description: "変数 A (値 5) と 変数 B (値 3) の値を入れ替える（スワップ）プログラムを完成させてください。第3の変数「作業用」を使用します。",
    initialState: {
      A: 5,
      B: 3,
      作業用: undefined
    },
    correctBlocks: [
      { id: "l1", text: "作業用 = A", indent: 0 },
      { id: "l2", text: "A = B", indent: 0 },
      { id: "l3", text: "B = 作業用", indent: 0 },
      { id: "l4", text: "表示する(A)", indent: 0 },
      { id: "l5", text: "表示する(B)", indent: 0 }
    ],
    blocks: [
      { id: "l3", text: "B = 作業用" },
      { id: "l5", text: "表示する(B)" },
      { id: "l1", text: "作業用 = A" },
      { id: "l4", text: "表示する(A)" },
      { id: "l2", text: "A = B" }
    ],
    narratives: {
      l1: (vars) => `変数 作業用 に変数 A の値 (${vars.A || 5}) を代入する`,
      l2: (vars) => `変数 A に変数 B の値 (${vars.B || 3}) を代入する`,
      l3: (vars) => `変数 B に変数 作業用 の値 (${vars.作業用 || 5}) を代入する`,
      l4: (vars) => `変数 A の値 (${vars.A || 3}) を表示する`,
      l5: (vars) => `変数 B の値 (${vars.B || 5}) を表示する`
    },
    explanation: "値の入れ替えには、元の値が消えてしまわないよう一時的な退避場所「作業用」が必要です。まず作業用に A を退避し、空いた A に B をコピー、最後に B に退避しておいた作業用の値（元のA）を書き込みます。【入れ替え可能な箇所】3つの代入はこの順番でなければ値が壊れます。表示の2枚も、入れ替えると出力の順序が変わってしまうため、入れ替えられません。"
  },
  {
    id: "lesson_branch",
    title: "2. 条件分岐（もし〜ならば）",
    description: "あらかじめ設定された変数『得点』（ここでは85点）が80点以上なら「合格」、そうでなければ「不合格」と表示するプログラムを完成させてください。",
    initialState: {
      得点: 85
    },
    correctBlocks: [
      { id: "l1", text: "得点 = 85", indent: 0, isLocked: true },
      { id: "l2", text: "もし 得点 >= 80 ならば:", indent: 0 },
      { id: "l3", text: "表示する(\"合格\")", indent: 1 },
      { id: "l4", text: "そうでなければ:", indent: 0 },
      { id: "l5", text: "表示する(\"不合格\")", indent: 1 }
    ],
    blocks: [
      { id: "l3", text: "表示する(\"合格\")" },
      { id: "l1", text: "得点 = 85", isLocked: true },
      { id: "l4", text: "そうでなければ:" },
      { id: "l5", text: "表示する(\"不合格\")" },
      { id: "l2", text: "もし 得点 >= 80 ならば:" }
    ],
    narratives: {
      l1: (vars) => `変数 得点 に 85 を代入する`,
      l2: (vars) => `もし 得点 (${vars.得点 || 85}) が 80 以上ならば: [判定: ${(vars.得点 || 85) >= 80 ? '真' : '偽'}]`,
      l3: (vars) => `文字列 "合格" を表示する`,
      l4: (vars) => `そうでなければ（条件を満たさない場合）:`,
      l5: (vars) => `文字列 "不合格" を表示する`
    },
    explanation: "「もし 得点 >= 80 ならば:」という判定文の下に、条件成立時の処理をインデント（1字下げ）して配置します。条件を満たさなかった場合の処理は「そうでなければ:」の下に同様にインデントして配置します。"
  },
  {
    id: "lesson_loop",
    title: "3. 繰り返し（カウンタ変数）",
    description: "変数 i を 1 から 5 まで 1 ずつ増やしながら、その値を順に表示するプログラムを完成させてください。",
    initialState: {
      i: undefined
    },
    correctBlocks: [
      { id: "l1", text: "i を 1 から 5 まで 1 ずつ増やしながら繰り返す:", indent: 0 },
      { id: "l2", text: "表示する(i)", indent: 1 }
    ],
    blocks: [
      { id: "l2", text: "表示する(i)" },
      { id: "l1", text: "i を 1 から 5 まで 1 ずつ増やしながら繰り返す:" }
    ],
    narratives: {
      l1: (vars) => `変数 i の値を 1 から 5 まで 1 ずつ増やしながら繰り返す (現在の i: ${vars.i || 1})`,
      l2: (vars) => `変数 i の値 (${vars.i || 1}) を表示する`
    },
    explanation: "「i を 1 から 5 まで 1 ずつ増やしながら繰り返す:」の配下にある処理が自動的に5回実行されます。表示処理は繰り返しの「中身」なので、インデント1に設定する必要があります。"
  },
  {
    id: "lesson_array",
    title: "4. 配列（データの取り出し）",
    description: "配列 A の最後の要素（3番目の値、インデックスは 2）を変数「値」に代入して表示するプログラムを完成させてください。",
    initialState: {
      A: [5, 8, 3],
      値: undefined,
      arrayData: { name: "A", values: [5, 8, 3] }
    },
    correctBlocks: [
      { id: "l0", text: "A = [5, 8, 3]", indent: 0, isLocked: true },
      { id: "l1", text: "値 = A[2]", indent: 0 },
      { id: "l2", text: "表示する(値)", indent: 0 }
    ],
    blocks: [
      { id: "l2", text: "表示する(値)" },
      { id: "l0", text: "A = [5, 8, 3]", isLocked: true },
      { id: "l1", text: "値 = A[2]" }
    ],
    narratives: {
      l0: (vars) => `配列 A に [5, 8, 3] を代入する`,
      l1: (vars) => `変数 値 に A[2] の値 (${vars.A ? vars.A[2] : 3}) を代入する`,
      l2: (vars) => `変数 値 の値 (${vars.値 || 0}) を表示する`
    },
    explanation: "配列 A の要素 is 0始まりのインデックスで指定します。1番目は A[0]、2番目は A[1]、3番目（最後）は A[2] となります。取り出した値を変数「値」に代入し、それを表示します。【入れ替え可能な箇所】この手順は順番を変えることができません。"
  },
  {
    id: "lesson_while",
    title: "5. 繰り返し（条件指定）",
    description: "変数 A の値（初期値 10）が 0 より大きい間、その値を表示し、A の値を 3 ずつ減らすプログラムを完成させてください。",
    initialState: {
      A: 10
    },
    correctBlocks: [
      { id: "l1", text: "A = 10", indent: 0, isLocked: true },
      { id: "l2", text: "A > 0 の間、繰り返す:", indent: 0 },
      { id: "l3", text: "表示する(A)", indent: 1 },
      { id: "l4", text: "A = A - 3", indent: 1 }
    ],
    blocks: [
      { id: "l3", text: "表示する(A)" },
      { id: "l1", text: "A = 10", isLocked: true },
      { id: "l4", text: "A = A - 3" },
      { id: "l2", text: "A > 0 の間、繰り返す:" }
    ],
    narratives: {
      l1: (vars) => `変数 A に 10 を代入する`,
      l2: (vars) => `変数 A の値 (${vars.A !== undefined ? vars.A : 10}) が 0 より大きい間、繰り返す: [判定: ${(vars.A !== undefined ? vars.A : 10) > 0 ? '真' : '偽'}]`,
      l3: (vars) => `変数 A の値 (${vars.A !== undefined ? vars.A : 10}) を表示する`,
      l4: (vars) => `変数 A に、現在の A (${vars.A !== undefined ? vars.A : 10}) から 3 を引いた値 (${(vars.A !== undefined ? vars.A : 10) - 3}) を代入する`
    },
    explanation: "「A > 0 の間、繰り返す:」は、条件式が成り立つ限りブロック内の処理をループします。ブロック内（インデント1）で「表示する(A)」と「A = A - 3」を繰り返すことで、Aが10, 7, 4, 1と減少していき、次に -2 になった時点で条件が不成立（偽）になりループを抜けます。"
  },
  {
    id: "lesson_function",
    title: "6. 関数（定義と呼び出し）",
    description: "引数 x を受け取り、それを2倍にした値を返す関数「2倍にする」を定義し、5 を渡して呼び出した結果を変数「結果」に代入して表示するプログラムを完成させてください。",
    initialState: {
      結果: undefined
    },
    correctBlocks: [
      { id: "l1", text: "関数 2倍にする(x) を定義する:", indent: 0 },
      { id: "l2", text: "返す x * 2", indent: 1 },
      { id: "l3", text: "結果 = 2倍にする(5)", indent: 0 },
      { id: "l4", text: "表示する(結果)", indent: 0 }
    ],
    blocks: [
      { id: "l3", text: "結果 = 2倍にする(5)" },
      { id: "l2", text: "返す x * 2" },
      { id: "l4", text: "表示する(結果)" },
      { id: "l1", text: "関数 2倍にする(x) を定義する:" }
    ],
    narratives: {
      l1: (vars) => `引数 x を受け取る関数『2倍にする』を定義する`,
      l2: (vars) => `x の値 (${vars.x !== undefined ? vars.x : '引数'}) を2倍にした値 (${vars.x !== undefined ? vars.x * 2 : '結果'}) を返す`,
      l3: (vars) => `関数『2倍にする』に引数 5 を渡して実行し、戻ってきた値 (10) を変数『結果』に代入する`,
      l4: (vars) => `変数 結果 の値 (${vars.結果 !== undefined ? vars.結果 : 10}) を表示する`
    },
    explanation: "「関数 関数名(引数) を定義する:」で処理のグループを作り、「返す 式」で計算した結果を呼び出し元に返却します。定義した関数は「結果 = 2倍にする(5)」のように記述することで、好きな場所で何度でも呼び出すことができます。"
  },
  {
    id: "lesson_2d_array",
    title: "7. 2次元配列（データの取り出し）",
    description: "2行3列の2次元配列 A が用意されています（1行目は [10, 20, 30]、2行目は [40, 50, 60]）。この配列の2行目の2番目の要素（値は 50、インデックスは行1、列1）を変数「値」に代入して表示するプログラムを完成させてください。",
    initialState: {
      A: [[10, 20, 30], [40, 50, 60]],
      値: undefined,
      arrayData: { name: "A", values: [[10, 20, 30], [40, 50, 60]] }
    },
    correctBlocks: [
      { id: "l0", text: "A = [[10, 20, 30], [40, 50, 60]]", indent: 0, isLocked: true },
      { id: "l1", text: "値 = A[1,1]", indent: 0 },
      { id: "l2", text: "表示する(値)", indent: 0 }
    ],
    blocks: [
      { id: "l2", text: "表示する(値)" },
      { id: "l0", text: "A = [[10, 20, 30], [40, 50, 60]]", isLocked: true },
      { id: "l1", text: "値 = A[1,1]" }
    ],
    narratives: {
      l0: (vars) => `2次元配列 A に [[10, 20, 30], [40, 50, 60]] を代入する`,
      l1: (vars) => `変数 値 に A[1,1] の要素の値 (${vars.A ? vars.A[1][1] : 50}) を代入する`,
      l2: (vars) => `変数 値 の値 (${vars.値 || 50}) を表示する`
    },
    explanation: "2次元配列（グリッドデータ）は、行と列の2つのインデックス（添字）を指定します。DNCLでは通常0から始まるため、2行目のインデックスは「1」、2番目の列のインデックスは「1」となり、「A[1,1]」でアクセスします。【入れ替え可能な箇所】この手順は順番を変えることができません。"
  },
  {
    id: "lesson_multi_print",
    title: "8. 表示する(複数の値)",
    description: "新DNCLでは「表示する(\"合計は\", 合計)」のように、複数の値や文字列をカンマで区切って一度に表示できます。合計 15 の結果を表示するプログラムを完成させてください。",
    initialState: {
      合計: 15
    },
    correctBlocks: [
      { id: "l1", text: "合計 = 15", indent: 0, isLocked: true },
      { id: "l2", text: "表示する(\"合計は\", 合計)", indent: 0 }
    ],
    blocks: [
      { id: "l2", text: "表示する(\"合計は\", 合計)" },
      { id: "l1", text: "合計 = 15", isLocked: true }
    ],
    narratives: {
      l1: (vars) => `変数 合計 に 15 を代入する`,
      l2: (vars) => `文字列 '合計は' と変数 合計 の値 (${vars.合計 || 15}) を連結して表示する`
    },
    explanation: "「表示する(値1, 値2, ...)」とカンマで区切ることで、メッセージと変数の値を1行にまとめて出力できます。"
  },
  {
    id: "lesson_logic_ops",
    title: "9. 論理演算子 and / or / not",
    description: "新DNCLでは「かつ」「または」「でない」を and, or, not で表します。変数 x の値が 0 より大きくかつ 10 より小さいかを判定するプログラムを完成させてください。",
    initialState: {
      x: 5
    },
    correctBlocks: [
      { id: "l1", text: "x = 5", indent: 0, isLocked: true },
      { id: "l2", text: "もし x > 0 and x < 10 ならば:", indent: 0 },
      { id: "l3", text: "表示する(\"範囲内\")", indent: 1 }
    ],
    blocks: [
      { id: "l3", text: "表示する(\"範囲内\")" },
      { id: "l1", text: "x = 5", isLocked: true },
      { id: "l2", text: "もし x > 0 and x < 10 ならば:" }
    ],
    narratives: {
      l1: (vars) => `変数 x に 5 を代入する`,
      l2: (vars) => `もし x > 0 かつ x < 10 ならば: [判定: ${(vars.x || 5) > 0 && (vars.x || 5) < 10 ? '真' : '偽'}]`,
      l3: (vars) => `文字列 '範囲内' を表示する`
    },
    explanation: "and は両方の条件が成り立つとき真、or はどちらかが成り立つとき真、not は条件の真偽を反転させます。"
  },
  {
    id: "lesson_div_mod",
    title: "10. 整数除算 ÷ と剰余 %",
    description: "17 を 5 で割ったときの商（整数除算 ÷）と余り（%）を、それぞれ計算して表示するプログラムを完成させてください。",
    initialState: {
      商: undefined,
      余り: undefined
    },
    correctBlocks: [
      { id: "l1", text: "商 = 17 ÷ 5", indent: 0 },
      { id: "l2", text: "余り = 17 % 5", indent: 0 },
      { id: "l3", text: "表示する(商)", indent: 0 },
      { id: "l4", text: "表示する(余り)", indent: 0 }
    ],
    // 商と余りの計算は互いに独立。「余り = 17 % 5」は「表示する(商)」の後でもよい
    swappable: [["l1", "l2"], ["l2", "l3"]],
    blocks: [
      { id: "l3", text: "表示する(商)" },
      { id: "l1", text: "商 = 17 ÷ 5" },
      { id: "l4", text: "表示する(余り)" },
      { id: "l2", text: "余り = 17 % 5" }
    ],
    narratives: {
      l1: (vars) => `17 ÷ 5 の商の整数部分 (3) を変数 商 に代入する`,
      l2: (vars) => `17 % 5 の余り (2) を変数 余り に代入する`,
      l3: (vars) => `変数 商 の値 (${vars.商 !== undefined ? vars.商 : 3}) を表示する`,
      l4: (vars) => `変数 余り の値 (${vars.余り !== undefined ? vars.余り : 2}) を表示する`
    },
    explanation: "通常の割算 / は結果が小数になりますが、整数除算 ÷ を使うと端数が切り捨てられた整数の商が得られます。余りは % で求めます。【入れ替え可能な箇所】商と余りの計算は互いに関係しないので、「余り = 17 % 5」は「商 = 17 ÷ 5」の前でも、「表示する(商)」の後でもかまいません。"
  },
  {
    id: "lesson_step_decrease",
    title: "11. 減らしながら繰り返す",
    description: "変数 i の値を 5 から 1 まで 1 ずつ減らしながら（カウントダウン）、その値を順に表示するプログラムを完成させてください。",
    initialState: {
      i: undefined
    },
    correctBlocks: [
      { id: "l1", text: "i を 5 から 1 まで 1 ずつ減らしながら繰り返す:", indent: 0 },
      { id: "l2", text: "表示する(i)", indent: 1 }
    ],
    blocks: [
      { id: "l2", text: "表示する(i)" },
      { id: "l1", text: "i を 5 から 1 まで 1 ずつ減らしながら繰り返す:" }
    ],
    narratives: {
      l1: (vars) => `変数 i の値を 5 から 1 まで 1 ずつ減らしながら繰り返す (現在の i: ${vars.i !== undefined ? vars.i : 5})`,
      l2: (vars) => `変数 i の値 (${vars.i !== undefined ? vars.i : 5}) を表示する`
    },
    explanation: "「1 ずつ減らしながら繰り返す」を使うことで、カウントダウン型のループ処理を簡単に記述できます。"
  },
  {
    id: "lesson_nested_loop",
    title: "12. 二重ループ",
    description: "外側のループ（i = 1〜2）と内側のループ（j = 1〜3）を組み合わせた二重ループで、i * j の結果を表示するプログラムを完成させてください。",
    initialState: {
      i: undefined,
      j: undefined
    },
    correctBlocks: [
      { id: "l1", text: "i を 1 から 2 まで 1 ずつ増やしながら繰り返す:", indent: 0 },
      { id: "l2", text: "j を 1 から 3 まで 1 ずつ増やしながら繰り返す:", indent: 1 },
      { id: "l3", text: "表示する(i * j)", indent: 2 }
    ],
    blocks: [
      { id: "l3", text: "表示する(i * j)" },
      { id: "l1", text: "i を 1 から 2 まで 1 ずつ増やしながら繰り返す:" },
      { id: "l2", text: "j を 1 から 3 まで 1 ずつ増やしながら繰り返す:" }
    ],
    narratives: {
      l1: (vars) => `外側ループ: i の値を 1 から 2 まで増やしながら繰り返す (現在 i: ${vars.i || 1})`,
      l2: (vars) => `内側ループ: j の値を 1 から 3 まで増やしながら繰り返す (現在 j: ${vars.j || 1})`,
      l3: (vars) => `i * j の計算結果 (${(vars.i || 1) * (vars.j || 1)}) を表示する`
    },
    explanation: "ループの中に別のループを配置する「二重ループ」では、外側のループが1回進むごとに、内側のループが最初から最後まで全回数実行されます。"
  }
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { problems, syntaxLessons };
}
