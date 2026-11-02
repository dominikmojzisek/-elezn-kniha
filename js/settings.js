/* ===== Připojení k úložišti, export a import ===== */
const APP_VER = '2026-11-02 domácí cvičení';
const normPath = (v, def) => { v = (v || '').trim() || def; return v[0] === '/' ? v : '/' + v; };

function connHint() {
  const c = Store.cfg;
  if (c.provider !== 'manual' && !Store.ready)
    return `<div class="card stack" style="border-color:var(--warn)"><b>Úložiště není připojeno</b><div class="muted" style="font-size:14px">Data zatím zůstávají jen v tomto zařízení. ${esc(Store.err || '')}</div><button class="btn sm" data-act="settings">Připojit</button></div>`;
  if (c.provider === 'manual' && !localStorage.getItem(CFG_KEY))
    return `<div class="card row" style="justify-content:space-between"><span class="muted" style="font-size:14px">Data jsou zatím jen v tomto zařízení. Nastav cloudové úložiště nebo zálohu.</span><button class="btn sm" data-act="settings">Připojení</button></div>`;
  return '';
}

function settingsDialog() {
  const c = Store.cfg, key = c.dbxKey || (window.APP_CONFIG && APP_CONFIG.dropboxAppKey) || '';
  const opt = (v, l, cur) => `<option value="${v}"${v === cur ? ' selected' : ''}>${l}</option>`;
  const status = Store.ready
    ? (Store.isManual() ? 'Ruční režim: data jsou v tomto zařízení.' : 'Připojeno k úložišti.')
    : (c.provider === 'manual' ? 'Ruční režim.' : 'Nepřipojeno.' + (Store.err ? ' ' + Store.err : ''));
  openDlg(`<h2>Připojení</h2><div class="muted" style="font-size:14px">${esc(status)}</div>
    <label class="field"><span class="lbl">Kdo jsem</span><select id="s-role">${opt('client', 'Klient (cvičím podle plánu)', c.role)}${opt('trainer', 'Trenér (upravuji plán klienta)', c.role)}</select></label>
    <label class="field"><span class="lbl">Úložiště</span><select id="s-prov">${opt('dropbox', 'Dropbox', c.provider)}${opt('webdav', 'Nextcloud / WebDAV', c.provider)}${opt('manual', 'Ručně (soubory, iCloud Drive přes Soubory)', c.provider)}</select></label>
    <div class="stack" data-prov="dropbox">
      <label class="field"><span class="lbl">Dropbox App key</span><input id="s-key" value="${esc(key)}" autocomplete="off"></label>
      <div class="muted" style="font-size:13px">Redirect URI v nastavení Dropbox aplikace: <b style="overflow-wrap:anywhere">${esc(DbxProv.redirectUri())}</b></div>
    </div>
    <div class="stack" data-prov="webdav">
      <label class="field"><span class="lbl">Adresa WebDAV</span><input id="s-url" value="${esc(c.davUrl)}" placeholder="https://cloud.example.cz/remote.php/dav/files/jmeno" autocomplete="off"></label>
      <label class="field"><span class="lbl">Uživatel</span><input id="s-user" value="${esc(c.davUser)}" autocomplete="off"></label>
      <label class="field"><span class="lbl">Aplikační heslo</span><input id="s-pass" type="password" value="${esc(c.davPass)}" autocomplete="off"></label>
      <div class="muted" style="font-size:13px">Heslo se ukládá jen v tomto prohlížeči. Použij aplikační heslo z Nextcloudu, ne hlavní.</div>
    </div>
    <div class="stack" data-prov="dropbox webdav">
      <label class="field"><span class="lbl">Složka v úložišti</span><input id="s-folder" value="${esc(c.folder)}" autocomplete="off"></label>
      <div class="muted" style="font-size:13px">Klient: sem se uloží app.json a plans.json. Složku nasdílej trenérovi s právem úprav. Trenér: zadej cestu ke sdílené složce od klienta (obvykle se objeví v kořeni úložiště pod stejným názvem).</div>
    </div>
    <div class="stack" data-prov="manual"><div class="muted" style="font-size:14px">Data zůstávají v tomto prohlížeči. Zálohu a přenos mezi klientem a trenérem děláš soubory níže, které můžeš uložit třeba do iCloud Drive nebo poslat zprávou.</div></div>
    <div class="row"><button class="btn pri grow" data-act="setsave">Uložit a připojit</button><button class="btn" data-act="close">Zavřít</button></div>
    <div class="muted" style="font-size:13px">Verze aplikace: ${APP_VER}</div>
    <div class="lbl">Soubory</div>
    <div class="row"><button class="btn sm" data-act="exportf" data-n="app">Export deníku</button><button class="btn sm" data-act="importf" data-n="app">Import deníku</button></div>
    <div class="row"><button class="btn sm" data-act="exportf" data-n="plans">Export plánů</button><button class="btn sm" data-act="importf" data-n="plans">Import plánů</button></div>`);
  applyProvVisibility(c.provider);
}
function applyProvVisibility(v) {
  dlg.querySelectorAll('[data-prov]').forEach(el => { el.hidden = !el.dataset.prov.split(' ').includes(v); });
}

function downloadJson(obj, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}
async function exportFile(name) {
  if (name === 'app') {
    if (Store.cfg.role === 'trainer') { const sn = await Store.doc('app').get(); if (!sn.exists) { toast('Deník zatím neexistuje'); return; } downloadJson(sn.data(), 'app.json'); }
    else downloadJson(snapshotLocal(), 'app.json');
    return;
  }
  const snap = await Store.doc('plans').get();
  if (!snap.exists) { toast('Soubor s plány zatím neexistuje'); return; }
  downloadJson(snap.data(), 'plans.json');
}
async function importFile(input) {
  const name = input.dataset.n, f = input.files && input.files[0]; input.value = '';
  if (!f) return;
  try {
    const obj = JSON.parse(await f.text());
    if (typeof obj !== 'object' || !obj || Array.isArray(obj)) throw new Error('Soubor nemá správný formát');
    if (name === 'app') {
      if (Store.cfg.role === 'trainer') await Store.doc('app').set(obj);
      else { applyData(obj); saveLocal(); if (dbDoc) { dirty = true; await flush(); } }
    }
    else await Store.doc('plans').set(obj);
    toast('Soubor načten'); setTimeout(() => location.reload(), 500);
  } catch (e) { toast('Import se nepovedl: ' + (e.message || 'neplatný soubor')); }
}

const SETTINGS_ACTIONS = {
  settings: () => settingsDialog(),
  setsave: async () => {
    const g = id => ($('#' + id, dlg) || {}).value || '';
    const c = Store.cfg;
    Object.assign(c, {
      role: g('s-role'), provider: g('s-prov'), dbxKey: g('s-key').trim(), davUrl: g('s-url').trim(), davUser: g('s-user').trim(), davPass: g('s-pass'),
      folder: normPath(g('s-folder'), '/ZeleznaKniha').replace(/\/+$/, '')
    });
    Store.save();
    if (c.provider === 'dropbox' && !DbxProv.ready()) {
      try { await DbxProv.login(); } catch (e) { toast(e.message); }
      return;
    }
    closeDlg(); toast('Nastavení uloženo'); setTimeout(() => location.reload(), 400);
  },
  exportf: el => exportFile(el.dataset.n),
  importf: el => { const i = $('#impfile'); i.dataset.n = el.dataset.n; i.click(); }
};
