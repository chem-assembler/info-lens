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
      { id: "b5", text: "合計 を表示する", indent: 0 }
    ],
    easyBlocks: [
      { id: "b4", text: "合計 = 合計 + i" },
      { id: "b1", text: "N = 10", isLocked: true },
      { id: "b5", text: "合計 を表示する" },
      { id: "b3", text: "i を 1 から N まで 1 ずつ増やしながら繰り返す:" },
      { id: "b2", text: "合計 = 0" }
    ],
    normalBlocks: [
      { id: "b4", text: "合計 = 合計 + i" },
      { id: "b1", text: "N = 10", isLocked: true },
      { id: "b5", text: "合計 を表示する" },
      { id: "b3", text: "i を 1 から N まで 1 ずつ増やしながら繰り返す:" },
      { id: "b2", text: "合計 = 0" },
      { id: "d1", text: "合計 = 合計 + 1", isDummy: true, reason: "これでは毎回1しか足されず、1からNまでの合計になりません。" },
      { id: "d2", text: "i を 1 から N 未満まで 1 ずつ増やしながら繰り返す:", isDummy: true, reason: "「N未満」にすると、N自身（ここでは10）が合計に足されなくなります。" }
    ],
    hardBlocks: [
      { id: "b4", text: "合計 = 合計 + [input_add]", inputs: { input_add: { placeholder: "足す値", correct: "i" } } },
      { id: "b1", text: "N = 10", isLocked: true },
      { id: "b5", text: "[input_print] を表示する", inputs: { input_print: { placeholder: "表示する変数", correct: "合計" } } },
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
      { id: "b6", text: "個数 を表示する", indent: 0 }
    ],
    easyBlocks: [
      { id: "b5", text: "個数 = 個数 + 1" },
      { id: "b1", text: "N = 20", isLocked: true },
      { id: "b6", text: "個数 を表示する" },
      { id: "b3", text: "i を 1 から N まで 1 ずつ増やしながら繰り返す:" },
      { id: "b2", text: "個数 = 0" },
      { id: "b4", text: "もし i % 3 == 0 ならば:" }
    ],
    normalBlocks: [
      { id: "b5", text: "個数 = 個数 + 1" },
      { id: "b1", text: "N = 20", isLocked: true },
      { id: "b6", text: "個数 を表示する" },
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
      { id: "b6", text: "個数 を表示する" }
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
      { id: "b4", text: "もし 西暦 % 100 != 0 または 西暦 % 400 == 0 ならば:", indent: 1 },
      { id: "b5", text: "うるう年 = 1", indent: 2 },
      { id: "b6", text: "うるう年 を表示する", indent: 0 }
    ],
    easyBlocks: [
      { id: "b5", text: "うるう年 = 1" },
      { id: "b1", text: "西暦 = 2024", isLocked: true },
      { id: "b6", text: "うるう年 を表示する" },
      { id: "b3", text: "もし 西暦 % 4 == 0 ならば:" },
      { id: "b4", text: "もし 西暦 % 100 != 0 または 西暦 % 400 == 0 ならば:" },
      { id: "b2", text: "うるう年 = 0" }
    ],
    normalBlocks: [
      { id: "b5", text: "うるう年 = 1" },
      { id: "b1", text: "西暦 = 2024", isLocked: true },
      { id: "b6", text: "うるう年 を表示する" },
      { id: "b3", text: "もし 西暦 % 4 == 0 ならば:" },
      { id: "b4", text: "もし 西暦 % 100 != 0 または 西暦 % 400 == 0 ならば:" },
      { id: "b2", text: "うるう年 = 0" },
      { id: "d1", text: "もし 西暦 % 4 == 0 または 西暦 % 400 == 0 ならば:", isDummy: true, reason: "100の倍数である年を除外する条件（西暦 % 100 != 0）が抜けているため、1900年など（うるう年ではない）をうるう年と誤判定してしまいます。" },
      { id: "d2", text: "うるう年 = 0", isDummy: true, reason: "この初期化カードはすでに2行目に配置されているため重複してしまい不要です。" }
    ],
    hardBlocks: [
      { id: "b1", text: "西暦 = 2024", isLocked: true },
      { id: "b2", text: "うるう年 = 0" },
      { id: "b3", text: "もし [input_cond1] ならば:", inputs: { input_cond1: { placeholder: "最初の条件 (例: 西暦 % 4 == 0)", correct: "西暦 % 4 == 0" } } },
      { id: "b4", text: "もし [input_cond2] ならば:", inputs: { input_cond2: { placeholder: "ネストの条件 (例: 西暦 % 100 != 0 または 西暦 % 400 == 0)", correct: "西暦 % 100 != 0 または 西暦 % 400 == 0" } } },
      { id: "b5", text: "うるう年 = 1" },
      { id: "b6", text: "うるう年 を表示する" }
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
    explanation: "「うるう年 = 0」で非うるう年を初期状態とします。4の倍数の場合に最初の条件に入り、さらに「100の倍数ではない、または400の倍数である」という条件をネスト（入れ子）で判定し、適合すれば「うるう年 = 1」に変更して最後に表示します。【入れ替え可能な箇所】初期化「うるう年 = 0」は、判定文が始まる前（固定されている 西暦 = 2024 の下など）の任意の位置に配置できます。"
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
      { id: "b5", text: "最大値 を表示する", indent: 0 }
    ],
    easyBlocks: [
      { id: "b3", text: "もし A[i] > 最大値 ならば:" },
      { id: "b0", text: "A = [12, 45, 78, 34, 89, 56]", isLocked: true },
      { id: "b1", text: "最大値 = A[0]" },
      { id: "b5", text: "最大値 を表示する" },
      { id: "b4", text: "最大値 = A[i]" },
      { id: "b2", text: "i を 1 から 5 まで 1 ずつ増やしながら繰り返す:" }
    ],
    normalBlocks: [
      { id: "b3", text: "もし A[i] > 最大値 ならば:" },
      { id: "b0", text: "A = [12, 45, 78, 34, 89, 56]", isLocked: true },
      { id: "b1", text: "最大値 = A[0]" },
      { id: "b5", text: "最大値 を表示する" },
      { id: "b4", text: "最大値 = A[i]" },
      { id: "b2", text: "i を 1 から 5 まで 1 ずつ増やしながら繰り返す:" },
      { id: "d1", text: "最大値 = 0", isDummy: true, reason: "初期値を0にすると、配列の要素がすべてマイナスの数値だった場合に正しく最大値を判定できません。配列の最初の要素（A[0]）で初期化するのが鉄則です。" },
      { id: "d2", text: "もし A[i] < 最大値 ならば:", isDummy: true, reason: "これでは「最大値よりも小さい場合」に中身を更新してしまうため、最小値を求めるプログラム（または意図しない動作）になってしまいます。" }
    ],
    hardBlocks: [
      { id: "b0", text: "A = [12, 45, 78, 34, 89, 56]", isLocked: true },
      { id: "b1", text: "最大値 = [input_init]", inputs: { input_init: { placeholder: "初期値", correct: "A[0]" } } },
      { id: "b2", text: "i を 1 から 5 まで 1 ずつ増やしながら繰り返す:" },
      { id: "b3", text: "もし [input_cond] > 最大値 ならば:", inputs: { input_cond: { placeholder: "比較対象", correct: "A[i]" } } },
      { id: "b4", text: "最大値 = A[i]" },
      { id: "b5", text: "最大値 を表示する" }
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
      { id: "b7", text: "A を表示する", indent: 0 }
    ],
    easyBlocks: [
      { id: "b5", text: "A = B" },
      { id: "b1", text: "A = 48", isLocked: true },
      { id: "b6", text: "B = 余り" },
      { id: "b3", text: "B > 0 の間、繰り返す:" },
      { id: "b2", text: "B = 18", isLocked: true },
      { id: "b4", text: "余り = A % B" },
      { id: "b7", text: "A を表示する" }
    ],
    normalBlocks: [
      { id: "b5", text: "A = B" },
      { id: "b1", text: "A = 48", isLocked: true },
      { id: "b6", text: "B = 余り" },
      { id: "b3", text: "B > 0 の間、繰り返す:" },
      { id: "b2", text: "B = 18", isLocked: true },
      { id: "b4", text: "余り = A % B" },
      { id: "b7", text: "A を表示する" },
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
      { id: "b7", text: "A を表示する" }
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
      { id: "b6", text: "位置 を表示する", indent: 0 }
    ],
    easyBlocks: [
      { id: "b4", text: "位置 = i" },
      { id: "b0_1", text: "A = [8, 3, 5, 9, 2]", isLocked: true },
      { id: "b1", text: "位置 = -1" },
      { id: "b0_2", text: "target = 9", isLocked: true },
      { id: "b5", text: "ループを抜ける" },
      { id: "b3", text: "もし A[i] == target ならば:" },
      { id: "b6", text: "位置 を表示する" },
      { id: "b2", text: "i を 0 から 4 まで 1 ずつ増やしながら繰り返す:" }
    ],
    normalBlocks: [
      { id: "b4", text: "位置 = i" },
      { id: "b0_1", text: "A = [8, 3, 5, 9, 2]", isLocked: true },
      { id: "b1", text: "位置 = -1" },
      { id: "b0_2", text: "target = 9", isLocked: true },
      { id: "b5", text: "ループを抜ける" },
      { id: "b3", text: "もし A[i] == target ならば:" },
      { id: "b6", text: "位置 を表示する" },
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
      { id: "b6", text: "位置 を表示する" }
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
    explanation: "まず、見つからなかった場合の初期値として「位置 = -1」を設定します。ループで配列の各要素「A[i]」と「target」を順番に比較し、一致した場合はそのインデックス「i」を「位置」に代入し、「ループを抜ける」で探索を終了します。最後にその位置を表示します。【入れ替え可能な箇所】条件分岐の中の「位置 = i」と「ループを抜ける」は、どちらが先でも最終的な結果は変わらないため、順序を入れ替えても正しく動作します（ただし同じインデント2である必要があります）。"
  },
  {
    id: "coin_change",
    title: "最小硬貨枚数（お釣り計算）",
    description: "あらかじめ設定されたお釣り金額 780 円を、500円、100円、50円、10円硬貨を使って、最小の枚数で支払う際、各硬貨の枚数を計算し表示するプログラムを完成させてください。（DNCLでは「商の整数部分」を取り出す際に「の整数部分」を使います）",
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
      { id: "b3", text: "枚数 = 金額 / 硬貨[i] の整数部分", indent: 1 },
      { id: "b4", text: "金額 = 金額 % 硬貨[i]", indent: 1 },
      { id: "b5", text: "枚数 を表示する", indent: 1 }
    ],
    easyBlocks: [
      { id: "b3", text: "枚数 = 金額 / 硬貨[i] の整数部分" },
      { id: "b1", text: "金額 = 780", isLocked: true },
      { id: "b0", text: "硬貨 = [500, 100, 50, 10]", isLocked: true },
      { id: "b5", text: "枚数 を表示する" },
      { id: "b4", text: "金額 = 金額 % 硬貨[i]" },
      { id: "b2", text: "i を 0 から 3 まで 1 ずつ増やしながら繰り返す:" }
    ],
    normalBlocks: [
      { id: "b3", text: "枚数 = 金額 / 硬貨[i] の整数部分" },
      { id: "b1", text: "金額 = 780", isLocked: true },
      { id: "b0", text: "硬貨 = [500, 100, 50, 10]", isLocked: true },
      { id: "b5", text: "枚数 を表示する" },
      { id: "b4", text: "金額 = 金額 % 硬貨[i]" },
      { id: "b2", text: "i を 0 から 3 まで 1 ずつ増やしながら繰り返す:" },
      { id: "d1", text: "枚数 = 金額 / 硬貨[i]", isDummy: true, reason: "整数部分を取らないと、枚数が小数（例: 780 / 500 = 1.56枚）になってしまいます。" },
      { id: "d2", text: "金額 = 金額 / 硬貨[i]", isDummy: true, reason: "これでは金額が減るのではなく、金額自体が割られた値になってしまいます。残りの金額を計算するには余り（%）を使います。" }
    ],
    hardBlocks: [
      { id: "b1", text: "金額 = 780", isLocked: true },
      { id: "b0", text: "硬貨 = [500, 100, 50, 10]", isLocked: true },
      { id: "b2", text: "i を 0 から 3 まで 1 ずつ増やしながら繰り返す:" },
      { id: "b3", text: "枚数 = [input_div] の整数部分", inputs: { input_div: { placeholder: "金額を硬貨で割る式 (例: 金額 / 硬貨[i])", correct: "金額 / 硬貨[i]" } } },
      { id: "b4", text: "金額 = [input_mod]", inputs: { input_mod: { placeholder: "余り金額の式 (例: 金額 % 硬貨[i])", correct: "金額 % 硬貨[i]" } } },
      { id: "b5", text: "枚数 を表示する" }
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
    explanation: "大きい額面の硬貨（500円）から順番に、「金額を硬貨の額面で割った商（の整数部分）」を枚数とし、「割った余り」を次の硬貨で支払う残額とします。ループ内で各硬貨の枚数を順次表示していきます。【入れ替え可能な箇所】この問題は手順が密接に関連しているため、入れ替え可能な箇所はありません。"
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
      { id: "l4", text: "A を表示する", indent: 0 },
      { id: "l5", text: "B を表示する", indent: 0 }
    ],
    blocks: [
      { id: "l3", text: "B = 作業用" },
      { id: "l5", text: "B を表示する" },
      { id: "l1", text: "作業用 = A" },
      { id: "l4", text: "A を表示する" },
      { id: "l2", text: "A = B" }
    ],
    narratives: {
      l1: (vars) => `変数 作業用 に変数 A の値 (${vars.A || 5}) を代入する`,
      l2: (vars) => `変数 A に変数 B の値 (${vars.B || 3}) を代入する`,
      l3: (vars) => `変数 B に変数 作業用 の値 (${vars.作業用 || 5}) を代入する`,
      l4: (vars) => `変数 A の値 (${vars.A || 3}) を表示する`,
      l5: (vars) => `変数 B の値 (${vars.B || 5}) を表示する`
    },
    explanation: "値の入れ替えには、元の値が消えてしまわないよう一時的な退避場所「作業用」が必要です。まず作業用に A を退避し、空いた A に B をコピー、最後に B に退避しておいた作業用の値（元のA）を書き込みます。【入れ替え可能な箇所】出力の「A を表示する」と「B を表示する」は順序を入れ替えても動作します。"
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
      { id: "l3", text: "\"合格\" を表示する", indent: 1 },
      { id: "l4", text: "そうでなければ:", indent: 0 },
      { id: "l5", text: "\"不合格\" を表示する", indent: 1 }
    ],
    blocks: [
      { id: "l3", text: "\"合格\" を表示する" },
      { id: "l1", text: "得点 = 85", isLocked: true },
      { id: "l4", text: "そうでなければ:" },
      { id: "l5", text: "\"不合格\" を表示する" },
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
      { id: "l2", text: "i を表示する", indent: 1 }
    ],
    blocks: [
      { id: "l2", text: "i を表示する" },
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
      { id: "l2", text: "値 を表示する", indent: 0 }
    ],
    blocks: [
      { id: "l2", text: "値 を表示する" },
      { id: "l0", text: "A = [5, 8, 3]", isLocked: true },
      { id: "l1", text: "値 = A[2]" }
    ],
    narratives: {
      l0: (vars) => `配列 A に [5, 8, 3] を代入する`,
      l1: (vars) => `変数 値 に A[2] の値 (${vars.A ? vars.A[2] : 3}) を代入する`,
      l2: (vars) => `変数 値 の値 (${vars.値 || 0}) を表示する`
    },
    explanation: "配列 A の要素は、0始まりのインデックスで指定します。1番目は A[0]、2番目は A[1]、3番目（最後）は A[2] となります。取り出した値を変数「値」に代入し、それを表示します。【入れ替え可能な箇所】この手順は順番を変えることができません。"
  }
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { problems, syntaxLessons };
}
