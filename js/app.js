const API_BASE = 'https://reloop360.onrender.com/api/products';

/* ---------- auth ---------- */
let selectedRole='Community';
function setAuthMode(mode){
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
function openApp(){
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  const email=document.getElementById('authEmail').value.trim();
  const name=email?email.split('@')[0]:'User';
  document.getElementById('userLine').textContent='Welcome, '+name;
  document.getElementById('avatarInit').textContent=name[0]?.toUpperCase()||'U';
  document.getElementById('sideRole').textContent=selectedRole;
  showView('home');
  if(!tourShown){ tourShown=true; setTimeout(openTour,350); }
}

/* ---------- nav ---------- */
let currentCategory='';
function showView(id,btn){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  const titles={home:'Dashboard',industrial:'Industrial Exchange',industrialBrowse:'Industrial Listings',market:'LoopMarket',exchange:'Exchange Offers',donate:'Donate & ReLoop',formView:'Create Listing'};
  document.getElementById('pageTitle').textContent=titles[id]||'ReLoop 360';
  if(btn){document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active')}
  else document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
  if(id==='market') fetchProducts();
  if(id==='industrialBrowse') renderIndustrial();
  if(id==='exchange') renderExchange();
}

/* ---------- industry ID verification gate ---------- */
let industryVerified=false, pendingView=null;
function enterIndustrial(btn){
  if(industryVerified){ showView('industrial',btn); return; }
  pendingView={id:'industrial',btn:btn};
  openVerifyModal();
}
function openVerifyModal(){
  openCustom('Verify company ID', '<p style="color:var(--muted);font-size:13px;margin-bottom:14px">Industrial Exchange is limited to verified businesses. Scan or upload a company ID / GST certificate to continue - this is a one-time check per account.</p><div class="verify-box"><div class="scan-frame" id="scanFrame">🪪</div><div class="verify-status" id="verifyStatus">Waiting for ID scan…</div><input id="idUpload" type="file" accept="image/*" capture="environment" hidden onchange="runScan()"><button class="primary" id="scanBtn" onclick="document.getElementById(\'idUpload\').click()">📷 Scan / Upload Company ID</button></div>');
}
function runScan(){
  const frame=document.getElementById('scanFrame'), status=document.getElementById('verifyStatus'), btn=document.getElementById('scanBtn');
  frame.classList.add('scanning'); frame.innerHTML='<div class="scan-line"></div>🪪';
  status.textContent='Scanning ID…'; btn.disabled=true; btn.textContent='Scanning…';
  setTimeout(function(){
    frame.classList.remove('scanning'); frame.innerHTML='✅';
    status.textContent='ID verified successfully.';
    industryVerified=true;
    document.getElementById('navLock').textContent='✓';
    btn.textContent='Continue →'; btn.disabled=false;
    btn.onclick=function(){ closeModal(); toast('Company ID verified — Industrial Exchange unlocked'); if(pendingView){ showView(pendingView.id,pendingView.btn); pendingView=null; } };
  },1300);
}

/* ---------- guided tour ---------- */
let tourShown=false;
function openTour(){
  const body = '<div class="tour-steps">' +
    '<div class="tour-step"><div class="ti" style="background:var(--steel-light);color:var(--steel)">🏭</div><div><b>1. Industrial Exchange</b><p>Industries list surplus materials (fabric, scrap, e-waste). After a one-time company ID check, Smart Match suggests the best-fit recyclers or NGOs for each listing.</p></div></div>' +
    '<div class="tour-step"><div class="ti" style="background:var(--green-light);color:var(--green)">♻</div><div><b>2. LoopMarket</b><p>Anyone can buy or sell pre-owned books, clothes, electronics and furniture. When you try to sell something, we also offer the option to donate it instead.</p></div></div>' +
    '<div class="tour-step"><div class="ti" style="background:var(--amber-light);color:var(--amber)">💚</div><div><b>3. Donate & ReLoop</b><p>Give items directly to verified NGO partners by category — clothes, books, e-materials, food and more.</p></div></div>' +
    '</div>' +
    '<div class="info-line">Every listing and exchange is logged on your Dashboard\'s impact stats — kg diverted, value recovered, items donated — so the whole exchange stays transparent, matching the platform\'s goal of turning waste into tracked, reusable value.</div>' +
    '<button class="primary" style="margin-top:16px" onclick="closeModal()">Got it</button>';
  openCustom('How ReLoop 360 works', body);
}

/* ---------- industrial: smart match ---------- */
const partners=[
  {name:'GreenCycle Recyclers',type:'Recycler',material:'Plastic & E-Waste',score:94,loc:'Chennai'},
  {name:'TechBridge Foundation',type:'NGO',material:'E-Materials',score:88,loc:'Bengaluru'},
  {name:'FabReuse Industries',type:'Recycler',material:'Textile Offcuts',score:91,loc:'Tiruppur'},
  {name:'Goodwill Circle',type:'NGO',material:'Mixed Surplus',score:79,loc:'Chennai'},
];
function runSmartMatch(){
  toast('Smart matching materials to partners…');
  const el=document.getElementById('matchList');
  el.innerHTML=partners.map(function(p){
    return '<div class="match-card"><div><div class="mname">'+p.name+'</div><div class="mtag">'+p.type+' • Handles '+p.material+' • '+p.loc+'</div></div><div style="display:flex;align-items:center;gap:10px"><span class="match-score">'+p.score+'% match</span><button onclick="toast(\''+'Connection request sent to '+p.name+'\')">Connect</button></div></div>';
  }).join('');
}
runSmartMatchInit();
function runSmartMatchInit(){document.getElementById('matchList').innerHTML='<p style="color:var(--muted);font-size:12.5px">Run Smart Match to see suggested recyclers &amp; NGOs for your surplus materials.</p>';}

const industrialListings=[
  {icon:'🧵',name:'Cotton Fabric Offcuts',qty:'120 kg',cond:'Reusable',loc:'Tiruppur',seller:'Vikram Textiles'},
  {icon:'🔩',name:'Steel Scrap Sheets',qty:'800 kg',cond:'For Recycling',loc:'Chennai',seller:'Anna Fabricators'},
  {icon:'📦',name:'Cardboard Packaging Surplus',qty:'40 bales',cond:'Good',loc:'Hyderabad',seller:'PackRight Ltd'},
  {icon:'🖥️',name:'Decommissioned Office PCs',qty:'25 units',cond:'Working',loc:'Bengaluru',seller:'NovaSoft Pvt Ltd'},
];
function renderIndustrial(){
  document.getElementById('industrialList').innerHTML=industrialListings.map(function(x){
    return '<div class="match-card"><div><div class="mname">'+x.icon+' '+x.name+'</div><div class="mtag">'+x.qty+' • '+x.cond+' • '+x.loc+' • '+x.seller+'</div></div><button onclick="toast(\''+'Enquiry sent to '+x.seller+'\')">Enquire</button></div>';
  }).join('');
}

/* ---------- LoopMarket ---------- */
let products=[];
let activeCat='All',wishlist=[],cart=[],orders=[],activities=[];

function fetchProducts(){
  fetch(API_BASE)
    .then(function(res){ return res.json(); })
    .then(function(data){
      products = data.products.map(function(p){
        p.id = p._id;
        return p;
      });
      render();
    })
    .catch(function(err){
      console.error('Failed to load products from backend:', err);
      document.getElementById('products').innerHTML = '<p style="color:var(--muted)">Could not load listings — is the backend running?</p>';
    });
}

function filterCat(v){activeCat=v;render();}
function clearFilters(){
  activeCat='All';
  document.querySelector('input[name="fc"][value="All"]').checked=true;
  document.getElementById('freeOnly').checked=false;
  document.getElementById('verifiedOnly').checked=false;
  document.getElementById('exchangeOnly').checked=false;
  document.getElementById('locationFilter').value='all';
  render();
}
function render(){
  const free=document.getElementById('freeOnly').checked;
  const ver=document.getElementById('verifiedOnly').checked;
  const exOnly=document.getElementById('exchangeOnly').checked;
  const loc=document.getElementById('locationFilter').value;
  let list=products.filter(function(p){
    return (activeCat==='All'||p.cat===activeCat)&&(!free||p.price===0)&&(!ver||p.verified)&&(!exOnly||p.exchange)&&(loc==='all'||p.loc===loc);
  });
  const s=document.getElementById('sort').value;
  if(s==='low') list.sort(function(a,b){return a.price-b.price;});
  if(s==='high') list.sort(function(a,b){return b.price-a.price;});
  document.getElementById('resultText').textContent=list.length+' results';
  document.getElementById('products').innerHTML=list.length?list.map(card).join(''):'<p style="color:var(--muted)">No matching listings. Try clearing a filter.</p>';
  document.getElementById('wishCount').textContent=wishlist.length;
  document.getElementById('cartCount').textContent=cart.reduce(function(a,b){return a+b.qty;},0);
}
function card(p){
  const w=wishlist.includes(p.id);
  let html = '<article class="product"><div class="pimg">'+p.icon+'<button class="wish" onclick="toggleWish(\''+p.id+'\')">'+(w?'♥':'♡')+'</button></div><div class="pbody"><span class="pbadge '+(p.price===0?'free':'')+'">'+p.cat+' • '+p.cond+'</span>';
  if(p.exchange){ html += '<span class="pbadge" style="background:#eef0fb;color:#4338ca;margin-left:5px">🔄 Swap OK</span>'; }
  html += '<h3>'+p.name+'</h3><div class="price">'+(p.price?'₹'+p.price.toLocaleString():'FREE')+'</div><div class="meta">'+p.loc+' '+(p.verified?'• ✓ Verified seller':'')+'</div><div class="seller">Seller: '+p.seller+'</div><div class="card-actions"><button class="add" onclick="addCart(\''+p.id+'\')">Add to Cart</button>';
  const cleanName = p.name.replace(/'/g,'');
  if(p.exchange){
    html += '<button class="outline" onclick="openExchangeForm(\''+cleanName+'\')">🔄 Swap</button>';
  } else {
    html += '<button class="outline" onclick="toast(\''+cleanName+' — full detail view coming soon\')">Details</button>';
  }
  html += '</div></div></article>';
  return html;
}
function toggleWish(id){
  wishlist=wishlist.includes(id)?wishlist.filter(function(x){return x!==id;}):wishlist.concat([id]);
  render();
  toast('Wishlist updated');
}
function openWishlist(){
  const items=products.filter(function(p){return wishlist.includes(p.id);});
  const body = items.length ? items.map(function(p){
    return '<div class="cart-item"><div class="cart-icon">'+p.icon+'</div><div><b>'+p.name+'</b><div style="color:var(--muted);font-size:12px">'+(p.price?'₹'+p.price.toLocaleString():'FREE')+'</div><button class="add" style="margin-top:8px" onclick="addCart(\''+p.id+'\');closeModal()">Add to cart</button></div></div>';
  }).join('') : '<p style="color:var(--muted)">Your wishlist is empty.</p>';
  openCustom('Wishlist', body);
}
function addCart(id){
  const p=products.find(function(x){return x.id===id;});
  const x=cart.find(function(x){return x.id===id;});
  if(x){ x.qty++; } else { cart.push(Object.assign({}, p, {qty:1})); }
  updateCart(); openCart(); toast('Added to cart');
}
function updateCart(){
  document.getElementById('cartCount').textContent=cart.reduce(function(a,b){return a+b.qty;},0);
  const el=document.getElementById('cartItems');
  el.innerHTML = cart.length ? cart.map(function(x){
    return '<div class="cart-item"><div class="cart-icon">'+x.icon+'</div><div style="flex:1"><b>'+x.name+'</b><div style="color:var(--muted);font-size:12px">'+(x.price?'₹'+x.price.toLocaleString():'FREE')+' each</div><div class="qty"><button onclick="changeQty(\''+x.id+'\',-1)">−</button>'+x.qty+'<button onclick="changeQty(\''+x.id+'\',1)">+</button></div></div><b>'+(x.price?'₹'+(x.price*x.qty).toLocaleString():'FREE')+'</b></div>';
  }).join('') : '<p style="color:var(--muted)">Your cart is empty.</p>';
}
function changeQty(id,d){
  const x=cart.find(function(x){return x.id===id;});
  if(x){ x.qty+=d; if(x.qty<=0){ cart=cart.filter(function(y){return y.id!==id;}); } }
  updateCart();
}
function openCart(){ document.getElementById('cartOverlay').classList.remove('hidden'); updateCart(); }
function closeCart(){ document.getElementById('cartOverlay').classList.add('hidden'); }
function startPayment(){
  if(!cart.length){ toast('Your cart is empty'); return; }
  const total=cart.reduce(function(a,b){return a+b.price*b.qty;},0);
  const body = '<p style="color:var(--muted);font-size:13px">Demo checkout — no real payment is taken.</p><div style="background:#f3f8f5;padding:14px;border-radius:10px;margin-top:12px"><b>Total: '+(total?'₹'+total.toLocaleString():'FREE')+'</b></div><button class="primary" style="margin-top:14px" onclick="completeOrder()">Confirm order ✓</button>';
  openCustom('Confirm order', body);
}
function completeOrder(){
  const total=cart.reduce(function(a,b){return a+b.price*b.qty;},0);
  const order={id:'RL-'+Date.now().toString().slice(-8),date:new Date().toLocaleString(),items:cart.map(function(x){return x.name;}),total:total};
  orders.unshift(order);
  activities.unshift({time:order.date,text:'Order placed '+order.id});
  cart=[]; updateCart(); closeModal(); toast('Order confirmed — '+order.id);
}

/* ---------- exchange offers ---------- */
const exchangeOffers=[
  {id:1,icon:'📘',offer:'Engineering Mathematics (Used)',want:'Any Data Structures textbook',owner:'Ajay P.',loc:'Hyderabad'},
  {id:2,icon:'📗',offer:'Novel Collection (5 books)',want:'Cookbooks or comics',owner:'Meera S.',loc:'Bengaluru'},
  {id:3,icon:'🎒',offer:'School Backpack, Good Condition',want:'Kids clothes (any size)',owner:'Ravi K.',loc:'Chennai'},
  {id:4,icon:'🔌',offer:'Extra Phone Charger (Type-C)',want:'Old earphones or cables',owner:'TechReuse Hub',loc:'Chennai'},
];
function renderExchange(){
  document.getElementById('exchangeList').innerHTML=exchangeOffers.map(function(x){
    return '<div class="match-card"><div><div class="mname">'+x.icon+' '+x.offer+'</div><div class="mtag">Wants: '+x.want+' • '+x.owner+' • '+x.loc+'</div></div><button onclick="toast(\'Swap proposed to '+x.owner+'\')">Propose Swap</button></div>';
  }).join('');
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

/* ---------- sell form + donation nudge ---------- */
function openMaterialForm(title){
  document.getElementById('formTitle').textContent=title;
  document.getElementById('itemCategory').value=title.includes('Surplus')?'Industrial Material':'';
  document.getElementById('photoField').classList.toggle('hidden',title.includes('Surplus'));
  document.getElementById('sellNudge').classList.remove('show');
  document.getElementById('wantField').classList.add('hidden');
  document.getElementById('notice').classList.remove('show');
  showView('formView');
}
function openSell(){
  document.getElementById('formTitle').textContent='Sell an Item';
  document.getElementById('itemCategory').value=activeCat!=='All'?activeCat:'';
  document.getElementById('photoField').classList.remove('hidden');
  document.getElementById('notice').classList.remove('show');
  document.getElementById('wantField').classList.add('hidden');
  document.getElementById('sellNudge').classList.add('show');
  showView('formView');
}
function openExchangeForm(fromProduct){
  document.getElementById('formTitle').textContent=fromProduct?('Propose a swap for: '+fromProduct):'Post an Exchange Offer';
  document.getElementById('itemCategory').value='';
  document.getElementById('photoField').classList.remove('hidden');
  document.getElementById('sellNudge').classList.remove('show');
  document.getElementById('notice').classList.remove('show');
  document.getElementById('wantField').classList.remove('hidden');
  showView('formView');
}
function dismissNudge(){ document.getElementById('sellNudge').classList.remove('show'); toast('Continuing as a sale listing'); }
function switchToDonate(){
  document.getElementById('sellNudge').classList.remove('show');
  document.getElementById('formTitle').textContent='Donate this item';
  toast('Switched to donation — pick an NGO from the Donate module after saving');
}
function previewPhotos(input){
  const wrap=document.getElementById('photoPreview'); wrap.innerHTML='';
  Array.from(input.files).slice(0,6).forEach(function(f){
    const r=new FileReader();
    r.onload=function(e){
      const img=document.createElement('img');
      img.src=e.target.result;
      wrap.appendChild(img);
    };
    r.readAsDataURL(f);
  });
}
function submitForm(){
  const name=document.getElementById('itemName').value.trim();
  if(!name){ toast('Please enter an item or material name'); return; }
  const wantEl=document.getElementById('wantField');
  if(!wantEl.classList.contains('hidden')){
    const want=document.getElementById('wantInput').value.trim()||'Open to offers';
    exchangeOffers.unshift({id:Date.now(),icon:'📦',offer:name,want:want,owner:'You',loc:'Your area'});
    activities.unshift({time:new Date().toLocaleString(),text:'Posted exchange offer: '+name});
    document.getElementById('wantInput').value='';
  } else {
    activities.unshift({time:new Date().toLocaleString(),text:'Listed: '+name});
  }
  document.getElementById('notice').classList.add('show');
  document.getElementById('itemName').value='';
}

/* ---------- account ---------- */
function openAccount(){
  const total=orders.reduce(function(a,o){return a+o.total;},0);
  const activityHtml = activities.length ? activities.slice(0,8).map(function(a){
    return '<div class="activity-row"><span>•</span><div><b>'+a.text+'</b><small>'+a.time+'</small></div></div>';
  }).join('') : '<p style="color:var(--muted);font-size:13px">Your orders, listings and donations will appear here.</p>';

  const body = '<div class="account-grid">' +
    '<div class="account-tile"><span class="tile-icon">🛒</span><b>Cart</b><span style="color:var(--muted);font-size:12px">'+cart.reduce(function(a,b){return a+b.qty;},0)+' item(s)</span></div>' +
    '<div class="account-tile"><span class="tile-icon">♥</span><b>Favourites</b><span style="color:var(--muted);font-size:12px">'+wishlist.length+' saved</span></div>' +
    '<div class="account-tile"><span class="tile-icon">📦</span><b>Orders</b><span style="color:var(--muted);font-size:12px">'+orders.length+' completed</span></div>' +
    '<div class="account-tile"><span class="tile-icon">₹</span><b>Total spent</b><span style="color:var(--muted);font-size:12px">₹'+total.toLocaleString()+'</span></div>' +
    '</div><h3 class="section-title" style="margin-top:20px">Recent activity</h3>' + activityHtml;

  openCustom('My Account', body);
}

/* ---------- modal + toast ---------- */
function openCustom(title,body){
  document.getElementById('modalTitle').textContent=title;
  document.getElementById('modalBody').innerHTML=body;
  document.getElementById('modal').classList.remove('hidden');
}
function closeModal(){ document.getElementById('modal').classList.add('hidden'); }
function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.classList.remove('hidden');
  clearTimeout(window._tt);
  window._tt=setTimeout(function(){ t.classList.add('hidden'); },2200);
}