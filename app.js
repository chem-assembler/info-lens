// DNCL学習アプリ メインロジック

class DNCLApp {
  constructor() {
    this.interpreter = new DNCLInterpreter();
    this.currentProblem = null;
    this.currentDifficulty = "easy"; // easy, normal, hard
    
    // アプリの状態
    this.editorBlocks = [];
    this.traceResults = null;
    this.currentStepIndex = -1;
    this.isPlaying = false;
    this.playInterval = null;
    this.isDragging = false; // ドラッグ中かどうかのフラグ（タップ誤判定防止）
    this.playbackSpeed = 400; // 自動再生の間隔 (ms)

    // DOM要素のキャッシュ
    this.problemSelect = document.getElementById("problem-select");
    this.problemTitle = document.getElementById("problem-title");
    this.problemDesc = document.getElementById("problem-desc");
    this.difficultyBadge = document.getElementById("difficulty-badge");
    
    this.trayList = document.getElementById("tray-list");
    this.editorList = document.getElementById("editor-list");
    
    this.runBtn = document.getElementById("run-btn");
    this.stepBackBtn = document.getElementById("step-back-btn");
    this.stepForwardBtn = document.getElementById("step-forward-btn");
    this.stepCounter = document.getElementById("step-counter");
    this.speedRange = document.getElementById("speed-range");
    this.speedVal = document.getElementById("speed-val");
    this.resetBtn = document.getElementById("reset-btn");
    
    this.varsGrid = document.getElementById("vars-grid");
    this.arrayVisualizer = document.getElementById("array-visualizer");
    this.consoleOutput = document.getElementById("console-output");
    this.previewCode = document.getElementById("preview-code");
    this.statusBar = document.getElementById("status-bar");
    this.statusText = document.getElementById("status-text");
    this.explanationSection = document.getElementById("explanation-section");
    this.explanationText = document.getElementById("explanation-text");
    
    // AI連携用
    this.aiPromptBtn = document.getElementById("ai-prompt-btn");
    this.aiModal = document.getElementById("ai-modal");
    this.closeModalBtn = document.getElementById("close-modal");
    this.promptTextarea = document.getElementById("prompt-textarea");
    this.copyPromptBtn = document.getElementById("copy-prompt-btn");
    this.downloadPromptBtn = document.getElementById("download-prompt-btn");

    // 模範解答用
    this.showAnswerBtn = document.getElementById("show-answer-btn");
    this.answerModal = document.getElementById("answer-modal");
    this.closeAnswerModalBtn = document.getElementById("close-answer-modal");
    this.answerCodePreview = document.getElementById("answer-code-preview");
    this.answerExplanationText = document.getElementById("answer-explanation-text");

    // モード切り替え用DOM & 状態変数
    this.currentMode = "exercise"; // exercise (問題演習) or syntax (構文学習)
    this.modeExerciseBtn = document.getElementById("mode-exercise-btn");
    this.modeSyntaxBtn = document.getElementById("mode-syntax-btn");
    this.difficultyTabs = document.getElementById("difficulty-tabs");

    this.initEvents();
    this.loadProblemList();
  }

  initEvents() {
    // 問題切り替え
    this.problemSelect.addEventListener("change", (e) => {
      this.loadProblem(e.target.value);
    });

    // 難易度切り替え
    document.querySelectorAll(".diff-tab").forEach(tab => {
      tab.addEventListener("click", (e) => {
        document.querySelectorAll(".diff-tab").forEach(t => t.classList.remove("active"));
        e.target.classList.add("active");
        this.currentDifficulty = e.target.dataset.difficulty;
        this.resetWorkspace();
      });
    });

    // アクションボタン
    this.runBtn.addEventListener("click", () => this.runCode());
    this.stepForwardBtn.addEventListener("click", () => this.stepForward());
    this.stepBackBtn.addEventListener("click", () => this.stepBack());
    this.resetBtn.addEventListener("click", () => this.resetExecution());

    // 再生速度スライダー
    this.speedRange.addEventListener("input", (e) => {
      this.playbackSpeed = parseInt(e.target.value, 10);
      this.speedVal.textContent = `${this.playbackSpeed}ms`;
      if (this.isPlaying) {
        clearInterval(this.playInterval);
        this.startPlayback();
      }
    });

    // AI質問用モーダル
    this.aiPromptBtn.addEventListener("click", () => this.openAIModal());
    this.closeModalBtn.addEventListener("click", () => this.closeAIModal());
    this.copyPromptBtn.addEventListener("click", () => this.copyPromptToClipboard());
    this.downloadPromptBtn.addEventListener("click", () => this.downloadPromptFile());

    // モーダル外側クリックで閉じる
    this.aiModal.addEventListener("click", (e) => {
      if (e.target === this.aiModal) this.closeAIModal();
    });

    // 模範解答モーダル
    this.showAnswerBtn.addEventListener("click", () => this.openAnswerModal());
    this.closeAnswerModalBtn.addEventListener("click", () => this.closeAnswerModal());
    this.answerModal.addEventListener("click", (e) => {
      if (e.target === this.answerModal) this.closeAnswerModal();
    });

    // モード切り替えタブ
    this.modeExerciseBtn.addEventListener("click", () => this.switchMode("exercise"));
    this.modeSyntaxBtn.addEventListener("click", () => this.switchMode("syntax"));

    // SortableJSの初期化 (トレイとエディタの連携、タッチ対応オプション追加)
    new Sortable(this.trayList, {
      group: {
        name: "shared",
        pull: true,
        put: true
      },
      animation: 150,
      ghostClass: "sortable-ghost",
      delay: 80, // タッチ操作でのスクロール競合を防ぐための遅延
      delayOnTouchOnly: true,
      touchStartThreshold: 5,
      filter: ".locked-card", // ロックされたカードはドラッグ不可にする
      preventOnFilter: false,
      onStart: () => { this.isDragging = true; },
      onEnd: () => {
        setTimeout(() => { this.isDragging = false; }, 80);
        this.onBlocksChanged();
      }
    });

    new Sortable(this.editorList, {
      group: {
        name: "shared",
        pull: true,
        put: true
      },
      animation: 150,
      ghostClass: "sortable-ghost",
      delay: 80,
      delayOnTouchOnly: true,
      touchStartThreshold: 5,
      filter: ".locked-card", // ロックされたカードはドラッグ不可にする
      preventOnFilter: false,
      onStart: () => { this.isDragging = true; },
      onEnd: () => {
        setTimeout(() => { this.isDragging = false; }, 80);
        this.onBlocksChanged();
      }
    });
  }

  switchMode(mode) {
    if (this.currentMode === mode) return;
    this.currentMode = mode;
    
    if (mode === "exercise") {
      this.modeExerciseBtn.classList.add("active");
      this.modeSyntaxBtn.classList.remove("active");
      this.difficultyTabs.style.display = "flex";
    } else {
      this.modeSyntaxBtn.classList.add("active");
      this.modeExerciseBtn.classList.remove("active");
      this.difficultyTabs.style.display = "none";
    }
    
    this.loadProblemList();
  }

  loadProblemList() {
    this.problemSelect.innerHTML = "";
    const targetList = this.currentMode === "exercise" ? problems : syntaxLessons;
    
    targetList.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = this.currentMode === "exercise" ? `${p.title} (${p.difficulty})` : p.title;
      this.problemSelect.appendChild(opt);
    });
    
    if (targetList.length > 0) {
      this.loadProblem(targetList[0].id);
    }
  }

  loadProblem(id) {
    const targetList = this.currentMode === "exercise" ? problems : syntaxLessons;
    const problem = targetList.find(p => p.id === id);
    if (!problem) return;
    this.currentProblem = problem;

    this.problemTitle.textContent = problem.title;
    this.problemDesc.textContent = problem.description;
    
    if (this.currentMode === "exercise") {
      this.difficultyBadge.style.display = "inline-block";
      this.difficultyBadge.textContent = problem.difficulty;
      this.difficultyBadge.className = "difficulty-badge";
      if (problem.difficulty === "初級") this.difficultyBadge.classList.add("easy");
      else if (problem.difficulty === "中級") this.difficultyBadge.classList.add("normal");
      else this.difficultyBadge.classList.add("hard");
    } else {
      this.difficultyBadge.style.display = "none";
    }

    this.resetWorkspace();
  }

  resetWorkspace() {
    this.resetExecution();
    this.statusBar.style.display = "none";
    this.explanationSection.style.display = "none";

    let sourceBlocks = [];
    if (this.currentMode === "exercise") {
      if (this.currentDifficulty === "easy") {
        sourceBlocks = [...this.currentProblem.easyBlocks];
      } else if (this.currentDifficulty === "normal") {
        sourceBlocks = [...this.currentProblem.normalBlocks];
      } else if (this.currentDifficulty === "hard") {
        sourceBlocks = [...this.currentProblem.hardBlocks];
      }
    } else {
      sourceBlocks = [...this.currentProblem.blocks];
    }

    // ロックされたカードはトレイから除外
    const trayBlocks = this.shuffleArray(sourceBlocks.filter(block => !block.isLocked));

    this.trayList.innerHTML = "";
    trayBlocks.forEach(block => {
      const card = this.createBlockCard(block);
      this.trayList.appendChild(card);
    });

    // エディタをクリア
    this.editorList.innerHTML = "";

    // ロックされたカードを最初からエディタに配置
    const lockedBlocks = this.currentProblem.correctBlocks.filter(block => block.isLocked);
    
    if (lockedBlocks.length > 0) {
      lockedBlocks.forEach(block => {
        const card = this.createBlockCard(block);
        this.editorList.appendChild(card);
      });
    } else {
      this.editorList.innerHTML = `
        <div class="empty-placeholder" id="workspace-placeholder">
          <i class="fas fa-code"></i>
          <span>ここにカードをドラッグ＆ドロップしてプログラムを組み立ててください</span>
        </div>
      `;
    }

    this.onBlocksChanged();
    this.updateVariableMonitor(this.currentProblem.initialState);
    this.updateStepControls();
  }

  shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  createBlockCard(block) {
    const card = document.createElement("div");
    card.className = "block-card indent-0";
    card.dataset.id = block.id;
    card.dataset.indent = "0";

    if (block.isDummy) {
      card.classList.add("dummy-card");
      card.dataset.isDummy = "true";
    }

    if (block.isLocked) {
      card.classList.add("locked-card");
      card.dataset.isLocked = "true";
    }

    const textSpan = document.createElement("span");
    textSpan.className = "block-text";

    // ハードモードの穴埋め入力欄のレンダリング
    if (block.inputs && this.currentDifficulty === "hard" && this.currentMode === "exercise") {
      let html = block.text;
      Object.keys(block.inputs).forEach(key => {
        const inputSpec = block.inputs[key];
        html = html.replace(`[${key}]`, `<input type="text" class="block-input" data-input-key="${key}" placeholder="${inputSpec.placeholder}">`);
      });
      textSpan.innerHTML = html;
      
      // 入力変更時にもプレビュー更新
      setTimeout(() => {
        card.querySelectorAll("input").forEach(input => {
          input.addEventListener("input", () => this.updatePreview());
          // ドラッグ開始時にテキストボックスがフォーカスされてキー入力イベントが奪われるのを防ぐ
          input.addEventListener("mousedown", (e) => e.stopPropagation());
        });
      }, 0);
    } else {
      // 穴埋めなし、またはハードモード以外
      // ハードモード用テキストのプレースホルダーを「???」や本来の値に戻す
      let displayPattern = block.text;
      if (block.inputs) {
        Object.keys(block.inputs).forEach(key => {
          displayPattern = displayPattern.replace(`[${key}]`, block.inputs[key].correct);
        });
      }
      textSpan.textContent = displayPattern;
    }

    card.appendChild(textSpan);

    // インデント操作用ボタン（エディタに配置された時のみ有効化できるようにイベントは常時バインドし表示はCSSで制御）
    const btnGroup = document.createElement("div");
    btnGroup.className = "indent-btn-group";

    const decBtn = document.createElement("button");
    decBtn.className = "indent-btn dec-indent";
    decBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    decBtn.title = "インデントを減らす";
    decBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.adjustIndent(card, -1);
    });

    const incBtn = document.createElement("button");
    incBtn.className = "indent-btn inc-indent";
    incBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    incBtn.title = "インデントを増やす";
    incBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.adjustIndent(card, 1);
    });

    btnGroup.appendChild(decBtn);
    btnGroup.appendChild(incBtn);
    card.appendChild(btnGroup);

    // タッチパッド・スマホ用のタップ簡単配置イベント
    card.addEventListener("click", (e) => {
      // インプット要素やインデントボタンのクリック時は何もしない
      if (e.target.tagName === "INPUT" || e.target.closest(".indent-btn-group")) {
        return;
      }
      
      // ドラッグ操作中、または直後のクリック誤動作をガード
      if (this.isDragging) {
        return;
      }

      this.handleCardTap(card);
    });

    return card;
  }

  /**
   * カードタップ時にトレイとエディタ間を自動で移動させる（タッチ操作の補助）
   */
  handleCardTap(card) {
    const isAtTray = this.trayList.contains(card);
    
    if (isAtTray) {
      // トレイからエディタへ移動
      const placeholder = document.getElementById("workspace-placeholder");
      if (placeholder) placeholder.remove();
      this.editorList.appendChild(card);
    } else {
      // エディタからトレイへ戻す
      this.trayList.appendChild(card);
      // インデントのリセット
      const currentIndent = parseInt(card.dataset.indent || "0", 10);
      card.classList.remove(`indent-${currentIndent}`);
      card.classList.add("indent-0");
      card.dataset.indent = "0";
    }

    this.onBlocksChanged();
  }

  adjustIndent(card, diff) {
    // エディタに入っていないカードはインデント調整させない
    if (!this.editorList.contains(card)) return;

    let currentIndent = parseInt(card.dataset.indent || "0", 10);
    let nextIndent = Math.max(0, Math.min(3, currentIndent + diff));
    
    card.classList.remove(`indent-${currentIndent}`);
    card.classList.add(`indent-${nextIndent}`);
    card.dataset.indent = nextIndent;
    
    this.onBlocksChanged();
  }

  onBlocksChanged() {
    const placeholder = document.getElementById("workspace-placeholder");
    const editorCards = Array.from(this.editorList.querySelectorAll(".block-card"));
    
    if (editorCards.length > 0) {
      if (placeholder) placeholder.remove();
    } else {
      if (!placeholder) {
        this.editorList.innerHTML = `
          <div class="empty-placeholder" id="workspace-placeholder">
            <i class="fas fa-code"></i>
            <span>ここにカードをドラッグ＆ドロップしてプログラムを組み立ててください</span>
          </div>
        `;
      }
    }

    // editorBlocks の状態を更新
    this.editorBlocks = editorCards.map(card => {
      const id = card.dataset.id;
      const indent = parseInt(card.dataset.indent || "0", 10);
      
      // 穴埋めテキストの置換処理
      let text = "";
      const isDummy = card.dataset.isDummy === "true";
      
      const textSpan = card.querySelector(".block-text");
      if (card.querySelectorAll("input").length > 0) {
        // ハードモードで入力欄がある場合、テキストは入力値で組み立てる
        let rawText = "";
        const originalBlock = (this.currentMode === "exercise" && this.currentProblem.hardBlocks)
          ? this.currentProblem.hardBlocks.find(b => b.id === id)
          : null;
        if (originalBlock) {
          rawText = originalBlock.text;
          card.querySelectorAll("input").forEach(input => {
            const key = input.dataset.inputKey;
            const val = this.normalizeInputText(input.value) || `[${key}]`;
            rawText = rawText.replace(`[${key}]`, val);
          });
          text = rawText;
        } else {
          text = textSpan.textContent;
        }
      } else {
        text = textSpan.textContent;
      }

      return { id, text, indent, isDummy };
    });

    this.updatePreview();
    this.updateStepControls();
  }

  updatePreview() {
    if (this.editorBlocks.length === 0) {
      this.previewCode.textContent = "// 組み立てられたプログラムがここに表示されます";
      return;
    }

    const lines = this.editorBlocks.map(b => {
      const space = "  ".repeat(b.indent);
      return space + b.text;
    });

    this.previewCode.textContent = lines.join("\n");
  }

  getCurrentVariablesState() {
    const state = {};
    if (this.currentProblem) {
      // problems.js で定義された初期値をディープコピー
      Object.keys(this.currentProblem.initialState).forEach(key => {
        const val = this.currentProblem.initialState[key];
        state[key] = Array.isArray(val) ? [...val] : val;
      });
    }
    return state;
  }

  runCode() {
    if (this.editorBlocks.length === 0) return;

    if (this.isPlaying) {
      this.pauseCode();
      return;
    }

    // 既に最後まで実行済みの状態、またはまだ一度も実行していない場合
    if (!this.traceResults || this.currentStepIndex >= this.traceResults.trace.length - 1) {
      const success = this.prepareExecution();
      if (!success) return;
    }

    this.startPlayback();
  }

  startPlayback() {
    this.isPlaying = true;
    this.runBtn.innerHTML = '<i class="fas fa-pause"></i> 一時停止';
    this.runBtn.className = "primary warning";
    this.updateStepControls();

    this.playInterval = setInterval(() => {
      if (this.currentStepIndex < this.traceResults.trace.length - 1) {
        this.currentStepIndex++;
        this.renderStep(this.currentStepIndex);
        this.updateStepControls();
      } else {
        this.pauseCode();
        this.onExecutionFinished();
      }
    }, this.playbackSpeed);
  }

  pauseCode() {
    this.isPlaying = false;
    if (this.playInterval) {
      clearInterval(this.playInterval);
      this.playInterval = null;
    }
    this.runBtn.innerHTML = '<i class="fas fa-play"></i> 実行';
    this.runBtn.className = "primary";
    this.updateStepControls();
  }

  prepareExecution() {
    this.resetExecution();
    const initialVars = this.getCurrentVariablesState();
    this.traceResults = this.interpreter.run(this.editorBlocks, initialVars);

    if (!this.traceResults.success) {
      this.consoleOutput.innerHTML = `<div class="console-line" style="border-left-color: var(--accent-red); color: var(--accent-red);">${this.traceResults.error}</div>`;
      this.statusBar.className = "status-bar fail";
      this.statusText.innerHTML = `<i class="fas fa-times-circle"></i> 実行エラーが発生しました。カードの順序や穴埋めを確認してください。`;
      this.statusBar.style.display = "flex";
      this.updateStepControls();
      return false;
    }

    this.currentStepIndex = 0;
    this.renderStep(this.currentStepIndex);
    this.updateStepControls();
    return true;
  }

  stepForward() {
    if (this.isPlaying) return;

    if (!this.traceResults) {
      const success = this.prepareExecution();
      if (!success) return;
      return;
    }

    if (this.currentStepIndex < this.traceResults.trace.length - 1) {
      this.currentStepIndex++;
      this.renderStep(this.currentStepIndex);
      this.updateStepControls();

      if (this.currentStepIndex === this.traceResults.trace.length - 1) {
        this.onExecutionFinished();
      }
    }
  }

  stepBack() {
    if (this.isPlaying || this.currentStepIndex <= 0) return;

    if (this.traceResults) {
      this.currentStepIndex--;
      this.renderStep(this.currentStepIndex);
      this.updateStepControls();
      
      // 最後まで実行した状態から戻る際はステータスバー等を一旦隠す
      this.statusBar.style.display = "none";
      this.explanationSection.style.display = "none";
    }
  }

  updateStepControls() {
    if (!this.traceResults || !this.traceResults.success) {
      // 組み立てが1枚以上ある場合は進むボタンだけ活性化（実行準備）
      const hasBlocks = this.editorBlocks.length > 0;
      this.stepBackBtn.disabled = true;
      this.stepForwardBtn.disabled = !hasBlocks;
      this.stepCounter.textContent = "0/0";
      return;
    }

    const total = this.traceResults.trace.length;
    const current = this.currentStepIndex === -1 ? 0 : this.currentStepIndex + 1;
    this.stepCounter.textContent = `${current}/${total}`;

    if (this.isPlaying) {
      this.stepBackBtn.disabled = true;
      this.stepForwardBtn.disabled = true;
    } else {
      this.stepBackBtn.disabled = (this.currentStepIndex <= 0);
      this.stepForwardBtn.disabled = (this.currentStepIndex >= total - 1);
    }
  }

  renderStep(index) {
    const trace = this.traceResults.trace[index];
    const activeBlockIndex = trace.blockIndex;

    // カードのハイライト切り替え
    const cards = this.editorList.querySelectorAll(".block-card");
    cards.forEach((c, idx) => {
      if (idx === activeBlockIndex) {
        c.classList.add("active-line");
        c.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        c.classList.remove("active-line");
      }
    });

    // 変数モニターの更新
    this.updateVariableMonitor(trace.variables);

    // コンソールの更新
    this.consoleOutput.innerHTML = "";
    trace.output.forEach(line => {
      const div = document.createElement("div");
      div.className = "console-line";
      div.textContent = line;
      this.consoleOutput.appendChild(div);
    });
    this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
  }

  updateVariableMonitor(variables) {
    const prevValues = {};
    this.varsGrid.querySelectorAll(".var-badge").forEach(badge => {
      const name = badge.dataset.varName;
      const valEl = badge.querySelector(".var-value");
      if (name && valEl) prevValues[name] = valEl.textContent;
    });

    this.varsGrid.innerHTML = "";
    this.arrayVisualizer.innerHTML = "";

    let hasArray = false;

    Object.keys(variables).forEach(name => {
      const val = variables[name];

      if (Array.isArray(val)) {
        hasArray = true;
        // 配列ビジュアライザへレンダリング
        this.renderArrayVisualizer(name, val, variables['i']); // i は現在のループカウンタと想定してハイライトに利用
      } else if (name !== "arrayData" && typeof val !== "object") {
        // 通常の変数
        const badge = document.createElement("div");
        badge.className = "var-badge";
        badge.dataset.varName = name;

        const nameEl = document.createElement("div");
        nameEl.className = "var-name";
        nameEl.textContent = name;

        const valEl = document.createElement("div");
        valEl.className = "var-value";
        valEl.textContent = val === undefined ? "?" : val;

        // 値が変わった場合にフラッシュさせる
        if (prevValues[name] !== undefined && String(prevValues[name]) !== String(valEl.textContent)) {
          valEl.classList.add("changed");
        }

        badge.appendChild(nameEl);
        badge.appendChild(valEl);
        this.varsGrid.appendChild(badge);
      }
    });

    if (!hasArray && this.currentProblem.initialState.arrayData) {
      // 初期配列データを初期状態で表示
      const arrData = this.currentProblem.initialState.arrayData;
      this.renderArrayVisualizer(arrData.name, arrData.values, -1);
    }
  }

  renderArrayVisualizer(arrayName, arrayValues, activeIndex) {
    const container = document.createElement("div");
    container.className = "array-container";

    const label = document.createElement("div");
    label.className = "array-label";
    label.textContent = `配列 ${arrayName} の状態:`;
    container.appendChild(label);

    const boxList = document.createElement("div");
    boxList.className = "array-box-list";

    arrayValues.forEach((val, idx) => {
      const box = document.createElement("div");
      box.className = "array-box";
      // 現在のループ変数 `i` がこのインデックスを指していればハイライト
      if (idx === activeIndex) {
        box.classList.add("highlight");
      }

      const valEl = document.createElement("span");
      valEl.className = "val";
      valEl.textContent = val;

      const idxEl = document.createElement("span");
      idxEl.className = "idx";
      idxEl.textContent = idx;

      box.appendChild(valEl);
      box.appendChild(idxEl);
      boxList.appendChild(box);
    });

    container.appendChild(boxList);
    this.arrayVisualizer.appendChild(container);
  }

  onExecutionFinished() {
    this.isPlaying = false;
    this.runBtn.innerHTML = '<i class="fas fa-play"></i> 実行';
    this.runBtn.className = "primary";
    this.updateStepControls();

    // 正解判定
    const isCorrect = this.checkSolution();

    this.statusBar.style.display = "flex";
    if (isCorrect) {
      this.statusBar.className = "status-bar success";
      this.statusText.innerHTML = `<i class="fas fa-check-circle"></i> 素晴らしい！正解です！プログラムが期待通りに動作しました。`;
      this.explanationText.textContent = this.currentProblem.explanation;
      this.explanationSection.style.display = "block";
    } else {
      this.statusBar.className = "status-bar fail";
      
      // 不正解の理由を分析
      let failMessage = "プログラムの結果が期待と異なります。カードの並び順やインデント、穴埋めの値を確認してください。";
      
      // ダミーカード（ディストラクター）が混入しているかチェック
      const dummyUsed = this.editorBlocks.find(b => b.isDummy);
      if (dummyUsed) {
        const dummySpec = this.currentProblem.normalBlocks.find(b => b.id === dummyUsed.id);
        if (dummySpec && dummySpec.reason) {
          failMessage = `【ヒント】使用している「${dummyUsed.text}」カードに問題があります。<br>${dummySpec.reason}`;
          // ダミーカードを赤くハイライト
          const cardEl = this.editorList.querySelector(`.block-card[data-id="${dummyUsed.id}"]`);
          if (cardEl) {
            cardEl.classList.add("reveal-error");
          }
        }
      } else if (this.editorBlocks.length < this.currentProblem.correctBlocks.length) {
        failMessage = "プログラムの行数が足りないようです。必要なカードがすべて配置されているか確認してください。";
      } else {
        // 典型的な誤答パターンの分析
        failMessage = this.getDetailedFeedback();
      }
      
      this.statusText.innerHTML = `<i class="fas fa-times-circle"></i> ${failMessage}`;
    }
  }

  checkSolution() {
    if (!this.traceResults || !this.traceResults.success) return false;

    const correct = this.currentProblem.correctBlocks;
    
    // 1. ダミーカードを使用していないかチェック
    if (this.editorBlocks.some(b => b.isDummy)) return false;

    // 2. 使用しているカードの総数と、IDの構成セットが一致しているかチェック（本質的でない順序違いを許容するため）
    if (this.editorBlocks.length !== correct.length) return false;
    
    const userIds = this.editorBlocks.map(b => b.id).sort();
    const correctIds = correct.map(b => b.id).sort();
    for (let i = 0; i < correctIds.length; i++) {
      if (userIds[i] !== correctIds[i]) return false;
    }

    // 3. インデント構造の論理的チェック
    // 制御構文の親子関係が模範解答と同じであるかをチェック
    // （例えば、ループの中に合計加算が入っているかなど、インデント差分の構造を比較）
    // 順序が異なる場合もあるが、対応するブロックIDのインデント値自体は正解と一致している必要がある
    for (let i = 0; i < this.editorBlocks.length; i++) {
      const userBlock = this.editorBlocks[i];
      const correctBlock = correct.find(b => b.id === userBlock.id);
      if (correctBlock && userBlock.indent !== correctBlock.indent) {
        return false;
      }
    }

    // 4. ハードモードでの穴埋め入力値のチェック
    if (this.currentDifficulty === "hard" && this.currentMode === "exercise") {
      for (let i = 0; i < this.editorBlocks.length; i++) {
        const userBlock = this.editorBlocks[i];
        const originalBlock = this.currentProblem.hardBlocks.find(b => b.id === userBlock.id);
        if (originalBlock && originalBlock.inputs) {
          // 入力キーごとに正解と比較
          const cardEl = this.editorList.querySelector(`.block-card[data-id="${userBlock.id}"]`);
          if (cardEl) {
            let inputsAllCorrect = true;
            Object.keys(originalBlock.inputs).forEach(key => {
              const inputEl = cardEl.querySelector(`input[data-input-key="${key}"]`);
              const userVal = this.normalizeInputText(inputEl ? inputEl.value : "");
              const correctVal = this.normalizeInputText(originalBlock.inputs[key].correct);
              if (userVal !== correctVal) {
                inputsAllCorrect = false;
              }
            });
            if (!inputsAllCorrect) return false;
          } else {
            return false;
          }
        }
      }
    }

    // 5. 実行結果（コンソール出力）が期待値と完全に一致しているかチェック
    // 模範解答を同じ初期値で実行した期待される出力を取得
    const initialVars = this.getCurrentVariablesState();
    const expectedResult = this.interpreter.run(correct, initialVars);
    
    if (!expectedResult.success) return false;

    const userOutput = this.traceResults.output;
    const expectedOutput = expectedResult.output;

    if (userOutput.length !== expectedOutput.length) return false;
    for (let i = 0; i < expectedOutput.length; i++) {
      if (userOutput[i] !== expectedOutput[i]) return false;
    }

    return true;
  }

  /**
   * 典型的な誤答パターンの並び順とインデントを分析し、具体的なデバッグアドバイスを返します。
   */
  getDetailedFeedback() {
    const problemId = this.currentProblem.id;
    const blocks = this.editorBlocks;
    
    const getBlock = (id) => blocks.find(b => b.id === id);
    const getIndex = (id) => blocks.findIndex(b => b.id === id);

    if (problemId === "count_multiples_of_3") {
      const idxLoop = getIndex("b3");
      const idxIf = getIndex("b4");
      const idxAdd = getIndex("b5");
      const idxPrint = getIndex("b6");
      const idxInit = getIndex("b2");

      if (idxLoop === -1 || idxIf === -1 || idxAdd === -1 || idxPrint === -1 || idxInit === -1) {
        return "必要なカードが不足しています。すべてのカードを配置してください。";
      }

      const blockLoop = getBlock("b3");
      const blockIf = getBlock("b4");
      const blockAdd = getBlock("b5");
      const blockPrint = getBlock("b6");

      // 1. 初期化がループの中にある
      if (idxInit > idxLoop && blocks[idxInit].indent > blockLoop.indent) {
        return "【アドバイス】カウント初期化処理「個数 = 0」が繰り返し（ループ）の中に入っています。これでは繰り返すたびに個数が 0 にクリアされてしまいます。「個数 = 0」を繰り返しより上の位置に移動し、インデントを外してください。";
      }

      // 2. 条件判定がループの外
      if (idxIf < idxLoop || blockIf.indent <= blockLoop.indent) {
        return "【アドバイス】条件判定「もし i % 3 == 0 ならば:」が繰り返しの外にあります。ループの中で各数値をチェックするために、このカードのインデントを下げて繰り返しの中に配置してください。";
      }

      // 3. カウントアップが条件分岐の外
      if (idxAdd < idxIf || blockAdd.indent <= blockIf.indent) {
        return "【アドバイス】個数を増やす処理「個数 = 個数 + 1」が、条件判定「もし i % 3 == 0 ならば:」の範囲に入っていません。このカードのインデントをさらに1段下げて（インデント2）、条件を満たしたときだけカウントされるようにしてください。";
      }

      // 4. 出力がループの中にある
      if (idxPrint > idxLoop && blockPrint.indent > blockLoop.indent) {
        return "【アドバイス】結果を表示する処理「個数 を表示する」が、繰り返し（ループ）の中に入っています。すべてのチェックが終わった最後に1回だけ表示されるよう、カードを一番下に移動し、インデントを外してください。";
      }
    }

    if (problemId === "sum_1_to_n") {
      const idxLoop = getIndex("b3");
      const idxAdd = getIndex("b4");
      const idxPrint = getIndex("b5");
      const idxInit = getIndex("b2");

      if (idxLoop === -1 || idxAdd === -1 || idxPrint === -1 || idxInit === -1) {
        return "必要なカードが不足しています。すべてのカードを配置してください。";
      }

      const blockLoop = getBlock("b3");
      const blockAdd = getBlock("b4");
      const blockPrint = getBlock("b5");

      // 1. 初期化がループの中にある
      if (idxInit > idxLoop && blocks[idxInit].indent > blockLoop.indent) {
        return "【アドバイス】変数をリセットする初期化処理「合計 = 0」が繰り返し（ループ）の中に入っています。これでは繰り返すたびに合計値が毎回クリアされてしまいます。「合計 = 0」を繰り返しより上の位置に移動し、インデントを外してください。";
      }
      
      // 2. 加算処理がループの外（下）にある
      if (idxAdd < idxLoop || blockAdd.indent <= blockLoop.indent) {
        return "【アドバイス】合計に i を足す処理「合計 = 合計 + i」が、繰り返し（ループ）の外にあります。これではループの中で値が加算されません。カードの右矢印ボタンを押してインデントを下げ、繰り返しの中に配置してください。";
      }

      // 3. 出力処理がループの中にある
      if (idxPrint > idxLoop && blockPrint.indent > blockLoop.indent) {
        return "【アドバイス】結果を表示する処理「合計 を表示する」が、繰り返し（ループ）の中に入っています。これでは途中の計算結果が何度も表示されてしまいます。「合計 を表示する」のインデントを減らして繰り返しの外に出すか、カードを一番下に移動してください。";
      }
      
      // 4. 初期化が加算より下（しかしループの外）にある
      if (idxInit > idxAdd) {
        return "【アドバイス】「合計 = 0」の初期化処理が、足し算処理「合計 = 合計 + i」より下にあります。計算を始める前に初期化されるように、初期化カードを上に移動してください。";
      }
    }

    if (problemId === "find_max") {
      const idxLoop = getIndex("b2");
      const idxIf = getIndex("b3");
      const idxUpdate = getIndex("b4");
      const idxPrint = getIndex("b5");
      const idxInit = getIndex("b1");

      if (idxLoop === -1 || idxIf === -1 || idxUpdate === -1 || idxPrint === -1 || idxInit === -1) {
        return "必要なカードが不足しています。";
      }

      const blockLoop = getBlock("b2");
      const blockIf = getBlock("b3");
      const blockUpdate = getBlock("b4");
      const blockPrint = getBlock("b5");

      // 1. 条件分岐がループの外にある
      if (idxIf < idxLoop || blockIf.indent <= blockLoop.indent) {
        return "【アドバイス】条件判定「もし A[i] > 最大値 ならば:」が繰り返しの外にあります。配列の各要素を順番に調べるために、このカードを繰り返しの中（インデントを下げた位置）に配置してください。";
      }

      // 2. 更新処理が条件分岐の外にある
      if (idxUpdate < idxIf || blockUpdate.indent <= blockIf.indent) {
        return "【アドバイス】最大値を更新する処理「最大値 = A[i]」が、条件判定「もし A[i] > 最大値 ならば:」の範囲に入っていません。このカードのインデントをさらに1段下げて（インデント2）、条件を満たしたときだけ実行されるようにしてください。";
      }

      // 3. 出力がループの中にある
      if (idxPrint > idxLoop && blockPrint.indent > blockLoop.indent) {
        return "【アドバイス】結果を表示する処理「最大値 を表示する」が繰り返しの中に入っています。すべてのチェックが終わった最後に1回だけ表示されるよう、カードを一番下に移動し、インデントを外してください。";
      }
      
      // 4. 初期化がループの中にある
      if (idxInit > idxLoop) {
        return "【アドバイス】初期化「最大値 = A[0]」が繰り返しの中にあります。これでは毎回最大値が先頭の値にリセットされてしまいます。初期化カードを一番上に移動してください。";
      }
    }

    if (problemId === "linear_search") {
      const idxInit = getIndex("b1");
      const idxLoop = getIndex("b2");
      const idxIf = getIndex("b3");
      const idxAssign = getIndex("b4");
      const idxBreak = getIndex("b5");
      const idxPrint = getIndex("b6");

      if (idxInit === -1 || idxLoop === -1 || idxIf === -1 || idxAssign === -1 || idxBreak === -1 || idxPrint === -1) {
        return "必要なカードが不足しています。";
      }

      const blockLoop = getBlock("b2");
      const blockIf = getBlock("b3");
      const blockAssign = getBlock("b4");
      const blockBreak = getBlock("b5");
      const blockPrint = getBlock("b6");

      // 1. 条件判定がループの外
      if (idxIf < idxLoop || blockIf.indent <= blockLoop.indent) {
        return "【アドバイス】条件判定「もし A[i] == target ならば:」が繰り返しの外にあります。配列の値を調べるために、繰り返しの中（インデントを下げた位置）に配置してください。";
      }

      // 2. 位置代入が条件分岐の外
      if (idxAssign < idxIf || blockAssign.indent <= blockIf.indent) {
        return "【アドバイス】見つかった位置を記録する「位置 = i」が、条件判定「もし A[i] == target ならば:」の外側にあります。値が一致したときだけ記録されるよう、インデントを下げて（インデント2）配置してください。";
      }

      // 3. ループを抜けるが条件分岐の外
      if (idxBreak < idxIf || blockBreak.indent <= blockIf.indent) {
        return "【アドバイス】「ループを抜ける」が条件判定の外側にあります。これでは配列の最初の値を調べた直後に必ずループが終わってしまいます。インデントを下げて、見つかったときだけループを抜けるようにしてください。";
      }

      // 4. 出力がループの中
      if (idxPrint > idxLoop && blockPrint.indent > blockLoop.indent) {
        return "【アドバイス】出力処理「位置 を表示する」が繰り返しの中に入っています。探索がすべて終わった最後に表示されるよう、カードを一番下に移動し、インデントを外してください。";
      }
    }

    return "プログラムの結果が期待と異なります。カードの並び順やインデント、穴埋めの値を確認してください。";
  }

  resetExecution() {
    this.pauseCode();
    this.currentStepIndex = -1;
    this.traceResults = null;

    // ハイライトを消す
    this.editorList.querySelectorAll(".block-card").forEach(c => {
      c.classList.remove("active-line");
      c.classList.remove("reveal-error");
    });
    
    // 変数とコンソールの初期化
    this.consoleOutput.innerHTML = "";
    if (this.currentProblem) {
      this.updateVariableMonitor(this.currentProblem.initialState);
    }
    this.updateStepControls();
  }

  // --- AI プロンプト連携機能 ---

  generateAIPrompt() {
    const problem = this.currentProblem;
    const userCode = this.previewCode.textContent;
    const consoleText = this.consoleOutput.textContent || "(実行結果なし)";
    const difficultyStr = this.currentDifficulty === "easy" ? "イージー (並び替えのみ)" :
                          this.currentDifficulty === "normal" ? "ノーマル (ダミーカード混入)" :
                          "ハード (穴埋め問題)";

    return `あなたは共通テスト「情報I」のプログラミング（DNCL疑似言語）を教える優秀な家庭教師AIです。
現在、学習用アプリで以下の問題に取り組んでいますが、正しく動作しないか、思ったような結果になりません。
私のコードのどこが論理的、あるいは構文的に間違っているかをわかりやすく指摘し、正しい考え方を解説してください。

---

### 1. 取り組んでいる問題
* **問題タイトル**: ${problem.title}
* **難易度設定**: ${difficultyStr}
* **問題の説明**: 
${problem.description}

### 2. 私が組み立てたプログラム（DNCL）
\`\`\`text
${userCode}
\`\`\`
※ 各行の左側のスペース（インデント）は、私が設定したブロックの階層構造（入れ子関係）を表しています。

### 3. プログラム実行時の出力・エラー
\`\`\`text
${consoleText}
\`\`\`

### 4. AIへの質問
このプログラムが正しく動かない原因を解説してください。
特に、以下のポイントについてアドバイスが欲しいです：
- カードの並べ方の順序が論理的にあっているか
- インデント（「もし〜」「繰り返し〜」の範囲）のつけ方が正しいか
- （ハードモードの場合）穴埋めに入力した値が適切か
`;
  }

  openAIModal() {
    const prompt = this.generateAIPrompt();
    this.promptTextarea.value = prompt;
    this.aiModal.classList.add("open");
  }

  closeAIModal() {
    this.aiModal.classList.remove("open");
  }

  copyPromptToClipboard() {
    this.promptTextarea.select();
    navigator.clipboard.writeText(this.promptTextarea.value)
      .then(() => {
        const originalText = this.copyPromptBtn.innerHTML;
        this.copyPromptBtn.innerHTML = '<i class="fas fa-check"></i> コピーしました！';
        this.copyPromptBtn.style.background = "var(--accent-green)";
        setTimeout(() => {
          this.copyPromptBtn.innerHTML = originalText;
          this.copyPromptBtn.style.background = "";
        }, 2000);
      })
      .catch(err => {
        alert("コピーに失敗しました。テキストエリアから直接選択してコピーしてください。");
      });
  }

  downloadPromptFile() {
    const prompt = this.promptTextarea.value;
    const blob = new Blob([prompt], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `dncl_qa_prompt_${this.currentProblem.id}.md`;
    link.style.display = "none";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  openAnswerModal() {
    if (!this.currentProblem) return;
    
    const correctBlocks = this.currentProblem.correctBlocks;
    const lines = correctBlocks.map(b => {
      const space = "  ".repeat(b.indent);
      return space + b.text;
    });
    
    this.answerCodePreview.textContent = lines.join("\n");
    this.answerExplanationText.textContent = this.currentProblem.explanation;
    this.answerModal.classList.add("open");
  }

  closeAnswerModal() {
    this.answerModal.classList.remove("open");
  }

  /**
   * 入力された全角文字（英数字、大かっこ、マイナス等）を半角に正規化します。
   */
  normalizeInputText(str) {
    if (!str) return "";
    return str.trim()
      // 全角英数字を半角に変換
      .replace(/[！-～]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
      // 特殊な全角記号を半角に変換
      .replace(/　/g, " ")
      .replace(/－/g, "-")
      .replace(/ー/g, "-")
      .replace(/［/g, "[")
      .replace(/］/g, "]")
      .replace(/（/g, "(")
      .replace(/）/g, ")")
      .replace(/＝/g, "=")
      .replace(/＋/g, "+");
  }
}

// アプリの起動
document.addEventListener("DOMContentLoaded", () => {
  window.dnclApp = new DNCLApp();
});
