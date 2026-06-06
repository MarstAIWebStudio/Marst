// ── ROUTER ──
const Router = {
  current: null,
  render(page) {
    this.current = page;
    const app = document.getElementById('app');
    app.innerHTML = '';
    app.appendChild(page);
  }
};

// ── TOAST ──
function showToast(msg, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ── MODAL ──
function openModal(content, large = false) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const modal = document.createElement('div');
  modal.className = large ? 'modal modal-lg' : 'modal';
  modal.innerHTML = content;
  overlay.appendChild(modal);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  return { overlay, modal };
}
function closeModal() {
  const overlay = document.querySelector('.modal-overlay');
  if (overlay) overlay.remove();
}

// ── CONFIRM ──
function confirmDialog(msg) {
  return new Promise(resolve => {
    const { modal } = openModal(`
      <div class="modal-header"><span class="modal-title">확인</span></div>
      <p style="color:var(--text2);font-size:14px;margin-bottom:24px;">${msg}</p>
      <div class="flex gap-1 justify-center">
        <button class="btn btn-secondary" id="conf-cancel">취소</button>
        <button class="btn btn-danger" id="conf-ok">확인</button>
      </div>
    `);
    modal.querySelector('#conf-cancel').onclick = () => { closeModal(); resolve(false); };
    modal.querySelector('#conf-ok').onclick = () => { closeModal(); resolve(true); };
  });
}

// ── HELPERS ──
function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
    else e.setAttribute(k, v);
  }
  for (const c of children) {
    if (typeof c === 'string') e.insertAdjacentHTML('beforeend', c);
    else if (c) e.appendChild(c);
  }
  return e;
}

function rankBadge(rank) {
  const colors = { '신입': 'gray', '인턴': 'cyan', '서비스원': 'green', '팀장': 'amber', '부장': 'amber', '부사장': 'purple', 'CEO': 'cyan' };
  return `<span class="badge badge-${colors[rank] || 'gray'}">${rank}</span>`;
}

function statusBadge(status) {
  const map = {
    pending: ['amber', '대기중'],
    approved: ['green', '승인됨'],
    confirmed: ['green', '확정됨'],
    rejected: ['red', '거절됨'],
    cancelled: ['red', '취소됨'],
    active: ['green', '진행중'],
    done: ['gray', '완료'],
    paused: ['amber', '일시정지']
  };
  const [color, label] = map[status] || ['gray', status];
  return `<span class="badge badge-${color}">${label}</span>`;
}
