/* iDex — despensa virtual offline. Sem dependências. */
(() => {
'use strict';

/* ================= Utilidades ================= */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const hash = s => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
const round = n => Math.round(n * 100) / 100;
const fmt = n => String(round(n)).replace('.', ',');
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const stepOf = u => (u === 'kg' || u === 'L') ? 0.5 : 1;
const byName = (a, b) => a.name.localeCompare(b.name, 'pt-BR');

const ICONS = {
  pantry: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M8 3v9M15 12v9"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M3.5 6l1.2 1.2L7 5M3.5 12l1.2 1.2L7 11M3.5 18l1.2 1.2L7 17"/>',
  settings: '<path d="M4 6h8M16 6h4M4 12h2M10 12h10M4 18h12M20 18h0"/><circle cx="14" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 9"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  check: '<path d="M5 12.5l5 5L20 7"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 16V5M7 9l5-5 5 5M5 20h14"/>',
  chev: '<path d="M6 9l6 6 6-6"/>',
  cart: '<path d="M3 4h2l2.5 10h10L20 7H6.5"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'
};
const ico = (n, s = 24) => `<svg class="ico" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

const LOGO = `<svg class="logo" viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" rx="112" fill="#0f766e"/><circle cx="152" cy="150" r="27" fill="#fbbf24"/><rect x="125" y="204" width="54" height="178" rx="16" fill="#fff"/><rect x="222" y="196" width="76" height="186" rx="18" fill="#fff" opacity=".92"/><rect x="232" y="162" width="56" height="34" rx="10" fill="#fbbf24"/><rect x="338" y="248" width="72" height="134" rx="16" fill="#fff" opacity=".85"/><rect x="92" y="382" width="328" height="30" rx="15" fill="#fde68a"/></svg>`;

/* ================= Dados ================= */
const DEFAULT_CATS = [
  { id: 'graos', name: 'Grãos e massas', emoji: '🌾' },
  { id: 'horti', name: 'Hortifruti', emoji: '🥬' },
  { id: 'lacteos', name: 'Laticínios e frios', emoji: '🥛' },
  { id: 'carnes', name: 'Carnes e ovos', emoji: '🥩' },
  { id: 'bebidas', name: 'Bebidas', emoji: '🥤' },
  { id: 'limpeza', name: 'Limpeza', emoji: '🧴' },
  { id: 'higiene', name: 'Higiene', emoji: '🧼' },
  { id: 'outros', name: 'Outros', emoji: '📦' }
];
const UNITS = ['un', 'pct', 'kg', 'g', 'L', 'ml', 'cx', 'fd', 'dz'];
const SAMPLE = [
  ['Arroz', 'graos', 'pct', 1, 3], ['Feijão', 'graos', 'pct', 0, 3], ['Macarrão', 'graos', 'pct', 4, 4],
  ['Açúcar', 'graos', 'pct', 1, 2], ['Café', 'graos', 'pct', 0, 2], ['Farinha de trigo', 'graos', 'pct', 2, 2],
  ['Tomate', 'horti', 'kg', 1, 2], ['Cebola', 'horti', 'kg', 2, 2], ['Banana', 'horti', 'dz', 0.5, 2],
  ['Leite', 'lacteos', 'L', 4, 12], ['Queijo mussarela', 'lacteos', 'pct', 1, 2], ['Manteiga', 'lacteos', 'un', 1, 1],
  ['Frango', 'carnes', 'kg', 0, 3], ['Ovos', 'carnes', 'dz', 1, 3],
  ['Refrigerante', 'bebidas', 'L', 2, 4], ['Suco', 'bebidas', 'un', 1, 3],
  ['Detergente', 'limpeza', 'un', 1, 3], ['Sabão em pó', 'limpeza', 'un', 2, 2],
  ['Papel higiênico', 'higiene', 'pct', 0, 2], ['Sabonete', 'higiene', 'un', 3, 4]
];

let S;                // estado persistido
const ui = { tab: 'pantry', q: '', filter: 'all', search: false };
let sheet = null;     // { kind, ... }
let edit = null;      // estado do formulário de produto
let deferredInstall = null;

const fresh = () => ({ v: 1, theme: 'paper', cats: DEFAULT_CATS.map(c => ({ ...c })), products: [], collapsed: {} });
function migrate(raw) {
  const s = Object.assign(fresh(), raw || {});
  if (!Array.isArray(s.cats) || !s.cats.length) s.cats = DEFAULT_CATS.map(c => ({ ...c }));
  if (!Array.isArray(s.products)) s.products = [];
  if (!s.collapsed) s.collapsed = {};
  return s;
}

/* ---- Armazenamento: IndexedDB (com fallback em localStorage) ---- */
const idb = () => new Promise((res, rej) => {
  const r = indexedDB.open('idex', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('kv');
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
});
async function dbGet(k) {
  const db = await idb();
  return new Promise((res, rej) => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
}
async function dbSet(k, v) {
  const db = await idb();
  return new Promise((res, rej) => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = () => res(); t.onerror = () => rej(t.error); });
}
async function load() {
  let raw = null;
  try { raw = await dbGet('state'); } catch { try { raw = JSON.parse(localStorage.getItem('idex') || 'null'); } catch { /* ignora */ } }
  S = migrate(raw);
}
let saveT;
function save() {
  clearTimeout(saveT);
  saveT = setTimeout(async () => {
    try { await dbSet('state', JSON.parse(JSON.stringify(S))); }
    catch { try { localStorage.setItem('idex', JSON.stringify(S)); } catch { toast('Não foi possível salvar (sem espaço?)'); } }
  }, 120);
}

/* ================= Regras de negócio ================= */
const byId = id => S.products.find(p => p.id === id);
const catOf = p => S.cats.find(c => c.id === p.cat) || S.cats[S.cats.length - 1];
const status = p => p.stock <= 0 ? 'out' : (p.stock < p.ideal ? 'low' : 'ok');
const need = p => Math.max(0, round(p.ideal - p.stock));
const toBuy = p => (p.buy != null ? p.buy : need(p));
const listCount = () => S.products.filter(p => toBuy(p) > 0 && !p.got).length;

/* ================= Tema ================= */
const THEME_COLORS = { paper: '#f5f1e8', sepia: '#f0e2c3', night: '#0f1514' };
function applyTheme() {
  document.documentElement.dataset.theme = S.theme;
  try { localStorage.setItem('idex-theme', S.theme); } catch { /* ignora */ }
  const m = $('meta[name="theme-color"]'); if (m) m.content = THEME_COLORS[S.theme] || '#0f766e';
}

/* ================= Componentes ================= */
function coverHTML(p, cls = '') {
  const hue = hash(p.name) % 360;
  const c = catOf(p);
  const inner = p.img
    ? `<img src="${p.img}" alt="" draggable="false">`
    : `<div class="ph" style="--h:${hue}"><span class="ph-emoji">${c.emoji}</span><span class="ph-name">${esc(p.name)}</span></div>`;
  return `<div class="cover ${cls}"><div class="face">${inner}</div></div>`;
}
const cell = p => {
  const st = status(p);
  return `<button class="cell" data-act="open" data-id="${p.id}" aria-label="${esc(p.name)}, ${fmt(p.stock)} ${p.unit} em estoque">
    <div class="stand"><div class="cover-wrap" style="width:100%;position:relative">${coverHTML(p).replace('<div class="face">', `<span class="qty ${st}">${fmt(p.stock)}</span><div class="face">`)}</div></div>
    <div class="plank"></div><div class="label">${esc(p.name)}</div></button>`;
};
const filler = () => `<div class="cell filler" aria-hidden="true"><div class="stand"><div class="cover"></div></div><div class="plank"></div><div class="label">&nbsp;</div></div>`;

/* ================= Views ================= */
function viewPantry() {
  const all = S.products;
  if (!all.length) return `<div class="empty">
    <div class="empty-logo">${LOGO}</div>
    <h2>Sua despensa está vazia</h2>
    <p>Cadastre o que você sempre compra, com foto, e acompanhe o estoque de cada prateleira.</p>
    <button class="btn primary" data-act="new">${ico('plus', 20)} Adicionar produto</button>
    <button class="btn ghost" data-act="sample">Carregar exemplos</button></div>`;

  const q = norm(ui.q);
  const counts = { all: all.length, low: all.filter(p => status(p) === 'low').length, out: all.filter(p => status(p) === 'out').length };
  const list = all.filter(p => (ui.filter === 'all' || status(p) === ui.filter) && (!q || norm(p.name).includes(q)));
  const chip = (k, t) => `<button class="chip ${ui.filter === k ? 'on' : ''}" data-act="filter" data-id="${k}">${t}<b>${counts[k]}</b></button>`;
  let html = `<div class="chips">${chip('all', 'Tudo')}${chip('low', 'Acabando')}${chip('out', 'Acabou')}</div>`;
  if (!list.length) return html + `<div class="empty small"><p>Nada encontrado por aqui.</p></div>`;

  for (const c of S.cats) {
    const items = list.filter(p => catOf(p).id === c.id).sort(byName);
    if (!items.length) continue;
    const closed = S.collapsed[c.id] && !q && ui.filter === 'all';
    const pad = (cols - (items.length % cols)) % cols;
    html += `<section class="shelf ${closed ? 'closed' : ''}">
      <button class="shelf-head" data-act="toggle-cat" data-id="${c.id}"><span class="emo">${c.emoji}</span><span class="nm">${esc(c.name)}</span><span class="ct">${items.length}</span><span class="chev">${ico('chev', 20)}</span></button>
      <div class="grid">${items.map(cell).join('')}${filler().repeat(pad)}</div></section>`;
  }
  return html;
}

function viewList() {
  const items = S.products.filter(p => toBuy(p) > 0);
  const open = items.filter(p => !p.got).length;
  let html = '';
  if (!items.length) {
    return `<div class="empty"><div class="empty-logo">${LOGO}</div><h2>Nada a comprar 🎉</h2>
      <p>Seu estoque está no nível ideal. Quando algo baixar, aparece aqui automaticamente.</p>
      <button class="btn ghost" data-act="pick-sheet">${ico('plus', 20)} Adicionar item à lista</button></div>`;
  }
  html += `<div class="sum"><div><div class="big">${open}</div><small>${open === 1 ? 'item' : 'itens'} para comprar</small></div></div>`;
  for (const c of S.cats) {
    const g = items.filter(p => catOf(p).id === c.id).sort((a, b) => (a.got - b.got) || byName(a, b));
    if (!g.length) continue;
    html += `<section class="lgroup"><h3>${c.emoji} ${esc(c.name)}</h3><div class="lrows">${g.map(p => `
      <div class="row ${p.got ? 'done' : ''}">
        <button class="chk" data-act="got" data-id="${p.id}" aria-label="Marcar ${esc(p.name)} como comprado">${p.got ? ico('check', 18) : ''}</button>
        <div class="thumb">${coverHTML(p)}</div>
        <div class="info"><b>${esc(p.name)}</b><small>Tenho ${fmt(p.stock)} de ${fmt(p.ideal)}</small></div>
        <div class="mini"><button data-act="buy-" data-id="${p.id}" aria-label="Diminuir">${ico('minus', 16)}</button><span>${fmt(toBuy(p))} ${p.unit}</span><button data-act="buy+" data-id="${p.id}" aria-label="Aumentar">${ico('plus', 16)}</button></div>
      </div>`).join('')}</div></section>`;
  }
  const got = items.filter(p => p.got).length;
  html += `<div class="listbar"><div class="in">
    <button class="btn" data-act="pick-sheet">${ico('plus', 20)}</button>
    <button class="btn primary" data-act="finish" ${got ? '' : 'disabled'}>${ico('cart', 20)} Concluir feira${got ? ` (${got})` : ''}</button></div></div>`;
  return html;
}

function viewSettings() {
  const th = (k, name, bg, wood) => `<button class="theme-btn ${S.theme === k ? 'on' : ''}" data-act="theme" data-id="${k}"><span class="sw" style="background:${bg};--w:${wood}"></span>${name}</button>`;
  const iosHint = /iphone|ipad|ipod/i.test(navigator.userAgent) && !navigator.standalone;
  return `
  <section class="card"><h3>Aparência</h3><div class="themes">${th('paper', 'Papel', '#f5f1e8', '#b98450')}${th('sepia', 'Sépia', '#f0e2c3', '#8e5f30')}${th('night', 'Noite', '#0f1514', '#583b20')}</div></section>
  <section class="card"><h3>Prateleiras</h3><p>Organize as categorias onde seus produtos ficam guardados.</p>
    <div class="btns"><button class="btn" data-act="cats">${ico('folder', 20)} Gerenciar prateleiras</button></div></section>
  <section class="card"><h3>Seus dados</h3><p>Tudo fica salvo só neste aparelho e funciona sem internet. Faça um backup de vez em quando.</p>
    <div class="btns"><button class="btn" data-act="export">${ico('download', 20)} Exportar</button><button class="btn" data-act="import">${ico('upload', 20)} Importar</button><button class="btn danger" data-act="reset">${ico('trash', 20)} Apagar tudo</button></div></section>
  ${deferredInstall ? `<section class="card"><h3>Instalar iDex</h3><p>Adicione à tela inicial para abrir como um app.</p><div class="btns"><button class="btn primary" data-act="install">Instalar app</button></div></section>`
    : iosHint ? `<section class="card"><h3>Instalar iDex</h3><p>No iPhone: toque em Compartilhar e depois em “Adicionar à Tela de Início”.</p></section>` : ''}
  <p class="about">iDex 1.0 · ${S.products.length} produtos guardados</p>`;
}

/* ================= Render ================= */
let cols = 3;
function calcCols() {
  const w = Math.min(innerWidth, 900);
  const c = w < 480 ? 3 : w < 700 ? 4 : 5;
  const changed = c !== cols; cols = c;
  document.documentElement.style.setProperty('--cols', c);
  return changed;
}
const TITLES = { pantry: null, list: 'Lista de compras', settings: 'Ajustes' };

function renderTop() {
  const t = TITLES[ui.tab];
  let actions = '';
  if (ui.tab === 'pantry' && S.products.length) actions = `<button class="icon-btn" data-act="search" aria-label="Buscar">${ico('search')}</button>`;
  if (ui.tab === 'list' && S.products.some(p => toBuy(p) > 0)) actions = `<button class="icon-btn" data-act="share-list" aria-label="Copiar ou compartilhar lista">${ico('copy')}</button>`;
  $('#topbar').innerHTML = `<div class="top-row"><div class="brand">${LOGO}<h1>${t ? esc(t) : '<span class="i">i</span>Dex'}</h1></div>${actions}</div>` +
    (ui.search && ui.tab === 'pantry' ? `<div class="searchbar"><input id="q" type="search" placeholder="Buscar produto…" value="${esc(ui.q)}" autocomplete="off"><button class="icon-btn" data-act="search-close" aria-label="Fechar busca">${ico('close')}</button></div>` : '');
}
function renderView() {
  const v = $('#view');
  v.innerHTML = ui.tab === 'pantry' ? viewPantry() : ui.tab === 'list' ? viewList() : viewSettings();
  $('#fab').hidden = !(ui.tab === 'pantry' && S.products.length);
}
function renderTabs() {
  const n = listCount();
  const t = (k, i, l) => `<button class="tab ${ui.tab === k ? 'on' : ''}" data-act="tab" data-id="${k}">${ico(i)}<span>${l}</span>${k === 'list' && n ? `<i class="bd">${n}</i>` : ''}</button>`;
  $('#tabs').innerHTML = `<div class="in">${t('pantry', 'pantry', 'Despensa')}${t('list', 'list', 'Lista')}${t('settings', 'settings', 'Ajustes')}</div>`;
}
function render() { renderTop(); renderView(); renderTabs(); }
function refresh() { renderView(); renderTabs(); if (ui.tab !== 'pantry' || !ui.search) renderTop(); }

/* ================= Sheet (modal inferior) ================= */
let closeTimer;
function openSheet(next) {
  sheet = next;
  const root = $('#sheet-root');
  if (!root.firstChild || root.classList.contains('closing')) {
    clearTimeout(closeTimer); root.classList.remove('closing');
    root.innerHTML = '<div class="backdrop" data-act="close"></div><section class="sheet" role="dialog" aria-modal="true"></section>';
    history.pushState({ idex: 1 }, '');
  }
  paintSheet();
}
function paintSheet() {
  const el = $('.sheet'); if (!el || !sheet) return;
  el.innerHTML = SHEETS[sheet.kind]();
  const sb = $('.sheet-body', el); if (sb) sb.scrollTop = 0;
}
function closeSheet() {
  if (!$('.sheet')) return;
  if (history.state && history.state.idex) history.back(); else removeSheet();
}
function removeSheet() {
  const root = $('#sheet-root'); if (!root.firstChild) return;
  root.classList.add('closing');
  closeTimer = setTimeout(() => { root.innerHTML = ''; root.classList.remove('closing'); sheet = null; edit = null; }, 180);
}
addEventListener('popstate', removeSheet);
addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

const stepper = (act, id, value, unit, cls = '') => `<div class="stepper ${cls}">
  <button data-act="${act}-" data-id="${id}" aria-label="Diminuir">${ico('minus', 22)}</button>
  <div class="v">${fmt(value)}<small>${esc(unit)}</small></div>
  <button data-act="${act}+" data-id="${id}" aria-label="Aumentar">${ico('plus', 22)}</button></div>`;

const SHEETS = {
  product() {
    const p = byId(sheet.id);
    if (!p) { setTimeout(closeSheet); return ''; }
    const st = status(p), n = toBuy(p), c = catOf(p);
    return `<div class="grab"></div>
    <div class="sheet-body">
      <div class="pd-top"><div class="pd-cover">${coverHTML(p, 'big')}</div>
        <div class="pd-meta"><span class="pill ${st}">${{ ok: 'Em dia', low: 'Acabando', out: 'Acabou' }[st]}</span><h2>${esc(p.name)}</h2><div class="muted">${c.emoji} ${esc(c.name)}</div></div></div>
      <div class="panel">
        <div class="prow"><div><b>Em estoque</b><small>quanto tenho agora</small></div>${stepper('stock', p.id, p.stock, p.unit)}</div>
        <div class="prow"><div><b>Quero ter</b><small>nível ideal</small></div>${stepper('ideal', p.id, p.ideal, p.unit, 'sm')}</div>
      </div>
      <div class="buy ${n ? 'on' : ''}"><span>${n ? `Na próxima feira: <b>${fmt(n)} ${esc(p.unit)}</b>` : 'Estoque completo, nada a comprar'}</span>
        <button class="btn" style="height:38px;padding:0 14px" data-act="toggle-list" data-id="${p.id}">${n ? 'Tirar da lista' : 'Pôr na lista'}</button></div>
    </div>
    <div class="sheet-foot"><button class="btn" data-act="edit" data-id="${p.id}">${ico('edit', 20)} Editar</button><button class="btn primary" data-act="close">Pronto</button></div>`;
  },

  edit() {
    const e = edit;
    return `<div class="grab"></div>
    <div class="sheet-head"><h2>${e.id ? 'Editar produto' : 'Novo produto'}</h2><button class="icon-btn" data-act="close" aria-label="Fechar">${ico('close')}</button></div>
    <div class="sheet-body">
      <div class="photo-row">
        <div class="photo-prev" id="prev"></div>
        <div class="photo-btns">
          <label class="btn primary"><input type="file" accept="image/*" capture="environment" id="f-cam" hidden>${ico('camera', 20)} Tirar foto</label>
          <label class="btn"><input type="file" accept="image/*" id="f-gal" hidden>${ico('image', 20)} Galeria</label>
          <div class="seg" id="fit" ${e.file ? '' : 'hidden'}><button type="button" data-act="fit" data-id="cover" class="${e.fit === 'cover' ? 'on' : ''}">Preencher</button><button type="button" data-act="fit" data-id="contain" class="${e.fit === 'contain' ? 'on' : ''}">Ajustar</button></div>
          <button class="btn link" data-act="photo-rm" id="rm" ${e.img ? '' : 'hidden'}>Remover foto</button>
        </div>
      </div>
      <label class="field"><span>Nome</span><input id="e-name" value="${esc(e.name)}" placeholder="Ex.: Arroz" autocomplete="off" maxlength="60"></label>
      <div class="frow">
        <label class="field"><span>Prateleira</span><select id="e-cat">${S.cats.map(c => `<option value="${c.id}" ${c.id === e.cat ? 'selected' : ''}>${c.emoji} ${esc(c.name)}</option>`).join('')}</select></label>
        <label class="field" style="max-width:110px"><span>Unidade</span><select id="e-unit">${UNITS.map(u => `<option ${u === e.unit ? 'selected' : ''}>${u}</option>`).join('')}</select></label>
      </div>
      <div class="frow">
        <label class="field"><span>Tenho agora</span><input id="e-stock" type="number" inputmode="decimal" min="0" step="any" value="${e.stock}"></label>
        <label class="field"><span>Quero ter</span><input id="e-ideal" type="number" inputmode="decimal" min="0" step="any" value="${e.ideal}"></label>
      </div>
    </div>
    <div class="sheet-foot">${e.id ? `<button class="btn danger" data-act="delete" data-id="${e.id}" style="flex:0 0 auto">${ico('trash', 20)}</button>` : ''}<button class="btn primary" data-act="save">Salvar</button></div>`;
  },

  cats() {
    return `<div class="grab"></div>
    <div class="sheet-head"><h2>Prateleiras</h2><button class="icon-btn" data-act="close" aria-label="Fechar">${ico('close')}</button></div>
    <div class="sheet-body">
      <p class="muted" style="font-size:14px">Edite o nome e o emoji. Ao apagar uma prateleira, os produtos vão para outra.</p>
      ${S.cats.map(c => `<div class="catrow"><input class="e" data-cat-emoji="${c.id}" value="${esc(c.emoji)}" maxlength="4" aria-label="Emoji"><input class="n" data-cat-name="${c.id}" value="${esc(c.name)}" maxlength="30" aria-label="Nome"><button class="icon-btn" data-act="cat-del" data-id="${c.id}" aria-label="Apagar">${ico('trash', 20)}</button></div>`).join('')}
      <div class="catrow" style="margin-top:6px"><input class="e" id="nc-e" value="🛒" maxlength="4"><input class="n" id="nc-n" placeholder="Nova prateleira" maxlength="30"><button class="btn primary" style="height:44px;padding:0 14px" data-act="cat-add">${ico('plus', 20)}</button></div>
    </div>
    <div class="sheet-foot"><button class="btn primary" data-act="close">Pronto</button></div>`;
  },

  pick() {
    return `<div class="grab"></div>
    <div class="sheet-head"><h2>Adicionar à lista</h2><button class="icon-btn" data-act="close" aria-label="Fechar">${ico('close')}</button></div>
    <div class="sheet-body"><label class="field"><span>Buscar</span><input id="pq" type="search" placeholder="Nome do produto" autocomplete="off" value="${esc(sheet.q || '')}"></label><div id="pl">${pickList()}</div></div>
    <div class="sheet-foot"><button class="btn primary" data-act="close">Pronto</button></div>`;
  }
};
function pickList() {
  const q = norm(sheet && sheet.q);
  const items = S.products.filter(p => toBuy(p) <= 0 && (!q || norm(p.name).includes(q))).sort(byName);
  if (!items.length) return '<p class="muted" style="padding:14px 4px">Nenhum produto disponível.</p>';
  return items.map(p => `<div class="prow-pick"><div class="thumb">${coverHTML(p)}</div><div class="info" style="flex:1;min-width:0"><b style="display:block">${esc(p.name)}</b><small class="muted">Tenho ${fmt(p.stock)} ${p.unit}</small></div><button class="btn" style="height:38px;padding:0 14px" data-act="pick" data-id="${p.id}">${ico('plus', 18)} Lista</button></div>`).join('');
}

/* ================= Foto ================= */
async function processImage(file, fit) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const W = 360, H = 480;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const s = fit === 'contain' ? Math.min(W / iw, H / ih) : Math.max(W / iw, H / ih);
    x.drawImage(img, (W - iw * s) / 2, (H - ih * s) / 2, iw * s, ih * s);
    return c.toDataURL('image/jpeg', 0.82);
  } finally { URL.revokeObjectURL(url); }
}
function updatePreview() {
  const nameEl = $('#e-name'), catEl = $('#e-cat');
  const fake = { name: (nameEl && nameEl.value.trim()) || 'Produto', cat: catEl ? catEl.value : edit.cat, img: edit.img };
  const prev = $('#prev'); if (prev) prev.innerHTML = coverHTML(fake, 'big');
  const rm = $('#rm'); if (rm) rm.hidden = !edit.img;
  const fit = $('#fit'); if (fit) fit.hidden = !edit.file;
}
async function regen() {
  try { edit.img = await processImage(edit.file, edit.fit); updatePreview(); }
  catch { toast('Não consegui ler essa imagem'); }
}

/* ================= Ações ================= */
function newEdit(p) {
  edit = p ? { id: p.id, name: p.name, cat: p.cat, unit: p.unit, stock: p.stock, ideal: p.ideal, img: p.img || null, file: null, fit: 'cover' }
           : { id: null, name: '', cat: (S.cats[0] || {}).id, unit: 'un', stock: 0, ideal: 1, img: null, file: null, fit: 'cover' };
  openSheet({ kind: 'edit' });
  updatePreview();
  if (!p) setTimeout(() => { const n = $('#e-name'); if (n) n.focus(); }, 280);
}
function adjust(p, key, dir) {
  const step = stepOf(p.unit);
  p[key] = Math.max(0, round(p[key] + dir * step));
  if (key === 'stock') { p.buy = null; if (!toBuy(p)) p.got = false; }
  if (key === 'ideal' && !toBuy(p)) p.got = false;
  save(); refresh(); paintSheet();
}
function saveProduct() {
  const name = $('#e-name').value.trim();
  if (!name) { toast('Dê um nome ao produto'); $('#e-name').focus(); return; }
  const num = id => Math.max(0, round(parseFloat(String($('#' + id).value).replace(',', '.')) || 0));
  const data = { name, cat: $('#e-cat').value, unit: $('#e-unit').value, stock: num('e-stock'), ideal: num('e-ideal'), img: edit.img || null };
  if (edit.id) { const p = byId(edit.id); Object.assign(p, data); p.buy = null; }
  else S.products.push({ id: uid(), buy: null, got: false, created: Date.now(), ...data });
  const wasNew = !edit.id;
  save(); refresh(); closeSheet();
  toast(wasNew ? 'Produto guardado na prateleira' : 'Produto atualizado');
}
function finishShopping() {
  const got = S.products.filter(p => p.got && toBuy(p) > 0);
  if (!got.length) return;
  if (!confirm(`Adicionar ${got.length} ${got.length > 1 ? 'itens comprados' : 'item comprado'} ao estoque?`)) return;
  got.forEach(p => { p.stock = round(p.stock + toBuy(p)); p.got = false; p.buy = null; });
  S.products.forEach(p => { if (p.got) p.got = false; });
  save(); refresh(); toast('Estoque atualizado ✔');
}
function listText() {
  let t = '🛒 Lista de compras — iDex\n';
  for (const c of S.cats) {
    const g = S.products.filter(p => catOf(p).id === c.id && toBuy(p) > 0 && !p.got).sort(byName);
    if (!g.length) continue;
    t += `\n${c.emoji} ${c.name}\n` + g.map(p => `• ${p.name} — ${fmt(toBuy(p))} ${p.unit}`).join('\n') + '\n';
  }
  return t.trim();
}
async function shareList() {
  const text = listText();
  try {
    if (navigator.share) { await navigator.share({ title: 'Lista de compras', text }); return; }
    await navigator.clipboard.writeText(text); toast('Lista copiada');
  } catch (e) { if (e && e.name !== 'AbortError') toast('Não foi possível compartilhar'); }
}
function exportData() {
  const blob = new Blob([JSON.stringify(S)], { type: 'application/json' });
  const a = document.createElement('a');
  const d = new Date(), pad = n => String(n).padStart(2, '0');
  a.href = URL.createObjectURL(blob);
  a.download = `idex-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Backup exportado');
}
async function importData(file) {
  try {
    const raw = JSON.parse(await file.text());
    if (!raw || !Array.isArray(raw.products)) throw new Error('inválido');
    if (!confirm(`Substituir os dados atuais por este backup (${raw.products.length} produtos)?`)) return;
    S = migrate(raw); applyTheme(); save(); render(); toast('Backup importado ✔');
  } catch { toast('Arquivo de backup inválido'); }
}

const actions = {
  tab(id) { ui.tab = id; ui.search = false; ui.q = ''; render(); scrollTo(0, 0); },
  search() { ui.search = true; renderTop(); setTimeout(() => { const q = $('#q'); if (q) q.focus(); }, 30); },
  'search-close'() { ui.search = false; ui.q = ''; renderTop(); renderView(); },
  filter(id) { ui.filter = id; renderView(); },
  'toggle-cat'(id) { S.collapsed[id] = !S.collapsed[id]; save(); renderView(); },
  open(id) { openSheet({ kind: 'product', id }); },
  close() { closeSheet(); },
  new() { newEdit(null); },
  edit(id) { newEdit(byId(id)); },
  save() { saveProduct(); },
  delete(id) {
    const p = byId(id); if (!p || !confirm(`Apagar “${p.name}”?`)) return;
    S.products = S.products.filter(x => x.id !== id); save(); refresh(); closeSheet(); toast('Produto apagado');
  },
  'stock+'(id) { adjust(byId(id), 'stock', 1); }, 'stock-'(id) { adjust(byId(id), 'stock', -1); },
  'ideal+'(id) { adjust(byId(id), 'ideal', 1); }, 'ideal-'(id) { adjust(byId(id), 'ideal', -1); },
  'toggle-list'(id) {
    const p = byId(id);
    if (toBuy(p) > 0) { p.buy = 0; p.got = false; } else { p.buy = Math.max(need(p), stepOf(p.unit)); }
    save(); refresh(); paintSheet();
  },
  got(id) { const p = byId(id); p.got = !p.got; save(); refresh(); },
  'buy+'(id) { const p = byId(id); p.buy = round(toBuy(p) + stepOf(p.unit)); save(); refresh(); },
  'buy-'(id) {
    const p = byId(id); p.buy = Math.max(0, round(toBuy(p) - stepOf(p.unit)));
    if (p.buy === 0) { p.got = false; toast('Removido da lista'); }
    save(); refresh();
  },
  finish() { finishShopping(); },
  'share-list'() { shareList(); },
  'pick-sheet'() { openSheet({ kind: 'pick', q: '' }); },
  pick(id) { const p = byId(id); p.buy = stepOf(p.unit); p.got = false; save(); refresh(); const pl = $('#pl'); if (pl) pl.innerHTML = pickList(); toast(`${p.name} na lista`); },
  sample() {
    SAMPLE.forEach(([name, cat, unit, stock, ideal]) => S.products.push({ id: uid(), name, cat, unit, stock, ideal, img: null, buy: null, got: false, created: Date.now() }));
    save(); render(); toast('Exemplos carregados');
  },
  theme(id) { S.theme = id; applyTheme(); save(); renderView(); },
  cats() { openSheet({ kind: 'cats' }); },
  'cat-add'() {
    const n = $('#nc-n').value.trim(); if (!n) { $('#nc-n').focus(); return; }
    S.cats.push({ id: uid(), name: n, emoji: $('#nc-e').value.trim() || '📦' });
    save(); paintSheet(); refresh();
  },
  'cat-del'(id) {
    if (S.cats.length <= 1) { toast('Mantenha pelo menos uma prateleira'); return; }
    const c = S.cats.find(x => x.id === id);
    const n = S.products.filter(p => p.cat === id).length;
    if (!confirm(`Apagar “${c.name}”?${n ? ` Os ${n} produtos vão para outra prateleira.` : ''}`)) return;
    S.cats = S.cats.filter(x => x.id !== id);
    const dest = S.cats[S.cats.length - 1].id;
    S.products.forEach(p => { if (p.cat === id) p.cat = dest; });
    save(); paintSheet(); refresh();
  },
  fit(id) {
    edit.fit = id;
    document.querySelectorAll('#fit button').forEach(b => b.classList.toggle('on', b.dataset.id === id));
    if (edit.file) regen();
  },
  'photo-rm'() { edit.img = null; edit.file = null; updatePreview(); },
  export() { exportData(); },
  import() { $('#imp').click(); },
  reset() {
    if (!confirm('Apagar TODOS os produtos e configurações deste aparelho? Isso não pode ser desfeito.')) return;
    S = fresh(); applyTheme(); save(); render(); toast('Tudo limpo');
  },
  async install() {
    if (!deferredInstall) return;
    deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; renderView();
  }
};

/* ================= Eventos ================= */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const fn = actions[el.dataset.act]; if (fn) fn(el.dataset.id, el, e);
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'q') { ui.q = t.value; renderView(); }
  else if (t.id === 'pq') { sheet.q = t.value; $('#pl').innerHTML = pickList(); }
  else if (t.id === 'e-name') updatePreview();
});
document.addEventListener('change', async e => {
  const t = e.target;
  if (t.id === 'f-cam' || t.id === 'f-gal') {
    const f = t.files && t.files[0]; if (!f) return;
    edit.file = f; await regen(); t.value = '';
  } else if (t.id === 'e-cat') updatePreview();
  else if (t.id === 'imp') { const f = t.files && t.files[0]; if (f) await importData(f); t.value = ''; }
  else if (t.dataset.catName) { const c = S.cats.find(x => x.id === t.dataset.catName); if (c && t.value.trim()) { c.name = t.value.trim(); save(); refresh(); } }
  else if (t.dataset.catEmoji) { const c = S.cats.find(x => x.id === t.dataset.catEmoji); if (c) { c.emoji = t.value.trim() || '📦'; save(); refresh(); } }
});
addEventListener('resize', () => { if (calcCols() && ui.tab === 'pantry') renderView(); });
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; if (ui.tab === 'settings') renderView(); });
addEventListener('appinstalled', () => { deferredInstall = null; });

let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ================= Início ================= */
(async function boot() {
  await load();
  $('#fab').innerHTML = ico('plus', 28);
  applyTheme(); calcCols(); render();
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch { /* ignora */ }
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
})();
