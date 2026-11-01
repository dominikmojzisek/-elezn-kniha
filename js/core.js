/* ===== Stav a ukládání ===== */
const LS_KEY = 'zeleznaKniha.v1';
let S = { plans: [], logs: [], settings: { level: 1, eq: {} }, sess: null };
let ui = { tab: 'home', cat: 'all', q: '', openPlan: null, editDay: 0, hist: null, genStep: null };
let MODE = 'client';
let dbDoc = null, saveTimer = null, saving = false, dirty = false;

const uid = () => Math.random().toString(36).slice(2, 9);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $ = (sel, el = document) => el.querySelector(sel);
const fmtDate = d => new Date(d).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
const fmtShort = d => new Date(d).toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' });
const mmss = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t); toast._t = setTimeout(() => t.hidden = true, 2200);
}

/* Do cloudu (app.json) jde deník, nastavení a příznak "právě cvičí". Plány jsou ve sdíleném plans.json. */
function snapshot() {
  return {
    logs: S.logs.slice(0, 150), settings: S.settings, sess: S.sess, updated: Date.now(),
    live: S.sess ? { start: S.sess.start, dayT: S.sess.dayT, planName: S.sess.planName } : null
  };
}
const snapshotLocal = () => Object.assign({ plans: S.plans }, snapshot());
function applyData(d) {
  if (!d || typeof d !== 'object') return;
  if (Array.isArray(d.plans)) { S.plans = d.plans; ensureIds(S.plans); }
  S.logs = Array.isArray(d.logs) ? d.logs : [];
  S.settings = Object.assign({ level: 1 }, d.settings || {});
  if (!S.settings.eq || typeof S.settings.eq !== 'object') S.settings.eq = {};
  S.sess = d.sess || null;
}
function saveLocal() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(snapshotLocal())); } catch (e) {}
}
function loadLocal() {
  try { const raw = localStorage.getItem(LS_KEY); if (raw) applyData(JSON.parse(raw)); } catch (e) {}
}
function persist() {
  if (MODE === 'coach') { coachPersist(); return; }
  saveLocal();
  if (P.doc && Store.ready) plansSoon();
  if (!dbDoc) return;
  dirty = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 900);
}
/* okamžité uložení (začátek a konec tréninku), aby trenér hned viděl, že se cvičí */
function flushNow() { if (!dbDoc) return; dirty = true; clearTimeout(saveTimer); flush(); }
async function flush() {
  if (saving || !dbDoc || !dirty) return;
  saving = true; dirty = false;
  try { await dbDoc.set(snapshot()); }
  catch (e) { toast('Uložení do cloudu se nepovedlo, data jsou v tomto zařízení'); }
  saving = false;
  if (dirty) saveTimer = setTimeout(flush, 900);
}
async function initCloud() {
  try {
    if (!(await Store.init())) return;
    if (Store.cfg.role === 'trainer') { await enterCoach(); return; }
    if (!Store.isManual()) {
      dbDoc = Store.doc('app');
      const snap = await dbDoc.get();
      if (snap.exists) {
        const remote = snap.data();
        // novější data vyhrávají: porovnáme počet tréninků, rozpracovaný trénink z tohoto zařízení nechám
        const rl = (remote.logs || []).length, ll = S.logs.length;
        if (rl >= ll) {
          const keepSess = S.sess;
          applyData(remote);
          if (!S.sess && keepSess) S.sess = keepSess;
          saveLocal(); render();
        } else { flushNow(); }
      } else if (S.logs.length || S.sess) { flushNow(); }
    }
    startPlansSync();
  } catch (e) { toast('Úložiště není dostupné, pracuji s daty v tomto zařízení'); }
}

/* ===== Práce s cviky a plány ===== */
const exOf = id => EXMAP[id] || { id, n: 'Neznámý cvik', c: 'stred', m: '', mu: '', s: 3, r: '10', rest: 60, lvl: 1, tip: '' };
const planItem = (id, over = {}) => { const e = exOf(id); return Object.assign({ id: uid(), x: id, s: e.s, r: e.r, rest: e.rest, w: 0 }, over); };
const ensureIds = plans => plans.forEach(p => p.days.forEach(d => d.ex.forEach(i => { if (!i.id) i.id = uid(); })));
const newPlan = (name, days) => ({ id: uid(), name, created: Date.now(), days: days.map(d => ({ id: uid(), t: d.t, ex: d.ex })) });

/* Generátor: z každé dvojice "a|b" vybere dostupný cvik podle úrovně; když nic z nabídky v klubu není,
   vezme jiný dostupný cvik ze stejné partie. Série a opakování upraví podle cíle. */
function generatePlan(splitId, goalId, level) {
  const sp = SPLITS[splitId], g = GOALS[goalId];
  const days = sp.days.map(d => {
    const used = new Set(), out = [];
    d.ex.forEach((spec, i) => {
      const ids = spec.split('|');
      let opts = ids.map(exOf).filter(e => isAvail(e) && !used.has(e.id));
      if (!opts.length) {
        const cat = exOf(ids[0]).c, pool = EX.filter(e => e.c === cat && isAvail(e) && !used.has(e.id));
        opts = pool.filter(e => e.lvl <= level); if (!opts.length) opts = pool;
      }
      if (!opts.length) return;
      opts.sort((a, b) => Math.abs(a.lvl - level) - Math.abs(b.lvl - level));
      const e = opts[0]; used.add(e.id);
      const compound = i < 2 && e.c !== 'stred';
      const sets = Math.max(2, Math.min(5, e.s + g.setAdd));
      const reps = /[a-zA-Z\/]/.test(e.r) ? e.r : (compound ? g.main : g.iso);
      out.push(planItem(e.id, { s: level === 1 ? Math.min(sets, 3) : sets, r: reps, rest: Math.round(e.rest * g.restMul / 15) * 15 }));
    });
    return { t: d.t, ex: out };
  }).filter(d => d.ex.length);
  if (!days.length) days.push({ t: 'Den 1', ex: [] });
  return newPlan(sp.n + ' · ' + g.n, days);
}

/* Poslední zaznamenaná váha a nejlepší série pro cvik */
function lastWeight(xid) {
  for (const l of S.logs) for (const it of l.items) if (it.x === xid) {
    const done = it.sets.filter(s => s.ok && s.w > 0);
    if (done.length) return Math.max(...done.map(s => s.w));
  }
  return 0;
}
function bestOf(xid) {
  let w = 0, vol = 0;
  for (const l of S.logs) for (const it of l.items) if (it.x === xid)
    for (const s of it.sets) if (s.ok) { w = Math.max(w, s.w || 0); vol += (s.w || 0) * (s.r || 0); }
  return { w, vol };
}
const e1rm = (w, r) => r > 0 ? w * (1 + r / 30) : 0;
const repsLow = r => parseInt(String(r).split('-')[0]) || 8;

/* ===== Trénink (živá relace) ===== */
let tick = null;
function startSession(planId, dayIdx) {
  const p = S.plans.find(x => x.id === planId); if (!p) return;
  const d = p.days[dayIdx]; if (!d) return;
  S.sess = {
    planId, planName: p.name, dayT: d.t, start: Date.now(), rest: null,
    items: d.ex.map(it => {
      const lw = lastWeight(it.x) || it.w || 0;
      return { x: it.x, rest: it.rest, plan: it.r, chg: it.chg ? it.chg.text : '', note: it.note || '', sets: Array.from({ length: it.s }, () => ({ w: lw, r: repsLow(it.r), ok: false })) };
    })
  };
  d.ex.forEach(i => { i.chg = null; });
  ui.tab = 'home'; persist(); flushNow(); render(); startTick(); holdScreen();
}
/* Displej zůstane při tréninku zapnutý (Screen Wake Lock). Na starších iOS verzích v aplikaci z plochy nemusí fungovat. */
let wl = null;
async function holdScreen() {
  if (!S.sess || S.settings.keepAwake === false || !('wakeLock' in navigator) || wl) return;
  try { wl = await navigator.wakeLock.request('screen'); wl.addEventListener('release', () => { wl = null; }); } catch (e) { wl = null; }
}
function releaseScreen() { if (wl) { try { wl.release(); } catch (e) {} wl = null; } }
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (!document.hidden) holdScreen(); });

function startTick() {
  clearInterval(tick);
  tick = setInterval(() => {
    const t = $('#sessClock'); if (t && S.sess) t.textContent = mmss((Date.now() - S.sess.start) / 1000);
    const r = $('#restBox');
    if (r && S.sess && S.sess.rest) {
      const left = (S.sess.rest.end - Date.now()) / 1000;
      if (left <= 0) {
        S.sess.rest = null; persist(); render();
        try { navigator.vibrate && navigator.vibrate([200, 100, 200]); } catch (e) {}
        toast('Pauza skončila, jede se dál');
      } else { $('#restT').textContent = mmss(left); }
    }
  }, 500);
}
function finishSession() {
  const s = S.sess; if (!s) return;
  const items = s.items.map(it => ({ x: it.x, sets: it.sets.filter(z => z.ok).map(z => ({ w: +z.w || 0, r: +z.r || 0, ok: true })) })).filter(it => it.sets.length);
  if (!items.length) { S.sess = null; releaseScreen(); persist(); render(); toast('Trénink zahozen, nic nebylo odcvičeno'); return; }
  S.logs.unshift({ id: uid(), date: s.start, dur: Math.round((Date.now() - s.start) / 1000), planId: s.planId, planName: s.planName, dayT: s.dayT, items });
  S.sess = null; releaseScreen(); clearInterval(tick); persist(); flushNow(); applyRemotePlans(); ui.tab = 'hist'; render();
  toast('Trénink uložen');
}
