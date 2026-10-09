const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const money = n => 'NT$ ' + Number(n).toLocaleString('zh-TW');

const regionClass = r => r === '仙台' ? 'sendai' : r === '藏王' ? 'zao' : (r.includes('山形') || r.includes('天童')) ? 'yamagata' : 'tokyo';

let DATA = null;

async function load(){
  DATA = await fetch('data.json?v=' + Date.now()).then(r=>r.json());
  renderMeta();
  renderDashboard();
  renderCategoryBudget();
  renderRegions();
  renderItinerary();
  initRegionJumps();
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
  $('#budgetNote').textContent=b.note+'｜'+DATA.meta.exchangeRate;
  $('#knownPaid').textContent=money(b.regionSpentTotalTwd);
  $('#budgetPercent').textContent=Math.round(b.regionSpentTotalTwd/b.limitTwd*100)+'%（已付／全程預算）';
  $('#budgetBar i').style.width=Math.min(100,Math.round(b.regionSpentTotalTwd/b.limitTwd*100))+'%';
  $('#regionalBudget').innerHTML='<div class="regional-budget-head"><h3>四區預算進度</h3><p>圓環代表已確認金額占各區預期花費的比例；數字仍以同一份費用明細為準</p></div><div class="regional-budget-grid regional-ring-grid">'+b.regionBreakdown.map((r,i)=>{const pct=r.plannedTwd?Math.round(r.spentTwd/r.plannedTwd*100):0;return '<article class="regional-budget-card regional-ring-card"><div class="regional-budget-title"><strong>'+String(i+1).padStart(2,'0')+' '+r.name+'</strong><a href="#itinerary" data-region-jump="'+r.name+'">看行程 ↗</a></div><div class="region-ring" style="--ring-pct:'+pct+'%"><div class="region-ring-core"><strong>'+pct+'%</strong><span>已確認</span></div></div><div class="ring-amounts"><div><small>已確認</small><strong>'+money(r.spentTwd)+'</strong></div><div><small>預期總額</small><strong>'+money(r.plannedTwd)+'</strong></div></div><small class="ring-pending">未確認暫估 '+money(r.estimatedTwd)+'</small></article>'}).join('')+'</div><div class="regional-budget-total"><span>四區預算合計</span><strong>'+money(b.regionSpentTotalTwd)+' / '+money(b.regionPlanTotalTwd)+'</strong><small>另計國際機票暫估 '+money(b.sharedEstimateTwd)+'；整趟預期 '+money(b.tripProjectedTwd)+'（購物未列）</small></div>';
}

function renderCategoryBudget(){
 const b=DATA.budget, names={'住宿':'住宿','交通':'交通','餐飲':'餐飲','滑雪':'滑雪相關','活動':'活動／門票','機票':'國際機票'};
 const groups=Object.keys(names).map(k=>{
   const items=b.items.filter(x=>x.category===k);
   const paid=items.filter(x=>x.status==='confirmed').reduce((n,x)=>n+x.twd,0);
   const total=items.reduce((n,x)=>n+x.twd,0);
   return {name:names[k],paid,total};
 });
 const paid=groups.reduce((n,x)=>n+x.paid,0),total=groups.reduce((n,x)=>n+x.total,0);
 const icons={'住宿':'🏨','交通':'🚆','餐飲':'🍽️','滑雪相關':'🎿','活動／門票':'🎟️','國際機票':'✈️'};
 $('#categoryBudget').innerHTML='<div class="regional-budget-head"><h3>總預算｜依費用類別</h3><p>十格刻度顯示已確認費用比例</p></div><div class="category-budget-grid">'+groups.map(x=>{const pct=x.total?Math.min(100,Math.round(x.paid/x.total*100)):0;return '<div class="category-budget-item"><div class="category-budget-icon" aria-hidden="true">'+icons[x.name]+'</div><div class="category-budget-copy"><strong>'+x.name+'</strong><span>已確認 '+money(x.paid)+'</span><small>預估 '+money(x.total)+'</small></div><div class="category-budget-meter" role="img" aria-label="'+x.name+'已確認 '+pct+'%"><strong>'+pct+'%</strong><div class="category-budget-ticks">'+Array.from({length:10},(_,i)=>'<i class="'+(pct>i*10?'filled':'')+'"></i>').join('')+'</div></div></div>'}).join('')+'</div>';
 $('#budgetOverallTotal').innerHTML='<span>整趟已確認／總預算</span><strong>'+money(paid)+' / '+money(total)+'</strong><small>未確認暫估 '+money(total-paid)+'；未列購物費</small>';
 $('#knownPaid').textContent=money(paid);
 $('#budgetLimit').textContent=money(total);
 $('#listedSubtotal').textContent=money(b.regionPlanTotalTwd);
 $('#knownUnpaid').textContent=money(total-paid);
 $('#paymentUnknown').textContent=money(b.sharedEstimateTwd);
 $('#budgetPercent').textContent=(total?Math.round(paid/total*100):0)+'% 已確認';
 $('#budgetBar i').style.width=(total?Math.min(100,paid/total*100):0)+'%';
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

const slotNames=[['breakfast','早餐'],['morning','上午'],['lunch','午餐'],['afternoon','下午'],['dinner','晚餐']];
const overviewSlotNames=slotNames;
function isConfirmedSlot(day,key){
 const v=String(day.schedule?.[key]||'').trim();
 if(!v||/^(自理|待定|待確認|候選|參考|自由活動|休息|—)$/.test(v))return false;
 // 已排定的用餐（包含現場候位、待訂位首選）與交通行程都可亮燈；
 // 完成預約與否仍由待辦事項獨立追蹤。
 if(['breakfast','lunch','dinner'].includes(key)){
   if(/備案|候補/.test(v)&&!/首選|暫排|預排|機上餐|牛たん料理/.test(v))return false;
   return /機上餐|含早餐|含晚餐|首選|預排|暫排|已訂|已預約|已確認|現場候位|牛たん料理|市場海鮮丼|餐廳|料理|定食/.test(v);
 }
 const plannedTourDays=['01/23','01/24','01/25'];
 if(plannedTourDays.includes(day.date)&&(key==='morning'||key==='afternoon'))return true;
 if(/待定|待確認|候選|參考|自由|休息|練習|整理|採買|購物|未訂|待訂|申請|或|—/.test(v))return false;
 return /已訂|已預約|已確認|\d{1,2}:\d{2}.*(起飛|抵達)|入住|換房/.test(v);
}
function renderItinerary(){
 $('#itineraryList').innerHTML=DATA.itinerary.map((x,i)=>'<button class="itinerary-item itinerary-row region-'+regionClass(x.region)+' '+(i===0?'active':'')+'" data-i="'+i+'"><div class="itinerary-row-top"><span class="itinerary-date">'+x.date+'</span><span class="itinerary-day">'+x.day+'</span><strong class="itinerary-one-line">'+x.title+'</strong></div><div class="itinerary-row-slots">'+overviewSlotNames.map(([k,label])=>'<span class="schedule-slot '+(isConfirmedSlot(x,k)?'is-filled':'is-empty')+'">'+label+'</span>').join('')+'</div></button>').join('');
 $$('.itinerary-item').forEach(b=>b.addEventListener('click',()=>{$$('.itinerary-item').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderItineraryDetail(Number(b.dataset.i));}));
 renderItineraryDetail(0);
}
function renderItineraryDetail(i){
 const x=DATA.itinerary[i],s=x.schedule||{},detail=$('#itineraryDetail');
 detail.className='panel itinerary-detail region-'+regionClass(x.region);
 detail.innerHTML='<div class="detail-top"><div><div class="detail-region">'+x.region+'</div><div class="detail-date">'+x.date+'</div></div><span class="status detail-status">'+x.status+'</span></div><h3 class="detail-title">'+x.title+'</h3><p class="detail-summary">'+x.summary+'</p><div class="day-schedule">'+slotNames.map(([k,label])=>'<div class="day-schedule-row"><strong>'+label+'</strong><span>'+(s[k]||'待安排')+'</span></div>').join('')+'</div><details><summary>交通與備案詳細備註</summary><ul class="detail-list">'+x.details.map(v=>'<li>'+v+'</li>').join('')+'</ul></details>';
}

function initRegionJumps(){
  $$('[data-region-jump]').forEach(link=>link.addEventListener('click',()=>{
    const region=link.dataset.regionJump;
    const index=DATA.itinerary.findIndex(x=>region==='山形／天童'?(x.region.includes('山形')||x.region.includes('天童')):x.region===region);
    if(index<0)return;
    $$('.itinerary-item').forEach(x=>x.classList.remove('active'));
    const item=$('.itinerary-item[data-i="'+index+'"]');
    if(item){item.classList.add('active');item.scrollIntoView({block:'nearest'});}
    renderItineraryDetail(index);
  }));
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
      <div class="mini-trip-grid"> ${items.map(x=>`
        <details class="mini-trip-card ${x.dateStatus==='尚無日期可選'?'date-pending':''}">
          <summary><strong>${x.title}</strong><span aria-hidden="true">⌄</span></summary>
          <div class="mini-trip-expanded">
            <div class="mini-trip-top"><span class="platform ${x.platform.toLowerCase()}">${x.platform}</span><span class="date-state">${x.dateStatus}</span></div>
            <div class="mini-trip-meta">${x.from} · ${x.duration}</div>
            <div class="mini-trip-price"><span>2大1小參考</span><strong>${x.familyPrice||"待估"}</strong><small>${x.priceLabel||""}｜${x.priceNote||""}</small></div>
            <p>${x.fit}</p>
            <a class="source-link" href="${x.url}" target="_blank" rel="noopener">查看 ${x.platform} 行程 ↗</a>
          </div>
        </details>`).join('')}</div>
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
        const items=[...(area.meals[key]||[])].sort((a,b)=>(a.date?0:1)-(b.date?0:1)||String(a.date||'').localeCompare(String(b.date||'')));
        return `<div class="food-meal-column"><div class="food-meal-head"><strong>${label}</strong><span>${items.length}</span></div>
          <div class="food-card-list">${items.length?items.map(x=>`
            <article class="food-card ${x.bookingType==='walkin'?'food-walkin':x.bookingType==='reservation'?(x.bookingStatus==='booked'?'food-booked':'food-pending'):'food-unknown'}">
              <div class="food-card-top"><span>${x.category||label}</span><small>${x.price||'價格待補'}</small></div>
              <h4>${x.name}</h4>${x.date?`<div class="food-date">📅 ${x.date} 已排行程</div>`:''}<p>${x.note||''}</p><p class="food-recommend"><strong>推薦餐點：</strong>${x.recommendedDish||'待選定'}</p>
              <div class="food-tags">
                <span class="food-reservation-tag">${x.bookingType==='walkin'?'現場候位':x.bookingStatus==='booked'?'已預約':x.bookingType==='reservation'?'待預約':'預約待確認'}｜${x.reservation||'待確認'}</span><span>菜單：${x.menu||'待確認'}</span><span>親子：${x.family||'待確認'}</span>
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