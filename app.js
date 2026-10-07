const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const money = n => 'NT$ ' + Number(n).toLocaleString('zh-TW');

const regionClass = r => r === '仙台' ? 'sendai' : r === '藏王' ? 'zao' : (r.includes('山形') || r.includes('天童')) ? 'yamagata' : 'tokyo';

let DATA = null;

async function load(){
  DATA = await fetch('data.json?v=' + Date.now()).then(r=>r.json());
  renderMeta();
  renderDashboard();
  renderRegions();
  renderItinerary();
  renderTodos();
  renderMiniTrips();
  renderFoodGuide();
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

function itineraryTags(x){
  const text=[x.title,x.summary,...(x.details||[])].join('｜');
  const rules=[
    ['上午',/早上|上午|早餐|08:|09:|10:|11:|樹冰|出發/],
    ['午餐',/午餐|中午|12:|13:00|海鮮|牡蠣/],
    ['下午',/下午|13:|14:|15:|16:|採草莓|水族館|自由活動/],
    ['晚餐',/晚餐|晚間|晚上|牛舌/]
  ];
  return rules.map(([label,re])=>({label,filled:re.test(text)}));
}

function renderItinerary(){
  $('#itineraryList').innerHTML=DATA.itinerary.map((x,i)=>{
    const tags=itineraryTags(x);
    const tagHtml=tags.map(t=>'<span class="schedule-slot '+(t.filled?'is-filled':'is-empty')+'">'+t.label+'</span>').join('');
    return `
    <button class="itinerary-item itinerary-row region-${regionClass(x.region)} ${i===0?'active':''}" data-i="${i}">
      <div class="itinerary-row-top">
        <span class="itinerary-date">${x.date}</span>
        <span class="itinerary-day">${x.day}</span>
        <strong class="itinerary-one-line">${x.title}</strong>
      </div>
      <div class="itinerary-row-slots">${tagHtml}</div>
    </button>`;
  }).join('');
  $$('.itinerary-item').forEach(b=>b.addEventListener('click',()=>{
    $$('.itinerary-item').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    renderItineraryDetail(Number(b.dataset.i));
  }));
  renderItineraryDetail(0);
}

function renderItineraryDetail(i){
  const x=DATA.itinerary[i];
  const detail=$('#itineraryDetail');
  detail.className='panel itinerary-detail region-'+regionClass(x.region);
  detail.innerHTML=`
    <div class="detail-top">
      <div><div class="detail-region">${x.region}</div><div class="detail-date">${x.date}</div></div>
      <span class="status detail-status">${x.status}</span>
    </div>
    <h3 class="detail-title">${x.title}</h3>
    <p class="detail-summary">${x.summary}</p>
    <ul class="detail-list">${x.details.map(v=>'<li>'+v+'</li>').join('')}</ul>`;
}

function renderTodos(){
  const columns=[
    {priority:'高',title:'最重要',note:'現在優先處理',cls:'high'},
    {priority:'中',title:'次重要',note:'接著處理',cls:'medium'},
    {priority:'低',title:'最低',note:'可以稍後',cls:'low'}
  ];
  $('#todoGrid').innerHTML=columns.map(col=>{
    const arr=DATA.todos.filter(x=>x.priority===col.priority);
    return `<section class="todo-column priority-${col.cls}">
      <div class="todo-column-head"><div><span>${col.priority}優先</span><h3>${col.title}</h3></div><b>${arr.length}</b></div>
      <div class="todo-column-note">${col.note}</div>
      <div class="todo-column-list">${arr.length?arr.map(x=>`
        <article class="todo-compact-card">
          <div class="todo-compact-top"><span class="tag">${x.category}</span><small>${x.status}</small></div>
          <h4>${x.title||x.text}</h4>
          <p>${x.summary||''}</p>
        </article>`).join(''):'<div class="todo-empty">目前沒有項目</div>'}</div>
    </section>`;
  }).join('');
}

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
          <div class="mini-trip-price"><span>2大1小參考</span><strong>${x.familyPrice||"待估"}</strong><small>${x.priceLabel||""}｜${x.priceNote||""}</small></div>
          <p>${x.fit}</p>
          <a class="source-link" href="${x.url}" target="_blank" rel="noopener">查看 ${x.platform} 行程 ↗</a>
        </article>`).join('')}</div>
    </div>`;
  }).join('');
}


function renderFoodGuide(){
  const root=$('#foodGroups'); if(!root || !DATA.foodGuide) return;
  const labels={lunch:'午餐',dinner:'晚餐',snack:'小吃'};
  $('#foodRules').innerHTML=(DATA.foodGuideRules||[]).map(x=>'<span class="food-rule">'+x+'</span>').join('');
  root.innerHTML=DATA.foodGuide.map(area=>`
    <section class="food-region">
      <div class="food-region-head"><h3>${area.region}</h3></div>
      <div class="food-meal-grid">${Object.entries(labels).map(([key,label])=>{
        const items=area.meals[key]||[];
        return `<div class="food-meal-column"><div class="food-meal-head"><strong>${label}</strong><span>${items.length}</span></div>
          <div class="food-card-list">${items.length?items.map(x=>`
            <article class="food-card">
              <div class="food-card-top"><span>${x.category||label}</span><small>${x.price||'價格待補'}</small></div>
              <h4>${x.name}</h4><p>${x.note||''}</p>
              <div class="food-tags">
                <span>預約：${x.reservation||'待確認'}</span><span>菜單：${x.menu||'待確認'}</span><span>親子：${x.family||'待確認'}</span>
              </div>
              ${x.url?'<a class="source-link" href="'+x.url+'" target="_blank" rel="noopener">查看餐廳 ↗</a>':''}
            </article>`).join(''):'<div class="food-empty">候選餐廳待加入</div>'}</div>
        </div>`;
      }).join('')}</div>
    </section>`).join('');
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
  const recent=DATA.recentChanges||[];
  const visible=recent.slice(0,5);
  $('#recentChanges').innerHTML=visible.map(x=>'<div class="stack-item"><time>'+x.date+'</time><p>'+x.text+'</p></div>').join('')+(recent.length>5?'<details class="change-more"><summary>查看較早更新（'+(recent.length-5)+'）</summary><div class="change-more-list">'+recent.slice(5).map(x=>'<div class="stack-item"><time>'+x.date+'</time><p>'+x.text+'</p></div>').join('')+'</div></details>':'');
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