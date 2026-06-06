// ── LOGIN PAGE ──
function renderLogin() {
  const page = document.createElement('div');
  page.className = 'login-page';
  page.innerHTML = `
    <div class="login-bg"></div>
    <div class="login-grid"></div>
    <div class="login-box">
      <div class="login-logo">NEXUS</div>
      <div class="login-tagline">Company Management System</div>
      <div class="login-tabs">
        <button class="login-tab active" id="tab-login">로그인</button>
        <button class="login-tab" id="tab-register">회원가입</button>
      </div>
      <div id="login-form">
        <div class="flex flex-col gap-2">
          <div class="form-group"><label class="form-label">아이디</label><input class="input" id="login-username" placeholder="아이디 입력" autocomplete="username"/></div>
          <div class="form-group"><label class="form-label">비밀번호</label><input class="input" id="login-password" type="password" placeholder="비밀번호 입력" autocomplete="current-password"/></div>
          <div id="login-error" style="color:var(--danger);font-size:13px;min-height:18px;"></div>
          <button class="btn btn-primary btn-lg w-full mt-1" id="login-btn">로그인</button>
          <div class="divider"></div>
          <button class="btn btn-secondary w-full" id="guest-btn">👥 손님으로 계속하기</button>
        </div>
        <p style="text-align:center;color:var(--text3);font-size:12px;margin-top:16px;">기본 관리자: admin / admin1234</p>
      </div>
      <div id="register-form" class="hidden">
        <div class="flex flex-col gap-2">
          <div class="form-group"><label class="form-label">이름</label><input class="input" id="reg-name" placeholder="실명 입력"/></div>
          <div class="form-group"><label class="form-label">아이디</label><input class="input" id="reg-username" placeholder="영문, 숫자 4-20자"/></div>
          <div class="form-group"><label class="form-label">비밀번호</label><input class="input" id="reg-password" type="password" placeholder="8자 이상"/></div>
          <div id="reg-error" style="color:var(--danger);font-size:13px;min-height:18px;"></div>
          <button class="btn btn-primary btn-lg w-full mt-1" id="reg-btn">직원 신청하기</button>
          <p style="font-size:12px;color:var(--text3);text-align:center;">신청 후 관리자 승인이 필요합니다</p>
        </div>
      </div>
    </div>
  `;

  const tabLogin = page.querySelector('#tab-login');
  const tabReg = page.querySelector('#tab-register');
  const formLogin = page.querySelector('#login-form');
  const formReg = page.querySelector('#register-form');

  tabLogin.onclick = () => { tabLogin.classList.add('active'); tabReg.classList.remove('active'); formLogin.classList.remove('hidden'); formReg.classList.add('hidden'); };
  tabReg.onclick = () => { tabReg.classList.add('active'); tabLogin.classList.remove('active'); formReg.classList.remove('hidden'); formLogin.classList.add('hidden'); };

  const doLogin = async () => {
    const username = page.querySelector('#login-username').value.trim();
    const password = page.querySelector('#login-password').value;
    const errEl = page.querySelector('#login-error');
    if (!username || !password) { errEl.textContent = '아이디와 비밀번호를 입력하세요.'; return; }
    const btn = page.querySelector('#login-btn');
    btn.textContent = '로그인 중...'; btn.disabled = true;
    try {
      const result = await Auth.login(username, password);
      if (!result.ok) { errEl.textContent = result.error; return; }
      errEl.textContent = '';
      App.start();
    } finally {
      btn.textContent = '로그인'; btn.disabled = false;
    }
  };

  page.querySelector('#login-btn').onclick = doLogin;
  page.querySelector('#login-password').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  page.querySelector('#guest-btn').onclick = () => App.renderGuest();

  page.querySelector('#reg-btn').onclick = async () => {
    const name = page.querySelector('#reg-name').value.trim();
    const username = page.querySelector('#reg-username').value.trim();
    const password = page.querySelector('#reg-password').value;
    const errEl = page.querySelector('#reg-error');
    if (!name || !username || !password) { errEl.textContent = '모든 항목을 입력하세요.'; return; }
    if (password.length < 8) { errEl.textContent = '비밀번호는 8자 이상이어야 합니다.'; return; }
    const btn = page.querySelector('#reg-btn');
    btn.textContent = '신청 중...'; btn.disabled = true;
    try {
      const result = await Auth.register({ name, username, password });
      if (!result.ok) { errEl.textContent = result.error; return; }
      showToast('신청 완료! 관리자 승인을 기다려 주세요.', 'success');
      tabLogin.click();
    } finally {
      btn.textContent = '직원 신청하기'; btn.disabled = false;
    }
  };

  return page;
}
