// ── 구매자 관리 ──
async function renderBuyers(container, user) {
  const canEdit = Auth.canManage(user) || Auth.isCEO(user);
  let searchQ = '';

  async function draw() {
    let buyers = await DB.getBuyers();
    if (searchQ) buyers = buyers.filter(b => b.name.includes(searchQ)||b.email.includes(searchQ)||(b.phone||'').includes(searchQ));
    const allBuyers = await DB.getBuyers();
    const totalRevenue = allBuyers.reduce((s,b)=>s+(b.purchases||[]).reduce((ps,p)=>ps+Number(p.amount),0),0);

    container.innerHTML = `
      <div class="section-header">
        <div><div class="page-title">👥 구매자 관리</div><div class="page-sub">총 ${allBuyers.length}명의 고객</div></div>
        ${canEdit?`<button class="btn btn-primary" id="add-buyer-btn">+ 고객 추가</button>`:''}
      </div>
      <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:24px;">
        <div class="stat-card"><div class="stat-label">전체 고객</div><div class="stat-value accent">${allBuyers.length}</div></div>
        <div class="stat-card"><div class="stat-label">총 매출</div><div class="stat-value" style="color:var(--success);">₩${totalRevenue.toLocaleString()}</div></div>
        <div class="stat-card"><div class="stat-label">VIP 고객</div><div class="stat-value" style="color:var(--accent3);">${allBuyers.filter(b=>b.grade==='VIP').length}</div></div>
      </div>
      <div class="card">
        <div style="margin-bottom:16px;"><input class="input" id="buyer-search" placeholder="🔍 이름, 이메일, 전화번호 검색" value="${searchQ}" style="max-width:300px;"/></div>
        ${buyers.length===0?`<div class="empty-state"><div class="empty-state-icon">👤</div><div class="empty-state-text">${searchQ?'검색 결과 없음':'고객이 없습니다'}</div></div>`:`
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;">
            ${buyers.map(b=>{
              const totalSpent=(b.purchases||[]).reduce((s,p)=>s+Number(p.amount),0);
              const gradeColor={'VIP':'var(--accent3)','일반':'var(--text2)','신규':'var(--success)'}[b.grade]||'var(--text2)';
              return `<div class="card card-sm" style="cursor:pointer;border-color:${b.grade==='VIP'?'rgba(245,158,11,0.3)':'var(--border)'};" onclick="openBuyerDetail('${b.id}')">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent2));display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;">${b.name[0]}</div>
                    <div><div style="font-weight:700;">${b.name}</div><div style="font-size:12px;color:var(--text2);">${b.email}</div></div>
                  </div>
                  <span style="font-size:12px;font-weight:700;color:${gradeColor};">${b.grade}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:13px;">
                  <span style="color:var(--text2);">총 구매액</span>
                  <span style="font-weight:700;color:var(--success);">₩${totalSpent.toLocaleString()}</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text3);margin-top:4px;">
                  <span>구매 ${(b.purchases||[]).length}건</span><span>${DB.formatDate(b.createdAt)}</span>
                </div>
              </div>`;
            }).join('')}
          </div>`}
      </div>
    `;
    const searchEl = container.querySelector('#buyer-search');
    if (searchEl) searchEl.oninput = () => { searchQ = searchEl.value.trim(); draw(); };
    if (canEdit) { const btn = container.querySelector('#add-buyer-btn'); if(btn) btn.onclick = ()=>showAddBuyerModal(draw); }
    window.openBuyerDetail = (id) => showBuyerDetail(id, draw, canEdit);
  }
  await draw();
}

function showAddBuyerModal(onDone) {
  const { modal } = openModal(`
    <div class="modal-header"><span class="modal-title">고객 추가</span><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
    <div class="flex flex-col gap-2">
      <div class="form-group"><label class="form-label">이름</label><input class="input" id="by-name" placeholder="고객 이름"/></div>
      <div class="form-group"><label class="form-label">이메일</label><input class="input" id="by-email" type="email" placeholder="email@example.com"/></div>
      <div class="form-group"><label class="form-label">전화번호</label><input class="input" id="by-phone" placeholder="010-0000-0000"/></div>
      <div class="form-group"><label class="form-label">등급</label>
        <select class="input" id="by-grade"><option value="신규">신규</option><option value="일반">일반</option><option value="VIP">VIP</option></select>
      </div>
      <div class="form-group"><label class="form-label">메모</label><textarea class="input" id="by-memo" placeholder="특이사항"></textarea></div>
      <button class="btn btn-primary w-full mt-1" id="by-submit">추가</button>
    </div>
  `);
  modal.querySelector('#by-submit').onclick = async () => {
    const name = modal.querySelector('#by-name').value.trim();
    const email = modal.querySelector('#by-email').value.trim();
    const phone = modal.querySelector('#by-phone').value.trim();
    const grade = modal.querySelector('#by-grade').value;
    const memo = modal.querySelector('#by-memo').value.trim();
    if (!name||!email) { showToast('이름과 이메일을 입력하세요','error'); return; }
    await DB.addBuyer({name, email, phone, grade, memo});
    closeModal(); await onDone(); showToast('고객 추가됨','success');
  };
}

async function showBuyerDetail(id, redraw, canEdit) {
  const buyers = await DB.getBuyers();
  const buyer = buyers.find(b=>b.id===id);
  if (!buyer) return;
  const totalSpent = (buyer.purchases||[]).reduce((s,p)=>s+Number(p.amount),0);

  const { modal } = openModal(`
    <div class="modal-header"><span class="modal-title">${buyer.name} 상세</span><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
      <div><div style="font-size:11px;color:var(--text3);margin-bottom:3px;">이메일</div><div style="font-size:14px;">${buyer.email}</div></div>
      <div><div style="font-size:11px;color:var(--text3);margin-bottom:3px;">전화번호</div><div style="font-size:14px;">${buyer.phone||'-'}</div></div>
      <div><div style="font-size:11px;color:var(--text3);margin-bottom:3px;">등급</div><div style="font-size:14px;font-weight:700;">${buyer.grade}</div></div>
      <div><div style="font-size:11px;color:var(--text3);margin-bottom:3px;">총 구매액</div><div style="font-size:14px;font-weight:700;color:var(--success);">₩${totalSpent.toLocaleString()}</div></div>
    </div>
    ${buyer.memo?`<div style="background:var(--bg3);padding:12px;border-radius:8px;font-size:13px;color:var(--text2);margin-bottom:16px;">📝 ${buyer.memo}</div>`:''}
    <div class="section-header" style="margin-bottom:10px;">
      <span style="font-weight:700;">구매 내역 (${(buyer.purchases||[]).length}건)</span>
      ${canEdit?`<button class="btn btn-primary btn-sm" id="add-purchase-btn">+ 추가</button>`:''}
    </div>
    <div id="purchase-list">
      ${!(buyer.purchases||[]).length?'<div style="color:var(--text3);font-size:13px;text-align:center;padding:16px;">구매 내역 없음</div>':
        [...(buyer.purchases||[])].reverse().map(p=>`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);">
            <div><div style="font-size:14px;">${p.item}</div><div style="font-size:12px;color:var(--text2);">${p.date} · ${p.note||''}</div></div>
            <span style="font-weight:700;color:var(--success);">₩${Number(p.amount).toLocaleString()}</span>
          </div>`).join('')}
    </div>
    ${canEdit?`<div class="divider"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <select class="input" style="font-size:12px;padding:6px 10px;width:100px;" id="grade-select">
          ${['신규','일반','VIP'].map(g=>`<option value="${g}" ${buyer.grade===g?'selected':''}>${g}</option>`).join('')}
        </select>
        <button class="btn btn-secondary btn-sm" id="update-grade-btn">등급 변경</button>
        <button class="btn btn-danger btn-sm" id="delete-buyer-btn">삭제</button>
      </div>`:''}
  `, true);

  if (canEdit) {
    modal.querySelector('#add-purchase-btn').onclick = () => {
      const { modal: pm } = openModal(`
        <div class="modal-header"><span class="modal-title">구매 내역 추가</span><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
        <div class="flex flex-col gap-2">
          <div class="form-group"><label class="form-label">상품/서비스명</label><input class="input" id="pu-item" placeholder="상품명"/></div>
          <div class="form-group"><label class="form-label">금액</label><input class="input" id="pu-amount" type="number" placeholder="0"/></div>
          <div class="form-group"><label class="form-label">날짜</label><input class="input" id="pu-date" type="date" value="${new Date().toISOString().slice(0,10)}"/></div>
          <div class="form-group"><label class="form-label">비고</label><input class="input" id="pu-note" placeholder="메모"/></div>
          <button class="btn btn-primary w-full" id="pu-submit">추가</button>
        </div>
      `);
      pm.querySelector('#pu-submit').onclick = async () => {
        const item = pm.querySelector('#pu-item').value.trim();
        const amount = pm.querySelector('#pu-amount').value;
        const date = pm.querySelector('#pu-date').value;
        const note = pm.querySelector('#pu-note').value.trim();
        if (!item||!amount) { showToast('상품명과 금액을 입력하세요','error'); return; }
        const purchases = [...(buyer.purchases||[]), {id:'pu_'+Date.now(), item, amount, date, note}];
        await DB.updateBuyer(id, {purchases});
        closeModal(); closeModal(); redraw(); showToast('구매 내역 추가됨','success');
      };
    };
    modal.querySelector('#update-grade-btn').onclick = async () => {
      const grade = modal.querySelector('#grade-select').value;
      await DB.updateBuyer(id, {grade});
      closeModal(); redraw(); showToast('등급 변경됨','success');
    };
    modal.querySelector('#delete-buyer-btn').onclick = async () => {
      if (await confirmDialog('이 고객을 삭제하시겠습니까?')) {
        await DB.deleteBuyer(id); closeModal(); redraw(); showToast('삭제됨','info');
      }
    };
  }
}
