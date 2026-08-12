/**
 * カードの並び順の正しさを決める規則。
 *
 * 正解とみなす並びは「模範解答（correctBlocks）の順序」そのもの。ただし問題によっては
 * 順番が入れ替わっても論理的に同じプログラムになる箇所があるので、それを problems.js の
 * `swappable`（入れ替えてよいカードの組）で宣言する。ここはその宣言を解いて、
 * 「許してよい並び」の一覧を作る。
 *
 * なぜ出力の一致だけで判定しないか:
 *   初期値（initialState）に変数の値が入っているため、初期化カードをループの後ろに
 *   置いても出力が模範解答と同じになる問題がある（例: array_sum_avg で「合計 = 0」を
 *   平均の計算より後ろに置く）。出力だけを見ていると、これを「正解」と言ってしまう。
 *
 * app.js（判定）と verify_problems.js（検査）の両方がここを使う。実装は二重に持たない。
 */

class DNCLOrder {
  /**
   * 「入れ替えてよい組」を隣どうしで適用してたどり着ける並びを、すべて列挙する。
   * 隣接している時だけ入れ替えられる ＝ 離れた位置へ飛ばす配置は許さない。
   * 戻り値は "b1 b2 b3" 形式の文字列の Set。
   */
  static allowedOrders(problem) {
    const cached = DNCLOrder._cache.get(problem);
    if (cached) return cached;

    const model = problem.correctBlocks.map(b => b.id);
    const groups = problem.swappable || [];
    const canSwap = (a, b) => groups.some(g => g.includes(a) && g.includes(b));

    const seen = new Set([model.join(" ")]);
    const queue = [model];
    while (queue.length > 0 && seen.size <= DNCLOrder.MAX_ORDERS) {
      const cur = queue.shift();
      for (let i = 0; i + 1 < cur.length; i++) {
        if (!canSwap(cur[i], cur[i + 1])) continue;
        const next = cur.slice();
        [next[i], next[i + 1]] = [next[i + 1], next[i]];
        const key = next.join(" ");
        if (seen.has(key)) continue;
        seen.add(key);
        queue.push(next);
      }
    }

    DNCLOrder._cache.set(problem, seen);
    return seen;
  }

  /** 並び（カードIDの配列）が許される順序かどうか */
  static isAllowed(problem, ids) {
    return DNCLOrder.allowedOrders(problem).has(ids.join(" "));
  }

  /**
   * 許される並びのうち、いちばん先頭が長く一致するものと突き合わせて、
   * 最初に位置がずれたところを返す（アドバイス用）。合っていれば null
   */
  static firstMismatch(problem, ids) {
    if (DNCLOrder.isAllowed(problem, ids)) return null;

    let best = -1;
    let bestOrder = null;
    DNCLOrder.allowedOrders(problem).forEach(key => {
      const order = key.split(" ");
      let n = 0;
      while (n < order.length && n < ids.length && order[n] === ids[n]) n++;
      if (n > best) {
        best = n;
        bestOrder = order;
      }
    });

    return {
      index: best,                                  // 何枚目（0始まり）でずれたか
      placedId: ids[best] || null,                  // そこに置かれているカード
      expectedId: bestOrder ? bestOrder[best] : null // そこに来るはずのカード
    };
  }
}

// 入れ替えの組み合わせが増えすぎたときの歯止め（宣言ミスで爆発させない）
DNCLOrder.MAX_ORDERS = 5000;
DNCLOrder._cache = new WeakMap();

// ブラウザ環境とNode環境の両方に対応
if (typeof module !== "undefined" && module.exports) {
  module.exports = DNCLOrder;
}
