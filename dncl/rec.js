/**
 * 録画モード（P13-4 / 設計: chem 側 DESIGN_recording_mode.md）
 *
 * URL パラメータ ?rec=<デモID> があるときだけ動く、SNS素材収録用の自動再生層。
 * パラメータが無ければ何もしない（通常利用・回帰テストに影響ゼロ）。
 *
 * chem（assembler/rec.js）は既存の TutorialPlayer を駆動するが、DNCL には
 * チュートリアル機構が無いので、この中に最小の再生器を持たせている。
 * 外から見えるインターフェースは chem と同一なので、収録ツール
 * （chem の tools/record/record.mjs）は --base を差し替えるだけで使える。
 *
 * パラメータ（レンズ共通規約）:
 *   rec     デモID（demos.json の id）                     必須
 *   format  wide | short（short=縦型9:16向けのSNS字幕）    既定 wide
 *   speed   再生速度倍率（0.25〜4）                        既定 1
 *   cursor  mouse | touch | none                           既定 touch
 *   caption 1 | 0（字幕の表示）                            既定 1
 *   delay   ロード完了から再生開始までの猶予 ms            既定 1000
 *
 * 進行状態は window.__recState（loading → playing → done / error）で外部の
 * 収録ツールに通知する。あわせて console にも [rec] を出す。
 *
 * 台本（demos.json）のアクション:
 *   {type:'wait',   ms}                  待つ
 *   {type:'card',   id}                  カードをタップして トレイ⇔エディタ を移動
 *   {type:'indent', id, delta}           カードのインデントを増減
 *   {type:'click',  selector}            任意の要素をタップ
 *   {type:'select', selector, value}     セレクトの値を変える
 *   {type:'step',   times, pause}        「1行ずつ」を times 回
 *   {type:'run',    stall}               「実行」を押して再生の完了まで待つ
 *                                        （stall=進まなくなったと判断する ms。既定 20000）
 *   {type:'scroll', selector}            要素が見えるところまでスクロール
 */
(function () {
    'use strict';

    const params = new URLSearchParams(window.location.search);
    const demoId = params.get('rec');
    if (!demoId) return;

    window.__recState = 'loading';
    // 操作の発生時刻。収録ツールが効果音を置く位置に使う（chem の P13-3 と同じ約束）
    window.__recEvents = [];
    window.__recOnAction = (type) => window.__recEvents.push({ t: Date.now(), type });

    // クリーン画面はスクリプト評価の時点で立てる（ヘッダー等の映り込みを防ぐ）
    document.documentElement.classList.add('recording');
    if (params.get('format') === 'short') document.documentElement.classList.add('rec-short');
    const cursorKind = params.get('cursor') || 'touch';
    if (cursorKind === 'none') document.documentElement.classList.add('rec-no-cursor');
    if (params.get('caption') === '0') document.documentElement.classList.add('rec-no-caption');

    const speed = Math.max(0.25, Math.min(4, parseFloat(params.get('speed')) || 1));
    const delay = Math.max(0, parseInt(params.get('delay'), 10) || 1000);

    class RecPlayer {
        constructor(app, speedScale) {
            this.app = app;
            this.speed = speedScale;
            this.buildOverlay();
        }

        // ---------- 画面演出 ----------

        buildOverlay() {
            const ov = document.createElement('div');
            ov.id = 'rec-overlay';

            const cursor = document.createElement('div');
            cursor.id = 'rec-cursor';
            if (cursorKind === 'touch') cursor.classList.add('touch');

            const caption = document.createElement('div');
            caption.id = 'rec-caption';

            ov.appendChild(cursor);
            ov.appendChild(caption);
            document.body.appendChild(ov);
            this.cursorEl = cursor;
            this.captionEl = caption;

            // 実行シートの高さは中身しだいで変わる（46vh は上限にすぎない）。
            // 字幕をシートのすぐ上に置くため、実測値を CSS 変数で渡し続ける
            this.offsetTimer = setInterval(() => this.syncSheetOffset(), 150);
            this.syncSheetOffset();
        }

        syncSheetOffset() {
            const sheet = document.body.classList.contains('stepping')
                ? document.getElementById('output-pane') : null;
            const r = sheet && sheet.getBoundingClientRect();
            // 横持ちでは右側パネルになり、下端は塞がない
            const h = (r && r.left < 4 && r.top > 0) ? Math.round(window.innerHeight - r.top) : 0;
            document.documentElement.style.setProperty('--rec-sheet-h', h + 'px');
        }

        teardown() {
            clearInterval(this.offsetTimer);
        }

        setCaption(text) {
            if (!this.captionEl) return;
            this.captionEl.textContent = text || '';
            this.captionEl.classList.toggle('empty', !text);
        }

        pulse() {
            if (!this.cursorEl) return;
            this.cursorEl.animate(
                [{ boxShadow: '0 0 0 0 rgba(167,139,250,0.9)' },
                 { boxShadow: '0 0 0 26px rgba(167,139,250,0)' }],
                { duration: 450 });
        }

        /** シート（実行中の下部固定パネル）に隠れない可視域の下端 */
        visibleBottom() {
            const sheet = document.body.classList.contains('stepping')
                ? document.getElementById('output-pane') : null;
            if (!sheet) return window.innerHeight;
            const r = sheet.getBoundingClientRect();
            // 横持ちでは右側パネルになるので、下端は制限されない
            return r.top > 0 && r.left < 4 ? r.top : window.innerHeight;
        }

        /**
         * 要素を可視域の中央付近まで運ぶ。
         * scroll-behavior:smooth に頼らず自前で補間する（収録環境によっては
         * smooth のアニメーションが走らず、座標がずれたままクリックしてしまうため）
         */
        async ensureVisible(el) {
            // 固定配置の中（実行シートへ移った「実行」「1行ずつ」など）は常に見えている。
            // スクロールしようとすると画面が飛ぶだけなので何もしない
            for (let p = el; p && p !== document.body; p = p.parentElement) {
                if (getComputedStyle(p).position === 'fixed') return;
            }
            const limit = this.visibleBottom();
            const r = el.getBoundingClientRect();
            if (r.top >= 8 && r.bottom <= limit - 8) return;
            const dy = r.top + r.height / 2 - limit / 2;
            await this.scrollBySmooth(dy);
        }

        scrollBySmooth(dy, ms = 340) {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const from = window.scrollY;
            const to = Math.max(0, Math.min(max, from + dy));
            if (Math.abs(to - from) < 2) return Promise.resolve();
            const dur = Math.max(1, ms / this.speed);
            const t0 = performance.now();
            return new Promise(resolve => {
                const tick = () => {
                    const p = Math.min(1, (performance.now() - t0) / dur);
                    const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
                    window.scrollTo(0, from + (to - from) * e);
                    if (p < 1) requestAnimationFrame(tick); else resolve();
                };
                tick();
            });
        }

        async moveCursor(el, durationMs = 350) {
            if (!this.cursorEl) return;
            const r = el.getBoundingClientRect();
            const ms = durationMs / this.speed;
            this.cursorEl.style.transition = `left ${ms}ms ease, top ${ms}ms ease`;
            this.cursorEl.style.left = (r.left + r.width / 2) + 'px';
            this.cursorEl.style.top = (r.top + r.height / 2) + 'px';
            await this.sleep(durationMs + 40);
        }

        sleep(ms) {
            if (ms <= 0) return Promise.resolve();
            return new Promise(r => setTimeout(r, ms / this.speed));
        }

        // ---------- 操作 ----------

        /** 要素まで画面を送り、カーソルを運んでからクリックする */
        async tap(el, after = 450) {
            await this.ensureVisible(el);
            await this.moveCursor(el);
            this.pulse();
            el.click();
            await this.sleep(after);
        }

        query(selector) {
            const el = document.querySelector(selector);
            if (!el) throw new Error('要素が見つかりません: ' + selector);
            return el;
        }

        card(id) {
            const el = document.querySelector(`.block-card[data-id="${id}"]`);
            if (!el) throw new Error('カードが見つかりません: ' + id);
            return el;
        }

        async doAction(a) {
            if (window.__recOnAction) window.__recOnAction(a.type);
            switch (a.type) {
                case 'wait':
                    await this.sleep(a.ms || 500);
                    break;
                case 'card':
                    await this.tap(this.card(a.id));
                    break;
                case 'indent': {
                    const btn = this.card(a.id)
                        .querySelector(a.delta > 0 ? '.inc-indent' : '.dec-indent');
                    if (!btn) throw new Error('インデント操作が見つかりません: ' + a.id);
                    for (let i = 0; i < Math.abs(a.delta || 1); i++) await this.tap(btn, 280);
                    break;
                }
                case 'click':
                    await this.tap(this.query(a.selector));
                    break;
                case 'select': {
                    const el = this.query(a.selector);
                    await this.ensureVisible(el);
                    await this.moveCursor(el);
                    this.pulse();
                    el.value = a.value;
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                    await this.sleep(600);
                    break;
                }
                case 'step': {
                    const btn = this.query('#step-forward-btn');
                    const times = a.times || 1;
                    for (let i = 0; i < times; i++) {
                        if (btn.disabled) break;
                        await this.tap(btn, a.pause || 900);
                    }
                    break;
                }
                case 'run': {
                    await this.tap(this.query('#run-btn'), 300);
                    await this.waitForPlaybackEnd(a.stall || 20000);
                    await this.sleep(600);
                    break;
                }
                case 'scroll':
                    await this.ensureVisible(this.query(a.selector));
                    await this.sleep(300);
                    break;
                default:
                    throw new Error('未知のアクション: ' + a.type);
            }
        }

        /**
         * 自動再生（#run-btn）が最後まで進むのを待つ。
         * 打ち切りは「経過時間の上限」ではなく「進まなくなったら」で見る。
         * 総時間で切ると、ステップ数の多い問題（整列など）や遅い環境で
         * 正常な再生まで失敗扱いになるため
         */
        waitForPlaybackEnd(stallMs) {
            const app = this.app;
            let lastIdx = -2;
            let lastMove = Date.now();
            return new Promise((resolve, reject) => {
                const tick = () => {
                    const tr = app.traceResults;
                    if (!tr) return reject(new Error('実行の準備ができていない'));
                    if (app.currentStepIndex !== lastIdx) {
                        lastIdx = app.currentStepIndex;
                        lastMove = Date.now();
                    }
                    const atEnd = app.currentStepIndex >= tr.trace.length - 1;
                    if (!app.isPlaying && (atEnd || !tr.success)) return resolve();
                    if (Date.now() - lastMove > stallMs) {
                        return reject(new Error(`再生が進まない（${app.currentStepIndex + 1}/${tr.trace.length}）`));
                    }
                    setTimeout(tick, 100);
                };
                tick();
            });
        }

        // ---------- 開始状態 ----------

        /**
         * 台本の state を適用する（chem の demos.json の `state` にあたる）。
         *   { mode, problem, difficulty, place:[カードID…] }
         * place は「演技を始める前にエディタへ置いておくカード」。
         * 空から全部並べると尺が長くなる台本のための頭出し。
         */
        applyState(state) {
            if (!state) return;
            const app = this.app;
            if (state.mode && state.mode !== app.currentMode) app.switchMode(state.mode);
            if (state.difficulty) {
                const tab = document.getElementById('tab-' + state.difficulty);
                if (tab) tab.click();
            }
            if (state.problem) {
                app.problemSelect.value = state.problem;
                app.loadProblem(state.problem);
            }
            (state.place || []).forEach(id => {
                const card = app.trayList.querySelector(`.block-card[data-id="${id}"]`);
                if (!card) return;
                app.handleCardTap(card);
                const spec = (app.currentProblem.correctBlocks || []).find(b => b.id === id);
                const want = (spec && spec.indent) || 0;
                for (let i = 0; i < want; i++) app.adjustIndent(card, 1);
            });
        }

        async play(demo) {
            this.applyState(demo.state);
            await this.sleep(400);
            for (const step of demo.steps || []) {
                this.setCaption(step.caption);
                for (const a of step.actions || []) await this.doAction(a);
                await this.sleep(step.hold || 1100); // 字幕を読む時間
            }
        }
    }

    async function start() {
        // アプリの初期化（DOMContentLoaded で window.dnclApp が入る）を待つ
        while (!(window.dnclApp && window.dnclApp.currentProblem)) {
            await new Promise(r => setTimeout(r, 100));
        }
        const app = window.dnclApp;

        let demos = [];
        try {
            const res = await fetch(new URL('demos.json', window.location.href).href, { cache: 'no-cache' });
            if (res.ok) demos = await res.json();
        } catch (e) {
            console.warn('[rec] demos.json のロードに失敗:', e);
        }
        const demo = demos.find(d => d.id === demoId && d.steps);
        if (!demo) {
            console.error('[rec] demo not found: ' + demoId);
            window.__recState = 'error';
            return;
        }

        const player = new RecPlayer(app, speed);
        await new Promise(r => setTimeout(r, delay));
        window.__recState = 'playing';
        console.log('[rec] playing ' + demoId);
        try {
            await player.play(demo);
            window.__recState = 'done';
            console.log('[rec] done ' + demoId);
        } catch (e) {
            console.error('[rec] error:', e);
            window.__recState = 'error';
        } finally {
            player.teardown();
        }
    }

    start();
})();
