'use strict';
const $ = id => document.getElementById(id);
const form = $('movie-form');
let movies = [], editId = null, deleteId = null, busy = false;
const safe = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw Error([data.error, ...(data.details || [])].filter(Boolean).join('. '));
  return data;
}
function notice(text, success = false) {
  $('notice').textContent = text;
  $('notice').className = `message${success ? ' ok' : ''}`;
}
function lock(value) {
  busy = value;
  document.querySelectorAll('button').forEach(button => { button.disabled = value; });
}
function reset() {
  editId = null; form.reset(); $('editor-title').textContent = 'Жаңа фильм';
  $('save').textContent = 'Фильмді қосу'; $('cancel').classList.add('hidden');
}
function render() {
  const term = $('catalog-search').value.trim().toLocaleLowerCase('kk');
  const visible = movies.filter(movie => movie.title.toLocaleLowerCase('kk').includes(term));
  $('count').textContent = `${visible.length} / ${movies.length} фильм`;
  $('catalog-list').innerHTML = visible.length ? visible.map(movie => `<article class="catalog-film">
    <span class="tag">${safe(movie.genre_name)}</span> <span class="tag">${movie.age_rating}+</span>
    <h3>${safe(movie.title)}</h3><p class="muted">${safe(movie.description)}</p>
    <p class="muted">${movie.release_year} · ${movie.duration_min} минут · ★ ${movie.rating}</p>
    <div class="film-actions"><button type="button" data-edit="${movie.movie_id}">Өзгерту</button><button type="button" class="delete" data-delete="${movie.movie_id}">Жою</button></div></article>`).join('') : '<p class="muted">Фильм табылмады.</p>';
  $('catalog-list').querySelectorAll('button').forEach(button => { button.disabled = busy; });
}
async function reload() { movies = await api('/api/movies'); render(); }
$('catalog-search').addEventListener('input', render);
$('cancel').addEventListener('click', reset);
$('catalog-list').addEventListener('click', async event => {
  const button = event.target.closest('button');
  if (!button || busy) return;
  if (button.dataset.edit) {
    lock(true);
    try {
      const movie = await api(`/api/movies/${button.dataset.edit}`);
      editId = movie.movie_id;
      for (const field of form.elements) if (field.name && movie[field.name] !== undefined) field.value = movie[field.name];
      $('editor-title').textContent = 'Фильмді өзгерту'; $('save').textContent = 'Өзгерістерді сақтау';
      $('cancel').classList.remove('hidden'); form.elements.title.focus();
    } catch (error) { notice(error.message); } finally { lock(false); }
  }
  if (button.dataset.delete) {
    deleteId = Number(button.dataset.delete);
    $('delete-title').textContent = `«${movies.find(movie => movie.movie_id === deleteId).title}» фильмін жою керек пе?`;
    $('delete-dialog').showModal();
  }
});
form.addEventListener('submit', async event => {
  event.preventDefault(); if (busy) return;
  const data = Object.fromEntries(new FormData(form));
  for (const key of ['genre_id','duration_min','age_rating','release_year','rating']) data[key] = Number(data[key]);
  lock(true);
  try {
    const updating = editId !== null;
    await api(`/api/movies${updating ? `/${editId}` : ''}`, { method: updating ? 'PUT' : 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
    reset(); await reload(); notice(updating ? 'Фильм мәліметтері жаңартылды.' : 'Фильм каталогқа қосылды.', true);
  } catch (error) { notice(error.message); } finally { lock(false); }
});
$('keep').addEventListener('click', () => $('delete-dialog').close());
$('delete-confirm').addEventListener('click', async () => {
  if (busy || !deleteId) return;
  const id = deleteId; lock(true);
  try {
    await api(`/api/movies/${id}`, { method:'DELETE' });
    if (editId === id) reset();
    await reload(); notice('Фильм каталогтан жойылды.', true);
  } catch (error) { notice(error.message); } finally { $('delete-dialog').close(); deleteId = null; lock(false); }
});
(async () => {
  try {
    const metadata = await api('/api/metadata');
    $('genres').innerHTML = metadata.genres.map(genre => `<option value="${genre.genre_id}">${safe(genre.genre_name)}</option>`).join('');
    await reload(); $('save').disabled = !metadata.genres.length;
  } catch (error) { notice(error.message); }
})();
