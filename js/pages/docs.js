// ── 문서함 ──
async function renderDocs(container, user) {
  const canEdit = Auth.canManage(user) || Auth.isCEO(user);
  let filterCat = 'all', searchQ = '';
  const CATEGORIES = ['기획서','회의록','계약서','보고서','공문','기타'];

  async function draw() {
    let docs = await DB.getDocs();
    if (filterCat !== 'all') docs = docs.filter(d=>d.category===filterCat);
    if (searchQ) docs = docs.filter(d=>d.title.includes(searchQ)||d.content.includes(searchQ));
    const allDocs = await DB.getDocs();

    container.innerHTML = `
      <div class="section-header">
        <div><div class="page-title">📁 문서함</div><div class="page-sub">총 ${allDocs.length}개 문서</div></div>
        ${canEdit?`<button class="btn btn-primary" id="add-doc-btn">+ 문서 작성</button>`:''}
      </div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:20px;flex-wrap:wrap;">
        <input class="input" id="doc-search" placeholder="🔍 문서 검색" value="${searchQ}" style="max-width:240px;"/>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn ${filterCat==='all'?'btn-primary':'btn-secondary'} btn-sm" onclick="setDocCat('all')">전체</button>
          ${CATEGORIES.map(c=>`<button class="btn ${filterCat===c?'btn-primary':'btn-secondary'} btn-sm" onclick="setDocCat('${c}')">${c}</button>`).join('')}
        </div>
      </div>
      ${docs.length===0?`<div class="empty-state"><div class="empty-state-icon">📂</div><div class="empty-state-text">${searchQ||filterCat!=='all'?'검색 결과 없음':'문서가 없습니다'}</div></div>`:`
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;">
          ${docs.map(d=>{
            const catColors={'기획서':'cyan','회의록':'green','계약서':'amber','보고서':'purple','공문':'gray','기타':'gray'};
            return `<div class="card" style="cursor:pointer;" onclick="openDocDetail('${d.id}')"
              onmouseover="this.style.borderColor='rgba(0,229,255,0.3)'" onmouseout="this.style.borderColor='var(--border)'">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                <span class="badge badge-${catColors[d.category]||'gray'}">${d.category}</span>
                <span style="font-size:11px;color:var(--text3);">${DB.formatDate(d.createdAt)}</span>
              </div>
              <div style="font-weight:700;font-size:15px;margin-bottom:6px;">${d.title}</div>
              <div style="font-size:13px;color:var(--text2);line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${d.content}</div>
              <div style="margin-top:10px;font-size:12px;color:var(--text3);">작성: ${d.author}</div>
            </div>`;
          }).join('')}
        </div>`}
    `;

    window.setDocCat = (cat) => { filterCat = cat; draw(); };
    const searchEl = container.querySelector('#doc-search');
    if (searchEl) searchEl.oninput = () => { searchQ = searchEl.value.trim(); draw(); };
    if (canEdit) { const btn = container.querySelector('#add-doc-btn'); if(btn) btn.onclick = ()=>showAddDocModal(draw, user); }
    window.openDocDetail = (id) => showDocDetail(id, draw, canEdit);
  }
  await draw();
}

function showAddDocModal(onDone, user) {
  const CATEGORIES = ['기획서','회의록','계약서','보고서','공문','기타'];
  const { modal } = openModal(`
    <div class="modal-header"><span class="modal-title">문서 작성</span><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
    <div class="flex flex-col gap-2">
      <div class="form-group"><label class="form-label">카테고리</label>
        <select class="input" id="doc-cat">${CATEGORIES.map(c=>`<option value="${c}">${c}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label class="form-label">제목</label><input class="input" id="doc-title" placeholder="문서 제목"/></div>
      <div class="form-group"><label class="form-label">내용</label><textarea class="input" id="doc-content" placeholder="문서 내용을 입력하세요..." style="min-height:200px;"></textarea></div>
      <button class="btn btn-primary w-full mt-1" id="doc-submit">저장</button>
    </div>
  `, true);
  modal.querySelector('#doc-submit').onclick = async () => {
    const category = modal.querySelector('#doc-cat').value;
    const title = modal.querySelector('#doc-title').value.trim();
    const content = modal.querySelector('#doc-content').value.trim();
    if (!title||!content) { showToast('제목과 내용을 입력하세요','error'); return; }
    await DB.addDoc({category, title, content, author: user.name});
    closeModal(); await onDone(); showToast('문서 저장됨','success');
  };
}

async function showDocDetail(id, redraw, canEdit) {
  const docs = await DB.getDocs();
  const doc = docs.find(d=>d.id===id);
  if (!doc) return;
  const catColors={'기획서':'cyan','회의록':'green','계약서':'amber','보고서':'purple','공문':'gray','기타':'gray'};
  const { modal } = openModal(`
    <div class="modal-header"><span class="modal-title">${doc.title}</span><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
      <span class="badge badge-${catColors[doc.category]||'gray'}">${doc.category}</span>
      <span style="font-size:12px;color:var(--text3);">작성: ${doc.author} · ${DB.formatDateTime(doc.createdAt)}</span>
    </div>
    <div style="background:var(--bg3);padding:20px;border-radius:10px;font-size:14px;line-height:1.8;white-space:pre-wrap;max-height:400px;overflow-y:auto;">${doc.content}</div>
    ${canEdit?`<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
      <button class="btn btn-danger btn-sm" id="del-doc-btn">삭제</button>
    </div>`:''}
  `, true);
  if (canEdit) {
    modal.querySelector('#del-doc-btn').onclick = async () => {
      if (await confirmDialog('이 문서를 삭제하시겠습니까?')) {
        await DB.deleteDoc(id); closeModal(); redraw(); showToast('삭제됨','info');
      }
    };
  }
}
