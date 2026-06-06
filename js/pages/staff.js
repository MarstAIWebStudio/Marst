// ── STAFF PAGE ──
function renderStaff(user) {
  const page = document.createElement('div');
  const isCEO = Auth.isCEO(user);
  const canManage = Auth.canManage(user);

  const navLinks = [
    { id: 'nav-dashboard', label: '대시보드' },
    { id: 'nav-projects', label: '프로젝트' },
    { id: 'nav-bookings', label: '예약' },
    { id: 'nav-buyers', label: '구매자' },
    { id: 'nav-finance', label: '재무' },
    { id: 'nav-docs', label: '문서함' },
    ...(canManage ? [{ id: 'nav-team', label: '팀원' }] : []),
    ...(isCEO ? [{ id: 'nav-admin', label: '⚙️ 관리자' }] : []),
  ];

  page.innerHTML = `
    <nav class="nav">
      <div class="nav-brand">NEXUS</div>
      <div class="nav-links">
        ${navLinks.map(l => `<button class="nav-link" id="${l.id}">${l.label}</button>`).join('')}
      </div>
      <div class="nav-right">
        <button class="timer-nav-btn" id="timer-nav-btn" title="업무 타이머">
          <span class="timer-dot idle" id="timer-dot"></span>
          <span id="timer-nav-label">타이머</span>
          <span id="timer-nav-time" class="timer-nav-time" style="display:none">00:00:00</span>
        </button>
        <div class="nav-user">
          <div class="nav-avatar">${user.name[0]}</div>
          <span>${user.name}</span>
          ${rankBadge(user.rank)}
        </div>
        <button class="btn btn-ghost btn-sm" id="logout-btn">로그아웃</button>
      </div>
    </nav>
    <div class="page">
      <div id="staff-content" class="page-content"></div>
    </div>
  `;

  page.querySelector('#logout-btn').onclick = () => { Auth.logout(); App.renderLogin(); };
  WorkTimer.init(page);

  const content = page.querySelector('#staff-content');

  function setActive(id) {
    page.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const el = page.querySelector('#' + id);
    if (el) el.classList.add('active');
  }

  function showSection(section) {
    content.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text3);">불러오는 중...</div>';
    content.className = 'page-content animate-in';
    if (section === 'dashboard') renderDashboard(content, user);
    else if (section === 'projects') renderProjects(content, user);
    else if (section === 'bookings') renderBookings(content, user);
    else if (section === 'buyers') renderBuyers(content, user);
    else if (section === 'finance') renderFinance(content, user);
    else if (section === 'docs') renderDocs(content, user);
    else if (section === 'team') renderTeam(content, user);
    else if (section === 'admin') renderAdminPanel(content, user);
  }

  navLinks.forEach(l => {
    const btn = page.querySelector('#' + l.id);
    if (btn) btn.onclick = () => { setActive(l.id); showSection(l.id.replace('nav-', '')); };
  });

  setActive('nav-dashboard');
  showSection('dashboard');
  return page;
}

// ── DASHBOARD ──
async function renderDashboard(container, user) {
  const [projects, bookings, apps, users] = await Promise.all([
    DB.getProjects(), DB.getBookings(), DB.getApplications(), DB.getUsers()
  ]);
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const pendingApps = apps.filter(a => a.status === 'pending');
  const staffCount = users.filter(u => u.role === 'staff' && u.approved).length;

  container.innerHTML = `
    <div class="page-title">대시보드</div>
    <div class="page-sub">환영합니다, ${user.name}님! 오늘도 좋은 하루 되세요.</div>
    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">진행 중인 프로젝트</div><div class="stat-value accent">${projects.filter(p=>p.status==='active').length}</div></div>
      <div class="stat-card"><div class="stat-label">대기 중인 예약</div><div class="stat-value">${pendingBookings.length}</div></div>
      <div class="stat-card"><div class="stat-label">팀원 수</div><div class="stat-value">${staffCount}</div></div>
      <div class="stat-card"><div class="stat-label">지원 대기</div><div class="stat-value">${pendingApps.length}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
      <div class="card">
        <div class="section-header"><span class="section-title">최근 프로젝트</span></div>
        ${projects.slice(0,5).map(p=>`
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);">
            <span style="font-size:14px;">${p.name}</span>${statusBadge(p.status||'active')}
          </div>`).join('') || '<div class="empty-state"><div class="empty-state-icon">📁</div><div class="empty-state-text">프로젝트 없음</div></div>'}
      </div>
      <div class="card">
        <div class="section-header"><span class="section-title">최근 예약</span></div>
        ${bookings.slice(0,5).map(b=>`
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);">
            <div><div style="font-size:14px;">${b.name} — ${b.type}</div><div style="font-size:12px;color:var(--text2);">${b.date}</div></div>
            ${statusBadge(b.status)}
          </div>`).join('') || '<div class="empty-state"><div class="empty-state-icon">📅</div><div class="empty-state-text">예약 없음</div></div>'}
      </div>
    </div>
  `;
}

// ── PROJECTS ──
async function renderProjects(container, user) {
  const canEdit = Auth.canManage(user) || Auth.isCEO(user);
  async function draw() {
    const projects = await DB.getProjects();
    container.innerHTML = `
      <div class="section-header">
        <div><div class="page-title">프로젝트 관리</div><div class="page-sub">총 ${projects.length}개</div></div>
        ${canEdit ? `<button class="btn btn-primary" id="add-proj-btn">+ 추가</button>` : ''}
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;">
        ${projects.map(p=>`
          <div class="card" style="border-color:${p.status==='active'?'rgba(0,229,255,0.2)':'var(--border)'}">
            <div style="display:flex;align-items:start;justify-content:space-between;margin-bottom:12px;">
              <div style="font-size:16px;font-weight:700;">${p.name}</div>${statusBadge(p.status||'active')}
            </div>
            <div style="font-size:13px;color:var(--text2);margin-bottom:12px;">${p.description||'설명 없음'}</div>
            <div style="font-size:12px;color:var(--text3);">생성: ${DB.formatDate(p.createdAt)}</div>
            ${canEdit?`<div class="flex gap-1 mt-2">
              <select class="input" style="font-size:12px;padding:6px 10px;" onchange="updateProjStatus('${p.id}',this.value)">
                <option value="active" ${p.status==='active'?'selected':''}>진행중</option>
                <option value="paused" ${p.status==='paused'?'selected':''}>일시정지</option>
                <option value="done" ${p.status==='done'?'selected':''}>완료</option>
              </select>
              <button class="btn btn-danger btn-sm" onclick="deleteProj('${p.id}')">삭제</button>
            </div>`:''}
          </div>`).join('') || '<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📁</div><div class="empty-state-text">프로젝트 없음</div></div>'}
      </div>
    `;
    if (canEdit) { const btn = container.querySelector('#add-proj-btn'); if(btn) btn.onclick = ()=>showAddProjectModal(draw); }
  }
  window.updateProjStatus = async (id, status) => { await DB.updateProject(id, {status}); draw(); showToast('상태 업데이트됨','success'); };
  window.deleteProj = async (id) => { if(await confirmDialog('삭제하시겠습니까?')){ await DB.deleteProject(id); draw(); showToast('삭제됨','info'); } };
  await draw();
}

function showAddProjectModal(onDone) {
  const { modal } = openModal(`
    <div class="modal-header"><span class="modal-title">프로젝트 추가</span><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
    <div class="flex flex-col gap-2">
      <div class="form-group"><label class="form-label">이름</label><input class="input" id="pj-name" placeholder="이름"/></div>
      <div class="form-group"><label class="form-label">설명</label><textarea class="input" id="pj-desc" placeholder="설명"></textarea></div>
      <div class="form-group"><label class="form-label">상태</label>
        <select class="input" id="pj-status"><option value="active">진행중</option><option value="paused">일시정지</option><option value="done">완료</option></select>
      </div>
      <button class="btn btn-primary w-full mt-1" id="pj-submit">추가</button>
    </div>
  `);
  modal.querySelector('#pj-submit').onclick = async () => {
    const name = modal.querySelector('#pj-name').value.trim();
    const description = modal.querySelector('#pj-desc').value.trim();
    const status = modal.querySelector('#pj-status').value;
    if (!name) { showToast('이름을 입력하세요','error'); return; }
    await DB.addProject({name, description, status});
    closeModal(); await onDone(); showToast('추가됨','success');
  };
}

// ── BOOKINGS ──
async function renderBookings(container, user) {
  const canEdit = Auth.canManage(user) || Auth.isCEO(user);
  async function draw() {
    const bookings = await DB.getBookings();
    container.innerHTML = `
      <div class="page-title">예약 관리</div>
      <div class="page-sub">총 ${bookings.length}건</div>
      <div class="card"><div class="table-wrap"><table>
        <thead><tr><th>이름</th><th>종류</th><th>날짜</th><th>연락처</th><th>상태</th>${canEdit?'<th>관리</th>':''}</tr></thead>
        <tbody>
          ${bookings.length===0?`<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:32px;">예약 없음</td></tr>`:
            bookings.map(b=>`<tr>
              <td>${b.name}</td><td>${b.type}</td><td>${b.date}</td>
              <td style="color:var(--text2);font-size:13px;">${b.contact}</td>
              <td>${statusBadge(b.status)}</td>
              ${canEdit?`<td><div class="flex gap-1">
                <button class="btn btn-success btn-sm" onclick="updateBk('${b.id}','confirmed')">확정</button>
                <button class="btn btn-danger btn-sm" onclick="updateBk('${b.id}','cancelled')">취소</button>
              </div></td>`:''}
            </tr>`).join('')}
        </tbody>
      </table></div></div>
    `;
  }
  window.updateBk = async (id, status) => { await DB.updateBooking(id, {status}); draw(); showToast('업데이트됨','success'); };
  await draw();
}

// ── TEAM ──
async function renderTeam(container, user) {
  const isCEO = Auth.isCEO(user);
  async function draw() {
    const users = (await DB.getUsers()).filter(u => u.role==='staff' && u.approved);
    container.innerHTML = `
      <div class="page-title">팀원 관리</div>
      <div class="page-sub">승인된 팀원 ${users.length}명</div>
      <div class="card"><div class="table-wrap"><table>
        <thead><tr><th>이름</th><th>아이디</th><th>직급</th><th>가입일</th>${isCEO?'<th>직급 변경</th>':''}</tr></thead>
        <tbody>
          ${users.map(u=>`<tr>
            <td><div class="flex items-center gap-1">
              <div class="nav-avatar" style="width:28px;height:28px;font-size:11px;">${u.name[0]}</div>${u.name}
            </div></td>
            <td style="color:var(--text2);">${u.username}</td>
            <td>${rankBadge(u.rank)}</td>
            <td style="color:var(--text2);font-size:13px;">${DB.formatDate(u.createdAt)}</td>
            ${isCEO&&u.rank!=='CEO'?`<td>
              <select class="input" style="font-size:12px;padding:6px 10px;" onchange="changeRank('${u.id}',this.value)">
                ${RANKS.filter(r=>r!=='CEO').map(r=>`<option value="${r}" ${u.rank===r?'selected':''}>${r}</option>`).join('')}
              </select>
            </td>`:'<td></td>'}
          </tr>`).join('')}
        </tbody>
      </table></div></div>
    `;
  }
  window.changeRank = async (id, rank) => { await DB.updateUser(id, {rank}); draw(); showToast('직급 변경됨','success'); };
  await draw();
}
