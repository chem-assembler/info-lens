// 1標本ずつみるデジタル化 メインロジック
//
// 状態は「いま何拍目まで進んだか（beat）」だけで持つ。1標本 = 3拍
// （拍1 標本化 / 拍2 量子化 / 拍3 符号化）。renderBeats() は beat から
// 画面全体を描き直す純粋な写像なので、1歩ずつ・自動再生・つまみ変更が同じ経路を通る。

class DigitizeApp {
  constructor() {
    this.lesson = null;
    this.sampleCount = 0;
    this.bitDepth = 0;
    this.trace = [];
    this.beat = 0; // 済んだ拍の数（0 = 何もしていない、3×標本数 = 完了）
    this.isPlaying = false;
    this.playInterval = null;
    this.playbackSpeed = 500;
    this.DURATION_MS = 8; // 画面に見せる波の長さ。標本数→周波数の換算にも使う

    // DOM
    this.lessonSelect = document.getElementById("lesson-select");
    this.lessonTitle = document.getElementById("lesson-title");
    this.lessonDesc = document.getElementById("lesson-desc");
    this.lessonExpl = document.getElementById("lesson-expl");
    this.rateRow = document.getElementById("rate-row");
    this.rateRange = document.getElementById("rate-range");
    this.rateVal = document.getElementById("rate-val");
    this.bitRow = document.getElementById("bit-row");
    this.bitRange = document.getElementById("bit-range");
    this.bitVal = document.getElementById("bit-val");
    this.svg = document.getElementById("wave-svg");
    this.runBtn = document.getElementById("run-btn");
    this.stepBackBtn = document.getElementById("step-back-btn");
    this.stepForwardBtn = document.getElementById("step-forward-btn");
    this.stepCounter = document.getElementById("step-counter");
    this.speedRange = document.getElementById("speed-range");
    this.speedVal = document.getElementById("speed-val");
    this.narration = document.getElementById("narration");
    this.sampleTableBody = document.querySelector("#sample-table tbody");
    this.bitStream = document.getElementById("bit-stream");
    this.dataSizeEl = document.getElementById("data-size");

    this.initEvents();
    this.loadLessonList();
  }

  initEvents() {
    this.lessonSelect.addEventListener("change", e => this.loadLesson(e.target.value));

    this.rateRange.addEventListener("input", () => {
      this.sampleCount = parseInt(this.rateRange.value, 10);
      this.rebuild("complete");
    });
    this.bitRange.addEventListener("input", () => {
      this.bitDepth = parseInt(this.bitRange.value, 10);
      this.rebuild("complete");
    });

    this.runBtn.addEventListener("click", () => this.runOrPause());
    this.stepForwardBtn.addEventListener("click", () => this.stepForward());
    this.stepBackBtn.addEventListener("click", () => this.stepBack());

    this.speedRange.addEventListener("input", e => {
      this.playbackSpeed = parseInt(e.target.value, 10);
      this.speedVal.textContent = `${this.playbackSpeed}ms`;
      if (this.isPlaying) {
        clearInterval(this.playInterval);
        this.startPlayback();
      }
    });
  }

  loadLessonList() {
    this.lessonSelect.innerHTML = "";
    lessons.forEach(l => {
      const opt = document.createElement("option");
      opt.value = l.id;
      opt.textContent = l.title;
      this.lessonSelect.appendChild(opt);
    });
    this.loadLesson(lessons[0].id);
  }

  loadLesson(id) {
    const lesson = lessons.find(l => l.id === id);
    if (!lesson) return;
    this.lesson = lesson;
    this.pause();

    this.lessonTitle.textContent = lesson.title;
    this.lessonDesc.textContent = lesson.description;
    this.lessonExpl.textContent = lesson.explanation;

    // つまみ。null の側はこの課では固定（動かせないことを見た目でも示す）
    const rate = lesson.controls.sampleCount;
    this.sampleCount = rate ? rate.value : lesson.fixed.sampleCount;
    this.rateRow.classList.toggle("locked", !rate);
    this.rateRange.disabled = !rate;
    if (rate) {
      this.rateRange.min = rate.min;
      this.rateRange.max = rate.max;
      this.rateRange.value = rate.value;
    } else {
      this.rateRange.value = this.sampleCount;
      this.rateRange.min = this.sampleCount;
      this.rateRange.max = this.sampleCount;
    }

    const bit = lesson.controls.bitDepth;
    this.bitDepth = bit ? bit.value : lesson.fixed.bitDepth;
    this.bitRow.classList.toggle("locked", !bit);
    this.bitRange.disabled = !bit;
    if (bit) {
      this.bitRange.min = bit.min;
      this.bitRange.max = bit.max;
      this.bitRange.value = bit.value;
    } else {
      this.bitRange.value = this.bitDepth;
      this.bitRange.min = this.bitDepth;
      this.bitRange.max = this.bitDepth;
    }

    // 課を開いた直後は完成形を見せる（つまみの効果が最初の一目で分かるように）。
    // 「1標本ずつ」を押すと頭出しして1拍ずつになる
    this.rebuild("complete");
  }

  /** トレースを作り直して描く。mode: "complete"（完成形） | "start"（頭出し） */
  rebuild(mode) {
    this.pause();
    this.trace = Digitize.run(this.lesson.wave, this.sampleCount, this.bitDepth, this.DURATION_MS);
    this.beat = mode === "complete" ? this.totalBeats() : 0;
    this.renderBeats();
  }

  totalBeats() {
    return this.trace.length * 3;
  }

  // ---------- 再生制御 ----------

  runOrPause() {
    if (this.isPlaying) {
      this.pause();
      return;
    }
    if (this.beat >= this.totalBeats()) this.rebuild("start");
    this.startPlayback();
  }

  startPlayback() {
    this.isPlaying = true;
    this.runBtn.textContent = "⏸ 一時停止";
    this.playInterval = setInterval(() => {
      if (this.beat < this.totalBeats()) {
        this.beat++;
        this.renderBeats();
      } else {
        this.pause();
      }
    }, this.playbackSpeed);
    this.updateControls();
  }

  pause() {
    this.isPlaying = false;
    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
    if (this.runBtn) {
      this.runBtn.textContent = "▶ 再生";
      this.updateControls();
    }
  }

  stepForward() {
    if (this.isPlaying) return;
    if (this.beat >= this.totalBeats()) {
      this.rebuild("start"); // 完成形から押したら頭出し
      return;
    }
    this.beat++;
    this.renderBeats();
  }

  stepBack() {
    if (this.isPlaying || this.beat <= 0) return;
    this.beat--;
    this.renderBeats();
  }

  updateControls() {
    this.stepBackBtn.disabled = this.isPlaying || this.beat <= 0;
    // 完成形からの ▷ は「頭出し」として常に押せる
    this.stepForwardBtn.disabled = this.isPlaying;
    const sample = Math.min(this.trace.length, Math.floor((this.beat + 2) / 3));
    this.stepCounter.textContent = `標本 ${sample}/${this.trace.length}`;
  }

  // ---------- 描画 ----------

  /** beat から画面全体（SVG・表・ビット列・ナレーション）を描き直す */
  renderBeats() {
    this.renderWave();
    this.renderTable();
    this.renderNarration();
    this.updateControls();
  }

  /** 標本 i が何拍目まで済んでいるか（0=未着手 1=標本化 2=量子化 3=符号化） */
  phaseOf(i) {
    return Math.max(0, Math.min(3, this.beat - i * 3));
  }

  renderWave() {
    const W = 820, H = 420, L = 46, R = 20, T = 16, B = 34;
    const plotW = W - L - R, plotH = H - T - B;
    const x = u => L + u * plotW;
    const y = v => T + ((1 - v) / 2) * plotH; // v: -1..1

    const parts = [];
    const esc = n => (Math.round(n * 100) / 100);

    // 量子化の段階線と段階番号
    const levels = Digitize.levels(this.bitDepth);
    for (let lv = 0; lv < levels; lv++) {
      const vy = esc(y(Digitize.levelValue(lv, this.bitDepth)));
      parts.push(`<line class="grid-level" x1="${L}" y1="${vy}" x2="${W - R}" y2="${vy}"/>`);
      if (levels <= 16) {
        parts.push(`<text class="level-label" x="${L - 6}" y="${vy + 3}">${lv}</text>`);
      }
    }

    // 元の波（連続曲線）
    const pts = [];
    for (let k = 0; k <= 240; k++) {
      const u = k / 240;
      pts.push(`${esc(x(u))},${esc(y(Digitize.waveValue(this.lesson.wave, u)))}`);
    }
    parts.push(`<polyline class="wave-original" points="${pts.join(" ")}"/>`);

    // 標本ごとの描画（拍の進みに応じて出す）
    const holdW = plotW / this.trace.length;
    this.trace.forEach(s => {
      const phase = this.phaseOf(s.i);
      if (phase < 1) return;
      const sx = esc(x(s.u));
      const active = this.beat > 0 && s.i === Math.floor((this.beat - 1) / 3) && !this.isFinished();

      // 拍1 標本化: 読み取りの縦線と点
      parts.push(`<line class="sample-line" x1="${sx}" y1="${esc(y(-1))}" x2="${sx}" y2="${esc(y(1))}"/>`);
      parts.push(`<circle class="sample-dot${active && phase === 1 ? " active" : ""}" cx="${sx}" cy="${esc(y(s.raw))}" r="${active && phase === 1 ? 7 : 4.5}"/>`);

      if (phase < 2) return;
      // 拍2 量子化: 丸めた先の点・誤差の赤線・復元の階段
      const qy = esc(y(s.restored));
      parts.push(`<line class="error-line" x1="${sx}" y1="${esc(y(s.raw))}" x2="${sx}" y2="${qy}"/>`);
      parts.push(`<line class="restored-step" x1="${sx}" y1="${qy}" x2="${esc(x(s.u) + holdW)}" y2="${qy}"/>`);
      parts.push(`<circle class="restored-dot${active && phase === 2 ? " active" : ""}" cx="${sx}" cy="${qy}" r="${active && phase === 2 ? 7 : 4.5}"/>`);

      if (phase < 3) return;
      // 拍3 符号化: 2進数のラベル
      if (this.trace.length <= 16) {
        parts.push(`<text class="bits-label${active && phase === 3 ? " active" : ""}" x="${sx}" y="${H - 12}">${s.bits}</text>`);
      }
    });

    // 時間軸
    parts.push(`<line class="axis" x1="${L}" y1="${esc(y(-1))}" x2="${W - R}" y2="${esc(y(-1))}"/>`);
    this.svg.innerHTML = parts.join("");
  }

  isFinished() {
    return this.beat >= this.totalBeats();
  }

  renderTable() {
    this.sampleTableBody.innerHTML = "";
    let bitsSoFar = "";

    this.trace.forEach(s => {
      const phase = this.phaseOf(s.i);
      if (phase < 1) return;
      const tr = document.createElement("tr");
      if (!this.isFinished() && s.i === Math.floor((this.beat - 1) / 3)) tr.className = "active";
      const cells = [
        s.i,
        s.tMs.toFixed(1) + "ms",
        s.raw.toFixed(2),
        phase >= 2 ? s.level : "…",
        phase >= 3 ? s.bits : "…",
      ];
      cells.forEach(v => {
        const td = document.createElement("td");
        td.textContent = v;
        tr.appendChild(td);
      });
      this.sampleTableBody.appendChild(tr);
      if (phase >= 3) bitsSoFar += s.bits;
    });

    // ビット列は8桁ごとに区切って読みやすく
    this.bitStream.textContent = bitsSoFar.replace(/(.{8})/g, "$1 ").trim() || "（まだありません）";

    const size = Digitize.dataSize(this.trace.length, this.bitDepth);
    const bytes = size.bits % 8 === 0 ? `（${size.bits / 8} バイト）` : "";
    this.dataSizeEl.textContent =
      `データ量: 標本 ${this.trace.length} 個 × ${this.bitDepth} ビット = ${size.bits} ビット${bytes}`;

    this.rateVal.textContent = this.describeRate();
    this.bitVal.textContent = `${this.bitDepth} ビット（${Digitize.levels(this.bitDepth)} 段階）`;
  }

  describeRate() {
    // 画面の波は DURATION_MS ミリ秒ぶん。標本の数を1秒あたりに換算して周波数で言う
    const hz = Math.round((this.sampleCount * 1000) / this.DURATION_MS);
    const label = hz >= 1000 ? `${hz / 1000} kHz` : `${hz} Hz`;
    return `${label}（この画面に ${this.sampleCount} 個）`;
  }

  renderNarration() {
    if (this.beat === 0) {
      this.narration.textContent = "「▷ 1拍ずつ」か「▶ 再生」で、1標本ずつデジタル化が進みます。";
      return;
    }
    if (this.isFinished()) {
      const size = Digitize.dataSize(this.trace.length, this.bitDepth);
      this.narration.textContent =
        `デジタル化が完了。${this.trace.length} 個の標本が ${size.bits} ビットになりました。つまみを動かすと、きめ細かさとデータ量の変化を見比べられます。`;
      return;
    }
    const i = Math.floor((this.beat - 1) / 3);
    const s = this.trace[i];
    const phase = this.beat - i * 3;
    if (phase === 1) {
      this.narration.textContent =
        `標本${s.i}【標本化】 時刻 ${s.tMs.toFixed(1)}ms の波の高さ ${s.raw.toFixed(2)} を読み取った。`;
    } else if (phase === 2) {
      const err = Math.abs(s.raw - s.restored);
      this.narration.textContent =
        `標本${s.i}【量子化】 ${s.raw.toFixed(2)} をいちばん近い段階 ${s.level} に丸めた（ずれ ${err.toFixed(2)}）。`;
    } else {
      this.narration.textContent =
        `標本${s.i}【符号化】 段階 ${s.level} を2進数 ${s.bits} にしてビット列へ並べた。`;
    }
  }
}

// アプリの起動
document.addEventListener("DOMContentLoaded", () => {
  window.digitizeApp = new DigitizeApp();
});
