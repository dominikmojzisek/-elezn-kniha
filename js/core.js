/* ===== Stav a ukládání ===== */
const LS_KEY = 'zeleznaKniha.v1';
let S = { plans: [], logs: [], settings: { level: 1, eq: {}, home: {} }, sess: null };
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
  if (!S.settings.home || typeof S.settings.home !== 'object') S.settings.home = {};
  if (!Array.isArray(S.settings.customEx)) S.settings.customEx = [];
  syncCustom();
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
const newPlan = (name, days, place) => ({ id: uid(), name, place: place || 'gym', created: Date.now(), days: days.map(d => ({ id: uid(), t: d.t, ex: d.ex })) });

/* Generátor: z každé dvojice "a|b" vybere dostupný cvik podle úrovně; když nic z nabídky v klubu není,
   vezme jiný dostupný cvik ze stejné partie. Série a opakování upraví podle cíle. */
function generatePlan(splitId, goalId, level, opts = {}) {
  const sp = SPLITS[splitId], g = GOALS[goalId], place = sp.place || 'gym';
  const specDays = sp.days.map(d => ({ t: d.t, ex: d.ex.slice() }));
  /* běžecký pás: rozcvička před, doběh po tréninku, nebo samostatný den */
  if (opts.cardio && opts.cardio !== 'none' && isAvail(exOf('walkinc'), place)) {
    if (opts.cardio === 'warm') specDays.forEach(d => d.ex.unshift('treadwarm'));
    else if (opts.cardio === 'fin') specDays.forEach(d => d.ex.push('walkinc'));
    else if (opts.cardio === 'day') specDays.push({ t: 'Kondice na pásu', ex: ['treadwarm', 'runeasy|runint', 'walkinc'] });
  }
  const days = specDays.map(d => {
    const used = new Set(), out = [];
    d.ex.forEach((spec, i) => {
      const ids = spec.split('|');
      let opts2 = ids.map(exOf).filter(e => isAvail(e, place) && !used.has(e.id));
      if (!opts2.length) {
        const cat = exOf(ids[0]).c, pool = EX.filter(e => e.c === cat && isAvail(e, place) && !used.has(e.id));
        opts2 = pool.filter(e => e.lvl <= level); if (!opts2.length) opts2 = pool;
      }
      if (!opts2.length) return;
      opts2.sort((a, b) => Math.abs(a.lvl - level) - Math.abs(b.lvl - level));
      const e = opts2[0]; used.add(e.id);
      if (e.c === 'kondice') { out.push(planItem(e.id)); return; }
      const compound = out.filter(x => exOf(x.x).c !== 'kondice').length < 2 && e.c !== 'stred';
      const sets = Math.max(2, Math.min(5, e.s + g.setAdd));
      const reps = /[a-zA-Z\/]/.test(e.r) ? e.r : (compound ? g.main : g.iso);
      out.push(planItem(e.id, { s: level === 1 ? Math.min(sets, 3) : sets, r: reps, rest: Math.round(e.rest * g.restMul / 15) * 15 }));
    });
    return { t: d.t, ex: out };
  }).filter(d => d.ex.length);
  if (!days.length) days.push({ t: 'Den 1', ex: [] });
  return newPlan(sp.n + ' · ' + g.n, days, place);
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

/* ===== Vývoj zátěže a doporučení váhy =====
   Dvojitá progrese: nejdřív přidáváš opakování v daném rozsahu, a když všechny série dosáhnou horní hranice, zvedne se váha
   a opakování se vrátí na spodní hranici. Když jsi dvakrát po sobě pod rozsahem, nebo se tři tréninky nic nehnulo, váha se ubere o 10 %. */
const fmtKg = v => String(Math.round(v * 100) / 100).replace('.', ',');
const roundTo = (v, st) => Math.round(Math.round(v / st) * st * 100) / 100;
function parseReps(r) {
  const m = String(r || '').match(/(\d+)(?:\s*-\s*(\d+))?\s*(min|s|m)?(?![a-zá-ž])/i);
  if (!m) return { lo: 8, hi: 12, unit: '' };
  const lo = +m[1], hi = m[2] ? Math.max(+m[2], lo) : lo;
  return { lo, hi, unit: (m[3] || '').toLowerCase() };
}
/* poslední tréninky s daným cvikem, od nejnovějšího */
function exHistory(xid, n = 3) {
  const out = [];
  for (const l of S.logs.slice().sort((a, b) => b.date - a.date)) for (const it of l.items) if (it.x === xid) {
    const sets = it.sets.filter(z => z.ok !== false && (z.r || 0) > 0);
    if (sets.length) out.push({ t: l.date, sets, feel: l.feel });
    if (out.length >= n) return out;
  }
  return out;
}
/* o kolik přidat: jednoručky a kettlebell po menších krocích, jinak podle velikosti váhy */
function wStep(xid, w) {
  const tags = (EQ_OF[xid] || []).concat(HOME_OF[xid] || []).join(' ');
  if (/\b(db|kb)\b/.test(tags) && !/\bbb\b/.test(tags)) return w < 10 ? 1 : 2;
  return w < 20 ? 1 : (w < 80 ? 2.5 : 5);
}
const planRepsOf = xid => { for (const p of S.plans) for (const d of p.days) for (const i of d.ex) if (i.x === xid) return i.r; return exOf(xid).r; };
function suggest(xid, planR, planW, place) {
  const e = exOf(xid); if (e.c === 'kondice') return null;
  place = place || placeOfEx(xid);
  const rg = parseReps(planR || e.r), u = rg.unit ? ' ' + rg.unit : '', h = exHistory(xid, 3);
  if (!h.length) {
    if (planW > 0) return { w: planW, r: rg.lo, kind: 'start', last: '', text: `Začni s ${fmtKg(planW)} kg podle plánu.` };
    return { w: 0, r: rg.lo, kind: 'start', last: '', text: rg.unit ? `První trénink, cíl ${rg.lo}${u}.` : `První trénink: zvol zátěž, se kterou dáš ${rg.lo} opakování a dvě by ještě zbyla.` };
  }
  const top = x => Math.max(...x.sets.map(z => z.w || 0));
  const work = (x, w) => x.sets.filter(z => (z.w || 0) === w);
  const w = top(h[0]), reps = work(h[0], w).map(z => z.r), minR = Math.min(...reps), feel = h[0].feel;
  const last = `Minule ${w ? fmtKg(w) + ' kg × ' : ''}${reps.join(', ')}${u}`;
  if (w === 0) {
    if (minR >= rg.hi) return { w: 0, r: rg.hi, kind: 'up', last, text: `Horní hranici ${rg.hi}${u} máš ve všech sériích. Přidej zátěž nebo zvol těžší variantu.` };
    const t = Math.min(rg.hi, Math.max(rg.lo, minR + (rg.unit === 's' ? 5 : 1)));
    return { w: 0, r: t, kind: 'reps', last, text: `Cíl ${t}${u} v každé sérii.` };
  }
  /* váhy se berou z dostupného závaží (Moje závaží), jinak z běžných kroků */
  const up = upW(xid, w, place), down = downW(xid, w * 0.9, place);
  const goUp = why => up > w
    ? { w: up, r: rg.lo, kind: 'up', last, delta: up - w, text: `Přidej na ${fmtKg(up)} kg (+${fmtKg(roundTo(up - w, 0.05))}). ${why}` }
    : { w, r: minR + 1, kind: 'max', last, delta: 0, text: `Těžší závaží v seznamu nemáš. Nech ${fmtKg(w)} kg a přidej opakování nebo sérii.` };
  if (minR >= rg.hi) {
    if (feel === 5) return { w, r: rg.hi, kind: 'hold', last, delta: 0, text: `Rozsah máš splněný, ale minule to bylo na hraně. Nech ${fmtKg(w)} kg ještě jednou.` };
    return goUp(`Všechny série byly na horní hranici ${rg.hi}.`);
  }
  const under = x => { const r = work(x, w).map(z => z.r); return r.length > 0 && r.filter(v => v < rg.lo).length * 2 >= r.length; };
  if (under(h[0])) {
    if (h.length >= 2 && top(h[1]) === w && under(h[1]) && down < w)
      return { w: down, r: rg.lo, kind: 'down', last, delta: down - w, text: `Dvakrát po sobě pod ${rg.lo} opakování. Uber na ${fmtKg(down)} kg a vystavěj to znovu.` };
    return { w, r: rg.lo, kind: 'hold', last, delta: 0, text: `Váha byla těžká. Nech ${fmtKg(w)} kg a dostaň se aspoň na ${rg.lo} opakování.` };
  }
  const sum = x => work(x, w).reduce((a, z) => a + z.r, 0);
  if (h.length >= 3 && h.every(x => top(x) === w) && sum(h[0]) <= sum(h[1]) && sum(h[0]) <= sum(h[2]) && down < w)
    return { w: down, r: rg.hi, kind: 'down', last, delta: down - w, text: `Tři tréninky bez posunu na ${fmtKg(w)} kg. Uber na ${fmtKg(down)} kg a vystavěj to znovu.` };
  if (feel === 1 && minR >= Math.ceil((rg.lo + rg.hi) / 2) && up > w) return goUp('Minule to šlo lehce.');
  const t = Math.min(rg.hi, Math.max(rg.lo, minR + 1));
  return { w, r: t, kind: 'reps', last, delta: 0, text: `Nech ${fmtKg(w)} kg a přidej opakování, cíl ${t}. Až dáš ${rg.hi} ve všech sériích, zvedni váhu.` };
}
/* série pro nově zařazený cvik v tréninku: váha a opakování podle doporučení; výslovná váha od trenéra má přednost */
function sessItem(x, r, rest, n, planW, chg, note, o = {}) {
  const sg = suggest(x, r, planW, o.place), coachW = chg && planW > 0;
  const w0 = coachW ? planW : (sg ? sg.w : (lastWeight(x) || planW || 0));
  const r0 = sg && !coachW ? sg.r : repsLow(r);
  return { x, rest, plan: r, ss: !!o.ss, chg: chg || '', note: note || '', sug: sg ? (coachW ? `Váha ${fmtKg(planW)} kg podle trenéra.` : sg.text) : '', last: sg ? sg.last : '',
    sets: Array.from({ length: n }, () => ({ w: w0, r: r0, ok: false })) };
}

/* ===== Trénink (živá relace) ===== */
let tick = null;
function startSession(planId, dayIdx) {
  const p = S.plans.find(x => x.id === planId); if (!p) return;
  const d = p.days[dayIdx]; if (!d) return;
  S.sess = {
    planId, planName: p.name, dayT: d.t, place: p.place || 'gym', start: Date.now(), rest: null,
    items: d.ex.map(it => sessItem(it.x, it.r, it.rest, it.s, it.w || 0, it.chg ? it.chg.text : '', it.note, { place: p.place || 'gym', ss: it.ss }))
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
        beep();
        toast('Pauza skončila, jede se dál');
      } else { $('#restT').textContent = mmss(left); }
    }
  }, 500);
}
function finishSession(feel, note) {
  const s = S.sess; if (!s) return;
  const items = s.items.map(it => ({ x: it.x, sets: it.sets.filter(z => z.ok).map(z => Object.assign({ w: +z.w || 0, r: +z.r || 0, ok: true }, z.pr ? { pr: true } : {})) })).filter(it => it.sets.length);
  if (!items.length) { S.sess = null; releaseScreen(); persist(); render(); toast('Trénink zahozen, nic nebylo odcvičeno'); return; }
  S.logs.unshift({ id: uid(), date: s.start, dur: Math.round((Date.now() - s.start) / 1000), planId: s.planId, planName: s.planName, dayT: s.dayT, items, feel: feel || 0, note: note || '' });
  S.sess = null; releaseScreen(); clearInterval(tick); persist(); flushNow(); applyRemotePlans(); ui.tab = 'hist'; render();
  toast('Trénink uložen');
}
