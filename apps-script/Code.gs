// PNJENGA ENTERPRISE — Google Apps Script + Google Sheets backend
// Businesses: GATHAITI and KANJUKU. Configure PINs with setPins() before deployment.
const BIZ=['GATHAITI','KANJUKU'];
const HEAD={
  Items:['Category','Item','Unit cost','Unit price','Reorder level'],
  Sales:['ID','Date','Business','Category','Item','Qty','Unit cost','Unit price','Total','Profit','Created'],
  Stock:['ID','Date','Business','Category','Item','Qty','Unit cost','Total cost','Supplier','Created'],
  Expenses:['ID','Date','Business','Type','Description','Amount','Created'],
  MPesa:['ID','Date','Business','Opening float','Opening cash','Deposits','Withdrawals','Commission','Capital added','Closing float','Closing cash','Variance','Notes','Created']
};
const TAB={sales:{sheet:'Sales',prefix:'S'},stock:{sheet:'Stock',prefix:'R'},exp:{sheet:'Expenses',prefix:'E'},mpesa:{sheet:'MPesa',prefix:'M'}};
const MAP={
 sales:r=>({id:r[0],date:day_(r[1]),biz:r[2],cat:r[3],item:r[4],qty:r[5],cost:r[6],price:r[7],total:r[8],profit:r[9]}),
 stock:r=>({id:r[0],date:day_(r[1]),biz:r[2],cat:r[3],item:r[4],qty:r[5],cost:r[6],tcost:r[7],supplier:r[8]}),
 exp:r=>({id:r[0],date:day_(r[1]),biz:r[2],etype:r[3],desc:r[4],amount:r[5]}),
 mpesa:r=>({id:r[0],date:day_(r[1]),biz:r[2],ofloat:r[3],ocash:r[4],dep:r[5],wd:r[6],comm:r[7],cap:r[8],cfloat:r[9],ccash:r[10],variance:r[11],notes:r[12]})
};
function doGet(e){
 const dash=e&&e.parameter&&e.parameter.page==='dashboard';
 return HtmlService.createHtmlOutputFromFile(dash?'Index':'DataEntry')
  .setTitle(dash?'PNJENGA ENTERPRISE — Dashboard':'PNJENGA ENTERPRISE — Data Entry')
  .addMetaTag('viewport','width=device-width, initial-scale=1');
}
function setup(){
 const P=PropertiesService.getScriptProperties();
 let ss=P.getProperty('SHEET_ID')?SpreadsheetApp.openById(P.getProperty('SHEET_ID')):null;
 if(!ss){ss=SpreadsheetApp.create('PNJENGA ENTERPRISE — Gathaiti & Kanjuku');P.setProperty('SHEET_ID',ss.getId());}
 Object.keys(HEAD).forEach(n=>{
  const sh=ss.getSheetByName(n)||ss.insertSheet(n);
  if(sh.getMaxColumns()<HEAD[n].length)sh.insertColumnsAfter(sh.getMaxColumns(),HEAD[n].length-sh.getMaxColumns());
  const hdr=sh.getRange(1,1,1,HEAD[n].length).getValues()[0];
  HEAD[n].forEach((h,i)=>{if(!hdr[i])sh.getRange(1,i+1).setValue(h).setFontWeight('bold');});
  sh.setFrozenRows(1);if(n!=='Items')sh.getRange('B:B').setNumberFormat('@');
 });
 const items=ss.getSheetByName('Items');
 if(items.getLastRow()<2)items.getRange(2,1,6,5).setValues([
  ['Gas','6kg cylinder (full)',2600,3000,5],['Gas','13kg cylinder (full)',5400,6000,5],['Gas','Burner / grill',900,1200,2],
  ['Agrovet','Dairy meal 70kg',2300,2600,10],['Agrovet','Fertilizer CAN 50kg',3900,4300,10],['Agrovet','Dewormer 100ml',350,500,5]
 ]);
 const extra=ss.getSheetByName('Sheet1');if(extra&&ss.getSheets().length>1)ss.deleteSheet(extra);
 Logger.log('Spreadsheet: '+ss.getUrl());return ss.getUrl();
}
const num_=x=>parseFloat(x)||0;
const day_=v=>v instanceof Date?Utilities.formatDate(v,Session.getScriptTimeZone(),'yyyy-MM-dd'):String(v).slice(0,10);
const txt_=(s,n)=>{s=String(s||'').slice(0,n);return /^[=+\-@]/.test(s)?"'"+s:s;};
function ss_(){const id=PropertiesService.getScriptProperties().getProperty('SHEET_ID');if(!id)throw new Error('Run setup() once first');return SpreadsheetApp.openById(id);}
function read_(name){const sh=ss_().getSheetByName(name),n=sh.getLastRow();return n<2?[]:sh.getRange(2,1,n-1,HEAD[name].length).getValues();}
function pins_(){const P=PropertiesService.getScriptProperties();return{e:P.getProperty('ENTRY_PIN'),o:P.getProperty('OWNER_PIN')};}
function auth_(pin,role){
 const p=pins_(),s=String(pin||'');
 if(role==='owner'){if(!p.o||s!==p.o)throw new Error('Owner PIN is not configured or is incorrect');return;}
 if((p.e||p.o)&&s!==p.e&&s!==p.o)throw new Error('Wrong PIN');
}
function getInit(role){const p=pins_();return{needPin:role==='owner'?true:!!(p.e||p.o),role};}
function levels_(){const out={};read_('Items').forEach(r=>{if(r[4]===''||r[4]==null||isNaN(parseFloat(r[4])))return;out[(String(r[0]).toLowerCase()==='gas'?'gas':'agro')+'|'+String(r[1])]=parseFloat(r[4]);});return out;}
function balance_(biz,cat,item){const m=r=>String(r[2])===biz&&r[3]===cat&&String(r[4])===item;return read_('Stock').filter(m).reduce((a,r)=>a+num_(r[5]),0)-read_('Sales').filter(m).reduce((a,r)=>a+num_(r[5]),0);}
function getItems(pin){auth_(pin,'entry');const out={};read_('Items').forEach(r=>{if(r[0]&&r[1])(out[r[0]]=out[r[0]]||[]).push({n:String(r[1]),c:num_(r[2]),p:num_(r[3])});});return out;}
function listEntries(tab,pin){auth_(pin,'entry');const t=TAB[tab];if(!t)throw new Error('Bad tab');return read_(t.sheet).slice(-60).reverse().map(MAP[tab]);}
function saveEntry(tab,r,pin){
 auth_(pin,'entry');const t=TAB[tab];if(!t)throw new Error('Bad tab');
 const lock=LockService.getScriptLock();lock.waitLock(20000);
 try{
  const sh=ss_().getSheetByName(t.sheet),date=String(r.date||''),biz=String(r.biz||'').toUpperCase();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||isNaN(Date.parse(date)))throw new Error('Choose a valid date');
  if(!BIZ.includes(biz))throw new Error('Choose a business');
  const last=sh.getLastRow(),max=last<2?0:Math.max(...sh.getRange(2,1,last-1,1).getValues().map(x=>parseInt(String(x[0]).split('-')[1],10)||0));
  const id=t.prefix+'-'+String(max+1).padStart(4,'0'),now=new Date();let row,ci=null;
  if(tab==='mpesa'){
   const ofl=num_(r.ofloat),oc=num_(r.ocash),dep=num_(r.dep),wd=num_(r.wd),comm=num_(r.comm),cap=num_(r.cap),cf=num_(r.cfloat),cc=num_(r.ccash);
   if([ofl,oc,dep,wd,comm,cap,cf,cc].some(x=>x<0))throw new Error('Amounts cannot be negative');
   if(read_('MPesa').some(x=>day_(x[1])===date&&String(x[2])===biz))throw new Error('M-Pesa is already recorded for this business and date');
   const variance=Math.round(((cf+cc)-(ofl+oc)-dep+wd-comm-cap)*100)/100;
   row=[id,date,biz,ofl,oc,dep,wd,comm,cap,cf,cc,variance,txt_(r.notes,200),now];
  }else if(tab==='exp'){
   const a=num_(r.amount);if(a<=0)throw new Error('Amount must be more than zero');
   row=[id,date,biz,txt_(r.etype,40)||'Other',txt_(r.desc,200),a,now];
  }else{
   const q=num_(r.qty),c=num_(r.cost),p=num_(r.price),cat=String(r.cat||'');
   if(q<1||!Number.isFinite(q))throw new Error('Quantity must be at least 1');
   if(!['Gas','Agrovet'].includes(cat))throw new Error('Choose Gas or Agrovet');
   const item=txt_(r.item,100);if(!item)throw new Error('Choose an item');ci={cat,item};
   if(tab==='sales'){
    const available=balance_(biz,cat,item);if(q>available)throw new Error('Insufficient stock. Available: '+available);
    row=[id,date,biz,cat,item,q,c,p,q*p,q*(p-c),now];
   }else row=[id,date,biz,cat,item,q,c,q*c,txt_(r.supplier,100),now];
  }
  sh.appendRow(row);let alert='';
  if(tab==='sales'&&ci){const lv=levels_()[(ci.cat==='Gas'?'gas':'agro')+'|'+ci.item];if(lv!=null){const bal=balance_(biz,ci.cat,ci.item);if(bal<=lv)alert=(bal<=0?'OUT OF STOCK: ':'Low stock: ')+ci.item+' ('+bal+' left; reorder at '+lv+')';}}
  return{id,alert};
 }finally{lock.releaseLock();}
}
function deleteEntry(tab,id,pin){auth_(pin,'entry');const t=TAB[tab];if(!t)throw new Error('Bad tab');const lock=LockService.getScriptLock();lock.waitLock(20000);try{const sh=ss_().getSheetByName(t.sheet),n=sh.getLastRow();if(n<2)throw new Error('Not found');const ids=sh.getRange(2,1,n-1,1).getValues();for(let i=0;i<ids.length;i++)if(ids[i][0]===id){sh.deleteRow(i+2);return true;}throw new Error('Not found');}finally{lock.releaseLock();}}
function lastMpesa(biz,date,pin){auth_(pin,'entry');const rows=read_('MPesa').filter(r=>String(r[2])===String(biz).toUpperCase()&&day_(r[1])<String(date)).sort((a,b)=>day_(b[1]).localeCompare(day_(a[1])));return rows.length?{date:day_(rows[0][1]),cfloat:num_(rows[0][9]),ccash:num_(rows[0][10])}:null;}
function authItems_(pin){const p=pins_();if(p.o){if(String(pin||'')!==p.o)throw new Error('Wrong owner PIN');}else auth_(pin,'entry');}
function listItems(pin){authItems_(pin);return read_('Items').filter(r=>r[0]&&r[1]).map(r=>({cat:String(r[0]),item:String(r[1]),cost:num_(r[2]),price:num_(r[3]),level:r[4]===''||r[4]==null?null:num_(r[4])}));}
function saveItem(it,pin){authItems_(pin);const lock=LockService.getScriptLock();lock.waitLock(20000);try{const cat=String(it.cat||''),name=txt_(it.item,100).trim();if(!['Gas','Agrovet'].includes(cat)||!name)throw new Error('Choose a category and item name');const cost=num_(it.cost),price=num_(it.price),lv=it.level===''||it.level==null?'':num_(it.level);if(cost<0||price<0||(lv!==''&&lv<0))throw new Error('Values cannot be negative');const sh=ss_().getSheetByName('Items'),n=sh.getLastRow(),rows=n<2?[]:sh.getRange(2,1,n-1,5).getValues();let row=-1;for(let i=0;i<rows.length;i++)if(String(rows[i][0])===cat&&String(rows[i][1]).trim().toLowerCase()===name.toLowerCase()){row=i+2;break;}if(it.mode==='edit'){if(row<0)throw new Error('Item not found');sh.getRange(row,3,1,3).setValues([[cost,price,lv]]);return{created:false};}if(row>0)throw new Error('Item already exists');sh.appendRow([cat,name,cost,price,lv]);return{created:true};}finally{lock.releaseLock();}}
function deleteItem(cat,name,pin){authItems_(pin);const sh=ss_().getSheetByName('Items'),n=sh.getLastRow();if(n<2)throw new Error('Item not found');const rows=sh.getRange(2,1,n-1,5).getValues();for(let i=0;i<rows.length;i++)if(String(rows[i][0])===cat&&String(rows[i][1]).toLowerCase()===String(name).toLowerCase()){sh.deleteRow(i+2);return true;}throw new Error('Item not found');}
function getData(pin){
 auth_(pin,'owner');const recs={},stock={};
 const R=(d,b)=>recs[d+'|'+b]=recs[d+'|'+b]||{date:d,business:b,gSales:0,gGross:0,aSales:0,aGross:0,mComm:0,mVar:0,expenses:0};
 const S=(b,cat,item,f,q)=>{const k=[b,cat,item].join('|');(stock[k]=stock[k]||{business:b,cat,item,received:0,sold:0})[f]+=q;};
 read_('Sales').forEach(r=>{const b=String(r[2]).toLowerCase(),x=R(day_(r[1]),b),q=num_(r[5]),tot=num_(r[8]),pr=num_(r[9]);if(r[3]==='Gas'){x.gSales+=tot;x.gGross+=pr;S(b,'gas',r[4],'sold',q);}else if(r[3]==='Agrovet'){x.aSales+=tot;x.aGross+=pr;S(b,'agro',r[4],'sold',q);}});
 const mpesa=read_('MPesa').map(r=>({date:day_(r[1]),business:String(r[2]).toLowerCase(),dep:num_(r[5]),wd:num_(r[6]),comm:num_(r[7]),variance:num_(r[11]),cfloat:num_(r[9]),ccash:num_(r[10])}));
 mpesa.forEach(m=>{const x=R(m.date,m.business);x.mComm+=m.comm;x.mVar+=Math.abs(m.variance);});
 read_('Stock').forEach(r=>S(String(r[2]).toLowerCase(),r[3]==='Gas'?'gas':'agro',r[4],'received',num_(r[5])));
 read_('Expenses').forEach(r=>R(day_(r[1]),String(r[2]).toLowerCase()).expenses+=num_(r[5]));
 const lv=levels_(),rows=Object.values(stock).map(r=>Object.assign(r,{balance:r.received-r.sold,level:lv[r.cat+'|'+r.item]??null})).sort((a,b)=>(a.business+a.cat+a.item).localeCompare(b.business+b.cat+b.item));
 return{recs:Object.values(recs),stock:rows,mpesa,updated:new Date().toISOString(),items:listItems(pin)};
}
