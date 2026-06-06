// ── ADMIN PANEL (CEO only) ──
async function renderAdminPanel(container, user) {
  if (!Auth.isCEO(user)) {
    container.innerHTML = `<div class="pending-screen"><div class="pending-icon">🔒</div><div class="pending-title">접근 권한 없음</div></div>`;
    return;
  }

  let adminTab = 'staff-apps';

  async function draw() {
    const [staffApps, testApps, allUsers, notices] = await Promise.all([
      DB.getApplications(), DB.getTestApps(), DB.getUsers(), DB.getNotices()
    ]);
    const pendingUsers = allUsers.filter(u => u.role === 'staff' && !u.approved && u.rank !== 'CEO');

    container.innerHTML = `
      <div class="page-title">⚙️ 관리자 패널</div>
      <div class="page-sub">CEO 전용 관리 화면</div>
      <div style="display:flex;gap:8px;margin-bottom:24px;background:var(--bg3);padding:4px;border-radius:10px;width:fit-content;">
        ${[
          ['staff-apps', `직원 지원서 (${staffApps.filter(a=>a.status==='pending').length})`],
          ['pending-accounts', `계정 승인 (${pendingUsers.length})`],
          ['test-apps', `테스트 신청 (${testApps.filter(a=>a.status==='pending').length})`],
          ['notices', '공지사항'],
        ].map(([id, label]) => `
          <button class="login-tab ${adminTab===id?'active':''}" onclick="switchAdminTab('${id}')">${label}</button>
        `).join('')}
      </div>
      <div id="admin-tab-content"></div>
    `;

    window.switchAdminTab = (tab) => { adminTab = tab; draw(); };
    const tabContent = container.querySelector('#admin-tab-content');

    if (adminTab === 'staff-apps') renderStaffApps(tabContent, staffApps, draw);
    else if (adminTab === 'pending-accounts') renderPendingAccounts(tabContent, pendingUsers, draw);
    else if (adminTab === 'test-apps') renderTestApps(tabContent, testApps, draw);
    else if (adminTab === 'notices') renderNoticesAdmin(tabContent, notices, draw);
  }
  await draw();
}

function renderStaffApps(container, apps, redraw) {
  container.innerHTML = `
    <div class="card">
      <div class="section-header"><span class="section-title">직원 지원서</span></div>
      ${apps.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">지원서 없음</div></div>' :
        apps.map(a => `
          <div class="card card-sm" style="margin-bottom:12px;border-color:${a.status==='pending'?'rgba(245,158,11,0.3)':a.status==='approved'?'rgba(16,185,129,0.3)':'rgba(239,68,68,0.3)'}">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
              <div><span style="font-weight:700;font-size:16px;">${a.name}</span><span style="margin-left:10px;color:var(--text2);font-size:13px;">${a.position}</span></div>
              ${statusBadge(a.status)}
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
              <div><div style="font-size:11px;color:var(--text3);text-transform:uppercase;margin-bottom:4px;">경력</div><div style="font-size:13px;">${a.career}</div></div>
              <div><div style="font-size:11px;color:var(--text3);text-transform:uppercase;margin-bottom:4px;">실력</div><div style="font-size:13px;">${a.skill}</div></div>
            </div>
            <div style="margin-bottom:12px;"><div style="font-size:11px;color:var(--text3);text-transform:uppercase;margin-bottom:4px;">지원 이유</div><div style="font-size:13px;line-height:1.6;">${a.reason}</div></div>
            <div style="font-size:12px;color:var(--text2);margin-bottom:12px;">연락처: ${a.contact} | ${DB.formatDateTime(a.createdAt)}</div>
            ${a.status==='pending'?`<div class="flex gap-1">
              <button class="btn btn-success btn-sm" onclick="handleApp('${a.id}','approved')">✓ 승인</button>
              <button class="btn btn-danger btn-sm" onclick="handleApp('${a.id}','rejected')">✕ 거절</button>
            </div>`:''}
          </div>`).join('')}
    </div>
  `;
  window.handleApp = async (id, status) => { await DB.updateApplication(id, {status}); redraw(); showToast(status==='approved'?'승인됨':'거절됨', status==='approved'?'success':'error'); };
}

function renderPendingAccounts(container, pendingUsers, redraw) {
  container.innerHTML = `
    <div class="card">
      <div class="section-header"><span class="section-title">계정 승인 대기</span></div>
      ${pendingUsers.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">✅</div><div class="empty-state-text">대기 중인 계정 없음</div></div>' :
        pendingUsers.map(u => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 0;border-bottom:1px solid var(--border);">
            <div>
              <div style="font-weight:600;">${u.name} <span style="color:var(--text2);font-size:13px;">(@${u.username})</span></div>
              <div style="font-size:12px;color:var(--text3);margin-top:2px;">신청일: ${DB.formatDateTime(u.createdAt)}</div>
            </div>
            <div class="flex gap-1 items-center">
              <select class="input" style="font-size:12px;padding:6px 10px;width:100px;" id="rank-${u.id}">
                ${RANKS.filter(r=>r!=='CEO').map(r=>`<option value="${r}">${r}</option>`).join('')}
              </select>
              <button class="btn btn-success btn-sm" onclick="approveAccount('${u.id}')">승인</button>
              <button class="btn btn-danger btn-sm" onclick="rejectAccount('${u.id}')">거절</button>
            </div>
          </div>`).join('')}
    </div>
  `;
  window.approveAccount = async (id) => {
    const rankEl = container.querySelector(`#rank-${id}`);
    const rank = rankEl ? rankEl.value : '신입';
    await DB.updateUser(id, { approved: true, rank });
    redraw(); showToast('계정 승인됨', 'success');
  };
  window.rejectAccount = async (id) => {
    if (await confirmDialog('이 계정 신청을 거절하시겠습니까?')) {
      await DB.deleteUser(id); redraw(); showToast('거절됨', 'error');
    }
  };
}

function renderTestApps(container, apps, redraw) {
  container.innerHTML = `
    <div class="card">
      <div class="section-header"><span class="section-title">게임 테스트 신청</span></div>
      ${apps.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">🎮</div><div class="empty-state-text">신청 없음</div></div>' :
        `<div class="table-wrap"><table>
          <thead><tr><th>이름</th><th>연락처</th><th>게임 경험</th><th>참여 이유</th><th>상태</th><th>관리</th></tr></thead>
          <tbody>
            ${apps.map(a=>`<tr>
              <td>${a.name}</td>
              <td style="color:var(--text2);font-size:13px;">${a.contact}</td>
              <td>${a.exp}</td>
              <td style="font-size:13px;max-width:200px;">${a.reason}</td>
              <td>${statusBadge(a.status)}</td>
              <td>${a.status==='pending'?`<div class="flex gap-1">
                <button class="btn btn-success btn-sm" onclick="handleTestApp('${a.id}','approved')">승인</button>
                <button class="btn btn-danger btn-sm" onclick="handleTestApp('${a.id}','rejected')">거절</button>
              </div>`:''}</td>
            </tr>`).join('')}
          </tbody>
        </table></div>`}
    </div>
  `;
  window.handleTestApp = async (id, status) => { await DB.updateTestApp(id, {status}); redraw(); showToast(status==='approved'?'승인됨':'거절됨', status==='approved'?'success':'error'); };
}

function renderNoticesAdmin(container, notices, redraw) {
  container.innerHTML = `
    <div class="section-header">
      <span class="section-title">공지사항 관리</span>
      <button class="btn btn-primary" id="add-notice-btn">+ 공지 추가</button>
    </div>
    <div class="card">
      ${notices.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">공지사항 없음</div></div>' :
        notices.map(n=>`
          <div style="display:flex;align-items:start;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--border);">
            <div>
              <div style="font-weight:600;margin-bottom:4px;">${n.title}</div>
              <div style="font-size:13px;color:var(--text2);">${n.content}</div>
              <div style="font-size:11px;color:var(--text3);margin-top:6px;">${DB.formatDateTime(n.createdAt)}</div>
            </div>
            <button class="btn btn-danger btn-sm" onclick="deleteNotice('${n.id}')">삭제</button>
          </div>`).join('')}
    </div>
  `;
  container.querySelector('#add-notice-btn').onclick = () => {
    const { modal } = openModal(`
      <div class="modal-header"><span class="modal-title">공지사항 추가</span><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
      <div class="flex flex-col gap-2">
        <div class="form-group"><label class="form-label">제목</label><input class="input" id="nt-title" placeholder="제목"/></div>
        <div class="form-group"><label class="form-label">내용</label><textarea class="input" id="nt-content" placeholder="내용" style="min-height:120px;"></textarea></div>
        <button class="btn btn-primary w-full mt-1" id="nt-submit">등록</button>
      </div>
    `);
    modal.querySelector('#nt-submit').onclick = async () => {
      const title = modal.querySelector('#nt-title').value.trim();
      const content = modal.querySelector('#nt-content').value.trim();
      if (!title || !content) { showToast('제목과 내용을 입력하세요','error'); return; }
      await DB.addNotice({title, content});
      closeModal(); redraw(); showToast('공지 등록됨','success');
    };
  };
  window.deleteNotice = async (id) => {
    if (await confirmDialog('삭제하시겠습니까?')) { await DB.deleteNotice(id); redraw(); showToast('삭제됨','info'); }
  };
}
