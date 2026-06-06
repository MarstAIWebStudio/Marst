// ── AUTH (Firebase Auth + Firestore) ──
const Auth = {
  SESSION_KEY: 'cm_session',

  toEmail(username) { return `${username}@studio.com`; },
  fromEmail(email) { return email.replace('@studio.com', ''); },

  async getCurrentUser() {
    return new Promise(resolve => {
      firebase.auth().onAuthStateChanged(async (firebaseUser) => {
        if (!firebaseUser) { resolve(null); return; }
        try {
          const user = await DB.getUserById(firebaseUser.uid);
          resolve(user);
        } catch(e) { resolve(null); }
      });
    });
  },

  async login(username, password) {
    const email = this.toEmail(username);
    try {
      const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
      const user = await DB.getUserById(cred.user.uid);
      if (!user) return { ok: false, error: '계정 정보를 찾을 수 없습니다.' };
      if (!user.approved) return { ok: false, error: '아직 승인 대기 중입니다. 관리자 승인 후 로그인 가능합니다.' };
      return { ok: true, user };
    } catch(e) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        return { ok: false, error: '아이디 또는 비밀번호가 틀렸습니다.' };
      }
      return { ok: false, error: e.message };
    }
  },

  async register(data) {
    const email = this.toEmail(data.username);
    try {
      const cred = await firebase.auth().createUserWithEmailAndPassword(email, data.password);
      const uid = cred.user.uid;
      const newUser = {
        username: data.username,
        email,
        name: data.name,
        rank: '신입',
        approved: false,
        role: 'staff',
        createdAt: new Date().toISOString()
      };
      await DB.saveUser(uid, newUser);
      // 가입 후 바로 로그아웃 (승인 전까지 못 들어오게)
      await firebase.auth().signOut();
      return { ok: true, user: { id: uid, ...newUser } };
    } catch(e) {
      if (e.code === 'auth/email-already-in-use') return { ok: false, error: '이미 사용 중인 아이디입니다.' };
      return { ok: false, error: e.message };
    }
  },

  async initDefaultCEO() {
    // 기본 CEO 계정이 Auth에 없으면 생성
    const email = this.toEmail('admin');
    try {
      await firebase.auth().createUserWithEmailAndPassword(email, 'admin1234');
      const uid = firebase.auth().currentUser.uid;
      await DB.saveUser(uid, {
        username: 'admin', email, name: '사장님',
        rank: 'CEO', approved: true, role: 'staff',
        createdAt: new Date().toISOString()
      });
      await firebase.auth().signOut();
    } catch(e) {
      // 이미 있으면 무시
    }
  },

  async logout() {
    await firebase.auth().signOut();
  },

  isCEO(user) { return user && user.rank === 'CEO'; },
  isStaff(user) { return user && user.role === 'staff' && user.approved; },
  canManage(user) { return user && ['부사장', 'CEO'].includes(user.rank); },
  rankLevel(user) { return user ? (RANK_LEVEL[user.rank] || 0) : 0; }
};
