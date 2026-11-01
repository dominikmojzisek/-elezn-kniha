/* ===== Spolupráce s trenérem =====
   Klient zapne sdílení: do souboru coach.json se ukládá kopie plánů, report a příznak "právě cvičí".
   Trenér (v Připojení zvolená role Trenér) vidí report a může plán upravovat, ale jen když klient necvičí.
   Každá úprava se zapíše do seznamu změn a označí u cviku. Klientovi se zobrazí až po tlačítku "Odeslat změny".
   Soubor je sdílený přes cloud (Dropbox sdílená složka, Nextcloud sdílení) nebo se předává ručně. */
const COACH_TABS = [['report', 'Report'], ['plan', 'Plán'], ['chg', 'Změny']];
const clone = o => JSON.parse(JSON.stringify(o));
const canon = o => JSON.stringify(o, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.keys(v).sort().reduce((a, x) => (a[x] = v[x], a), {}) : v);
const hhmm = t => new Date(t).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
let shDoc = null, shData = null, shUnsub = null, pushT = null, pushing = false, pushAgain = false;
const C = { data: null, loading: true, err: null, dirty: false, saving: false, base: '[]', t: null, canWrite: true };

/* ---------- Klientská strana ---------- */
function startClientShare() {
  shDoc = Store.doc('coach');
  if (shUnsub) return;
  shUnsub = shDoc.onSnapshot(snap => {
    shData = snap.exists ? snap.data() : null;
    const b = $('#coachBanner'); if (b) b.innerHTML = coachBannerHtml();
    const c = $('#coachCard'); if (c) c.innerHTML = coachCardHtml();
  }, () => {});
}
function buildReport() {
  const week = S.logs.filter(l => Date.now() - l.date < 7 * 864e5);
  const ids = new Set();
  S.plans.forEach(p => p.days.forEach(d => d.ex.forEach(i => ids.add(i.x))));
  S.logs.slice(0, 40).forEach(l => l.items.forEach(i => ids.add(i.x)));
  const series = {};
  [...ids].slice(0, 40).forEach(x => { const s = progressSeries(x).slice(-30); if (s.length) series[x] = s; });
  return { week: week.length, weekVol: Math.round(setVolume(week)), total: S.logs.length, sessions: S.logs.slice(0, 15), series };
}
function pushSharedSoon() { clearTimeout(pushT); pushT = setTimeout(pushShared, 1500); }
async function pushShared() {
  if (!S.settings.coachOn || !Store.ready) return;
  if (pushing) { pushAgain = true; return; }
  if (!shDoc) shDoc = Store.doc('coach');
  pushing = true;
  try {
    ensureIds(S.plans);
    const mine = {
      enabled: true, updated: Date.now(), report: buildReport(), eq: S.settings.eq || {},
      live: S.sess ? { start: S.sess.start, dayT: S.sess.dayT, planName: S.sess.planName } : null
    };
    await shDoc.transact(d => {
      const patch = Object.assign({}, mine);
      const hold = d && (d.changes || []).some(c => c.ts > (S.settings.coachAcc || 0));
      if (!hold) patch.plans = clone(S.plans);
      if (!d) { patch.changes = []; patch.sentAt = 0; }
      return patch;
    });
  } catch (e) { /* bez sdílení aplikace funguje dál */ }
  pushing = false;
  if (pushAgain) { pushAgain = false; pushShared(); }
}
function acceptCoach() {
  if (S.sess) { toast('Změny použij po dokončení tréninku'); return; }
  if (!shData || !shData.plans) return;
  S.plans = clone(shData.plans); ensureIds(S.plans);
  S.settings.coachAcc = shData.sentAt || Date.now();
  persist(); render(); toast('Změny od trenéra použity');
}
function coachBannerHtml() {
  if (MODE !== 'client' || !shData || !shData.enabled) return '';
  const acc = S.settings.coachAcc || 0, sent = shData.sentAt || 0;
  if (sent <= acc) return '';
  const ch = (shData.changes || []).filter(c => c.ts > acc && c.ts <= sent);
  if (!ch.length) return '';
  const lines = ch.slice(-12).map(c => `<li><b>${esc(c.day)}</b>: ${esc(c.ex)}, ${esc(c.text)}</li>`).join('');
  return `<div class="card stack" style="border-color:var(--warn)"><div class="row"><span class="tag chg">Změna v plánu</span><span class="muted" style="font-size:14px">${hhmm(sent)}</span></div>
    <h3>Trenér upravil tvůj plán</h3><ul style="margin:0;padding-left:20px">${lines}</ul>
    <button class="btn pri" data-act="coachacc">Použít změny v plánu</button></div>`;
}
function coachCardHtml() {
  if (!S.settings.coachOn) return `<div class="stack"><h3>Trenér</h3><p class="muted" style="margin:0;font-size:14px">Zapni sdílení a trenér uvidí tvůj report a plán. Úpravy plánu bude moct dělat jen před začátkem tréninku a každá změna se ti označí.</p><button class="btn" data-act="coachon">Zapnout sdílení s trenérem</button></div>`;
  const live = S.sess ? '<span class="tag chg">Právě cvičíš, trenér plán nemůže měnit</span>' : '';
  return `<div class="stack"><div class="row" style="justify-content:space-between"><h3>Trenér</h3><span class="tag">Sdílení zapnuto</span></div>${live}
    <p class="muted" style="margin:0;font-size:14px">Soubor coach.json musí mít trenér k dispozici: sdílej složku s ním (Dropbox nebo Nextcloud s právem úprav), nebo mu soubor pošli ručně přes Připojení. Uvidí jen sdílený report a plán, ne tvůj soukromý deník.${shData && shData.updated ? ' Naposledy odesláno ' + hhmm(shData.updated) + '.' : ''}</p>
    <div class="row"><button class="btn sm" data-act="coachpush">Odeslat report teď</button><button class="btn sm ghost bad" data-act="coachoff">Vypnout sdílení</button></div></div>`;
}
const coachSlot = () => MODE === 'client' ? `<div id="coachBanner">${coachBannerHtml()}</div>` : '';

/* ---------- Trenérská strana ---------- */
async function enterCoach() {
  MODE = 'coach'; ui.ctab = 'report'; S.plans = []; S.logs = []; S.sess = null; C.canWrite = true;
  C.doc = Store.doc('coach');
  C.doc.onSnapshot(snap => {
    C.data = snap.exists ? snap.data() : null; C.loading = false; C.err = null;
    if (!C.dirty) { S.plans = C.data ? clone(C.data.plans || []) : []; C.base = canon(S.plans); S.settings.eq = (C.data && C.data.eq) || {}; }
    const a = document.activeElement;
    if (a && a.matches && a.matches('#app input,#app select')) { const l = $('#lockBox'); if (l) l.innerHTML = coachLockHtml(); }
    else render();
  }, e => { C.err = e && e.code || 'error'; C.loading = false; render(); });
  render();
}
const coachLocked = () => C.canWrite === false || !!(C.data && C.data.live);
function coachLockHtml() {
  if (C.canWrite === false) return '<div class="card" style="border-color:var(--warn)">Máš jen zobrazení. Pro úpravy plánu tě klient musí pozvat s právem Úpravy.</div>';
  if (C.data && C.data.live) return `<div class="card" style="border-color:var(--warn)"><span class="tag chg">Zamčeno</span> Klient právě cvičí (${esc(C.data.live.dayT)}, od ${hhmm(C.data.live.start)}). Úpravy plánu jsou možné jen před začátkem tréninku.</div>`;
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
    const res = await C.doc.transact(d => {
      why = ''; work = null;
      if (!d || !d.enabled) { why = 'off'; return null; }
      if (d.live) { why = 'live'; return null; }
      if (canon(d.plans || []) !== C.base) { why = 'conflict'; return null; }
      const w = clone(S.plans), ch = diffPlans(JSON.parse(C.base), w, Date.now(), d.sentAt || 0);
      if (!ch.length) return null;
      work = w;
      return { plans: w, changes: (d.changes || []).concat(ch).slice(-80) };
    });
    if (why === 'off') { toast('Klient sdílení vypnul'); C.dirty = false; }
    else if (why === 'live' || why === 'conflict') {
      toast(why === 'live' ? 'Klient právě cvičí, úpravy se neuložily' : 'Klient mezitím změnil plán. Načteno znovu, zopakuj úpravu.');
      const d = (await C.doc.get()).data() || {};
      S.plans = clone(d.plans || []); C.base = canon(S.plans); C.dirty = false; render();
    } else {
      if (res.written && work) { applyChg(work, S.plans); C.base = canon(work); }
      C.dirty = res.written ? canon(S.plans) !== C.base : false;
      if (C.dirty) C.t = setTimeout(coachFlush, 900);
    }
  } catch (e) { toast('Uložení se nepovedlo, zkus to znovu'); }
  C.saving = false;
}
async function coachSend() {
  await coachFlush();
  try {
    let why = '';
    const res = await C.doc.transact(d => {
      if (!d) { why = 'none'; return null; }
      if (d.live) { why = 'live'; return null; }
      if (!(d.changes || []).some(c => c.ts > (d.sentAt || 0))) { why = 'empty'; return null; }
      return { sentAt: Date.now() };
    });
    toast(res.written ? 'Změny odeslány klientovi' : why === 'live' ? 'Klient právě cvičí, odeslání je zamčené' : 'Není co odeslat');
  } catch (e) { toast('Odeslání se nepovedlo'); }
}

/* ---------- Trenérské obrazovky ---------- */
function viewCoach() {
  const head = `<div class="top"><div><small>Trenérský pohled</small><h1>Klient</h1></div><div class="row">${C.data && C.data.updated ? `<span class="tag num">${hhmm(C.data.updated)}</span>` : ''}<button class="btn sm ghost" data-act="settings">Připojení</button></div></div>`;
  if (C.loading) return head + '<div class="card muted">Načítám…</div>';
  if (C.err) return head + '<div class="card muted">Data klienta se nepodařilo načíst. Zkontroluj Připojení: úložiště, cestu ke sdílenému souboru a oprávnění ke sdílené složce.</div>';
  if (!C.data || !C.data.enabled) return head + '<div class="card muted">Soubor od klienta zatím není k dispozici. Zkontroluj v Připojení cestu ke sdílenému souboru, nebo si od klienta nech poslat coach.json a importuj ho. Klient musí mít zapnuté sdílení na záložce Plány.</div>';
  return head + `<div id="lockBox">${coachLockHtml()}</div>` + ({ report: coachReport, plan: coachPlan, chg: coachChanges }[ui.ctab] || coachReport)();
}
function coachReport() {
  const r = C.data.report || { sessions: [], series: {}, week: 0, weekVol: 0, total: 0 };
  const tiles = `<div class="grid2"><div class="stat"><span class="lbl">Za 7 dní</span><b class="num">${r.week}×</b><span class="muted">tréninků</span></div>
    <div class="stat"><span class="lbl">Objem 7 dní</span><b class="num">${Math.round(r.weekVol / 100) / 10} t</b><span class="muted">kg × opakování</span></div>
    <div class="stat"><span class="lbl">Celkem</span><b class="num">${r.total}</b><span class="muted">tréninků</span></div></div>`;
  const ids = Object.keys(r.series || {}).sort((a, b) => exOf(a).n.localeCompare(exOf(b).n, 'cs'));
  if (!ui.cex || !ids.includes(ui.cex)) ui.cex = ids[0];
  const chart = ids.length ? `<div class="card stack"><label class="field"><span class="lbl">Pokrok ve cviku</span><select id="cex" data-f="cex">${ids.map(x => `<option value="${x}"${x === ui.cex ? ' selected' : ''}>${esc(exOf(x).n)}</option>`).join('')}</select></label>${chartSvg(r.series[ui.cex])}</div>` : '';
  const rows = (r.sessions || []).map(l => {
    const open = ui.hist === l.id, sets = l.items.reduce((a, it) => a + it.sets.length, 0);
    const detail = open ? '<div class="stack" style="margin-top:10px">' + l.items.map(it => `<div><b>${esc(exOf(it.x).n)}</b><div class="num muted" style="font-size:14px">${it.sets.map(s => (s.w || 0) + '×' + s.r).join(' · ')}</div></div>`).join('') + '</div>' : '';
    return `<div class="card"><button class="pickitem" style="background:transparent;border:0;padding:0" data-act="openlog" data-l="${l.id}" aria-expanded="${open}"><span><b>${esc(l.dayT)}</b><em>${fmtShort(l.date)} · ${esc(l.planName)}</em></span><span class="num muted" style="font-size:14px">${sets} sérií · ${Math.round(l.dur / 60)} min</span></button>${detail}</div>`;
  }).join('') || '<div class="card muted">Klient zatím neodcvičil žádný trénink.</div>';
  return tiles + chart + '<h2>Poslední tréninky</h2>' + rows;
}
function coachPlan() {
  const p = S.plans.find(x => x.id === ui.openPlan);
  if (p) return viewEditor(p);
  return S.plans.map(p => `<div class="card stack"><div class="row" style="justify-content:space-between"><h2 class="grow">${esc(p.name)}</h2><span class="tag num">${p.days.length} dnů</span></div>
    <div class="muted" style="font-size:14px">${p.days.map(d => esc(d.t) + ' (' + d.ex.length + ')').join(' · ')}</div>
    <button class="btn pri" data-act="openplan" data-p="${p.id}">Upravit plán</button></div>`).join('') || '<div class="card muted">Klient zatím nemá žádný plán.</div>';
}
function coachChanges() {
  const ch = (C.data.changes || []).slice().reverse(), sent = C.data.sentAt || 0, unsent = ch.filter(c => c.ts > sent).length;
  const status = unsent
    ? `<div class="card stack"><b>${unsent} neodeslaných změn</b><div class="muted" style="font-size:14px">Klient je zatím nevidí. Po odeslání se mu v aplikaci zobrazí hlášení se seznamem.</div><button class="btn pri" data-act="coachsend"${coachLocked() ? ' disabled' : ''}>Odeslat změny klientovi</button></div>`
    : `<div class="card muted">Všechny změny jsou odeslané${sent ? ' (' + hhmm(sent) + ')' : ''}.</div>`;
  const rows = ch.map(c => `<div class="card"><span class="lbl">${hhmm(c.ts)} · ${c.ts > sent ? 'koncept' : 'odesláno'}</span><div><b>${esc(c.ex)}</b> · ${esc(c.day)}</div><div class="muted" style="font-size:14px">${esc(c.text)}</div></div>`).join('') || '<div class="card muted">Zatím žádné změny.</div>';
  return status + rows;
}

const COACH_ACTIONS = {
  ctab: el => { ui.ctab = el.dataset.v; ui.openPlan = null; render(); scrollTo(0, 0); },
  coachon: async () => {
    if (!Store.ready) { toast('Nejdřív připoj úložiště v Připojení'); return; }
    S.settings.coachOn = true; persist(); startClientShare(); await pushShared(); render(); toast('Sdílení zapnuto');
  },
  coachpush: async () => { await pushShared(); toast('Report odeslán'); },
  coachoff: () => askDlg('Vypnout sdílení s trenérem?', 'docoachoff'),
  docoachoff: async () => {
    S.settings.coachOn = false; closeDlg(); persist();
    try { await Store.doc('coach').transact(d => d ? { enabled: false, plans: [], report: null, live: null } : null); } catch (e) {}
    render(); toast('Sdílení vypnuto');
  },
  coachacc: () => acceptCoach(),
  coachsend: async () => { await coachSend(); render(); }
};
