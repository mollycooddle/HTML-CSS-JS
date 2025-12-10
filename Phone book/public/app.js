// public/app.js
let currentUser = null;										// пользователь
const $ = id => document.getElementById(id);

async function api(path, options = {}) {												// обёртка над fetch, которая всегда посылает куки
  const res = await fetch(path, { credentials: 'same-origin', ...options });			// парсит json и возвращает объект(чтобы не падать при получении не json файла)
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res;
}

async function init() {												// привязка обрааботчиков событий(вход/регистрация/выход)
  $('loginBtn').onclick = async () => {								// при клике делается Post api/login и затем loadMe. Логинит пользователя
    const username = $('username').value;
    const password = $('password').value;
    const r = await api('/api/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({username, password}) });
    if (r.error) {$('authMsg').innerText = r.error; return;}
    $('authMsg').innerText = 'Вход успешен';
    await loadMe();
  };
  $('registerBtn').onclick = async () => {							// при клике делается Post api/register и затем loadMe. Логинит пользователя
    const username = $('username').value;
    const password = $('password').value;
    const r = await api('/api/register', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({username, password}) });
    if (r.error) {$('authMsg').innerText = r.error; return;}
    $('authMsg').innerText = 'Регистрация успешна';
    await loadMe();
  };
  $('logoutBtn').onclick = async () => {							// при клике делается Post api/logout и затем renderAuth. Незалогиненное состояние
    await api('/api/logout', { method: 'POST' });
    currentUser = null;
    renderAuth();
  };

  $('modeCreate').onclick = () => { showSection('createSection'); };		// переключение видимых секций кнопками
  $('modeSearch').onclick = () => { showSection('searchSection'); };

  const tagsSet = new Set();												// Добавление меток(всё локально, отправлены на сервер будут только по кнопке)
  $('addTagBtn').onclick = () => {											// выражение разбивается по запятым и добавляется в Set
    const t = $('tagsInput').value.trim();									// Затем RenderTags обновляет метки
    if (!t) return;
    t.split(',').map(x=>x.trim()).filter(Boolean).forEach(x => tagsSet.add(x));
    renderTags();
    $('tagsInput').value = '';
  };
  
  function renderTags() {													//рендер меток
    $('tagsList').innerText = Array.from(tagsSet).join(', ');
  }
  
  $('noteForm').onsubmit = async (ev) => {																// Отправляем форму. Создаём FormData, чтобы были правильные заголовки
    ev.preventDefault();																				// и чтобы вложить файлы.
    const fd = new FormData();																			// Браузер всё отправляет и всё записывается в файлы и uploads
    fd.append('title', $('title').value);																
    fd.append('text', $('text').value);																	
    if (tagsSet.size) fd.append('tags', Array.from(tagsSet).join(','));									
    const files = $('files').files;
    for (let f of files) fd.append('files', f);
    const res = await fetch('/api/notes', { method: 'POST', credentials: 'same-origin', body: fd });
    const json = await res.json();
    if (json.error) $('createMsg').innerText = json.error;
    else {
      $('createMsg').innerText = 'Запись сохранена';
      $('title').value=''; $('text').value=''; $('files').value=null; tagsSet.clear(); renderTags();
      await listAll();
    }
  };

  $('searchByTag').onclick = async () => {											// Поиск.
    const tag = $('searchTag').value.trim();										// Кнопки формируют get запросы с соответствующими query параметрами
    if (!tag) return;																// массив записей передаётся в renderNotes
    const r = await api(`/api/notes?tag=${encodeURIComponent(tag)}`);
    renderNotes(r.notes || []);
  };
  $('searchByTitle').onclick = async () => {
    const q = $('searchTitle').value.trim();
    if (!q) return;
    const r = await api(`/api/notes?q=${encodeURIComponent(q)}&type=title`);
    renderNotes(r.notes || []);
  };
  $('searchByText').onclick = async () => {
    const q = $('searchText').value.trim();
    if (!q) return;
    const r = await api(`/api/notes?q=${encodeURIComponent(q)}&type=text`);
    renderNotes(r.notes || []);
  };
  $('listAll').onclick = listAll;													// просто открывает listAll. Возвращает все заметки текущего пользователя.

  await loadMe();
}

function showSection(id) {
  ['createSection','searchSection'].forEach(s => $(s).classList.add('hidden'));
  $(id).classList.remove('hidden');
}

async function loadMe() {															// вызывает GET api/me если юзер есть то ок, иначе renderAuth
  const r = await api('/api/me');
  currentUser = r.user;
  renderAuth();
  await listAll();
}

function renderAuth() {
  if (currentUser) {
    $('welcome').innerText = `Пользователь: ${currentUser.username}`;
    $('authForms').style.display = 'none';
    $('userArea').style.display = 'block';
    $('modeCreate').disabled = false;
    $('modeSearch').disabled = false;
  } else {
    $('welcome').innerText = '';
    $('authForms').style.display = 'block';
    $('userArea').style.display = 'none';
    $('modeCreate').disabled = true;
    $('modeSearch').disabled = true;
    showSection('searchSection');
  }
}

async function listAll() {
  if (!currentUser) { $('results').innerText = 'Войдите чтобы видеть записи.'; return; }
  const r = await api('/api/notes');
  renderNotes(r.notes || []);
}

function renderNotes(notes) {																				// рендер заметок
  const container = $('results');																			// при клике на открыть делает GET api/notes/:id, затем в блок details
  container.innerHTML = '';																					// вставляет текст, метки, ссылки на файлы
  if (!notes.length) { container.innerText = 'Ничего не найдено'; return; }									// браузер сделает запрос к серверу и начнёт загрузку
  notes.forEach(n => {																						// 
    const div = document.createElement('div');
    div.className = 'note';
    div.innerHTML = `<strong>${escapeHtml(n.title)}</strong> <em style="float:right">${n.created_at}</em>
      <div style="margin-top:8px">${escapeHtml(n.text ? n.text.substring(0,400) : '')}${n.text && n.text.length>400 ? '...' : ''}</div>
      <div style="margin-top:8px">
        <button data-id="${n.id}" class="viewBtn">Открыть</button>
      </div>
      <div class="details" id="detail-${n.id}"></div>
    `;
    container.appendChild(div);
    div.querySelector('.viewBtn').onclick = async () => {
      const detail = $(`detail-${n.id}`);
      if (detail.innerHTML) { detail.innerHTML = ''; return; } // toggle
      detail.innerHTML = 'Загрузка...';
      const r = await api(`/api/notes/${n.id}`);
      if (r.error) { detail.innerText = r.error; return; }
      const tags = (r.tags || []).join(', ');
      const filesHtml = (r.files || []).map(f => `<a href="/api/files/${f.id}/download">${escapeHtml(f.original_name)}</a>`).join('');
      detail.innerHTML = `<div><strong>Текст:</strong><div>${nl2br(escapeHtml(r.note.text || ''))}</div></div>
        <div class="tags"><strong>Метки:</strong> ${escapeHtml(tags)}</div>
        <div class="files"><strong>Файлы:</strong> ${filesHtml || 'нет'}</div>`;
    };
  });
}

function escapeHtml(s){ if(!s) return ''; return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }	// Экранизация ввода
function nl2br(s){ return s.replace(/\n/g, '<br>'); }																								// заменяет \n на <br>

window.addEventListener('DOMContentLoaded', init);				//осле загрузки DOM вызывается init, который привязывает все обработчики и запускает loadMe
