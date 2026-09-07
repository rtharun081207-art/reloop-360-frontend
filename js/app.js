/* ---------- config ---------- */
const API_BASE = 'https://reloop360-1.onrender.com/api/products';
const ORDERS_API = 'https://reloop360-1.onrender.com/api/orders';
const AUTH_BASE = 'https://reloop360-1.onrender.com/api/auth';
const MATCH_BASE = 'https://reloop360-1.onrender.com/api/loopmarket';

function getToken(){ return localStorage.getItem('reloop_token'); }
function getUser(){ try{ return JSON.parse(localStorage.getItem('reloop_user')||'null'); }catch(e){ return null; } }
function authHeaders(){ const t=getToken(); return t?{ 'Authorization':'Bearer '+t, 'Content-Type':'application/json' }:{ 'Content-Type':'application/json' }; }
function getPasswordInput(){
  return document.getElementById('authPassword') || document.querySelector('#loginPage input[type="password"]');
}

/* ---------- auth ---------- */
let selectedRole='Community', authMode='login';
function setAuthMode(mode){
  authMode=mode;
  document.getElementById('tabLogin').classList.toggle('active',mode==='login');
  document.getElementById('tabSignup').classList.toggle('active',mode==='signup');
  document.getElementById('roleBlock').classList.toggle('hidden',mode!=='signup');
  document.getElementById('authHeading').textContent=mode==='login'?'Welcome back':'Create your account';
  document.getElementById('authSub').textContent=mode==='login'?'Sign in to your ReLoop 360 dashboard.':'Join as an individual, industry, recycler or NGO.';
}
function pickRole(el){
  document.querySelectorAll('.role-opt').forEach(x=>x.classList.remove('sel'));
  el.classList.add('sel'); selectedRole=el.dataset.role;
}
async function openApp(){
  const email=document.getElementById('authEmail').value.trim();
  const passwordEl = getPasswordInput();
  const password = passwordEl ? passwordEl.value : '';
  if(!email||!password){ toast('Enter an email and password'); return; }

  const url = authMode==='signup' ? AUTH_BASE+'/register' : AUTH_BASE+'/login';
  const body = authMode==='signup'
    ? { name: email.split('@')[0], email, password, role: selectedRole }
    : { email, password };

  try{
    const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const data = await res.json();
    if(!res.ok){ toast(data.message || 'Login/signup failed'); return; }

    localStorage.setItem('reloop_token', data.token);
    localStorage.setItem('reloop_user', JSON.stringify(data.user));

    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('userLine').textContent='Welcome, '+data.user.name;
    document.getElementById('avatarInit').textContent=(data.user.name[0]||'U').toUpperCase();
    document.getElementById('sideRole').textContent=data.user.role||selectedRole;
    showView('home');
    loadProducts();
    if(!tourShown){ tourShown=true; setTimeout(openTour,350); }
  }catch(err){
    toast('Could not reach the server. Try again.');
  }
}
function logout(){
  localStorage.removeItem('reloop_token');
  localStorage.removeItem('reloop_user');
  location.reload();
}

/* ---------- nav ---------- */
function showView(id,btn){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const titles={home:'Dashboard',industrial:'Industrial Exchange',industrialBrowse:'Industrial Listings',market:'LoopMarket',exchange:'Exchange Offers',donate:'Donate & ReLoop',formView:'Create Listing'};
  document.getElementById('pageTitle').textContent=titles[id]||'ReLoop 360';

  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  if(btn){
    btn.classList.add('active');
  } else {
    const match = document.querySelector(`.nav-btn[onclick*="'${id}'"]`);
    if(match) match.classList.add('active');
  }

  if(id==='market') render();
  if(id==='industrialBrowse') renderIndustrial();
  if(id==='exchange') renderExchange();
}

/* ---------- industry ID verification gate (still local/demo) ---------- */
let industryVerified=false, pendingView=null;
function enterIndustrial(btn){
  if(industryVerified){ showView('industrial',btn); return; }
  pendingView={id:'industrial',btn:btn};
  openVerifyModal();
}
function openVerifyModal(){
  openCustom('Verify company ID',`
    <p style="color:var(--muted);font-size:13px;margin-bottom:14px">Industrial Exchange is limited to verified businesses. Scan or upload a company ID / GST certificate to continue — this is a one-time check per account.</p>
    <div class="verify-box">
      <div class="scan-frame" id="scanFrame">🪪</div>
      <div class="verify-status" id="verifyStatus">Waiting for ID scan…</div>
      <input id="idUpload" type="file" accept="image/*" capture="environment" hidden onchange="runScan()">
      <button class="chip" id="scanBtn" onclick="document.getElementById('idUpload').click()">📷 Scan / Upload Company ID</button>
    </div>`);
}
function runScan(){
  const frame=document.getElementById('scanFrame'), status=document.getElementById('verifyStatus'), btn=document.getElementById('scanBtn');
  frame.classList.add('scanning'); frame.innerHTML='<div class="scan-line"></div>🪪';
  status.textContent='Scanning ID…'; btn.disabled=true; btn.textContent='Scanning…';
  setTimeout(()=>{
    frame.classList.remove('scanning'); frame.innerHTML='✅';
    status.textContent='ID verified successfully.';
    industryVerified=true;
    document.getElementById('navLock').textContent='✓';
    btn.textContent='Continue →'; btn.disabled=false;
    btn.onclick=()=>{ closeModal(); toast('Company ID verified — Industrial Exchange unlocked'); if(pendingView){ showView(pendingView.id,pendingView.btn); pendingView=null; } };
  },1300);
}

/* ---------- guided tour ---------- */
let tourShown=false;
function openTour(){
  openCustom('How ReLoop 360 works',`
    <div class="tour-steps">
      <div class="tour-step"><div class="ti" style="background:var(--steel-light);color:var(--steel)">🏭</div><div><b>1. Industrial Exchange</b><p>Industries list surplus materials. After a one-time company ID check, Smart Match suggests the best-fit recyclers or NGOs for each listing.</p></div></div>
      <div class="tour-step"><div class="ti" style="background:var(--green-light);color:var(--green)">♻</div><div><b>2. LoopMarket</b><p>Real listings from real accounts. Request an item — the seller can accept or reject your request from their My Account. Use "Find Match" to see who else wants a similar item.</p></div></div>
      <div class="tour-step"><div class="ti" style="background:var(--amber-light);color:var(--amber)">💚</div><div><b>3. Donate & ReLoop</b><p>Give items directly to verified NGO partners by category.</p></div></div>
    </div>
    <button class="chip" style="margin-top:16px;background:var(--green);color:#fff;border-color:var(--green)" onclick="closeModal()">Got it</button>`);
}

/* ---------- industrial: smart match (still demo data) ---------- */
const partners=[
  {name:'GreenCycle Recyclers',type:'Recycler',material:'Plastic & E-Waste',score:94,loc:'Chennai'},
  {name:'TechBridge Foundation',type:'NGO',material:'E-Materials',score:88,loc:'Bengaluru'},
  {name:'FabReuse Industries',type:'Recycler',material:'Textile Offcuts',score:91,loc:'Tiruppur'},
  {name:'Goodwill Circle',type:'NGO',material:'Mixed Surplus',score:79,loc:'Chennai'},
];
function runSmartMatch(){
  toast('Smart matching materials to partners…');
  document.getElementById('matchList').innerHTML=partners.map(p=>`<div class="match-card"><div><div class="mname">${p.name}</div><div class="mtag">${p.type} • Handles ${p.material} • ${p.loc}</div></div><div style="display:flex;align-items:center;gap:10px"><span class="match-score">${p.score}% match</span><button class="chip" onclick="toast('Connection request sent to ${p.name}')">Connect</button></div></div>`).join('');
}
function renderIndustrial(){
  document.getElementById('matchList').innerHTML='<p style="color:var(--muted);font-size:12.5px">Run Smart Match to see suggested recyclers &amp; NGOs for your surplus materials.</p>';
  document.getElementById('industrialList').innerHTML='<p style="color:var(--muted);font-size:12.5px">No industrial listings yet.</p>';
}

/* ---------- LoopMarket: real products from backend ---------- */
let products=[], activeCat='All', wishlist=[];
async function loadProducts(){
  try{
    const res = await fetch(API_BASE);
    const data = await res.json();
    products = data.products || [];
    render();
  }catch(err){
    document.getElementById('products').innerHTML = '<p style="color:var(--muted)">Could not load listings. Check your connection.</p>';
  }
}
function filterCat(v){activeCat=v;render()}
function clearFilters(){activeCat='All';document.querySelector('input[name="fc"][value="All"]').checked=true;document.getElementById('freeOnly').checked=false;document.getElementById('verifiedOnly').checked=false;document.getElementById('exchangeOnly').checked=false;document.getElementById('locationFilter').value='all';render()}
function render(){
  const free=document.getElementById('freeOnly').checked, ver=document.getElementById('verifiedOnly').checked, exOnly=document.getElementById('exchangeOnly').checked;
  const loc=document.getElementById('locationFilter').value;
  let list=products.filter(p=>(activeCat==='All'||p.cat===activeCat)&&(!free||p.price===0)&&(!ver||p.verified)&&(!exOnly||p.exchange)&&(loc==='all'||p.loc===loc));
  const s=document.getElementById('sort').value;
  if(s==='low')list.sort((a,b)=>a.price-b.price); if(s==='high')list.sort((a,b)=>b.price-a.price);
  document.getElementById('resultText').textContent=list.length+' results';
  document.getElementById('products').innerHTML=list.length?list.map(card).join(''):'<p style="color:var(--muted)">No matching listings. Try clearing a filter.</p>';
  document.getElementById('wishCount').textContent=wishlist.length;
}
function card(p){
  const w=wishlist.includes(p._id);
  const isTaken = p.status==='requested' || p.status==='sold';
  const requestBtn = isTaken
    ? '<button class="chip" disabled style="opacity:0.5;cursor:not-allowed">Already Requested</button>'
    : `<button class="chip" style="background:var(--green);color:#fff;border-color:var(--green)" onclick="requestItem('${p._id}','buy')">Request Item</button>`;
  const swapBtn = p.exchange
    ? `<button class="chip" onclick="requestItem('${p._id}','exchange')">🔄 Swap</button>`
    : '';
  return `<article class="product"><div class="pimg">${p.icon||'📦'}<button class="wish" onclick="toggleWish('${p._id}')">${w?'♥':'♡'}</button></div><div class="pbody"><span class="pbadge ${p.price===0?'free':''}">${p.cat} • ${p.cond}</span>${p.exchange?'<span class="pbadge" style="background:#eef0fb;color:#4338ca;margin-left:5px">🔄 Swap OK</span>':''}<h3>${p.name}</h3><div class="price">${p.price?'₹'+p.price.toLocaleString():'FREE'}</div><div class="meta">${p.loc} ${p.verified?'• ✓ Verified seller':''}</div><div class="seller">Seller: ${p.seller}</div><div class="card-actions" style="display:flex;flex-wrap:wrap;gap:6px">${requestBtn}${swapBtn}<button class="chip" onclick="findMatches('${p._id}')">🔍 Find Match</button></div></div></article>`;
}
function toggleWish(id){wishlist=wishlist.includes(id)?wishlist.filter(x=>x!==id):[...wishlist,id];render();toast('Wishlist updated')}
function openWishlist(){
  const items=products.filter(p=>wishlist.includes(p._id));
  openCustom('Wishlist',items.length?items.map(p=>`<div class="cart-item"><div class="cart-icon">${p.icon||'📦'}</div><div><b>${p.name}</b><div style="color:var(--muted);font-size:12px">${p.price?'₹'+p.price.toLocaleString():'FREE'}</div></div></div>`).join(''):'<p style="color:var(--muted)">Your wishlist is empty.</p>');
}

/* ---------- matching feature ---------- */
async function findMatches(productId){
  openCustom('Finding matches…', '<p style="color:var(--muted);font-size:13px">Searching for people who want something like this…</p>');
  try{
    const res = await fetch(MATCH_BASE+'/matches/'+productId);
    const data = await res.json();
    if(!res.ok){ document.getElementById('modalBody').innerHTML='<p style="color:var(--muted)">'+(data.message||'Could not run matching')+'</p>'; return; }

    const matches = data.matches || [];
    document.getElementById('modalTitle').textContent = 'Matches for "'+data.product.name+'"';
    if(!matches.length){
      document.getElementById('modalBody').innerHTML = '<p style="color:var(--muted);font-size:13px">No matches yet. We\'ll keep looking as more people post what they want.</p>';
      return;
    }
    document.getElementById('modalBody').innerHTML = matches.map(m=>{
      const item = m.product;
      return `<div class="match-card"><div><div class="mname">${item.icon||'📦'} ${item.name}</div><div class="mtag">Wants a match • ${item.loc||''}</div></div><span class="match-score">${m.score} pts match</span></div>`;
    }).join('');
  }catch(err){
    document.getElementById('modalBody').innerHTML='<p style="color:var(--muted)">Could not reach the server.</p>';
  }
}

/* ---------- real requests via backend ---------- */
async function requestItem(productId, mode){
  if(!getToken()){ toast('Please log in first'); return; }
  try{
    const res = await fetch(ORDERS_API, { method:'POST', headers: authHeaders(), body: JSON.stringify({ productId, mode }) });
    const data = await res.json();
    if(!res.ok){ toast(data.message || 'Could not send request'); return; }
    toast('Request sent to the seller');
    loadProducts();
  }catch(err){
    toast('Could not reach the server');
  }
}

/* ---------- exchange offers (still local/demo board) ---------- */
const exchangeOffers=[
  {icon:'📘',offer:'Engineering Mathematics (Used)',want:'Any Data Structures textbook',owner:'Ajay P.',loc:'Hyderabad'},
  {icon:'📗',offer:'Novel Collection (5 books)',want:'Cookbooks or comics',owner:'Meera S.',loc:'Bengaluru'},
];
function renderExchange(){
  document.getElementById('exchangeList').innerHTML=exchangeOffers.map(x=>`<div class="match-card"><div><div class="mname">${x.icon} ${x.offer}</div><div class="mtag">Wants: ${x.want} • ${x.owner} • ${x.loc}</div></div><button class="chip" onclick="toast('Swap proposed to ${x.owner}')">Propose Swap</button></div>`).join('');
}

/* ---------- donate ---------- */
function openDonation(type){
  document.getElementById('formTitle').textContent='Donate: '+type;
  document.getElementById('itemCategory').value=type;
  document.getElementById('photoField').classList.remove('hidden');
  document.getElementById('sellNudge').classList.remove('show');
  document.getElementById('wantField').classList.add('hidden');
  document.getElementById('notice').classList.remove('show');
  showView('formView');
}

/* ---------- sell / want form: real POST to backend ---------- */
let formListingType = 'sell';
function openSell(){
  formListingType='sell';
  document.getElementById('formTitle').textContent='Sell an Item';
  document.getElementById('itemCategory').value=activeCat!=='All'?activeCat:'';
  document.getElementById('photoField').classList.remove('hidden');
  document.getElementById('notice').classList.remove('show');
  document.getElementById('wantField').classList.add('hidden');
  document.getElementById('sellNudge').classList.add('show');
  showView('formView');
}
function openWantForm(){
  formListingType='want';
  document.getElementById('formTitle').textContent="What are you looking for?";
  document.getElementById('itemCategory').value='';
  document.getElementById('photoField').classList.add('hidden');
  document.getElementById('notice').classList.remove('show');
  document.getElementById('wantField').classList.add('hidden');
  document.getElementById('sellNudge').classList.remove('show');
  showView('formView');
}
function dismissNudge(){document.getElementById('sellNudge').classList.remove('show');toast('Continuing as a sale listing')}
function switchToDonate(){document.getElementById('sellNudge').classList.remove('show');document.getElementById('formTitle').textContent='Donate this item';toast('Switched to donation')}
function previewPhotos(input){
  const wrap=document.getElementById('photoPreview'); wrap.innerHTML='';
  [...input.files].slice(0,6).forEach(f=>{const r=new FileReader();r.onload=e=>{const img=document.createElement('img');img.src=e.target.result;wrap.appendChild(img)};r.readAsDataURL(f)});
}
async function submitForm(){
  if(!getToken()){ toast('Please log in first'); return; }
  const user = getUser();
  const name = document.getElementById('itemName').value.trim();
  const cat = document.getElementById('itemCategory').value.trim() || 'Books';

  // Quantity field has no id in the HTML — select it by its placeholder text
  const qtyInput = document.querySelector('#formView input[placeholder="e.g. 50 kg / 5 items"]');
  const qtyRaw = qtyInput ? qtyInput.value.trim() : '';
  const qtyMatch = qtyRaw.match(/\d+/);
  const quantity = qtyMatch ? Number(qtyMatch[0]) : 1;

  const locInput = document.querySelector('#formView input[placeholder="City / area"]');
  const loc = locInput && locInput.value.trim() ? locInput.value.trim() : 'Chennai';

  // Condition <select> has no id in the HTML — select it by its position in the form
  const condSelect = document.querySelector('#formView select');
  const cond = condSelect ? condSelect.value : 'Good';

  if(!name){ toast('Please enter an item or material name'); return; }
  if(!user || !user.name){ toast('Could not identify your account — please log in again'); return; }

  try{
    const res = await fetch(API_BASE, { method:'POST', headers: authHeaders(), body: JSON.stringify({
      name, cat, price:0, cond, loc, quantity, seller:user.name, exchange:false, listingType: formListingType
    })});
    const data = await res.json();
    if(!res.ok){ toast(data.message || 'Could not save listing'); return; }
    toast(formListingType==='want' ? 'Posted what you\'re looking for' : 'Listing posted');
    document.getElementById('notice').classList.add('show');
    document.getElementById('itemName').value='';
    loadProducts();
  }catch(err){
    toast('Could not reach the server');
  }
}

/* ---------- My Account: real data, sent vs received, accept/reject ---------- */
async function openAccount(){
  if(!getToken()){ toast('Please log in first'); return; }
  openCustom('My Account','<p style="color:var(--muted);font-size:13px">Loading your requests…</p>');
  try{
    const res = await fetch(ORDERS_API+'/mine', { headers: authHeaders() });
    const data = await res.json();
    if(!res.ok){ document.getElementById('modalBody').innerHTML='<p style="color:var(--muted)">'+(data.message||'Could not load your account')+'</p>'; return; }

    const sentHtml = data.sent.length ? data.sent.map(o=>`<div class="activity-row"><span>•</span><div><b>${o.product?o.product.name:'Item'}</b><small>Status: ${o.status} — ${new Date(o.createdAt).toLocaleString()}</small></div></div>`).join('') : '<p style="color:var(--muted);font-size:12.5px">You have not requested anything yet.</p>';

    const receivedHtml = data.received.length ? data.received.map(o=>`<div class="activity-row" style="align-items:center;justify-content:space-between"><div><b>${o.product?o.product.name:'Item'}</b><small>Requested by ${o.buyerName} — ${o.status}</small></div>${o.status==='pending'?`<div style="display:flex;gap:6px"><button class="chip" onclick="respondOrder('${o._id}','accepted')">Accept</button><button class="chip" onclick="respondOrder('${o._id}','rejected')">Reject</button></div>`:''}</div>`).join('') : '<p style="color:var(--muted);font-size:12.5px">No requests on your items yet.</p>';

    document.getElementById('modalTitle').textContent='My Account';
    document.getElementById('modalBody').innerHTML = `
      <div class="account-grid">
        <div class="account-tile"><span class="tile-icon">📤</span><b>Requests sent</b><span style="color:var(--muted);font-size:12px">${data.sent.length} total</span></div>
        <div class="account-tile"><span class="tile-icon">📥</span><b>Requests received</b><span style="color:var(--muted);font-size:12px">${data.received.length} total</span></div>
      </div>
      <h3 class="section-title" style="margin-top:18px">Requests I've sent</h3>
      ${sentHtml}
      <h3 class="section-title">Requests on my items</h3>
      ${receivedHtml}
      <button class="chip" style="margin-top:16px" onclick="logout()">Log out</button>
    `;
  }catch(err){
    document.getElementById('modalBody').innerHTML='<p style="color:var(--muted)">Could not reach the server.</p>';
  }
}
async function respondOrder(orderId, status){
  try{
    const res = await fetch(ORDERS_API+'/'+orderId, { method:'PUT', headers: authHeaders(), body: JSON.stringify({ status }) });
    const data = await res.json();
    if(!res.ok){ toast(data.message || 'Could not update request'); return; }
    toast(status==='accepted' ? 'Request accepted' : 'Request rejected');
    openAccount();
    loadProducts();
  }catch(err){
    toast('Could not reach the server');
  }
}

/* ---------- modal + toast ---------- */
function openCustom(title,body){document.getElementById('modalTitle').textContent=title;document.getElementById('modalBody').innerHTML=body;document.getElementById('modal').classList.remove('hidden')}
function closeModal(){document.getElementById('modal').classList.add('hidden')}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.remove('hidden');clearTimeout(window._tt);window._tt=setTimeout(()=>t.classList.add('hidden'),2200)}

/* ---------- boot: stay logged in if token exists ---------- */
(function init(){
  const user=getUser();
  if(getToken() && user){
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('userLine').textContent='Welcome, '+user.name;
    document.getElementById('avatarInit').textContent=(user.name[0]||'U').toUpperCase();
    document.getElementById('sideRole').textContent=user.role||'Community';
    showView('home');
    loadProducts();
  }
})();