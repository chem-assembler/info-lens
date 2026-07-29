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

    // DOM要素のキャッシュ
    this.problemSelect = document.getElementById("problem-select");
    this.problemTitle = document.getElementById("problem-title");
    this.problemDesc = document.getElementById("problem-desc");
    this.difficultyBadge = document.getElementById("difficulty-badge");
    
    this.trayList = document.getElementById("tray-list");
    this.editorList = document.getElementById("editor-list");
    
    this.runBtn = document.getElementById("run-btn");
    this.stepBtn = document.getElementById("step-btn");
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
    this.stepBtn.addEventListener("click", () => this.stepForward());
    this.resetBtn.addEventListener("click", () => this.resetExecution());

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

    // SortableJSの初期化 (トレイとエディタの連携)
    new Sortable(this.trayList, {
      group: {
        name: "shared",
        pull: true,
        put: true
      },
      animation: 150,
      ghostClass: "sortable-ghost",
      onEnd: () => this.onBlocksChanged()
    });

    new Sortable(this.editorList, {
      group: {
        name: "shared",
        pull: true,
        put: true
      },
      animation: 150,
      ghostClass: "sortable-ghost",
      onEnd: () => this.onBlocksChanged()
    });
  }

  loadProblemList() {
    this.problemSelect.innerHTML = "";
    problems.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `${p.title} (${p.difficulty})`;
      this.problemSelect.appendChild(opt);
    });
    
    // 初期問題ロード
    if (problems.length > 0) {
      this.loadProblem(problems[0].id);
    }
  }

  loadProblem(id) {
    const problem = problems.find(p => p.id === id);
    if (!problem) return;
    this.currentProblem = problem;

    // UI更新
    this.problemTitle.textContent = problem.title;
    this.problemDesc.textContent = problem.description;
    
    this.difficultyBadge.textContent = problem.difficulty;
    this.difficultyBadge.className = "difficulty-badge";
    if (problem.difficulty === "初級") this.difficultyBadge.classList.add("easy");
    else if (problem.difficulty === "中級") this.difficultyBadge.classList.add("normal");
    else this.difficultyBadge.classList.add("hard");

    this.resetWorkspace();
  }

  resetWorkspace() {
    this.resetExecution();
    this.statusBar.style.display = "none";
    this.explanationSection.style.display = "none";

    // 難易度に応じたカードリストの取得
    let sourceBlocks = [];
    if (this.currentDifficulty === "easy") {
      sourceBlocks = [...this.currentProblem.easyBlocks];
    } else if (this.currentDifficulty === "normal") {
      sourceBlocks = [...this.currentProblem.normalBlocks];
    } else if (this.currentDifficulty === "hard") {
      sourceBlocks = [...this.currentProblem.hardBlocks];
    }

    // シャッフル
    sourceBlocks = this.shuffleArray(sourceBlocks);

    // トレイの初期化
    this.trayList.innerHTML = "";
    sourceBlocks.forEach(block => {
      const card = this.createBlockCard(block);
      this.trayList.appendChild(card);
    });

    // エディタの初期化 (最初は空)
    this.editorList.innerHTML = `
      <div class="empty-placeholder" id="workspace-placeholder">
        <i class="fas fa-code"></i>
        <span>ここにカードをドラッグ＆ドロップしてプログラムを組み立ててください</span>
      </div>
    `;

    this.editorBlocks = [];
    this.updatePreview();
    this.updateVariableMonitor(this.currentProblem.initialState);
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

    const textSpan = document.createElement("span");
    textSpan.className = "block-text";

    // ハードモードの穴埋め入力欄のレンダリング
    if (block.inputs && this.currentDifficulty === "hard") {
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

    return card;
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
        const originalBlock = this.currentProblem.hardBlocks.find(b => b.id === id);
        if (originalBlock) {
          rawText = originalBlock.text;
          card.querySelectorAll("input").forEach(input => {
            const key = input.dataset.inputKey;
            const val = input.value.trim() || `[${key}]`;
            rawText = rawText.replace(`[${key}]`, val);
          });
        }
        text = rawText;
      } else {
        text = textSpan.textContent;
      }

      return { id, text, indent, isDummy };
    });

    this.updatePreview();
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
    this.resetExecution();

    const initialVars = this.getCurrentVariablesState();
    
    // エミュレータの実行
    const result = this.interpreter.run(this.editorBlocks, initialVars);
    this.traceResults = result;

    if (!result.success) {
      // 実行中のコンパイルエラーなど
      this.consoleOutput.innerHTML = `<div class="console-line" style="border-left-color: var(--accent-red); color: var(--accent-red);">${result.error}</div>`;
      this.statusBar.className = "status-bar fail";
      this.statusText.innerHTML = `<i class="fas fa-times-circle"></i> 実行エラーが発生しました。カードの順序や穴埋めを確認してください。`;
      this.statusBar.style.display = "flex";
      return;
    }

    // 全てのステップをアニメーションするか、一気に最終結果を表示するか
    // 本機能では、自動でステップを進めて再生する
    this.playSteps();
  }

  playSteps() {
    this.isPlaying = true;
    this.currentStepIndex = 0;
    this.runBtn.disabled = true;
    this.stepBtn.disabled = true;

    this.playInterval = setInterval(() => {
      if (this.currentStepIndex < this.traceResults.trace.length) {
        this.renderStep(this.currentStepIndex);
        this.currentStepIndex++;
      } else {
        clearInterval(this.playInterval);
        this.onExecutionFinished();
      }
    }, 400); // 400ms間隔でステップが進む
  }

  stepForward() {
    // 初回ステップ実行時
    if (this.currentStepIndex === -1) {
      this.resetExecution();
      const initialVars = this.getCurrentVariablesState();
      this.traceResults = this.interpreter.run(this.editorBlocks, initialVars);
      
      if (!this.traceResults.success) {
        this.consoleOutput.innerHTML = `<div class="console-line" style="border-left-color: var(--accent-red); color: var(--accent-red);">${this.traceResults.error}</div>`;
        return;
      }
      this.currentStepIndex = 0;
    }

    if (this.traceResults && this.currentStepIndex < this.traceResults.trace.length) {
      this.renderStep(this.currentStepIndex);
      this.currentStepIndex++;
      
      if (this.currentStepIndex === this.traceResults.trace.length) {
        this.onExecutionFinished();
      }
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
    this.runBtn.disabled = false;
    this.stepBtn.disabled = false;

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
        }
      } else if (this.editorBlocks.length < this.currentProblem.correctBlocks.length) {
        failMessage = "プログラムの行数が足りないようです。必要なカードがすべて配置されているか確認してください。";
      }
      
      this.statusText.innerHTML = `<i class="fas fa-times-circle"></i> ${failMessage}`;
    }
  }

  checkSolution() {
    // 1. ブロック数の確認
    const correct = this.currentProblem.correctBlocks;
    if (this.editorBlocks.length !== correct.length) return false;

    // 2. 各ブロックのIDとインデントの確認
    for (let i = 0; i < correct.length; i++) {
      const userBlock = this.editorBlocks[i];
      const correctBlock = correct[i];

      // IDの一致（同じコードブロックか）
      if (userBlock.id !== correctBlock.id) return false;
      
      // インデントの一致
      if (userBlock.indent !== correctBlock.indent) return false;

      // ハードモードでの穴埋め入力値のチェック
      if (this.currentDifficulty === "hard") {
        const originalBlock = this.currentProblem.hardBlocks.find(b => b.id === userBlock.id);
        if (originalBlock && originalBlock.inputs) {
          // 入力キーごとに正解と比較
          const cardEl = this.editorList.querySelector(`.block-card[data-id="${userBlock.id}"]`);
          if (cardEl) {
            let inputsAllCorrect = true;
            Object.keys(originalBlock.inputs).forEach(key => {
              const inputEl = cardEl.querySelector(`input[data-input-key="${key}"]`);
              if (!inputEl || inputEl.value.trim() !== originalBlock.inputs[key].correct) {
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

    return true;
  }

  resetExecution() {
    if (this.playInterval) clearInterval(this.playInterval);
    this.isPlaying = false;
    this.currentStepIndex = -1;
    this.runBtn.disabled = false;
    this.stepBtn.disabled = false;
    this.traceResults = null;

    // ハイライトを消す
    this.editorList.querySelectorAll(".block-card").forEach(c => c.classList.remove("active-line"));
    
    // 変数とコンソールの初期化
    this.consoleOutput.innerHTML = "";
    this.updateVariableMonitor(this.currentProblem.initialState);
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
}

// アプリの起動
document.addEventListener("DOMContentLoaded", () => {
  window.dnclApp = new DNCLApp();
});
