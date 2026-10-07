const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const money = n => 'NT$ ' + Number(n).toLocaleString('zh-TW');

let DATA = null;

async function load(){
  DATA = await fetch('data.json?v=' + Date.now()).then(r=>r.json());
  renderMeta();
  renderDashboard();
  renderRegions();
  renderItinerary();
  renderTodos();
  renderMiniTrips();
  renderReferences();
  renderFooterBlocks();
  initTheme();
}

function renderMeta(){
  $('#tripTitle').textContent = DATA.meta.title;
  $('#tripDates').textContent = DATA.meta.dates;
  $('#lastUpdated').textContent = '更新 ' + DATA.meta.lastUpdated + (DATA.meta.timezone ? ' · ' + DATA.meta.timezone : '');
  $('#footerUpdated').textContent = '最後更新 ' + DATA.meta.lastUpdated + (DATA.meta.timezone ? ' · ' + DATA.meta.timezone : '');
}

function renderDashboard(){
  const d=DATA.dashboard, b=DATA.budget;
  $('#progressDone').textContent=d.progress.done;
  $('#progressTotal').textContent=d.progress.total;
  const pct=Math.round(d.progress.done/d.progress.total*100);
  $('#progressBar i').style.width=pct+'%';
  $('#categoryProgress').innerHTML=d.categories.map(x=>{
    const p=Math.round(x.done/x.total*100);
    return '<div class="mini-progress"><div><span>'+x.name+'</span><span>'+p+'%</span></div><b>'+x.done+' / '+x.total+'</b></div>';
  }).join('');

  const bp=Math.round(b.knownPaidTwd/b.limitTwd*100);
  $('#budgetPercent').textContent=bp+'% of budget';
  $('#knownPaid').textContent=money(b.knownPaidTwd);
  $('#budgetLimit').textContent=money(b.limitTwd);
  $('#listedSubtotal').textContent=money(b.listedSubtotalTwd);
  $('#knownUnpaid').textContent=money(b.knownUnpaidReserveTwd);
  $('#paymentUnknown').textContent=money(b.paymentUnknownTwd);
  $('#budgetBar i').style.width=Math.min(bp,100)+'%';
  $('#budgetNote').textContent=b.note+'｜'+DATA.meta.exchangeRate+'｜待補金額 '+b.missingAmountItems+' 項；付款待核對 '+b.paymentCheckItems+' 項。';
}

function renderRegions(){
  $('#regionGrid').innerHTML=DATA.regions.map(r=>`
    <article class="region-card region-${r.no}">
      <div class="region-no">${r.no}</div>
      <h3>${r.name}</h3>
      <div class="date-line">${r.dates} · ${r.nights}</div>
      <span class="status">${r.status}</span>
      <p>${r.note}</p>
      <div class="chip-row">${r.items.map(x=>'<span class="chip">'+x+'</span>').join('')}</div>
    </article>`).join('');
}

function renderItinerary(){
  $('#itineraryList').innerHTML=DATA.itinerary.map((x,i)=>`
    <button class="itinerary-item ${i===0?'active':''}" data-i="${i}">
      <div><span class="itinerary-date">${x.date}</span><span class="itinerary-day">${x.day}</span></div>
      <div class="itinerary-title"><strong>${x.title}</strong><span>${x.region} · ${x.summary}</span></div>
    </button>`).join('');
  $$('.itinerary-item').forEach(b=>b.addEventListener('click',()=>{
    $$('.itinerary-item').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    renderItineraryDetail(Number(b.dataset.i));
  }));
  renderItineraryDetail(0);
}

function renderItineraryDetail(i){
  const x=DATA.itinerary[i];
  $('#itineraryDetail').innerHTML=`
    <div class="detail-top">
      <div><div class="detail-region">${x.region}</div><div class="detail-date">${x.date}</div></div>
      <span class="status detail-status">${x.status}</span>
    </div>
    <h3 class="detail-title">${x.title}</h3>
    <p class="detail-summary">${x.summary}</p>
    <ul class="detail-list">${x.details.map(v=>'<li>'+v+'</li>').join('')}</ul>`;
}

function renderTodos(filter='全部'){
  let arr=DATA.todos;
  if(filter==='高') arr=arr.filter(x=>x.priority==='高');
  if(filter==='待外部回覆') arr=arr.filter(x=>x.status==='待外部回覆');
  $('#todoGrid').innerHTML=arr.map(x=>`
    <article class="todo-card priority-${x.priority==='高'?'high':x.priority==='中'?'medium':'low'}">
      <div class="todo-meta"><span class="tag">${x.category}</span><span class="tag ${x.priority==='高'?'priority-high':''}">${x.priority}優先</span></div>
      <h3>${x.text}</h3><p>${x.status}</p>
    </article>`).join('');
}
$$('.filter').forEach(btn=>btn.addEventListener('click',()=>{
  $$('.filter').forEach(x=>x.classList.remove('active'));btn.classList.add('active');renderTodos(btn.dataset.filter);
}));


function renderMiniTrips(){
  const root=$('#miniTripGroups'); if(!root || !DATA.miniDayTrips) return;
  const regions=['仙台','山形／天童','東京'];
  root.innerHTML=regions.map(region=>{
    const items=DATA.miniDayTrips.filter(x=>x.region===region).sort((a,b)=>(a.dateStatus==='尚無日期可選')-(b.dateStatus==='尚無日期可選'));
    return `<div class="mini-trip-region">
      <div class="mini-trip-region-head"><h3>${region}</h3><span>${items.length} 個候選</span></div>
      <div class="mini-trip-grid">${items.map(x=>`
        <article class="mini-trip-card ${x.dateStatus==='尚無日期可選'?'date-pending':''}">
          <div class="mini-trip-top"><span class="platform ${x.platform.toLowerCase()}">${x.platform}</span><span class="date-state">${x.dateStatus}</span></div>
          <h4>${x.title}</h4>
          <div class="mini-trip-meta">${x.from} · ${x.duration}</div>
          <p>${x.fit}</p>
          <a class="source-link" href="${x.url}" target="_blank" rel="noopener">查看 ${x.platform} 行程 ↗</a>
        </article>`).join('')}</div>
    </div>`;
  }).join('');
}

function renderReferences(){
  $('#referenceCards').innerHTML=DATA.skiReferences.map(x=>`
    <article class="reference-card">
      <div class="eyebrow">${x.country} · ${x.sport}</div>
      <h3>${x.provider}</h3>
      <div class="reference-plan">${x.plan}</div>
      <div class="reference-price">${x.price}</div>
      <div class="reference-unit">${x.unit}</div>
      <dl>
        <dt>課程時間</dt><dd>${x.duration}</dd>
        <dt>適合情境</dt><dd>${x.fit}</dd>
        <dt>備註</dt><dd>${x.note}</dd>
        <dt>查價日</dt><dd>${x.checked}</dd>
      </dl>
      <a class="source-link" href="${x.url}" target="_blank" rel="noopener">查看官方價格頁 ↗</a>
    </article>`).join('');
}

function renderFooterBlocks(){
  $('#recentChanges').innerHTML=DATA.recentChanges.map(x=>'<div class="stack-item"><time>'+x.date+'</time><p>'+x.text+'</p></div>').join('');
  $('#sourceList').innerHTML=DATA.sources.map(x=>'<div class="stack-item"><p><a href="'+x.url+'" target="_blank" rel="noopener">'+x.label+' ↗</a></p></div>').join('');
}

function initTheme(){
  const saved=localStorage.getItem('ski2027-theme')||'dark';
  document.documentElement.dataset.theme=saved;
  updateThemeButton(saved);
  $('#themeBtn').addEventListener('click',()=>{
    const next=document.documentElement.dataset.theme==='dark'?'light':'dark';
    document.documentElement.dataset.theme=next;
    localStorage.setItem('ski2027-theme',next);
    updateThemeButton(next);
  });
}
function updateThemeButton(t){ $('#themeBtn').textContent=t==='dark'?'☀︎ 亮色':'◐ 深色'; }

load();