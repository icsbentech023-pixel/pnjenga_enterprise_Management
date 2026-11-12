// ===== Gathaiti & Kanjuku: data entry + dashboard, stored in a Google Sheet =====
const BIZ = ['GATHAITI', 'KANJUKU'];
const HEAD = {
  Items: ['Category', 'Item', 'Unit cost', 'Unit price', 'Reorder level'],
  Sales: ['ID', 'Date', 'Business', 'Category', 'Item', 'Qty', 'Unit cost', 'Unit price', 'Total', 'Profit', 'Created'],
  Stock: ['ID', 'Date', 'Business', 'Category', 'Item', 'Qty', 'Unit cost', 'Total cost', 'Supplier', 'Created'],
  Expenses: ['ID', 'Date', 'Business', 'Type', 'Description', 'Amount', 'Created'],
  MPesa: ['ID', 'Date', 'Business', 'Opening float', 'Opening cash', 'Deposits', 'Withdrawals', 'Commission', 'Capital added', 'Closing float', 'Closing cash', 'Variance', 'Notes', 'Created']
};
const TAB = { sales: { sheet: 'Sales', prefix: 'S' }, stock: { sheet: 'Stock', prefix: 'R' }, exp: { sheet: 'Expenses', prefix: 'E' }, mpesa: { sheet: 'MPesa', prefix: 'M' } };
const MAP = {
  sales: r => ({ id: r[0], date: day_(r[1]), biz: r[2], cat: r[3], item: r[4], qty: r[5], total: r[8], profit: r[9] }),
  stock: r => ({ id: r[0], date: day_(r[1]), biz: r[2], cat: r[3], item: r[4], qty: r[5], tcost: r[7], supplier: r[8] }),
  exp: r => ({ id: r[0], date: day_(r[1]), biz: r[2], etype: r[3], desc: r[4], amount: r[5] }),
  mpesa: r => ({ id: r[0], date: day_(r[1]), biz: r[2], comm: r[7], cfloat: r[9], ccash: r[10], variance: r[11] })
};

function doGet(e) {
  const dash = e && e.parameter && e.parameter.page === 'dashboard';
  return HtmlService.createHtmlOutputFromFile(dash ? 'Index' : 'DataEntry')
    .setTitle(dash ? 'Gathaiti & Kanjuku' : 'Data entry')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ---------- One-time setup (run from the editor) ----------
function setup() {
  const P = PropertiesService.getScriptProperties();
  let ss = P.getProperty('SHEET_ID') ? SpreadsheetApp.openById(P.getProperty('SHEET_ID')) : null;
  if (!ss) { ss = SpreadsheetApp.create('Gathaiti & Kanjuku Data'); P.setProperty('SHEET_ID', ss.getId()); }
  Object.keys(HEAD).forEach(n => {
    const sh = ss.getSheetByName(n) || ss.insertSheet(n);
    if (sh.getMaxColumns() < HEAD[n].length) sh.insertColumnsAfter(sh.getMaxColumns(), HEAD[n].length - sh.getMaxColumns());
    const hdr = sh.getRange(1, 1, 1, HEAD[n].length).getValues()[0];
    HEAD[n].forEach((h, i) => { if (!hdr[i]) sh.getRange(1, i + 1).setValue(h).setFontWeight('bold'); });   // adds any missing header, e.g. Reorder level
    sh.setFrozenRows(1);
    if (n !== 'Items') sh.getRange('B:B').setNumberFormat('@');   // keep dates as plain text yyyy-mm-dd
  });
  const items = ss.getSheetByName('Items');
  if (items.getLastRow() < 2) {
    items.getRange(2, 1, 6, 5).setValues([
      ['Gas', '6kg cylinder (full)', 2600, 3000, 5], ['Gas', '13kg cylinder (full)', 5400, 6000, 5], ['Gas', 'Burner / grill', 900, 1200, 2],
      ['Agrovet', 'Dairy meal 70kg', 2300, 2600, 10], ['Agrovet', 'Fertilizer CAN 50kg', 3900, 4300, 10], ['Agrovet', 'Dewormer 100ml', 350, 500, 5]]);
  }
  const extra = ss.getSheetByName('Sheet1'); if (extra && ss.getSheets().length > 1) ss.deleteSheet(extra);
  Logger.log('Sheet ready: ' + ss.getUrl());
}
// Optional: use a sheet you already have (for example the Excel template saved as a Google Sheet).
// Paste its ID (the part of the sheet URL between /d/ and /edit), run once, then you can clear the ID text.
function connectSheet() {
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', 'PASTE_SHEET_ID');
  setup();   // checks the tabs and headers, adds anything missing
}
// Edit the PINs, run once, then delete the PIN text from this function.
function setPins() {
  const P = PropertiesService.getScriptProperties();
  P.setProperty('ENTRY_PIN', 'CHANGE_ENTRY_PIN');   // staff: data entry only
  P.setProperty('OWNER_PIN', 'CHANGE_OWNER_PIN');   // owner: dashboard + data entry
}

// ---------- Helpers ----------
const num_ = x => parseFloat(x) || 0;
const day_ = v => v instanceof Date ? Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(v).slice(0, 10);
const txt_ = (s, n) => { s = String(s || '').slice(0, n); return /^[=+\-@]/.test(s) ? "'" + s : s; };   // stops spreadsheet formula injection
function ss_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('Run setup() once first');
  return SpreadsheetApp.openById(id);
}
function read_(name) { const sh = ss_().getSheetByName(name), n = sh.getLastRow(); return n < 2 ? [] : sh.getRange(2, 1, n - 1, HEAD[name].length).getValues(); }
function pins_() { const P = PropertiesService.getScriptProperties(); return { e: P.getProperty('ENTRY_PIN'), o: P.getProperty('OWNER_PIN') }; }
function auth_(pin, role) {
  const p = pins_(), s = String(pin || '');
  if (role === 'owner') { if (p.o && s !== p.o) throw new Error('Wrong PIN'); return; }
  if ((p.e || p.o) && s !== p.e && s !== p.o) throw new Error('Wrong PIN');
}
function getInit(role) {
  const p = pins_();
  return { appUrl: ScriptApp.getService().getUrl(), needPin: role === 'owner' ? !!p.o : !!(p.e || p.o) };
}

// Reorder levels from the Items tab, keyed 'gas|item' or 'agro|item'. Items with a blank level are skipped.
function levels_() {
  const out = {};
  read_('Items').forEach(r => {
    if (r[4] === '' || r[4] == null || isNaN(parseFloat(r[4]))) return;
    out[(String(r[0]).toLowerCase() === 'gas' ? 'gas' : 'agro') + '|' + String(r[1])] = parseFloat(r[4]);
  });
  return out;
}
function balance_(biz, cat, item) {
  const m = r => String(r[2]) === biz && r[3] === cat && String(r[4]) === item;
  return read_('Stock').filter(m).reduce((a, r) => a + num_(r[5]), 0) - read_('Sales').filter(m).reduce((a, r) => a + num_(r[5]), 0);
}

// ---------- Data entry ----------
function getItems(pin) {
  auth_(pin, 'entry');
  const out = {};
  read_('Items').forEach(r => { if (r[0] && r[1]) (out[r[0]] = out[r[0]] || []).push({ n: String(r[1]), c: num_(r[2]), p: num_(r[3]) }); });
  return out;
}
function listEntries(tab, pin) {
  auth_(pin, 'entry');
  const t = TAB[tab]; if (!t) throw new Error('Bad tab');
  return read_(t.sheet).slice(-40).reverse().map(MAP[tab]);
}
function saveEntry(tab, r, pin) {
  auth_(pin, 'entry');
  const t = TAB[tab]; if (!t) throw new Error('Bad tab');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = ss_().getSheetByName(t.sheet), date = String(r.date || ''), biz = String(r.biz || '').toUpperCase();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Choose a valid date');
    if (BIZ.indexOf(biz) < 0) throw new Error('Choose a business');
    const last = sh.getLastRow();
    const max = last < 2 ? 0 : Math.max.apply(null, sh.getRange(2, 1, last - 1, 1).getValues().map(x => parseInt(String(x[0]).split('-')[1], 10) || 0));
    const id = t.prefix + '-' + String(max + 1).padStart(4, '0'), now = new Date();
    let row, ci = null;
    if (tab === 'mpesa') {
      const ofl = num_(r.ofloat), oc = num_(r.ocash), dep = num_(r.dep), wd = num_(r.wd), comm = num_(r.comm), cap = num_(r.cap), cf = num_(r.cfloat), cc = num_(r.ccash);
      if ([ofl, oc, dep, wd, comm, cf, cc].some(x => x < 0)) throw new Error('Amounts cannot be negative');
      if (read_('MPesa').some(x => day_(x[1]) === date && String(x[2]) === biz)) throw new Error('M-Pesa is already recorded for this business and date. Delete it first.');
      const variance = Math.round(((cf + cc) - (ofl + oc) - comm - cap) * 100) / 100;   // should be 0
      row = [id, date, biz, ofl, oc, dep, wd, comm, cap, cf, cc, variance, txt_(r.notes, 200), now];
    } else if (tab === 'exp') {
      const a = num_(r.amount); if (a <= 0) throw new Error('Amount must be more than 0');
      row = [id, date, biz, txt_(r.etype, 40) || 'Other', txt_(r.desc, 200), a, now];
    } else {
      const q = num_(r.qty), c = num_(r.cost), p = num_(r.price), cat = String(r.cat || '');
      if (q < 1) throw new Error('Quantity must be at least 1');
      if (['Gas', 'Agrovet', 'M-Pesa'].indexOf(cat) < 0) throw new Error('Bad category');
      if (cat === 'M-Pesa') throw new Error('Use the M-Pesa tab for M-Pesa');
      const item = txt_(r.item, 100);
      ci = { cat, item };
      row = tab === 'sales' ? [id, date, biz, cat, item, q, c, p, q * p, q * (p - c), now]
                            : [id, date, biz, cat, item, q, c, q * c, txt_(r.supplier, 100), now];
    }
    sh.appendRow(row);
    let alert = '';
    if (tab === 'sales' && ci) {   // tell the attendant straight away if this sale takes the item to its reorder level
      const lv = levels_()[(ci.cat === 'Gas' ? 'gas' : 'agro') + '|' + ci.item];
      if (lv != null) {
        const bal = balance_(biz, ci.cat, ci.item);
        if (bal <= lv) alert = (bal <= 0 ? 'OUT OF STOCK: ' : 'Low stock: ') + ci.item + ' (' + bal + ' left, reorder at ' + lv + ')';
      }
    }
    return { id: id, alert: alert };
  } finally { lock.releaseLock(); }
}
function deleteEntry(tab, id, pin) {
  auth_(pin, 'entry');
  const t = TAB[tab]; if (!t) throw new Error('Bad tab');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = ss_().getSheetByName(t.sheet), n = sh.getLastRow();
    if (n < 2) throw new Error('Not found');
    const ids = sh.getRange(2, 1, n - 1, 1).getValues();
    for (let i = 0; i < ids.length; i++) if (ids[i][0] === id) { sh.deleteRow(i + 2); return true; }
    throw new Error('Not found');
  } finally { lock.releaseLock(); }
}

// Most recent closing before a date, used to pre-fill the next day's opening balances.
function lastMpesa(biz, date, pin) {
  auth_(pin, 'entry');
  const b = String(biz || '').toUpperCase(), d = String(date || '');
  const rows = read_('MPesa').filter(r => String(r[2]) === b && day_(r[1]) < d).sort((x, y) => day_(y[1]).localeCompare(day_(x[1])));
  return rows.length ? { date: day_(rows[0][1]), cfloat: num_(rows[0][9]), ccash: num_(rows[0][10]) } : null;
}

// ---------- Price list (Items tab) ----------
// Owner only when an OWNER_PIN is set. If only an ENTRY_PIN exists, anyone with that PIN can manage items.
function authItems_(pin) {
  const p = pins_();
  if (p.o) { if (String(pin || '') !== p.o) throw new Error('Wrong PIN'); }
  else auth_(pin, 'entry');
}
function listItems(pin) {
  authItems_(pin);
  return read_('Items').filter(r => r[0] && r[1]).map(r => ({
    cat: String(r[0]), item: String(r[1]), cost: num_(r[2]), price: num_(r[3]),
    level: (r[4] === '' || r[4] == null) ? null : num_(r[4])
  }));
}
function findItem_(sh, cat, name) {
  const n = sh.getLastRow(); if (n < 2) return -1;
  const rows = sh.getRange(2, 1, n - 1, 5).getValues();
  for (let i = 0; i < rows.length; i++) if (String(rows[i][0]) === cat && String(rows[i][1]).trim().toLowerCase() === name.toLowerCase()) return i + 2;
  return -1;
}
function saveItem(it, pin) {
  authItems_(pin);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const cat = String(it.cat || ''), name = txt_(it.item, 100).trim();
    if (['Gas', 'Agrovet'].indexOf(cat) < 0) throw new Error('Choose Gas or Agrovet');
    if (!name) throw new Error('Enter the item name');
    const cost = num_(it.cost), price = num_(it.price);
    if (cost < 0 || price < 0) throw new Error('Cost and price cannot be negative');
    const lv = (it.level === '' || it.level == null) ? '' : num_(it.level);
    if (lv !== '' && lv < 0) throw new Error('Reorder level cannot be negative');
    const sh = ss_().getSheetByName('Items'), row = findItem_(sh, cat, name);
    if (it.mode === 'edit') {
      if (row < 0) throw new Error('Item not found');
      sh.getRange(row, 3, 1, 3).setValues([[cost, price, lv]]);   // name and category stay as they are
      return { created: false };
    }
    if (row > 0) throw new Error('This item already exists. Edit it instead.');
    sh.appendRow([cat, name, cost, price, lv]);
    return { created: true };
  } finally { lock.releaseLock(); }
}
function deleteItem(cat, name, pin) {
  authItems_(pin);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = ss_().getSheetByName('Items'), row = findItem_(sh, String(cat), String(name));
    if (row < 0) throw new Error('Item not found');
    sh.deleteRow(row); return true;
  } finally { lock.releaseLock(); }
}

// ---------- Dashboard ----------
function getData(pin) {
  auth_(pin, 'owner');
  const recs = {}, stock = {};
  const R = (d, b) => recs[d + '|' + b] = recs[d + '|' + b] || { date: d, business: b, gSales: 0, gGross: 0, aSales: 0, aGross: 0, mComm: 0, mVar: 0, eGas: 0, eMp: 0, eAgro: 0, eGen: 0 };
  const S = (b, cat, item, f, q) => {
    const k = [b, cat, item].join('|');
    (stock[k] = stock[k] || { business: b, cat, item, received: 0, sold: 0 })[f] += q;
  };
  read_('Sales').forEach(r => {
    const b = String(r[2]).toLowerCase(), x = R(day_(r[1]), b), q = num_(r[5]), tot = num_(r[8]), pr = num_(r[9]);
    if (r[3] === 'Gas') { x.gSales += tot; x.gGross += pr; S(b, 'gas', r[4], 'sold', q); }
    else if (r[3] === 'Agrovet') { x.aSales += tot; x.aGross += pr; S(b, 'agro', r[4], 'sold', q); }
  });
  const mpesa = read_('MPesa').map(r => ({ date: day_(r[1]), business: String(r[2]).toLowerCase(), dep: num_(r[5]), wd: num_(r[6]), comm: num_(r[7]), variance: num_(r[11]), cfloat: num_(r[9]), ccash: num_(r[10]) }));
  mpesa.forEach(m => { const x = R(m.date, m.business); x.mComm += m.comm; x.mVar += Math.abs(m.variance); });   // M-Pesa income = commission earned
  read_('Stock').forEach(r => S(String(r[2]).toLowerCase(), r[3] === 'Gas' ? 'gas' : 'agro', r[4], 'received', num_(r[5])));
  read_('Expenses').forEach(r => { R(day_(r[1]), String(r[2]).toLowerCase()).eGen += num_(r[5]); });
  const lv = levels_();
  const rows = Object.values(stock).map(r => Object.assign(r, { balance: r.received - r.sold, level: lv[r.cat + '|' + r.item] == null ? null : lv[r.cat + '|' + r.item] }))
    .sort((a, b) => (a.business + a.cat + a.item).localeCompare(b.business + b.cat + b.item));
  return { recs: Object.values(recs), stock: rows, counts: {}, mpesa, updated: new Date().toISOString() };
}
