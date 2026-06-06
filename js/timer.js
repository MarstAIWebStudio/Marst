// ── 업무 타이머 ──
const WorkTimer = {
  interval: null,
  startTime: null,
  task: '',
  running: false,

  async getLogs() {
    try { return await DB.getTimerLogs(); } catch(e) { return []; }
  },

  start(task) {
    this.task = task;
    this.startTime = Date.now();
    this.running = true;
    this.interval = setInterval(() => this.tick(), 1000);
    this.updateNav();
  },

  async stop() {
    if (!this.running) return;
    clearInterval(this.interval);
    this.running = false;
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const log = {
      task: this.task,
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date().toISOString(),
      elapsed,
      date: new Date().toISOString().slice(0, 10)
    };
    try { await DB.addTimerLog(log); } catch(e) { console.error('Timer log save failed:', e); }
    this.task = '';
    this.startTime = null;
    this.updateNav();
    return log;
  },

  tick() {
    const el = document.getElementById('timer-nav-time');
    if (el) el.textContent = this.formatElapsed(Math.floor((Date.now() - this.startTime) / 1000));
  },

  formatElapsed(sec) {
    const h = Math.floor(sec/3600).toString().padStart(2,'0');
    const m = Math.floor((sec%3600)/60).toString().padStart(2,'0');
    const s = (sec%60).toString().padStart(2,'0');
    return `${h}:${m}:${s}`;
  },

  formatDuration(sec) {
    if (sec < 60) return `${sec}초`;
    if (sec < 3600) return `${Math.floor(sec/60)}분 ${sec%60}초`;
    return `${Math.floor(sec/3600)}시간 ${Math.floor((sec%3600)/60)}분`;
  },

  updateNav() {
    const dot = document.getElementById('timer-dot');
    const label = document.getElementById('timer-nav-label');
    const time = document.getElementById('timer-nav-time');
    if (!dot||!label||!time) return;
    if (this.running) {
      dot.className = 'timer-dot running';
      label.textContent = this.task.length > 10 ? this.task.slice(0,10)+'…' : this.task;
      time.style.display = 'inline';
    } else {
      dot.className = 'timer-dot idle';
      label.textContent = '타이머';
      time.style.display = 'none';
    }
  },

  init(page) {
    const btn = page.querySelector('#timer-nav-btn');
    if (!btn) return;
    btn.onclick = () => { if (this.running) this.showRunningModal(); else this.showStartModal(); };
  },

  async showStartModal() {
    const logs = await this.getLogs();
    const { modal } = openModal(`
      <div class="modal-header"><span class="modal-title">⏱ 업무 타이머 시작</span><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
      <div class="flex flex-col gap-2">
        <div class="form-group"><label class="form-label">지금 뭐 하는 중?</label>
          <input class="input" id="timer-task-input" placeholder="예: 켄도 게임 전투 시스템 개발" autofocus/>
        </div>
        <button class="btn btn-primary btn-lg w-full mt-1" id="timer-start-btn">▶ 시작</button>
      </div>
      <div style="margin-top:20px;">
        <div class="section-title" style="font-size:14px;margin-bottom:10px;">최근 기록</div>
        ${logs.slice(0,5).map(l=>`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer;"
            onclick="document.getElementById('timer-task-input').value='${l.task.replace(/'/g,"\\'")}'" title="클릭해서 재사용">
            <div><div style="font-size:13px;font-weight:500;">${l.task}</div><div style="font-size:11px;color:var(--text3);">${l.date}</div></div>
            <span style="font-size:12px;color:var(--accent);">${this.formatDuration(l.elapsed)}</span>
          </div>`).join('') || '<div style="color:var(--text3);font-size:13px;">기록 없음</div>'}
      </div>
    `);
    const input = modal.querySelector('#timer-task-input');
    const doStart = () => {
      const task = input.value.trim();
      if (!task) { showToast('작업 내용을 입력하세요','error'); return; }
      this.start(task); closeModal(); showToast(`"${task}" 시작!`,'success');
    };
    modal.querySelector('#timer-start-btn').onclick = doStart;
    input.addEventListener('keydown', e => { if(e.key==='Enter') doStart(); });
  },

  showRunningModal() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const { modal } = openModal(`
      <div class="modal-header"><span class="modal-title">⏱ 진행 중</span><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
      <div style="text-align:center;padding:20px 0;">
        <div style="font-size:14px;color:var(--text2);margin-bottom:8px;">현재 작업</div>
        <div style="font-size:22px;font-weight:700;color:var(--text);margin-bottom:16px;">${this.task}</div>
        <div style="font-family:'Rajdhani',sans-serif;font-size:48px;font-weight:700;color:var(--accent);letter-spacing:0.05em;" id="modal-timer-display">${this.formatElapsed(elapsed)}</div>
      </div>
      <div class="flex gap-2 mt-2">
        <button class="btn btn-secondary w-full" onclick="closeModal()">계속 진행</button>
        <button class="btn btn-danger w-full" id="timer-stop-btn">■ 종료</button>
      </div>
    `);
    const display = modal.querySelector('#modal-timer-display');
    const liveInterval = setInterval(() => {
      if (!this.running) { clearInterval(liveInterval); return; }
      display.textContent = this.formatElapsed(Math.floor((Date.now()-this.startTime)/1000));
    }, 1000);
    modal.querySelector('#timer-stop-btn').onclick = async () => {
      clearInterval(liveInterval);
      const log = await this.stop();
      closeModal();
      showToast(`완료! ${this.formatDuration(log.elapsed)} 작업했어요 💪`,'success');
    };
    modal.closest('.modal-overlay').addEventListener('click', ()=>clearInterval(liveInterval));
  }
};
