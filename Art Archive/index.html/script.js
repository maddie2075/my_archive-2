// Neon Hack — Cyberpunk Clicker
(function(){
  // --- State ---
  const STORAGE_KEY = 'neonhack_save_v1';
  let state = {
    dollars: 0,
    humanity: 100,
    dpc: 1, // dollars per click
    items: {},
    lastTick: Date.now()
  };

  // --- Shop definition ---
  const SHOP = [
    { id: 'script_kiddie', name: 'Script Kiddie', baseCost: 10, baseDPS: 0.1, humanityCost: 0.5 },
    { id: 'cyber_arm', name: 'Cybernetic Arm', baseCost: 100, baseDPS: 1, humanityCost: 5 },
    { id: 'black_ice', name: 'Black ICE Server', baseCost: 1000, baseDPS: 10, humanityCost: 20 },
    { id: 'ai_core', name: 'AI Core', baseCost: 10000, baseDPS: 100, humanityCost: 50 }
  ];

  // Initialize counts
  SHOP.forEach(s=> state.items[s.id] = 0);

  // --- Helpers ---
  function load(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(raw){
        const saved = JSON.parse(raw);
        Object.assign(state, saved);
      }
    }catch(e){console.warn('Load failed',e)}
  }

  function save(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch(e){ console.warn('Save failed', e); }
  }

  function formatMoney(n){
    if(n>=1000000) return '$' + (n/1000000).toFixed(2) + 'M';
    if(n>=1000) return '$' + (n/1000).toFixed(1) + 'k';
    return '$' + Math.floor(n);
  }

  function getDPS(){
    return SHOP.reduce((sum,item)=>{
      const count = state.items[item.id]||0;
      return sum + count * item.baseDPS;
    },0);
  }

  function getDPC(){ return state.dpc; }

  function costFor(item, count){
    // cost to buy one more = base * 1.15^count
    return Math.ceil(item.baseCost * Math.pow(1.15, count));
  }

  // --- UI bindings ---
  const el = {
    dollars: document.getElementById('dollars'),
    humanity: document.getElementById('humanity'),
    dpc: document.getElementById('dpc'),
    dps: document.getElementById('dps'),
    hackBtn: document.getElementById('hackBtn'),
    shop: document.getElementById('shop')
  };

  // Build shop UI
  function renderShop(){
    el.shop.innerHTML = '';
    SHOP.forEach(item =>{
      const count = state.items[item.id] || 0;
      const cost = costFor(item, count);
      const row = document.createElement('div');
      row.className = 'shop-item';
      row.innerHTML = `
        <div>
          <div style="font-weight:700">${item.name} <span class="muted">x${count}</span></div>
          <div class="muted" style="font-size:13px">+${item.baseDPS} DPS • Humanity −${item.humanityCost}</div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <div class="muted">${formatMoney(cost)}</div>
          <button data-id="${item.id}" class="big-btn" style="padding:8px 12px;font-size:14px">Buy</button>
        </div>
      `;
      el.shop.appendChild(row);
    });

    // attach buy handlers
    el.shop.querySelectorAll('button[data-id]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.getAttribute('data-id');
        buyItem(id);
      });
    });
  }

  function updateHUD(){
    el.dollars.textContent = formatMoney(state.dollars);
    el.humanity.textContent = Math.max(0, Math.round(state.humanity)) + '%';
    el.dpc.textContent = getDPC();
    const dps = getDPS();
    el.dps.textContent = (Math.round(dps*10)/10);

    // humanity color warning
    if(state.humanity <= 25) el.humanity.className = 'danger'; else el.humanity.className = '';
  }

  // --- Actions ---
  function hackClick(){
    state.dollars += getDPC();
    updateHUD();
  }

  function buyItem(id){
    const item = SHOP.find(s=>s.id===id);
    if(!item) return;
    const count = state.items[id] || 0;
    const cost = costFor(item, count);
    if(state.dollars < cost) return alert('Not enough dollars.');

    // make purchase
    state.dollars -= cost;
    state.items[id] = count + 1;
    state.humanity = Math.max(0, state.humanity - item.humanityCost);
    renderShop();
    updateHUD();
    save();
  }

  // Tick loop: add DPS income
  function tick(dt){
    const dps = getDPS();
    state.dollars += dps * (dt/1000);
  }

  // Main loop using setInterval to update every 200ms
  let last = Date.now();
  setInterval(()=>{
    const now = Date.now();
    const dt = now - last;
    last = now;
    tick(dt);
    updateHUD();
  }, 200);

  // Bind click
  el.hackBtn.addEventListener('click', ()=>{
    hackClick();
  });

  // Load / initial render
  load();
  renderShop();
  updateHUD();

  // Auto-save every 5 seconds
  setInterval(save, 5000);
  window.addEventListener('beforeunload', save);

})();
