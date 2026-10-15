'use strict';
const $=id=>document.getElementById(id);
let currentSession=null,chosenSeat=null,activeRequest=0;
const fmt=n=>`${Number(n||0).toLocaleString('ru-RU')} ₸`;
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateText=s=>String(s).slice(0,10);
const timeText=s=>String(s).slice(11,16);
async function api(url,opts){const res=await fetch(url,opts);const body=await res.json().catch(()=>({}));if(!res.ok)throw Error(body.error||`HTTP ${res.status}`);return body;}
function message(text,success=false){$('message').textContent=text;$('message').className=`message${success?' ok':''}`;}
function clearMessage(){$('message').classList.add('hidden');}
function page(name){
  for(const p of ['sessions','movies','report'])$(`${p}-view`).classList.toggle('hidden',p!==name);
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===name));
  clearMessage();if(name==='movies')loadMovies();if(name==='report')loadReport();
}
async function loadMetadata(){
  try{
    const meta=await api('/api/metadata');
    $('genre').innerHTML='<option value="">Барлығы</option>'+meta.genres.map(g=>`<option value="${g.genre_id}">${safe(g.genre_name)}</option>`).join('');
    $('hall').innerHTML='<option value="">Барлығы</option>'+meta.halls.map(h=>`<option value="${h.hall_id}">${safe(h.hall_name)}</option>`).join('');
    const health=await api('/api/health');$('connection').textContent=`SQL Server: ${health.db_name} ✓`;
  }catch(err){$('connection').textContent='SQL Server: қосылу қатесі';message(err.message);}
}
function sessionCard(s){
  const left=s.capacity-s.sold_count;
  return `<article class="card"><div class="tags"><span class="tag">${safe(s.genre_name)}</span><span class="tag">${s.age_rating}+</span><span class="tag">★ ${s.rating}</span></div>
   <h3>${safe(s.title)}</h3><p>${safe(s.description)}</p><div class="time">${timeText(s.start_at)} <small>${dateText(s.start_at)}</small></div>
   <div class="facts"><span>${safe(s.hall_name)} · ${s.duration_min} мин</span><span>${left} бос орын</span></div>
   <div class="buy"><strong>${fmt(s.price)}</strong><button data-buy="${s.session_id}" ${left===0?'disabled':''}>Орын таңдау ↗</button></div></article>`;
}
async function loadSessions(){
  const n=++activeRequest;const q=new URLSearchParams();
  for(const [key,id] of [['date','date'],['genre','genre'],['hall','hall'],['sort','sort'],['search','search']]) {
    if($(id).value.trim())q.set(key,$(id).value.trim());
  }
  try{
    const rows=await api(`/api/sessions?${q}`);if(n!==activeRequest)return;
    $('found').textContent=rows.length;
    $('session-list').innerHTML=rows.length?rows.map(sessionCard).join(''):'<p>Бұл сүзгіге сәйкес сеанс жоқ. Күнін немесе басқа шартты таңда.</p>';
    document.querySelectorAll('[data-buy]').forEach(b=>b.addEventListener('click',()=>openSeats(Number(b.dataset.buy))));
  }catch(err){if(n!==activeRequest)return;$('session-list').innerHTML='<p>Сеанстар жүктелмеді.</p>';message(err.message);}
}
async function loadMovies(){
  try{
   const data=await api('/api/movies');$('movie-list').innerHTML=data.map(m=>`<div class="movie"><span class="tag">${safe(m.genre_name)}</span><h3>${safe(m.title)}</h3><p>${safe(m.description)}</p><strong>★ ${m.rating}</strong><span class="muted"> · ${m.duration_min} минут · ${m.release_year} жыл</span></div>`).join('');
  }catch(err){message(err.message);}
}
async function loadReport(){
  try{
    const data=await api('/api/report');
    $('stats').innerHTML=[['Фильм саны',data.counts.movies],['Сеанс саны',data.counts.sessions],['Сатылған билеттер',data.totals.ticket_count],['Демо түсім',fmt(data.totals.revenue)]].map(x=>`<div class="stat"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('');
    $('report-table').innerHTML=data.movies.map(m=>`<tr><td>${safe(m.title)}</td><td>${m.ticket_count}</td><td>${fmt(m.revenue)}</td></tr>`).join('');
  }catch(err){message(err.message);}
}
async function openSeats(id){
  try{
    const data=await api(`/api/sessions/${id}/seats`);currentSession=data.session;chosenSeat=null;
    $('dialog-title').textContent=data.session.title;
    $('dialog-date').textContent=`${dateText(data.session.start_at)} · ${timeText(data.session.start_at)} · ${data.session.hall_name}`;
    const sold=new Set(data.soldSeats);
    $('seat-list').innerHTML=Array.from({length:data.session.capacity},(_,i)=>{
      const number=i+1;return `<button type="button" class="seat ${sold.has(number)?'sold':''}" data-seat="${number}" ${sold.has(number)?'disabled':''}>${number}</button>`;
    }).join('');
    document.querySelectorAll('[data-seat]').forEach(b=>b.addEventListener('click',()=>{
      document.querySelectorAll('.seat.selected').forEach(x=>x.classList.remove('selected'));
      b.classList.add('selected');chosenSeat=Number(b.dataset.seat);
      $('chosen-seat').textContent=chosenSeat;$('ticket-price').textContent=fmt(currentSession.price);
    }));
    $('receipt').classList.add('hidden');$('ticket-form').classList.remove('hidden');
    $('chosen-seat').textContent='—';$('ticket-price').textContent=fmt(data.session.price);
    $('dialog').classList.remove('hidden');
  }catch(err){message(err.message);}
}
function closeDialog(){$('dialog').classList.add('hidden');currentSession=null;chosenSeat=null;}
async function book(e){
  e.preventDefault();if(!chosenSeat||!currentSession)return alert('Алдымен бос орын таңдаңыз');
  const payload={sessionId:currentSession.session_id,seatNumber:chosenSeat,
    fullName:$('full-name').value.trim(),email:$('email').value.trim()};
  try{
    const result=await api('/api/tickets',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    $('ticket-form').classList.add('hidden');
    $('receipt').innerHTML=`<strong>Билет №${result.ticketId} сақталды ✓</strong><p>${safe(result.fullName)} · ${result.seatNumber} орын · ${fmt(result.price)}</p><p>Нақты ақша алынған жоқ. Билет SQL Server деректер қорында сақталды.</p>`;
    $('receipt').classList.remove('hidden');loadSessions();
  }catch(err){alert(err.message);if(err.message.includes('сатылып'))openSeats(currentSession.session_id);}
}
let timeout;
document.addEventListener('DOMContentLoaded',async()=>{
  document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>page(b.dataset.tab)));
  for(const id of ['date','genre','hall','sort'])$(id).addEventListener('change',loadSessions);
  $('search').addEventListener('input',()=>{clearTimeout(timeout);timeout=setTimeout(loadSessions,250)});
  $('reset').addEventListener('click',()=>{for(const id of ['search','date','genre','hall'])$(id).value='';$('sort').value='time_asc';loadSessions()});
  $('close').addEventListener('click',closeDialog);$('shade').addEventListener('click',closeDialog);
  $('ticket-form').addEventListener('submit',book);
  await loadMetadata();await loadSessions();
});
