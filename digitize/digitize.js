/**
 * 音のデジタル化の純ロジック（DOM非依存）。
 * 設計は docs/DESIGN_sound_digitization.md。UI（app.js）と検証（verify_lessons.js）が共有する。
 *
 * 値の約束:
 *   - 時刻は u（0..1 の正規化時刻）で持ち、表示用の ms は durationMs から導く
 *   - 波の高さは -1..1
 *   - 量子化は「いちばん近い段階に丸める」。段階 0 が -1、段階 2^bit - 1 が +1
 *     （このとき標本点での誤差は必ず段階幅の半分以下になる。verify がこれを検査する）
 */

const Digitize = {
  /** 元の波の高さ。波は乱数にしない（録画・テスト・解説が再現できなくなるため） */
  waveValue(wave, u) {
    switch (wave.type) {
      case "sine":
        return (wave.amp ?? 0.8) * Math.sin(2 * Math.PI * (wave.freq ?? 1) * u + (wave.phase ?? 0));
      case "duo":
        // 2つの正弦の和。単純な正弦だと量子化の階段が規則的すぎて誤差が見えにくい課で使う
        return 0.55 * Math.sin(2 * Math.PI * 2 * u) + 0.33 * Math.sin(2 * Math.PI * 5 * u);
      default:
        throw new Error("未知の波: " + wave.type);
    }
  },

  levels(bitDepth) {
    return 2 ** bitDepth;
  },

  /** 段階の高さ（-1..1）。目盛り線の描画にも使う */
  levelValue(level, bitDepth) {
    return (level / (this.levels(bitDepth) - 1)) * 2 - 1;
  },

  /** 量子化: いちばん近い段階に丸める */
  quantize(raw, bitDepth) {
    const top = this.levels(bitDepth) - 1;
    const level = Math.round(((raw + 1) / 2) * top);
    return Math.max(0, Math.min(top, level));
  },

  /** 符号化: 段階番号を固定長の2進数にする */
  encode(level, bitDepth) {
    return level.toString(2).padStart(bitDepth, "0");
  },

  /**
   * 全標本を処理してトレースを返す。
   * 標本は u = i / sampleCount（区間の頭）で取り、次の標本まで値を保持する（階段の復元）
   */
  run(wave, sampleCount, bitDepth, durationMs = 8) {
    const trace = [];
    for (let i = 0; i < sampleCount; i++) {
      const u = i / sampleCount;
      const raw = this.waveValue(wave, u);
      const level = this.quantize(raw, bitDepth);
      trace.push({
        i,
        u,
        tMs: (durationMs * i) / sampleCount,
        raw,
        level,
        restored: this.levelValue(level, bitDepth),
        bits: this.encode(level, bitDepth),
      });
    }
    return trace;
  },

  /** データ量。表示と検証の両方がこれを使う（式を2か所に持たない） */
  dataSize(sampleCount, bitDepth) {
    const bits = sampleCount * bitDepth;
    return { bits, bytes: bits / 8 };
  },

  /** 標本点での量子化誤差の最大値。正しい実装なら段階幅の半分を超えない */
  maxError(trace) {
    return trace.reduce((max, s) => Math.max(max, Math.abs(s.raw - s.restored)), 0);
  },

  /** 段階幅（となり合う段階の高さの差） */
  stepWidth(bitDepth) {
    return 2 / (this.levels(bitDepth) - 1);
  },
};

// ブラウザ環境とNode環境の両方に対応
if (typeof module !== "undefined" && module.exports) {
  module.exports = Digitize;
}
