// DNCL学習アプリ メインロジック

class DNCLApp {
  constructor() {
    this.interpreter = new DNCLInterpreter();
    // Python 対照は付加機能。変換器が読めなかったときに
    // アプリ全体（問題の読み込みやカード操作）まで巻き添えで死なせない
    this.toPython = (typeof DNCLToPython !== "undefined") ? new DNCLToPython() : null;
    this.previewMode = this.toPython ? "pair" : "dncl"; // pair（対照）/ dncl / python
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

    // 小画面用：実行シート（実行中に右ペインを画面下へ固定する）
    this.sheetBar = document.getElementById("sheet-bar");
    this.sheetControls = document.getElementById("sheet-controls");
    this.sheetToggle = document.getElementById("sheet-toggle");
    this.editorActions = document.querySelector(".editor-actions");
    this.speedControl = document.querySelector(".speed-control");
    this.stepControlsGroup = document.querySelector(".step-controls-group");
    this.descToggle = document.getElementById("desc-toggle");
    this.smallScreen = window.matchMedia("(max-width: 992px)");

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

    // モーダルは Escape で閉じ、開いている間は Tab を中に閉じ込める。
    // 閉じられない・後ろの画面へ出ていってしまうと、キーボードだけでは戻れなくなる
    document.addEventListener("keydown", (e) => {
      const modal = this.openModal();
      if (!modal) return;
      if (e.key === "Escape") {
        e.preventDefault();
        if (modal === this.aiModal) this.closeAIModal();
        else this.closeAnswerModal();
      } else if (e.key === "Tab") {
        this.trapFocus(e, modal);
      }
    });

    // モード切り替えタブ
    this.modeExerciseBtn.addEventListener("click", () => this.switchMode("exercise"));
    this.modeSyntaxBtn.addEventListener("click", () => this.switchMode("syntax"));

    // Python のコピー（実習環境に貼り付けて動かせるように）
    this.copyPythonBtn = document.getElementById("copy-python-btn");
    this.copyPythonBtn.addEventListener("click", () => this.copyPythonToClipboard());

    // コード表示の切り替え（対照 / DNCL / Python）
    if (!this.toPython) {
      // 変換器が無いときは、実装が無い機能の名前を画面に出さない
      const tabs = document.querySelector(".code-view-tabs");
      if (tabs) tabs.style.display = "none";
      this.copyPythonBtn.style.display = "none";
    }
    document.querySelectorAll(".code-view-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".code-view-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.previewMode = btn.dataset.view;
        this.updatePreview();
      });
    });

    // 実行シートの開閉（小画面）
    this.sheetToggle.addEventListener("click", () => {
      const collapsed = document.body.classList.toggle("sheet-collapsed");
      this.sheetToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    });

    // 画面の回転やウィンドウ幅の変更で、操作ボタンの置き場所（ヘッダー／シート）を選び直す
    window.addEventListener("resize", () => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => {
        this.syncSheetControls();
        this.updateDescToggle();
      }, 150);
    });

    // 問題文の折りたたみ（小画面）
    this.descToggle.addEventListener("click", () => {
      const expanded = document.body.classList.toggle("desc-expanded");
      this.descToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
      this.descToggle.textContent = expanded ? "とじる" : "続きを読む";
    });

    // 初心者向け基本解説アコーディオンのトグル制御
    const guideToggle = document.getElementById("guide-toggle");
    const guideBody = document.getElementById("guide-body");
    const guideIcon = document.getElementById("guide-toggle-icon");
    if (guideToggle && guideBody && guideIcon) {
      guideToggle.addEventListener("click", () => {
        const isHidden = guideBody.style.display === "none";
        guideBody.style.display = isHidden ? "block" : "none";
        guideIcon.style.transform = isHidden ? "rotate(180deg)" : "rotate(0deg)";
        guideToggle.setAttribute("aria-expanded", isHidden ? "true" : "false");
      });
    }

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

  /**
   * 小画面の実行中は「実行」ボタンとステップ操作を画面下のシートへ移す。
   * ヘッダー側に置いたままだと、コードをスクロールした時点で操作系が画面外に出てしまい
   * 「1行ずつみる」ができなくなるため。PC幅ではヘッダーへ戻す
   */
  syncSheetControls() {
    const toSheet = this.smallScreen.matches && document.body.classList.contains("stepping");

    if (toSheet) {
      if (this.sheetControls.contains(this.runBtn)) return;
      this.sheetControls.appendChild(this.runBtn);
      this.sheetControls.appendChild(this.stepControlsGroup);
    } else {
      if (this.editorActions.contains(this.runBtn)) return;
      // 元の並び（実行 → ステップ操作 → 速度 → …）に戻す
      this.editorActions.insertBefore(this.runBtn, this.speedControl);
      this.editorActions.insertBefore(this.stepControlsGroup, this.speedControl);
    }
  }

  enterSteppingMode() {
    document.body.classList.add("stepping");
    document.body.classList.remove("sheet-collapsed");
    this.sheetToggle.setAttribute("aria-expanded", "true");
    this.syncSheetControls();
  }

  exitSteppingMode() {
    document.body.classList.remove("stepping", "sheet-collapsed");
    this.syncSheetControls();
  }

  /**
   * 問題文が3行に収まらないときだけ「続きを読む」を出す（小画面のみ有効なCSS）
   */
  updateDescToggle() {
    document.body.classList.remove("desc-expanded");
    this.descToggle.textContent = "続きを読む";
    this.descToggle.setAttribute("aria-expanded", "false");
    const clipped = this.problemDesc.scrollHeight - this.problemDesc.clientHeight > 2;
    document.body.classList.toggle("desc-clipped", clipped);
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
    this.updateDescToggle();
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
          <span>トレイのカードをタップすると、ここに並びます</span>
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

    // マウスやタッチが使えなくてもカードを並べられるようにする。
    // 固定カード（isLocked）は動かせないので、素通りさせてタブ移動の邪魔をしない
    if (!block.isLocked) {
      card.tabIndex = 0;
      card.setAttribute("role", "button");
    }

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

    // ハードモードの穴埋め入力欄のレンダリング。
    // カードの文には「もし A[i] < 最小値 ならば:」のように < や > が入る。
    // 文字列を組み立てて innerHTML に入れると、空白の入り方しだいでタグとして解釈され、
    // カードの文が消える。テキストと入力欄を要素として組み立てる
    if (block.inputs && this.currentDifficulty === "hard" && this.currentMode === "exercise") {
      const placeholder = /\[([a-zA-Z0-9_]+)\]/g;
      let cursor = 0;
      let found;
      while ((found = placeholder.exec(block.text)) !== null) {
        const spec = block.inputs[found[1]];
        if (!spec) continue; // 配列の添字 A[i] などは穴埋めではないので、そのまま文字として出す
        textSpan.appendChild(document.createTextNode(block.text.slice(cursor, found.index)));

        const input = document.createElement("input");
        input.type = "text";
        input.className = "block-input";
        input.dataset.inputKey = found[1];
        input.placeholder = spec.placeholder;
        input.setAttribute("aria-label", spec.placeholder);
        input.addEventListener("input", () => this.updatePreview());
        // ドラッグ開始時にテキストボックスがフォーカスされてキー入力イベントが奪われるのを防ぐ
        input.addEventListener("mousedown", (e) => e.stopPropagation());
        textSpan.appendChild(input);

        cursor = found.index + found[0].length;
      }
      textSpan.appendChild(document.createTextNode(block.text.slice(cursor)));
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

    // インデント操作用ボタン（エディタに配置された時のみ有効化できるようにイベントは常時バインドし表示はCSSで制御）
    const btnGroup = document.createElement("div");
    btnGroup.className = "indent-btn-group";

    const decBtn = document.createElement("button");
    decBtn.className = "indent-btn dec-indent";
    decBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    decBtn.title = "インデントを減らす";
    decBtn.type = "button";
    decBtn.setAttribute("aria-label", "インデントを減らす");
    decBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.adjustIndent(card, -1);
    });

    const incBtn = document.createElement("button");
    incBtn.className = "indent-btn inc-indent";
    incBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    incBtn.title = "インデントを増やす";
    incBtn.type = "button";
    incBtn.setAttribute("aria-label", "インデントを増やす");
    incBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.adjustIndent(card, 1);
    });

    btnGroup.appendChild(decBtn);
    btnGroup.appendChild(incBtn);
    
    // インデントボタンを左側、テキストスパンを右側にするため、ボタンを先にアペンドする
    card.appendChild(btnGroup);
    card.appendChild(textSpan);

    // タップ（シングルクリック）でトレイ⇔エディタを行き来させる。
    // 以前はダブルクリックだったが、スマホではダブルタップがブラウザのズーム操作と
    // 衝突して安定せず、そもそも「タップで動く」と伝わっていなかった
    card.addEventListener("click", (e) => {
      // インプット要素やインデントボタンのタップ時は何もしない
      if (e.target.tagName === "INPUT" || e.target.closest(".indent-btn-group")) {
        return;
      }

      // ドラッグ操作中、または直後のクリック誤動作をガード
      if (this.isDragging) {
        return;
      }

      this.handleCardTap(card);
    });

    // キーボードだけで並べられるようにする（学校のPC教室やマウスを使いにくい生徒のため）。
    // Enter/Space でトレイ⇔エディタ、←→ でインデント、↑↓ でエディタ内の入れ替え
    card.addEventListener("keydown", (e) => this.handleCardKey(e, card));

    this.updateCardLabel(card);
    return card;
  }

  /**
   * 読み上げ用のラベル。カードの文字だけでは字下げが伝わらないので段数を添える
   */
  updateCardLabel(card) {
    const textSpan = card.querySelector(".block-text");
    if (!textSpan) return;
    const indent = parseInt(card.dataset.indent || "0", 10);
    const where = this.editorList.contains(card) ? "組み立てエリア" : "カードトレイ";
    card.setAttribute("aria-label", `${textSpan.textContent}（${where}・字下げ ${indent} 段）`);
  }

  /**
   * カードの上でのキー操作。マウスでできることは全部キーボードでもできるようにする
   */
  handleCardKey(e, card) {
    if (e.target.tagName === "INPUT") return; // 穴埋めの入力中は横取りしない
    const inEditor = this.editorList.contains(card);

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.handleCardTap(card);
      card.focus();
      this.updateCardLabel(card);
    } else if (inEditor && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      e.preventDefault();
      this.adjustIndent(card, e.key === "ArrowRight" ? 1 : -1);
      card.focus();
    } else if (inEditor && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      this.moveCardInEditor(card, e.key === "ArrowUp" ? -1 : 1);
    }
  }

  /**
   * エディタの中でカードを1つ上／下へ動かす。
   * 並べ替えがドラッグしかないと、キーボードでは順序を直せない
   */
  moveCardInEditor(card, dir) {
    if (card.dataset.isLocked === "true") return;
    const cards = Array.from(this.editorList.querySelectorAll(".block-card"));
    const to = cards.indexOf(card) + dir;
    if (to < 0 || to >= cards.length) return;

    if (dir < 0) this.editorList.insertBefore(card, cards[to]);
    else this.editorList.insertBefore(card, cards[to].nextElementSibling);

    this.onBlocksChanged();
    card.focus();
  }

  /**
   * カードタップ時にトレイとエディタ間を自動で移動させる（タッチ操作の補助）
   */
  handleCardTap(card) {
    if (card.dataset.isLocked === "true") return; // ロックされたカードはタップで移動しない
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

    this.updateCardLabel(card);
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

    this.updateCardLabel(card);
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
            <span>トレイのカードをタップすると、ここに並びます</span>
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
      this.previewCode.classList.remove("paired");
      return;
    }

    if (this.previewMode === "dncl" || !this.toPython) {
      this.previewCode.classList.remove("paired");
      this.previewCode.textContent = this.editorBlocks
        .map(b => "  ".repeat(b.indent) + b.text)
        .join("\n");
      return;
    }

    if (this.previewMode === "python") {
      this.previewCode.classList.remove("paired");
      this.previewCode.textContent = this.toPython.toSource(this.editorBlocks);
      return;
    }

    // 対照表示: DNCL の1行と Python の1行を上下に並べる。
    // 右ペインは狭いので左右2カラムにはせず、行ごとの組にする
    this.previewCode.classList.add("paired");
    this.previewCode.innerHTML = "";
    this.toPython.convertBlocks(this.editorBlocks).forEach(row => {
      const pair = document.createElement("div");
      pair.className = "code-pair";
      pair.style.paddingLeft = `${row.indent * 1.2}em`;

      const dncl = document.createElement("div");
      dncl.className = "code-dncl";
      dncl.textContent = row.dncl;

      const py = document.createElement("div");
      py.className = "code-py" + (row.same ? " same" : "");
      py.textContent = row.python;

      pair.appendChild(dncl);
      pair.appendChild(py);
      this.previewCode.appendChild(pair);
    });
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
      // エラー文には、ハードモードで生徒が打った文字がそのまま混ざる。
      // innerHTML に入れず、文字として出す
      this.consoleOutput.innerHTML = "";
      const errLine = document.createElement("div");
      errLine.className = "console-line";
      errLine.style.borderLeftColor = "var(--accent-red)";
      errLine.style.color = "var(--accent-red)";
      errLine.textContent = this.traceResults.error;
      this.consoleOutput.appendChild(errLine);
      this.statusBar.className = "status-bar fail";
      this.statusText.innerHTML = `<i class="fas fa-times-circle"></i> 実行エラーが発生しました。カードの順序や穴埋めを確認してください。`;
      this.statusBar.style.display = "flex";
      this.updateStepControls();
      this.enterSteppingMode(); // エラー文もシート内のコンソールに出るので、シートは開く
      return false;
    }

    this.currentStepIndex = 0;
    this.enterSteppingMode();
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
    
    // 既存の解説吹き出しをクリア
    const oldNarration = this.editorList.querySelector(".step-narration");
    if (oldNarration) oldNarration.remove();

    cards.forEach((c, idx) => {
      if (idx === activeBlockIndex) {
        c.classList.add("active-line");
        c.scrollIntoView({ behavior: "smooth", block: "nearest" });

        // 今回のアクティブカードの下に日本語解説（ナレーション）を動的生成して差し込む
        const blockId = c.dataset.id;
        const narratives = this.currentProblem.narratives;
        if (narratives && narratives[blockId]) {
          const text = narratives[blockId](trace.variables);
          if (text) {
            // ナレーションには変数の中身が入る＝ハードモードでは生徒が打った文字が混ざる。
            // 文字として出す
            const narDiv = document.createElement("div");
            narDiv.className = "step-narration";
            const icon = document.createElement("i");
            icon.className = "fas fa-comment-dots";
            const label = document.createElement("span");
            label.textContent = text;
            narDiv.appendChild(icon);
            narDiv.appendChild(label);
            c.appendChild(narDiv);
          }
        }
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
          failMessage = `【ヒント】使用している「${this.escapeText(dummyUsed.text)}」カードに問題があります。<br>${dummySpec.reason}`;
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

  /**
   * 判定メッセージにカードの文を差し込むときに通す。
   * ハードモードのカードの文には生徒が打った文字が入るので、記号をそのまま
   * innerHTML に流すと表示が壊れる
   */
  escapeText(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
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

    // 6. カードの並び順が模範解答（＋ problems.js の swappable で宣言した入れ替え）と一致しているか。
    // 出力の一致（5）だけでは足りない: 初期値が initialState に入っているため、初期化カードを
    // ループの後ろに置いても出力が同じになる問題がある（例: array_sum_avg の「合計 = 0」）
    //
    // 公開直後は index.html だけ先に配られて order-rules.js が 404 になる瞬間がある
    // （キャッシュバスターが無いので伝播のずれがそのまま出る）。そのときは並び順の判定を
    // 見送る。ここで例外にすると、実行し終えても判定が出ないアプリになってしまう
    if (typeof DNCLOrder === "undefined") {
      console.error("order-rules.js が読み込めていないため、並び順の判定を省きました。ページを再読み込みしてください。");
    } else if (!DNCLOrder.isAllowed(this.currentProblem, this.editorBlocks.map(b => b.id))) {
      return false;
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

    // 順序依存のエラーハンドリング
    if (problemId === "sum_1_to_n") {
      const idxN = getIndex("b1");
      const idxInit = getIndex("b2");
      const idxLoop = getIndex("b3");
      const idxAdd = getIndex("b4");
      const idxPrint = getIndex("b5");

      if (idxN === -1 || idxInit === -1 || idxLoop === -1 || idxAdd === -1 || idxPrint === -1) {
        return "必要なカードが不足しています。すべてのカードを配置してください。";
      }

      const blockLoop = getBlock("b3");
      const blockAdd = getBlock("b4");
      const blockPrint = getBlock("b5");

      // A. 初期設定がループより下にある
      if (idxN > idxLoop || idxInit > idxLoop) {
        return "【アドバイス】初期設定「N = 10」や「合計 = 0」が繰り返し（ループ）より下に配置されています。これでは繰り返しが始まる前に変数の準備ができません。初期設定カードを繰り返しの上の位置に移動してください。";
      }
      // B. 初期化がループの中にある
      if (idxInit > idxLoop && blocks[idxInit].indent > blockLoop.indent) {
        return "【アドバイス】変数を値リセットする「合計 = 0」が繰り返し（ループ）の中に入っています。これでは繰り返すたびに合計がクリアされてしまいます。「合計 = 0」を繰り返しより上に移動し、インデントを外してください。";
      }
      // C. 加算処理がループの外
      if (idxAdd < idxLoop || blockAdd.indent <= blockLoop.indent) {
        return "【アドバイス】合計に i を足す処理「合計 = 合計 + i」が繰り返しの外にあります。インデントを下げて繰り返しの中に配置してください。";
      }
      // D. 出力処理がループの中
      if (idxPrint > idxLoop && blockPrint.indent > blockLoop.indent) {
        return "【アドバイス】結果を表示する「表示する(合計)」が繰り返しの中に入っています。すべての処理が終わった最後に1回だけ表示するよう、インデントを外すかカードを一番下に移動してください。";
      }
    }

    if (problemId === "count_multiples_of_3") {
      const idxN = getIndex("b1");
      const idxInit = getIndex("b2");
      const idxLoop = getIndex("b3");
      const idxIf = getIndex("b4");
      const idxAdd = getIndex("b5");
      const idxPrint = getIndex("b6");

      if (idxN === -1 || idxInit === -1 || idxLoop === -1 || idxIf === -1 || idxAdd === -1 || idxPrint === -1) {
        return "必要なカードが不足しています。すべてのカードを配置してください。";
      }

      const blockLoop = getBlock("b3");
      const blockIf = getBlock("b4");
      const blockAdd = getBlock("b5");
      const blockPrint = getBlock("b6");

      // A. 初期設定がループより下にある
      if (idxN > idxLoop || idxInit > idxLoop) {
        return "【アドバイス】初期設定「N = 20」や「個数 = 0」が繰り返し（ループ）より下に配置されています。これでは繰り返しが始まる前に変数の準備ができません。初期設定カードを繰り返しの上の位置に移動してください。";
      }
      // B. 初期化がループの中
      if (idxInit > idxLoop && blocks[idxInit].indent > blockLoop.indent) {
        return "【アドバイス】カウント初期化「個数 = 0」が繰り返し（ループ）の中に入っています。これでは繰り返すたびに個数が 0 にクリアされてしまいます。「個数 = 0」を繰り返しより上の位置に移動し、インデントを外してください。";
      }
      // C. 条件判定がループの外
      if (idxIf < idxLoop || blockIf.indent <= blockLoop.indent) {
        return "【アドバイス】条件判定「もし i % 3 == 0 ならば:」が繰り返しの外にあります。インデントを下げて繰り返しの中に配置してください。";
      }
      // D. カウントアップが条件分岐の外
      if (idxAdd < idxIf || blockAdd.indent <= blockIf.indent) {
        return "【アドバイス】個数を増やす「個数 = 個数 + 1」が、条件判定の範囲に入っていません。インデントをさらに1段下げて（インデント2）、条件を満たしたときだけ実行されるようにしてください。";
      }
      // E. 出力がループの中
      if (idxPrint > idxLoop && blockPrint.indent > blockLoop.indent) {
        return "【アドバイス】結果を表示する「表示する(個数)」が繰り返しの中に入っています。繰り返しの最後で1回だけ表示されるよう、インデントを外してカードを一番下に移動してください。";
      }
    }

    if (problemId === "leap_year") {
      const idxYear = getIndex("b1");
      const idxLeap = getIndex("b2");
      const idxIf1 = getIndex("b3");
      const idxIf2 = getIndex("b4");
      const idxSet = getIndex("b5");
      const idxPrint = getIndex("b6");

      if (idxYear === -1 || idxLeap === -1 || idxIf1 === -1 || idxIf2 === -1 || idxSet === -1 || idxPrint === -1) {
        return "必要なカードが不足しています。";
      }

      // A. 初期設定が条件判定より下にある
      if (idxYear > idxIf1 || idxLeap > idxIf1) {
        return "【アドバイス】前提設定「西暦 = 2024」や初期化「うるう年 = 0」が、判定処理（もし）より下に配置されています。判定を行う前にこれらが初期化されるよう、一番上の位置に配置してください。";
      }
    }

    if (problemId === "find_max") {
      const idxArr = getIndex("b0");
      const idxInit = getIndex("b1");
      const idxLoop = getIndex("b2");
      const idxIf = getIndex("b3");
      const idxUpdate = getIndex("b4");
      const idxPrint = getIndex("b5");

      if (idxLoop === -1 || idxIf === -1 || idxUpdate === -1 || idxPrint === -1 || idxInit === -1 || idxArr === -1) {
        return "必要なカードが不足しています。";
      }

      const blockLoop = getBlock("b2");
      const blockIf = getBlock("b3");
      const blockUpdate = getBlock("b4");
      const blockPrint = getBlock("b5");

      // A. 初期化・初期設定がループより下にある
      if (idxArr > idxLoop || idxInit > idxLoop) {
        return "【アドバイス】前提設定「A = [12, 45, 78, 34, 89, 56]」や初期化「最大値 = A[0]」が繰り返し（ループ）より下に配置されています。繰り返しに入る前にこれらが完了するよう、一番上に移動してください。";
      }
      // B. 条件分岐がループの外
      if (idxIf < idxLoop || blockIf.indent <= blockLoop.indent) {
        return "【アドバイス】条件判定「もし A[i] > 最大値 ならば:」が繰り返しの外にあります。インデントを下げて繰り返しの中に配置してください。";
      }
      // C. 更新処理が条件分岐の外
      if (idxUpdate < idxIf || blockUpdate.indent <= blockIf.indent) {
        return "【アドバイス】最大値を更新する「最大値 = A[i]」が条件判定に入っていません。インデントをさらに1段下げて（インデント2）、条件を満たしたときだけ実行されるようにしてください。";
      }
      // D. 出力がループの中
      if (idxPrint > idxLoop && blockPrint.indent > blockLoop.indent) {
        return "【アドバイス】結果を表示する「表示する(最大値)」が繰り返しの中に入っています。インデントを外してカードを一番下に移動してください。";
      }
    }

    if (problemId === "euclidean_algorithm") {
      const idxA = getIndex("b1");
      const idxB = getIndex("b2");
      const idxLoop = getIndex("b3");

      if (idxA === -1 || idxB === -1 || idxLoop === -1) {
        return "必要なカードが不足しています。";
      }

      // A. 初期設定がループより下にある
      if (idxA > idxLoop || idxB > idxLoop) {
        return "【アドバイス】前提設定「A = 48」や「B = 18」が、繰り返し（間、繰り返す）より下に配置されています。これでは繰り返しが始まる前に数値の準備ができません。初期設定カードを繰り返しの上の位置に移動してください。";
      }
    }

    if (problemId === "linear_search") {
      const idxArr = getIndex("b0_1");
      const idxTarget = getIndex("b0_2");
      const idxInit = getIndex("b1");
      const idxLoop = getIndex("b2");
      const idxIf = getIndex("b3");
      const idxAssign = getIndex("b4");
      const idxBreak = getIndex("b5");
      const idxPrint = getIndex("b6");

      if (idxArr === -1 || idxTarget === -1 || idxInit === -1 || idxLoop === -1 || idxIf === -1 || idxAssign === -1 || idxBreak === -1 || idxPrint === -1) {
        return "必要なカードが不足しています。";
      }

      const blockLoop = getBlock("b2");
      const blockIf = getBlock("b3");
      const blockAssign = getBlock("b4");
      const blockBreak = getBlock("b5");
      const blockPrint = getBlock("b6");

      // A. 初期化がループより下にある
      if (idxArr > idxLoop || idxTarget > idxLoop || idxInit > idxLoop) {
        return "【アドバイス】前提設定「A = [8, 3, 5, 9, 2]」や「target = 9」、初期設定「位置 = -1」が、繰り返し（ループ）より下に配置されています。これでは繰り返しが始まる前に初期化が完了しません。これらを一番上に配置してください。";
      }
      // B. 条件判定がループの外
      if (idxIf < idxLoop || blockIf.indent <= blockLoop.indent) {
        return "【アドバイス】条件判定「もし A[i] == target ならば:」が繰り返しの外にあります。インデントを下げて繰り返しの中に配置してください。";
      }
      // C. 位置代入が条件分岐の外
      if (idxAssign < idxIf || blockAssign.indent <= blockIf.indent) {
        return "【アドバイス】見つかった位置を記録する「位置 = i」が条件判定の外にあります。インデントを下げて（インデント2）配置してください。";
      }
      // D. ループを抜けるが条件分岐の外
      if (idxBreak < idxIf || blockBreak.indent <= blockIf.indent) {
        return "【アドバイス】「ループを抜ける」が条件判定の外側にあります。インデントを下げて（インデント2）、見つかったときだけループを抜けるようにしてください。";
      }
      // E. 出力がループの中
      if (idxPrint > idxLoop && blockPrint.indent > blockLoop.indent) {
        return "【アドバイス】出力処理「表示する(位置)」が繰り返しの中に入っています。カードを一番下に移動し、インデントを外してください。";
      }
    }

    if (problemId === "coin_change") {
      const idxAmount = getIndex("b1");
      const idxCoins = getIndex("b0");
      const idxLoop = getIndex("b2");

      if (idxAmount === -1 || idxCoins === -1 || idxLoop === -1) {
        return "必要なカードが不足しています。";
      }

      // A. 初期設定がループより下にある
      if (idxAmount > idxLoop || idxCoins > idxLoop) {
        return "【アドバイス】前提設定「金額 = 780」や「硬貨 = [500, 100, 50, 10]」が、繰り返し（ループ）より下に配置されています。これでは繰り返しが始まる前に変数の初期化ができません。初期設定カードを繰り返しの上の位置に移動してください。";
      }
    }

    // 問題ごとの助言に当てはまらなかったときは、並び順のどこで模範解答から外れたかを指す。
    // 出力がたまたま合っていても、処理の順番が違えば別のプログラムになっている
    const mismatch = (typeof DNCLOrder !== "undefined")
      ? DNCLOrder.firstMismatch(this.currentProblem, blocks.map(b => b.id))
      : null;
    if (mismatch && mismatch.placedId) {
      const placed = getBlock(mismatch.placedId);
      return `【アドバイス】カードの並び順が正しくありません。上から ${mismatch.index + 1} 枚目（いま「${this.escapeText(placed ? placed.text : mismatch.placedId)}」があるところ）には、別のカードが来ます。実行の結果がたまたま同じでも、処理の順番が違うプログラムになっています。`;
    }

    return "プログラムの結果が期待と異なります。カードの並び順やインデント、穴埋めの値を確認してください。";
  }

  resetExecution() {
    this.pauseCode();
    this.exitSteppingMode();
    this.currentStepIndex = -1;
    this.traceResults = null;

    // ハイライトを消す
    this.editorList.querySelectorAll(".block-card").forEach(c => {
      c.classList.remove("active-line");
      c.classList.remove("reveal-error");
      const narration = c.querySelector(".step-narration");
      if (narration) narration.remove();
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

  /** いま開いているモーダル（無ければ null） */
  openModal() {
    if (this.aiModal.classList.contains("open")) return this.aiModal;
    if (this.answerModal.classList.contains("open")) return this.answerModal;
    return null;
  }

  /** モーダルの中の操作できる要素を、順番のまま集める */
  focusables(modal) {
    return Array.from(modal.querySelectorAll("button, textarea, input, select, a[href]"))
      .filter(el => !el.disabled && el.offsetParent !== null);
  }

  /** Tab がモーダルの外へ出ないように端で折り返す */
  trapFocus(e, modal) {
    const items = this.focusables(modal);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /** モーダルを開く前にいた場所を覚えておき、閉じたらそこへ返す */
  showModal(modal, focusTarget) {
    this.lastFocused = document.activeElement;
    modal.classList.add("open");
    if (focusTarget) focusTarget.focus();
  }

  hideModal(modal) {
    modal.classList.remove("open");
    if (this.lastFocused && document.contains(this.lastFocused)) this.lastFocused.focus();
    this.lastFocused = null;
  }

  openAIModal() {
    const prompt = this.generateAIPrompt();
    this.promptTextarea.value = prompt;
    this.showModal(this.aiModal, this.copyPromptBtn);
  }

  closeAIModal() {
    this.hideModal(this.aiModal);
  }

  /**
   * 組み立てたプログラムを Python として書き出してコピーする。
   * 表示の切り替え（対照 / DNCL / Python）に関わらず、コピーされるのは常に Python。
   * ボタンのラベルもそう書いてある
   */
  copyPythonToClipboard() {
    if (!this.toPython || this.editorBlocks.length === 0) return;
    const source = this.toPython.toSource(this.editorBlocks);

    const done = (ok) => {
      const original = this.copyPythonBtn.innerHTML;
      this.copyPythonBtn.innerHTML = ok
        ? '<i class="fas fa-check"></i>'
        : '<i class="fas fa-times"></i>';
      this.copyPythonBtn.classList.add(ok ? "copied" : "copy-failed");
      setTimeout(() => {
        this.copyPythonBtn.innerHTML = original;
        this.copyPythonBtn.classList.remove("copied", "copy-failed");
      }, 1600);
    };

    // http:// で開いた学校端末などでは navigator.clipboard が無い。
    // その場合も黙って失敗させず、選択用のテキストエリアを経由して試みる
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(source).then(() => done(true), () => done(this.copyByTextarea(source)));
    } else {
      done(this.copyByTextarea(source));
    }
  }

  copyByTextarea(text) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed; top:-1000px; opacity:0;";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {
      ok = false;
    }
    document.body.removeChild(ta);
    return ok;
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
    this.showModal(this.answerModal, this.closeAnswerModalBtn);
  }

  closeAnswerModal() {
    this.hideModal(this.answerModal);
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
