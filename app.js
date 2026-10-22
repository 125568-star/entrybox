
'use strict';

// Publishable API keys are safe in a browser. Never put Supabase secret/service_role keys here.
const SUPABASE_URL = 'https://pulbcpjwxliwnmkiyfhe.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_ljmRZCY1QvS4G64eDgTuUQ_GfWXky0x';
const CATEGORIES = ['All', 'Kitchen', 'Bathroom', 'Home', 'Picnic'];
const $ = (selector) => document.querySelector(selector);
const formatAUD = (cents) => (cents / 100).toLocaleString('en-AU', {style:'currency',currency:'AUD'});
const elem = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = String(text);
  return node;
};
let products = [], boxes = [], boxItems = [];
let chosen = new Map(), requests = [];
let activeBox = null, filter = 'All', search = '';

async function getTable(path) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Accept: 'application/json' }
  });
  if (!res.ok) throw new Error('Catalogue service returned ' + res.status);
  return res.json();
}
async function loadCatalogue() {
  const [p, b, bi] = await Promise.all([
    getTable('products?select=id,slug,name,category,emoji,price_cents&is_active=eq.true&order=name.asc'),
    getTable('boxes?select=id,slug,title,description,icons,background&is_active=eq.true&order=title.asc'),
    getTable('box_items?select=box_id,product_id,quantity')
  ]);
  if (!Array.isArray(p) || !Array.isArray(b) || !Array.isArray(bi) || !p.length || !b.length) {
    throw new Error('Catalogue is empty');
  }
  products = p;
  boxes = b;
  boxItems = bi;
  activeBox = boxes.find(b => b.slug === 'flat') || boxes[0];
  fillBox(activeBox, false);
}
function fillBox(box, scroll = true) {
  activeBox = box;
  chosen = new Map();
  requests = [];
  for (const item of boxItems.filter(it => it.box_id === box.id)) {
    if (products.some(p => p.id === item.product_id)) chosen.set(item.product_id, item.quantity);
  }
  filter = 'All'; search = ''; $('#search').value = '';
  $('#gift-recipient').value = '';
  $('#gift-occasion').value = '';
  $('#gift-message').value = '';
  render();
  if (scroll) $('#builder').scrollIntoView({behavior:'smooth'});
}
function renderKits() {
  const parent = $('#kits'); parent.replaceChildren();
  for (const box of boxes) {
    const button = elem('button', 'kit-card' + (box.slug === 'present' ? ' present-kit' : '') + (activeBox?.id === box.id ? ' active' : ''));
    button.type = 'button';
    button.setAttribute('aria-label','Choose '+box.title);
    const art = elem('div','kit-art');
    art.style.background = /^#[0-9a-fA-F]{6}$/.test(box.background) ? box.background : '#edf3ff';
    for (const icon of box.icons || ['📦']) art.append(elem('span','',icon));
    const body = elem('div','kit-details');
    body.append(elem('h3','',box.title),elem('p','',box.description),elem('span','kit-link',box.slug === 'present' ? 'Create a Present Box →' : 'Customise box →'));
    button.append(art,body);
    button.addEventListener('click',() => fillBox(box));
    parent.append(button);
  }
}
function renderFilters() {
  const parent=$('#filters'); parent.replaceChildren();
  for (const cat of CATEGORIES) {
    const button=elem('button',filter===cat?'active':'',cat);
    button.type='button';
    button.addEventListener('click',() => {filter=cat;renderFilters();renderProducts();});
    parent.append(button);
  }
}
function renderProducts() {
  const parent=$('#products'); parent.replaceChildren();
  const visible=products.filter(p =>
    (filter==='All'||p.category===filter) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  if (!visible.length) {parent.append(elem('p','small','No products match your search.'));return;}
  for (const p of visible) {
    const row=elem('div','product');
    const info=elem('div','prod-copy');
    info.append(elem('strong','',p.name),elem('small','',formatAUD(p.price_cents)));
    const add=elem('button','add',chosen.has(p.id)?'✓':'+');
    add.type='button';
    add.setAttribute('aria-label','Add '+p.name);
    add.addEventListener('click',() => {
      chosen.set(p.id, Math.min(20,(chosen.get(p.id)||0)+1));
      renderProducts();renderSummary();
    });
    row.append(elem('div','prod-emoji',p.emoji||'📦'),info,add);
    parent.append(row);
  }
}
function renderSummary() {
  $('#box-name').textContent=activeBox?.title||'Your EntryBox';
  const parent=$('#selected-items'); parent.replaceChildren();
  let total=0, quantityTotal=0;
  for (const p of products) {
    const qty=chosen.get(p.id)||0;
    if (!qty) continue;
    total+=p.price_cents*qty;
    quantityTotal+=qty;
    const row=elem('div','line');
    const controls=elem('div','qty');
    const minus=elem('button','', '−'), plus=elem('button','', '+');
    minus.type=plus.type='button';
    minus.setAttribute('aria-label','Remove one '+p.name);
    plus.setAttribute('aria-label','Add one '+p.name);
    minus.addEventListener('click',()=>{if(qty===1)chosen.delete(p.id);else chosen.set(p.id,qty-1);renderProducts();renderSummary();});
    plus.addEventListener('click',()=>{chosen.set(p.id,Math.min(20,qty+1));renderProducts();renderSummary();});
    controls.append(minus,elem('span','',qty),plus);
    row.append(elem('span','',p.emoji||'📦'),elem('span','',p.name),elem('strong','',formatAUD(p.price_cents*qty)),controls);
    parent.append(row);
  }
  requests.forEach((requested,i)=>{
    const row=elem('div','line');
    const controls=elem('div','qty');
    const remove=elem('button','', '×');
    remove.type='button';remove.setAttribute('aria-label','Remove requested item '+requested);
    remove.addEventListener('click',()=>{requests.splice(i,1);renderSummary();});
    controls.append(elem('span','','Price on request'),remove);
    row.append(elem('span','','📝'),elem('span','',requested),elem('strong','','—'),controls);
    parent.append(row);
  });
  if (!chosen.size&&!requests.length)parent.append(elem('p','small','Your box is empty. Add products to get started.'));
  $('#count').textContent=String(quantityTotal+requests.length);
  $('#total').textContent=formatAUD(total);
}
function render(){
  $('#gift-details').hidden = activeBox?.slug !== 'present';
  renderKits();renderFilters();renderProducts();renderSummary();
}
function openPresentBox(){
  const present = boxes.find(b => b.slug === 'present');
  if (present) fillBox(present);
}
$('#gift-start').addEventListener('click',openPresentBox);
$('#present-link').addEventListener('click',event=>{
  const present = boxes.find(b => b.slug === 'present');
  if (present) {event.preventDefault();fillBox(present);}
});
$('#search').addEventListener('input',event=>{search=event.target.value;renderProducts();});
$('#start-empty').addEventListener('click',()=>{
  const empty=boxes.find(b=>b.slug==='own');
  if (empty)fillBox(empty);
  else {chosen.clear();requests=[];render();$('#builder').scrollIntoView({behavior:'smooth'});}
});
$('#cart-nav').addEventListener('click',()=>$('#summary').scrollIntoView({behavior:'smooth'}));
$('#custom-form').addEventListener('submit',event=>{
  event.preventDefault();
  const input=$('#custom-input'),value=input.value.trim();
  if(!value)return;
  if(requests.length>=20){alert('Please limit custom requests to 20 items per box.');return;}
  requests.push(value);input.value='';renderSummary();
});
$('#review').addEventListener('click',()=>{
  const rows=products.filter(p=>chosen.has(p.id)).map(p=>{
    const q=chosen.get(p.id);
    return q+' × '+p.name+' — '+formatAUD(p.price_cents*q);
  });
  for(const r of requests)rows.push('Request: '+r+' (price to be confirmed)');
  $('#modal-title').textContent=activeBox?.title||'Your EntryBox';
  let giftHeader = '';
  if (activeBox?.slug === 'present') {
    const recipient = $('#gift-recipient').value.trim();
    const occasion = $('#gift-occasion').value;
    const message = $('#gift-message').value.trim();
    const details = [];
    if(recipient) details.push('For: '+recipient);
    if(occasion) details.push('Occasion: '+occasion);
    if(message) details.push('Gift message: '+message);
    if(details.length) giftHeader = details.join('\n')+'\n\n';
  }
  $('#modal-contents').textContent=giftHeader+(rows.length?rows.join('\n'):'Your box is empty.')+'\n\nIllustrative subtotal: '+$('#total').textContent+'\n\nPreview only — no order placed.';
  $('#overlay').hidden=false;
});
$('#close-modal').addEventListener('click',()=>$('#overlay').hidden=true);
$('#overlay').addEventListener('click',event=>{if(event.target===$('#overlay'))$('#overlay').hidden=true;});
document.addEventListener('keydown',event=>{if(event.key==='Escape')$('#overlay').hidden=true;});

loadCatalogue().catch(error=>{
  console.error('EntryBox catalogue:',error);
  const area=$('#kits');area.replaceChildren();
  const message=elem('div','panel');
  message.append(elem('h3','','Catalogue temporarily unavailable'),elem('p','small','The live product list could not be loaded. Please try again.'));
  const retry=elem('button','secondary','Retry loading products');
  retry.addEventListener('click',()=>{area.textContent='Loading boxes…';loadCatalogue().catch(()=>{area.replaceChildren(message);});});
  message.append(retry);area.append(message);
  $('#products').append(elem('p','small','Waiting for the EntryBox catalogue.'));
});
