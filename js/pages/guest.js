// ── GUEST PAGE ──
function renderGuest() {
  const page = document.createElement('div');
  page.innerHTML = `
    <nav class="nav">
      <div class="nav-brand">NEXUS</div>
      <div class="nav-right">
        <span style="font-size:13px;color:var(--text2);">손님 모드</span>
        <button class="btn btn-secondary btn-sm" id="guest-login-btn">로그인</button>
      </div>
    </nav>
    <div class="page">
      <div class="guest-hero">
        <div class="guest-hero-title">환영합니다 👋<br><span>NEXUS</span>에 오신 것을 환영합니다</div>
        <div class="guest-hero-sub">예약, 게임 테스트, 직원 지원을 이곳에서 진행하세요</div>
      </div>
      <div class="guest-actions">
        <div class="guest-action-card" id="btn-booking"><div class="guest-action-icon">📅</div><div class="guest-action-title">주문 / 예약</div><div class="guest-action-desc">달력에서 원하는 날짜를 선택하여 예약하세요.</div></div>
        <div class="guest-action-card" id="btn-gametest"><div class="guest-action-icon">🎮</div><div class="guest-action-title">게임 테스트 참여</div><div class="guest-action-desc">개발 중인 게임의 테스터로 참여 신청할 수 있습니다.</div></div>
        <div class="guest-action-card" id="btn-apply"><div class="guest-action-icon">📝</div><div class="guest-action-title">직원 지원</div><div class="guest-action-desc">우리 팀에 합류하고 싶으신가요? 지원서를 제출해 주세요.</div></div>
      </div>
      <div style="max-width:900px;margin:0 auto;padding:0 24px 48px;">
        <div class="section-header"><span class="section-title">📢 공지사항</span></div>
        <div id="notices-list" class="card"><div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">불러오는 중...</div></div></div>
      </div>
    </div>
  `;

  page.querySelector('#guest-login-btn').onclick = () => App.renderLogin();
  page.querySelector('#btn-booking').onclick = () => showBookingModal();
  page.querySelector('#btn-gametest').onclick = () => showGameTestModal();
  page.querySelector('#btn-apply').onclick = () => showApplyModal();

  // Load notices async
  DB.getNotices().then(notices => {
    const container = page.querySelector('#notices-list');
    if (!notices.length) { container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-text">공지사항이 없습니다</div></div>'; return; }
    container.innerHTML = notices.map(n => `
      <div style="padding:16px 0;border-bottom:1px solid var(--border);">
        <div style="font-weight:600;margin-bottom:4px;">${n.title}</div>
        <div style="font-size:13px;color:var(--text2);line-height:1.6;">${n.content}</div>
        <div style="font-size:11px;color:var(--text3);margin-top:8px;">${DB.formatDateTime(n.createdAt)}</div>
      </div>
    `).join('');
  });

  return page;
}

// ── BOOKING MODAL ──
function showBookingModal() {
  const today = new Date();
  let viewYear = today.getFullYear(), viewMonth = today.getMonth(), selectedDate = null;

  const { modal } = openModal(`
    <div class="modal-header"><span class="modal-title">📅 주문 / 예약</span><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
    <div id="cal-wrap"></div>
    <div id="booking-form" class="hidden" style="margin-top:20px;">
      <div class="flex flex-col gap-2">
        <div id="selected-date-label" style="font-size:14px;color:var(--accent);font-weight:600;margin-bottom:4px;"></div>
        <div class="form-group"><label class="form-label">이름</label><input class="input" id="bk-name" placeholder="이름 입력"/></div>
        <div class="form-group"><label class="form-label">연락처</label><input class="input" id="bk-contact" placeholder="이메일 또는 전화번호"/></div>
        <div class="form-group"><label class="form-label">예약 종류</label>
          <select class="input" id="bk-type"><option>주문</option><option>미팅</option><option>상담</option><option>기타</option></select>
        </div>
        <div class="form-group"><label class="form-label">요청 사항</label><textarea class="input" id="bk-note" placeholder="추가 요청 사항 (선택)"></textarea></div>
        <button class="btn btn-primary w-full" id="bk-submit">예약 신청</button>
      </div>
    </div>
  `);

  function renderCal() {
    const wrap = modal.querySelector('#cal-wrap');
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
    let html = `<div class="calendar"><div class="calendar-header">
      <button class="btn btn-ghost btn-sm" id="cal-prev">‹</button>
      <span class="calendar-title">${viewYear}년 ${monthNames[viewMonth]}</span>
      <button class="btn btn-ghost btn-sm" id="cal-next">›</button>
    </div><div class="calendar-grid">
      ${['일','월','화','수','목','금','토'].map(d=>`<div class="calendar-day-name">${d}</div>`).join('')}
      ${Array(firstDay).fill('<div class="calendar-day empty"></div>').join('')}`;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const isPast = new Date(dateStr) < new Date(today.toDateString());
      const isToday = dateStr === today.toISOString().slice(0,10);
      const isSelected = dateStr === selectedDate;
      let cls = 'calendar-day';
      if (isPast) cls += ' past'; if (isToday) cls += ' today'; if (isSelected) cls += ' selected';
      html += `<div class="${cls}" data-date="${dateStr}">${d}</div>`;
    }
    html += `</div></div>`;
    wrap.innerHTML = html;
    wrap.querySelector('#cal-prev').onclick = () => { viewMonth--; if(viewMonth<0){viewMonth=11;viewYear--;} renderCal(); };
    wrap.querySelector('#cal-next').onclick = () => { viewMonth++; if(viewMonth>11){viewMonth=0;viewYear++;} renderCal(); };
    wrap.querySelectorAll('.calendar-day:not(.empty):not(.past)').forEach(el => {
      el.onclick = () => { selectedDate = el.dataset.date; modal.querySelector('#selected-date-label').textContent = `선택된 날짜: ${selectedDate}`; modal.querySelector('#booking-form').classList.remove('hidden'); renderCal(); };
    });
  }
  renderCal();

  modal.querySelector('#bk-submit').onclick = async () => {
    const name = modal.querySelector('#bk-name').value.trim();
    const contact = modal.querySelector('#bk-contact').value.trim();
    const type = modal.querySelector('#bk-type').value;
    const note = modal.querySelector('#bk-note').value.trim();
    if (!name || !contact || !selectedDate) { showToast('이름, 연락처, 날짜를 입력해 주세요.', 'error'); return; }
    await DB.addBooking({ name, contact, type, note, date: selectedDate });
    closeModal(); showToast('예약 신청 완료! 확인 후 연락드리겠습니다.', 'success');
  };
}

// ── GAME TEST MODAL ──
function showGameTestModal() {
  const { modal } = openModal(`
    <div class="modal-header"><span class="modal-title">🎮 게임 테스트 참여 신청</span><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
    <div class="flex flex-col gap-2">
      <div class="form-group"><label class="form-label">이름</label><input class="input" id="gt-name" placeholder="이름"/></div>
      <div class="form-group"><label class="form-label">연락처</label><input class="input" id="gt-contact" placeholder="이메일 또는 전화번호"/></div>
      <div class="form-group"><label class="form-label">게임 경험</label>
        <select class="input" id="gt-exp"><option>없음</option><option>가끔</option><option>자주</option><option>하드코어 게이머</option></select>
      </div>
      <div class="form-group"><label class="form-label">참여 이유</label><textarea class="input" id="gt-reason" placeholder="왜 테스트에 참여하고 싶으신가요?"></textarea></div>
      <button class="btn btn-primary w-full mt-1" id="gt-submit">신청하기</button>
    </div>
  `);
  modal.querySelector('#gt-submit').onclick = async () => {
    const name = modal.querySelector('#gt-name').value.trim();
    const contact = modal.querySelector('#gt-contact').value.trim();
    const exp = modal.querySelector('#gt-exp').value;
    const reason = modal.querySelector('#gt-reason').value.trim();
    if (!name || !contact || !reason) { showToast('모든 항목을 입력해 주세요.', 'error'); return; }
    await DB.addTestApp({ name, contact, exp, reason });
    closeModal(); showToast('게임 테스트 신청 완료!', 'success');
  };
}

// ── STAFF APPLY MODAL ──
function showApplyModal() {
  const { modal } = openModal(`
    <div class="modal-header"><span class="modal-title">📝 직원 지원서</span><button class="btn btn-ghost btn-sm" onclick="closeModal()">✕</button></div>
    <div class="flex flex-col gap-2">
      <div class="form-group"><label class="form-label">이름</label><input class="input" id="ap-name" placeholder="실명"/></div>
      <div class="form-group"><label class="form-label">지원 포지션</label>
        <select class="input" id="ap-position"><option>게임 개발자</option><option>디자이너</option><option>기획자</option><option>마케터</option><option>서비스원</option><option>기타</option></select>
      </div>
      <div class="form-group"><label class="form-label">경력</label><textarea class="input" id="ap-career" placeholder="관련 경력이나 경험"></textarea></div>
      <div class="form-group"><label class="form-label">실력 / 기술</label><textarea class="input" id="ap-skill" placeholder="보유한 기술이나 능력"></textarea></div>
      <div class="form-group"><label class="form-label">지원 이유</label><textarea class="input" id="ap-reason" placeholder="왜 우리 팀에 지원하셨나요?"></textarea></div>
      <div class="form-group"><label class="form-label">연락처</label><input class="input" id="ap-contact" placeholder="이메일 또는 전화번호"/></div>
      <button class="btn btn-primary w-full mt-1" id="ap-submit">지원서 제출</button>
    </div>
  `, true);
  modal.querySelector('#ap-submit').onclick = async () => {
    const name = modal.querySelector('#ap-name').value.trim();
    const position = modal.querySelector('#ap-position').value;
    const career = modal.querySelector('#ap-career').value.trim();
    const skill = modal.querySelector('#ap-skill').value.trim();
    const reason = modal.querySelector('#ap-reason').value.trim();
    const contact = modal.querySelector('#ap-contact').value.trim();
    if (!name || !career || !skill || !reason || !contact) { showToast('모든 항목을 입력해 주세요.', 'error'); return; }
    await DB.addApplication({ name, position, career, skill, reason, contact });
    closeModal(); showToast('지원서 제출 완료! 검토 후 연락드리겠습니다.', 'success');
  };
}
