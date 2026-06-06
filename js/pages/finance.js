// ── 재무 관리 ──
async function renderFinance(container, user) {
  const canEdit = Auth.canManage(user) || Auth.isCEO(user);

  async function draw() {
    const finances = await DB.getFinances();
    const income = finances.filter(f=>f.type==='income').reduce((s,f)=>s+Number(f.amount),0);
    const expense = finances.filter(f=>f.type==='expense').reduce((s,f)=>s+Number(f.amount),0);
    const balance = income - expense;

    container.innerHTML = `
      <div class="section-header">
        <div><div class="page-title">💰 재무 관리</div><div class="page-sub">수입, 지출, 잔액 현황</div></div>
        ${canEdit?`<button class="btn btn-primary" id="add-finance-btn">+ 내역 추가</button>`:''}
      </div>
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:28px;">
        <div class="stat-card" style="border-color:rgba(16,185,129,0.3);"><div class="stat-label">총 수입</div><div class="stat-value" style="color:var(--success);">₩${income.toLocaleString()}</div></div>
        <div class="stat-card" style="border-color:rgba(239,68,68,0.3);"><div class="stat-label">총 지출</div><div class="stat-value" style="color:var(--danger);">₩${expense.toLocaleString()}</div></div>
        <div class="stat-card" style="border-color:rgba(0,229,255,0.3);"><div class="stat-label">잔액</div><div class="stat-value" style="color:${balance>=0?'var(--accent)':'var(--danger)'};">₩${balance.toLocaleString()}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
        <div class="card"><div class="section-title" style="margin-bottom:16px;">수입 카테고리</div>${renderCategoryBars(finances.filter(f=>f.type==='income'),income,'var(--success)')}</div>
        <div class="card"><div class="section-title" style="margin-bottom:16px;">지출 카테고리</div>${renderCategoryBars(finances.filter(f=>f.type==='expense'),expense,'var(--danger)')}</div>
      </div>
      <div class="card">
        <div class="section-header" style="margin-bottom:16px;">
          <span class="section-title">전체 내역</span>
          <select class="input" style="font-size:12px;padding:6px 10px;width:120px;" id="fin-filter">
            <option value="all">전체</option><option value="income">수입만</option><option value="expense">지출만</option>
          </select>
        </div>
        <div class="table-wrap" id="fin-table">${renderFinanceTable(finances, canEdit)}</div>
      </div>
    `;
    if (canEdit) { const btn = container.querySelector('#add-finance-btn'); if(btn) btn.onclick = ()=>showFinanceModal(draw); }
    const filterEl = container.querySelector('#fin-filter');
    if (filterEl) filterEl.onchange = () => {
      const val = filterEl.value;
      const filtered = val==='all'?finances:finances.filter(f=>f.type===val);
      container.querySelector('#fin-table').innerHTML = renderFinanceTable(filtered, canEdit);
      attachDeleteFinance(draw);
    };
    attachDeleteFinance(draw);
  }
  await draw();
}

function renderCategoryBars(items, total, color) {
  if (!items.length) return '<div style="color:var(--text3);font-size:13px;text-align:center;padding:20px;">내역 없음</div>';
  const cats = {};
  items.forEach(f => { cats[f.category]=(cats[f.category]||0)+Number(f.amount); });
  return Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>{
    const pct = total>0?Math.round((amt/total)*100):0;
    return `<div style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;"><span>${cat}</span><span style="color:var(--text2);">₩${amt.toLocaleString()} (${pct}%)</span></div>
      <div style="height:6px;background:var(--bg3);border-radius:3px;"><div style="height:100%;width:${pct}%;background:${color};border-radius:3px;"></div></div>
    </div>`;
  }).join('');
}

function renderFinanceTable(finances, canEdit) {
  if (!finances.length) return '<div class="empty-state"><div class="empty-state-icon">💸</div><div class="empty-state-text">내역이 없습니다</div></div>';
  return `<table><thead><tr><th>날짜</th><th>종류</th><th>카테고리</th><th>설명</th><th>금액</th>${canEdit?'<th>삭제</th>':''}</tr></thead><tbody>
    ${finances.map(f=>`<tr>
      <td style="color:var(--text2);font-size:13px;">${f.date||DB.formatDate(f.createdAt)}</td>
      <td>${f.type==='income'?'<span class="badge badge-green">수입</span>':'<span class="badge badge-red">지출</span>'}</td>
      <td style="color:var(--text2);">${f.category}</td>
      <td>${f.description}</td>
      <td style="font-weight:700;color:${f.type==='income'?'var(--success)':'var(--danger)'};">${f.type==='income'?'+':'-'}₩${Number(f.amount).toLocaleString()}</td>
      ${canEdit?`<td><button class="btn btn-ghost btn-sm" data-fin-del="${f.id}" style="color:var(--danger);">✕</button></td>`:''}
    </tr>`).join('')}
  </tbody></table>`;
}

function attachDeleteFinance(redraw) {
  document.querySelectorAll('[data-fin-del]').forEach(btn => {
    btn.onclick = async () => {
      if (await confirmDialog('이 내역을 삭제하시겠습니까?')) {
        await DB.deleteFinance(btn.dataset.finDel);
        redraw(); showToast('삭제됨','info');
      }
    };
  });
}

function showFinanceModal(onDone) {
  const { modal } = openModal(`
    <div class="modal-header"><span class="modal-title">내역 추가</span><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
    <div class="flex flex-col gap-2">
      <div class="form-group"><label class="form-label">종류</label>
        <select class="input" id="fin-type"><option value="income">수입</option><option value="expense">지출</option></select>
      </div>
      <div class="form-group"><label class="form-label">카테고리</label>
        <select class="input" id="fin-cat"><option>게임 판매</option><option>서비스 수수료</option><option>투자</option><option>급여</option><option>서버/인프라</option><option>마케팅</option><option>장비/소프트웨어</option><option>기타</option></select>
      </div>
      <div class="form-group"><label class="form-label">금액 (원)</label><input class="input" id="fin-amount" type="number" placeholder="0" min="0"/></div>
      <div class="form-group"><label class="form-label">날짜</label><input class="input" id="fin-date" type="date" value="${new Date().toISOString().slice(0,10)}"/></div>
      <div class="form-group"><label class="form-label">설명</label><input class="input" id="fin-desc" placeholder="간단한 설명"/></div>
      <button class="btn btn-primary w-full mt-1" id="fin-submit">추가</button>
    </div>
  `);
  modal.querySelector('#fin-submit').onclick = async () => {
    const type = modal.querySelector('#fin-type').value;
    const category = modal.querySelector('#fin-cat').value;
    const amount = modal.querySelector('#fin-amount').value;
    const date = modal.querySelector('#fin-date').value;
    const description = modal.querySelector('#fin-desc').value.trim();
    if (!amount || !description) { showToast('금액과 설명을 입력하세요','error'); return; }
    await DB.addFinance({type, category, amount, date, description});
    closeModal(); await onDone(); showToast('내역 추가됨','success');
  };
}
