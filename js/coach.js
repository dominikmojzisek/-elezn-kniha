/* ===== Spolupráce s trenérem =====
   Klient nasdílí trenérovi složku ve svém úložišti (Dropbox, Nextcloud). Jsou v ní dva soubory:
     app.json    deník klienta, píše jen klient; trenér z něj čte tréninky, nastavení a příznak "právě cvičí"
     plans.json  plány a seznam změn; píše klient i trenér
   Trenér je ve složce host. Plán upravuje hned, ale jen když klient necvičí (příznak live v app.json).
   Každá změna se označí u cviku a zapíše do seznamu změn. Klient vidí hlášení a potvrdí ho tlačítkem Rozumím.
   Souběžné úpravy hlídá revize souboru: při kolizi se načte aktuální stav a úprava se zopakuje. */
const COACH_TABS = [['report', 'Report'], ['plan', 'Plán'], ['chg', 'Změny']];
const clone = o => JSON.parse(JSON.stringify(o));
const canon = o => JSON.stringify(o, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce((a, x) => (a[x] = v[x], a), {}) : v);
const hhmm = t => new Date(t).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
const typing = () => { const a = document.activeElement; return !!(a && a.matches && a.matches('#app input,#app select,#app textarea')); };

/* ---------- Klientská strana ---------- */
/* P = stav souboru plans.json u klienta; base = poslední stav plánů shodný s cloudem */
const P = { doc: null, data: null, base: null, saving: false, t: null, unsub: null };

function startPlansSync() {
  if (P.unsub || !Store.ready) return;
  P.doc = Store.doc('plans');
  P.unsub = P.doc.onSnapshot(snap => {
    P.data = snap.exists ? snap.data() : null;
    if (!P.data) { plansFlush(); return; }
    applyRemotePlans();
    refreshCoachUi();
  }, () => {});
}
function refreshCoachUi() {
  const b = $('#coachBanner'); if (b) b.innerHTML = coachBannerHtml();
  const c = $('#coachCard'); if (c) c.innerHTML = coachCardHtml();
}
/* Plány z cloudu převezmu, pokud klient nemá neuložené vlastní úpravy. Během tréninku nic nepřepisuji. */
function applyRemotePlans() {
  if (MODE !== 'client' || S.sess || !P.data || !Array.isArray(P.data.plans)) return;
  const remote = canon(P.data.plans), mine = canon(S.plans);
  if (remote === mine) { P.base = remote; return; }
  const clean = P.base !== null && mine === P.base;
  if (clean || (P.base === null && P.data.plans.length)) {
    S.plans = clone(P.data.plans); ensureIds(S.plans); P.base = canon(S.plans);
    saveLocal();
    if (!typing()) render();
  } else { plansSoon(); }
}
function plansSoon() { clearTimeout(P.t); P.t = setTimeout(plansFlush, 900); }
async function plansFlush() {
  clearTimeout(P.t);
  if (MODE !== 'client' || !P.doc || !Store.ready) return;
  if (P.saving) { P.t = setTimeout(plansFlush, 500); return; }
  ensureIds(S.plans);
  const mine = canon(S.plans);
  if (mine === P.base) return;
  P.saving = true;
  let conflict = false;
  try {
    const res = await P.doc.transact(d => {
      conflict = false;
      if (d && Array.isArray(d.plans) && P.base !== null && canon(d.plans) !== P.base) { conflict = true; return null; }
      return { plans: clone(S.plans), updated: Date.now(), changes: (d && d.changes) || [], ackAt: (d && d.ackAt) || 0 };
    });
    if (conflict) {
      toast('Trenér mezitím změnil plán, načteno znovu');
      P.data = res.data; P.base = null; applyRemotePlans(); P.base = canon(S.plans); render();
    } else if (res.written) { P.data = res.data; P.base = mine; }
  } catch (e) { /* bez cloudu aplikace funguje dál, zkusí se při další změně */ }
  P.saving = false;
}
function coachBannerHtml() {
  if (MODE !== 'client' || !P.data) return '';
  const ack = P.data.ackAt || 0, ch = (P.data.changes || []).filter(c => c.ts > ack);
  if (!ch.length) return '';
  const lines = ch.slice(-12).map(c => `<li><b>${esc(c.day)}</b>: ${esc(c.ex)}, ${esc(c.text)}</li>`).join('');
  return `<div class="card stack" style="border-color:var(--warn)"><div class="row"><span class="tag chg">Změna v plánu</span><span class="muted" style="font-size:14px">${hhmm(ch[ch.length - 1].ts)}</span></div>
    <h3>Trenér změnil plán</h3><ul style="margin:0;padding-left:20px">${lines}</ul>
    <button class="btn pri" data-act="coachack">Rozumím</button></div>`;
}
function coachCardHtml() {
  const live = S.sess ? '<span class="tag chg">Právě cvičíš, trenér plán nemůže měnit</span>' : '';
  const where = Store.ready && !Store.isManual()
    ? `Nasdílej trenérovi složku <b>${esc(Store.cfg.folder)}</b> ve svém úložišti s právem úprav. Uvidí tvůj deník a plány může měnit, když necvičíš. Každá změna se ti označí.`
    : 'Pro sdílení s trenérem připoj Dropbox nebo Nextcloud v Připojení a nasdílej mu složku. V ručním režimu si s trenérem předáváš soubory app.json a plans.json.';
  return `<div class="stack"><h3>Trenér</h3>${live}<p class="muted" style="margin:0;font-size:14px">${where}${P.data && P.data.updated ? ' Plány naposledy uloženy ' + hhmm(P.data.updated) + '.' : ''}</p></div>`;
}
const coachSlot = () => MODE === 'client' ? `<div id="coachBanner">${coachBannerHtml()}</div>` : '';

/* ---------- Trenérská strana ---------- */
const C = { data: null, app: null, loading: true, loadingApp: true, err: null, dirty: false, saving: false, base: '[]', t: null, doc: null, appDoc: null };

async function enterCoach() {
  MODE = 'coach'; ui.ctab = 'report'; S.plans = []; S.logs = []; S.sess = null;
  C.doc = Store.doc('plans'); C.appDoc = Store.doc('app');
  C.doc.onSnapshot(snap => {
    C.data = snap.exists ? snap.data() : null; C.loading = false; C.err = null;
    if (!C.dirty) { S.plans = C.data ? clone(C.data.plans || []) : []; C.base = canon(S.plans); }
    softRender();
  }, e => { C.err = e && e.code || 'error'; C.loading = false; render(); });
  C.appDoc.onSnapshot(snap => {
    C.app = snap.exists ? snap.data() : null; C.loadingApp = false;
    S.logs = (C.app && C.app.logs) || [];
    S.settings = Object.assign({ level: 1 }, (C.app && C.app.settings) || {});
    if (!S.settings.eq || typeof S.settings.eq !== 'object') S.settings.eq = {};
    softRender();
  }, () => { C.loadingApp = false; });
  render();
}
function softRender() {
  if (typing()) { const l = $('#lockBox'); if (l) l.innerHTML = coachLockHtml(); }
  else render();
}
const coachLocked = () => !!(C.app && C.app.live);
function coachLockHtml() {
  if (C.app && C.app.live) return `<div class="card" style="border-color:var(--warn)"><span class="tag chg">Zamčeno</span> Klient právě cvičí (${esc(C.app.live.dayT)}, od ${hhmm(C.app.live.start)}). Úpravy plánu jsou možné jen před začátkem tréninku.</div>`;
  return '';
}
function diffPlans(oldP, cur, ts, sentAt) {
  const out = [], L = { s: 'série', r: 'opakování', rest: 'pauza', w: 'váha', note: 'poznámka', x: 'výměna' };
  const oldItems = new Map();
  oldP.forEach(p => p.days.forEach(d => d.ex.forEach(i => oldItems.set(i.id, { i, d, p }))));
  const seen = new Set();
  cur.forEach(p => p.days.forEach(d => d.ex.forEach(it => {
    seen.add(it.id);
    const o = oldItems.get(it.id), name = exOf(it.x).n;
    let text = '';
    if (!o) text = 'přidán cvik';
    else {
      const parts = [];
      for (const k of ['x', 's', 'r', 'rest', 'w', 'note']) {
        if ((o.i[k] ?? '') === (it[k] ?? '')) continue;
        parts.push(k === 'x' ? `výměna: ${exOf(o.i.x).n} → ${name}` : k === 'note' ? 'poznámka trenéra' : `${L[k]} ${o.i[k] || 0} → ${it[k] || 0}`);
      }
      text = parts.join(', ');
    }
    if (text) {
      out.push({ id: uid(), ts, plan: p.name, day: d.t, ex: name, text });
      it.chg = { ts, text: (o && it.chg && it.chg.ts > sentAt ? it.chg.text + '; ' : '') + text };
    }
  })));
  oldItems.forEach(({ i, d, p }, id) => { if (!seen.has(id)) out.push({ id: uid(), ts, plan: p.name, day: d.t, ex: exOf(i.x).n, text: 'cvik odebrán' }); });
  return out;
}
function coachPersist() { C.dirty = true; clearTimeout(C.t); C.t = setTimeout(coachFlush, 900); }
function applyChg(from, to) {
  const m = new Map();
  from.forEach(p => p.days.forEach(d => d.ex.forEach(i => { if (i.chg) m.set(i.id, i.chg); })));
  to.forEach(p => p.days.forEach(d => d.ex.forEach(i => { if (m.has(i.id)) i.chg = m.get(i.id); })));
}
async function coachFlush() {
  clearTimeout(C.t);
  if (C.saving) { C.t = setTimeout(coachFlush, 500); return; }
  if (!C.dirty) return;
  C.saving = true;
  let why = '', work = null;
  try {
    const a = (await C.appDoc.get()).data();       // čerstvě: nezačal klient mezitím cvičit?
    if (a) C.app = a;
    const live = !!(a && a.live);
    const res = await C.doc.transact(d => {
      why = ''; work = null;
      if (live) { why = 'live'; return null; }
      if (!d) { why = 'none'; return null; }
      if (canon(d.plans || []) !== C.base) { why = 'conflict'; return null; }
      const w = clone(S.plans), ch = diffPlans(JSON.parse(C.base), w, Date.now(), d.ackAt || 0);
      if (!ch.length) return null;
      work = w;
      return { plans: w, changes: (d.changes || []).concat(ch).slice(-80), updated: Date.now() };
    });
    if (why) {
      toast(why === 'live' ? 'Klient právě cvičí, úpravy se neuložily' : why === 'none' ? 'Klient zatím nemá soubor s plány' : 'Klient mezitím změnil plán. Načteno znovu, zopakuj úpravu.');
      const d = (await C.doc.get()).data() || {};
      C.data = d; S.plans = clone(d.plans || []); C.base = canon(S.plans); C.dirty = false; render();
    } else {
      if (res.written && work) { applyChg(work, S.plans); C.base = canon(work); C.data = res.data; }
      C.dirty = res.written ? canon(S.plans) !== C.base : false;
      if (C.dirty) C.t = setTimeout(coachFlush, 900);
    }
  } catch (e) { toast('Uložení se nepovedlo. Máš ve sdílené složce právo úprav?'); }
  C.saving = false;
}

/* ---------- Trenérské obrazovky ---------- */
function viewCoach() {
  const live = C.app && C.app.live ? '<span class="tag chg">Právě cvičí</span>' : '';
  const head = `<div class="top"><div><small>Trenérský pohled</small><h1>Klient</h1></div><div class="row">${live}<button class="btn sm ghost" data-act="settings">Připojení</button></div></div>`;
  if (C.loading || C.loadingApp) return head + '<div class="card muted">Načítám…</div>';
  if (C.err) return head + '<div class="card muted">Sdílená složka se nepodařilo načíst. Zkontroluj Připojení: úložiště a cestu ke složce, kterou ti klient nasdílel.</div>';
  if (!C.data && !C.app) return head + '<div class="card muted">Ve složce zatím nejsou soubory od klienta. Zkontroluj v Připojení cestu ke sdílené složce. Klient musí mít aplikaci připojenou k úložišti.</div>';
  return head + `<div id="lockBox">${coachLockHtml()}</div>` + ({ report: coachReport, plan: coachPlan, chg: coachChanges }[ui.ctab] || coachReport)();
}
function coachReport() {
  const week = S.logs.filter(l => Date.now() - l.date < 7 * 864e5);
  const ids = new Set();
  S.plans.forEach(p => p.days.forEach(d => d.ex.forEach(i => ids.add(i.x))));
  S.logs.slice(0, 40).forEach(l => l.items.forEach(i => ids.add(i.x)));
  const series = {};
  [...ids].slice(0, 40).forEach(x => { const s = progressSeries(x).slice(-30); if (s.length) series[x] = s; });
  const r = { week: week.length, weekVol: Math.round(setVolume(week)), total: S.logs.length, sessions: S.logs.slice(0, 15), series };
  const tiles = `<div class="grid2"><div class="stat"><span class="lbl">Za 7 dní</span><b class="num">${r.week}×</b><span class="muted">tréninků</span></div>
    <div class="stat"><span class="lbl">Objem 7 dní</span><b class="num">${Math.round(r.weekVol / 100) / 10} t</b><span class="muted">kg × opakování</span></div>
    <div class="stat"><span class="lbl">Celkem</span><b class="num">${r.total}</b><span class="muted">tréninků</span></div></div>`;
  const sids = Object.keys(r.series).sort((a, b) => exOf(a).n.localeCompare(exOf(b).n, 'cs'));
  if (!ui.cex || !sids.includes(ui.cex)) ui.cex = sids[0];
  const chart = sids.length ? `<div class="card stack"><label class="field"><span class="lbl">Pokrok ve cviku</span><select id="cex" data-f="cex">${sids.map(x => `<option value="${x}"${x === ui.cex ? ' selected' : ''}>${esc(exOf(x).n)}</option>`).join('')}</select></label>${chartSvg(r.series[ui.cex])}</div>` : '';
  const rows = r.sessions.map(l => {
    const open = ui.hist === l.id, sets = l.items.reduce((a, it) => a + it.sets.length, 0);
    const detail = open ? '<div class="stack" style="margin-top:10px">' + l.items.map(it => `<div><b>${esc(exOf(it.x).n)}</b><div class="num muted" style="font-size:14px">${it.sets.map(s => (s.w || 0) + '×' + s.r).join(' · ')}</div></div>`).join('') + '</div>' : '';
    return `<div class="card"><button class="pickitem" style="background:transparent;border:0;padding:0" data-act="openlog" data-l="${l.id}" aria-expanded="${open}"><span><b>${esc(l.dayT)}</b><em>${fmtShort(l.date)} · ${esc(l.planName)}</em></span><span class="num muted" style="font-size:14px">${sets} sérií · ${Math.round(l.dur / 60)} min</span></button>${detail}</div>`;
  }).join('') || '<div class="card muted">Klient zatím neodcvičil žádný trénink.</div>';
  return tiles + chart + '<h2>Poslední tréninky</h2>' + rows;
}
function coachPlan() {
  if (!C.data) return '<div class="card muted">Klient zatím nemá soubor s plány (plans.json). Otevře aplikaci připojenou k úložišti a soubor se vytvoří.</div>';
  const p = S.plans.find(x => x.id === ui.openPlan);
  if (p) return viewEditor(p);
  return S.plans.map(p => `<div class="card stack"><div class="row" style="justify-content:space-between"><h2 class="grow">${esc(p.name)}</h2><span class="tag num">${p.days.length} dnů</span></div>
    <div class="muted" style="font-size:14px">${p.days.map(d => esc(d.t) + ' (' + d.ex.length + ')').join(' · ')}</div>
    <button class="btn pri" data-act="openplan" data-p="${p.id}">Upravit plán</button></div>`).join('') || '<div class="card muted">Klient zatím nemá žádný plán.</div>';
}
function coachChanges() {
  const d = C.data || {}, ack = d.ackAt || 0, ch = (d.changes || []).slice().reverse(), wait = ch.filter(c => c.ts > ack).length;
  const status = wait
    ? `<div class="card"><b>${wait} změn čeká na potvrzení klientem</b><div class="muted" style="font-size:14px">Klient je vidí v aplikaci jako hlášení a potvrdí je tlačítkem Rozumím.</div></div>`
    : `<div class="card muted">Klient všechny změny potvrdil${ack ? ' (' + hhmm(ack) + ')' : ''}.</div>`;
  const rows = ch.map(c => `<div class="card"><span class="lbl">${hhmm(c.ts)} · ${c.ts > ack ? 'čeká na potvrzení' : 'potvrzeno'}</span><div><b>${esc(c.ex)}</b> · ${esc(c.day)}</div><div class="muted" style="font-size:14px">${esc(c.text)}</div></div>`).join('') || '<div class="card muted">Zatím žádné změny.</div>';
  return status + rows;
}

const COACH_ACTIONS = {
  ctab: el => { ui.ctab = el.dataset.v; ui.openPlan = null; render(); scrollTo(0, 0); },
  coachack: async () => {
    const now = Date.now();
    const clear = pl => pl.forEach(p => p.days.forEach(d => d.ex.forEach(i => { if (i.chg && i.chg.ts <= now) i.chg = null; })));
    clear(S.plans); saveLocal();
    if (P.data) P.data.ackAt = now;
    refreshCoachUi(); render();
    if (!P.doc) return;
    try {
      const res = await P.doc.transact(d => {
        const pl = clone((d && d.plans) || S.plans); clear(pl);
        return { plans: pl, ackAt: now, updated: now, changes: (d && d.changes) || [] };
      });
      P.data = res.data;
      if (canon(S.plans) === canon(res.data.plans)) P.base = canon(S.plans);
      else { P.base = canon(res.data.plans); S.plans = clone(res.data.plans); ensureIds(S.plans); saveLocal(); }
      render();
    } catch (e) { toast('Potvrzení se nepodařilo uložit, zkus to znovu'); }
  }
};
