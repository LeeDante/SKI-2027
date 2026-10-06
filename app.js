async function load(){
  const d=await fetch('data.json').then(r=>r.json());
  document.querySelector('#tripTitle').textContent=d.trip.title;
  document.querySelector('#tripDates').textContent=d.trip.dates;

  document.querySelector('#regions').innerHTML=d.trip.regions.map((r,i)=>`
    <article class="card">
      <div class="eyebrow">0${i+1}</div>
      <h3>${r.name}</h3>
      <div class="muted">${r.dates}</div>
      <p><span class="badge">${r.status}</span></p>
      <p>${r.note}</p>
    </article>`).join('');

  document.querySelector('#skiRows').innerHTML=d.skiReferences.map(x=>`
    <tr>
      <td>${x.country}</td><td>${x.provider}</td><td>${x.sport}</td>
      <td>${x.plan}</td><td>${x.price}</td><td>${x.unit}</td>
      <td>${x.duration}</td><td>${x.note}</td>
      <td><a href="${x.url}" target="_blank" rel="noopener">官方頁</a></td>
      <td>${x.checked}</td>
    </tr>`).join('');

  document.querySelector('#todos').innerHTML=d.todos.map(x=>`
    <div class="todo"><span class="badge">${x.category}</span><div><strong>${x.text}</strong><div class="muted">${x.status}</div></div></div>`).join('');
}
load();