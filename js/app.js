// ── APP ──
const App = {
  async start() {
    showLoading(true);
    try {
      // CEO 기본 계정 초기화 (최초 1회)
      const ceoCheck = await DB.getUserById('__ceo_init__').catch(()=>null);
      if (!ceoCheck) {
        await Auth.initDefaultCEO();
        // 초기화 플래그 저장
        try { await firebase.firestore().collection('meta').doc('init').set({ done: true }); } catch(e){}
      }

      const user = await Auth.getCurrentUser();
      if (!user) { this.renderLogin(); return; }
      if (!user.approved) { this.renderPending(user); return; }
      this.renderStaff(user);
    } catch(e) {
      console.error(e);
      this.renderLogin();
    } finally {
      showLoading(false);
    }
  },

  renderLogin() { Router.render(renderLogin()); },
  renderGuest() { Router.render(renderGuest()); },
  renderStaff(user) { Router.render(renderStaff(user)); },

  renderPending(user) {
    const page = document.createElement('div');
    page.innerHTML = `
      <div class="pending-screen">
        <div class="pending-icon">⏳</div>
        <div class="pending-title">승인 대기 중</div>
        <div class="pending-sub">
          안녕하세요, <strong>${user.name}</strong>님!<br>
          계정 신청이 접수되었습니다.<br>
          관리자 승인 후 로그인하실 수 있습니다.
        </div>
        <button class="btn btn-secondary mt-3" onclick="Auth.logout().then(()=>App.renderLogin())">← 로그인으로 돌아가기</button>
      </div>
    `;
    Router.render(page);
  }
};

function showLoading(show) {
  let el = document.getElementById('global-loading');
  if (show) {
    if (!el) {
      el = document.createElement('div');
      el.id = 'global-loading';
      el.style.cssText = 'position:fixed;inset:0;background:var(--bg);display:flex;align-items:center;justify-content:center;z-index:9999;';
      el.innerHTML = `<div style="text-align:center;">
        <div style="font-family:Rajdhani,sans-serif;font-size:32px;font-weight:700;color:var(--accent);letter-spacing:0.15em;margin-bottom:16px;">NEXUS</div>
        <div style="color:var(--text3);font-size:13px;">연결 중...</div>
      </div>`;
      document.body.appendChild(el);
    }
  } else {
    if (el) el.remove();
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  firebase.initializeApp(firebaseConfig);
  // CEO 초기화 여부 확인
  try {
    const meta = await firebase.firestore().collection('meta').doc('init').get();
    if (!meta.exists) await Auth.initDefaultCEO();
  } catch(e) {}
  App.start();
});
