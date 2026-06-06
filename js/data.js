// ── FIREBASE CONFIG ──
const firebaseConfig = {
  apiKey: "AIzaSyCQtA0Y7Nfqriyy9DxMcJw1LVg1Xf1C_Uk",
  authDomain: "marst-studio.firebaseapp.com",
  projectId: "marst-studio",
  storageBucket: "marst-studio.firebasestorage.app",
  messagingSenderId: "645316619518",
  appId: "1:645316619518:web:9d5c7bc5b9ddbf9c33c9af",
  measurementId: "G-Y15G44J4XM"
};

const RANKS = ['신입', '인턴', '서비스원', '팀장', '부장', '부사장', 'CEO'];
const RANK_LEVEL = { '신입': 1, '인턴': 2, '서비스원': 3, '팀장': 4, '부장': 5, '부사장': 6, 'CEO': 7 };

// Firestore 인스턴스 (firebase.js 로드 후 초기화)
let _db = null;

function getFirestore() {
  if (!_db) _db = firebase.firestore();
  return _db;
}

// ── 컬렉션명 상수 ──
const COL = {
  USERS: 'users',
  APPLICATIONS: 'applications',
  BOOKINGS: 'bookings',
  TEST_APPS: 'testApps',
  PROJECTS: 'projects',
  FINANCES: 'finances',
  NOTICES: 'notices',
  BUYERS: 'buyers',
  TIMER_LOGS: 'timerLogs',
  DOCS: 'docs',
};

// ── DB 헬퍼 (async/await Firestore wrapper) ──
const DB = {

  // ── USERS ──
  async getUsers() {
    const snap = await getFirestore().collection(COL.USERS).get();
    const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // CEO 기본 계정 없으면 생성
    if (!users.find(u => u.rank === 'CEO')) {
      await this.createDefaultCEO();
      return this.getUsers();
    }
    return users;
  },
  async createDefaultCEO() {
    await getFirestore().collection(COL.USERS).doc('ceo1').set({
      username: 'admin', password: 'admin1234', name: '사장님',
      rank: 'CEO', approved: true, role: 'staff',
      createdAt: new Date().toISOString()
    });
  },
  async getUserById(id) {
    const doc = await getFirestore().collection(COL.USERS).doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },
  async getUserByUsername(username) {
    const snap = await getFirestore().collection(COL.USERS).where('username', '==', username).limit(1).get();
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  },
  async saveUser(id, data) {
    await getFirestore().collection(COL.USERS).doc(id).set(data, { merge: true });
  },
  async updateUser(id, data) {
    await getFirestore().collection(COL.USERS).doc(id).update(data);
  },
  async deleteUser(id) {
    await getFirestore().collection(COL.USERS).doc(id).delete();
  },

  // ── APPLICATIONS ──
  async getApplications() {
    const snap = await getFirestore().collection(COL.APPLICATIONS).orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async addApplication(app) {
    app.createdAt = new Date().toISOString();
    app.status = 'pending';
    const ref = await getFirestore().collection(COL.APPLICATIONS).add(app);
    return { id: ref.id, ...app };
  },
  async updateApplication(id, data) {
    await getFirestore().collection(COL.APPLICATIONS).doc(id).update(data);
  },

  // ── BOOKINGS ──
  async getBookings() {
    const snap = await getFirestore().collection(COL.BOOKINGS).orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async addBooking(booking) {
    booking.createdAt = new Date().toISOString();
    booking.status = 'pending';
    const ref = await getFirestore().collection(COL.BOOKINGS).add(booking);
    return { id: ref.id, ...booking };
  },
  async updateBooking(id, data) {
    await getFirestore().collection(COL.BOOKINGS).doc(id).update(data);
  },

  // ── TEST APPS ──
  async getTestApps() {
    const snap = await getFirestore().collection(COL.TEST_APPS).orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async addTestApp(app) {
    app.createdAt = new Date().toISOString();
    app.status = 'pending';
    const ref = await getFirestore().collection(COL.TEST_APPS).add(app);
    return { id: ref.id, ...app };
  },
  async updateTestApp(id, data) {
    await getFirestore().collection(COL.TEST_APPS).doc(id).update(data);
  },

  // ── PROJECTS ──
  async getProjects() {
    const snap = await getFirestore().collection(COL.PROJECTS).orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async addProject(proj) {
    proj.createdAt = new Date().toISOString();
    const ref = await getFirestore().collection(COL.PROJECTS).add(proj);
    return { id: ref.id, ...proj };
  },
  async updateProject(id, data) {
    await getFirestore().collection(COL.PROJECTS).doc(id).update(data);
  },
  async deleteProject(id) {
    await getFirestore().collection(COL.PROJECTS).doc(id).delete();
  },

  // ── FINANCES ──
  async getFinances() {
    const snap = await getFirestore().collection(COL.FINANCES).orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async addFinance(entry) {
    entry.createdAt = new Date().toISOString();
    const ref = await getFirestore().collection(COL.FINANCES).add(entry);
    return { id: ref.id, ...entry };
  },
  async deleteFinance(id) {
    await getFirestore().collection(COL.FINANCES).doc(id).delete();
  },

  // ── NOTICES ──
  async getNotices() {
    const snap = await getFirestore().collection(COL.NOTICES).orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async addNotice(notice) {
    notice.createdAt = new Date().toISOString();
    const ref = await getFirestore().collection(COL.NOTICES).add(notice);
    return { id: ref.id, ...notice };
  },
  async deleteNotice(id) {
    await getFirestore().collection(COL.NOTICES).doc(id).delete();
  },

  // ── BUYERS ──
  async getBuyers() {
    const snap = await getFirestore().collection(COL.BUYERS).orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async addBuyer(buyer) {
    buyer.createdAt = new Date().toISOString();
    buyer.purchases = [];
    const ref = await getFirestore().collection(COL.BUYERS).add(buyer);
    return { id: ref.id, ...buyer };
  },
  async updateBuyer(id, data) {
    await getFirestore().collection(COL.BUYERS).doc(id).update(data);
  },
  async deleteBuyer(id) {
    await getFirestore().collection(COL.BUYERS).doc(id).delete();
  },

  // ── DOCS ──
  async getDocs() {
    const snap = await getFirestore().collection(COL.DOCS).orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async addDoc(doc) {
    doc.createdAt = new Date().toISOString();
    const ref = await getFirestore().collection(COL.DOCS).add(doc);
    return { id: ref.id, ...doc };
  },
  async deleteDoc(id) {
    await getFirestore().collection(COL.DOCS).doc(id).delete();
  },

  // ── TIMER LOGS ──
  async getTimerLogs() {
    const snap = await getFirestore().collection(COL.TIMER_LOGS).orderBy('startTime', 'desc').limit(50).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async addTimerLog(log) {
    const ref = await getFirestore().collection(COL.TIMER_LOGS).add(log);
    return { id: ref.id, ...log };
  },

  // ── UTIL ──
  formatDate(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
  },
  formatDateTime(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    return `${this.formatDate(iso)} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }
};
