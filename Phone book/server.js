// server.js
// frontend → REST API → sqlite DB + файловая система\
// Подключения модулей и подготовка директорий
const express = require('express');				// веб-фреймворк
const bodyParser = require('body-parser');		// парсинг JSON/form
const sqlite3 = require('sqlite3').verbose();	// БД
const multer = require('multer');				// multipart/form-data для файлов
const path = require('path');					// файловая система
const fs = require('fs');						
const bcrypt = require('bcrypt');				// хеш паролей
const session = require('express-session');		// Сессии

const UPLOAD_DIR = path.join(__dirname, 'uploads');			// Сохранение загруженных файлов
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({									// Включает серверную сессию
  secret: 'replace_with_a_strong_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24*60*60*1000 }
}));

// статические файлы (клиент)
app.use(express.static(path.join(__dirname, 'public')));

// БД
const DB_FILE = path.join(__dirname, 'notebook.db');
const db = new sqlite3.Database(DB_FILE);

// Инициализация (если таблиц нет — создаём)
const initSql = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  text TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS note_tags (
  note_id INTEGER,
  tag_id INTEGER,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT,
  mime TEXT,
  size INTEGER,
  path TEXT NOT NULL,
  FOREIGN KEY(note_id) REFERENCES notes(id) ON DELETE CASCADE
);
`;
db.exec(initSql, (err) => {								// Создание базы данных и таблицы
  if (err) console.error('DB init error', err);
  else console.log('DB initialized');
});

const storage = multer.diskStorage({				// Сохранение файлов в UPLOAD_DIR
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {										// Имя файла генерируется как timestamp + случайное число + оригинальное расширение
    const unique = Date.now() + '-' + Math.floor(Math.random()*1e6);	// чтобы не было одинаковых имён файлов
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  }
});
const upload = multer({ storage });

//  Проверка авторизации
function ensureAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  res.status(401).json({ error: 'Unauthorized' });
}

// Роуты - регистрация, вход, выход, me
app.post('/api/register', async (req, res) => {																// получает имя, пароль из req.body.
  const { username, password } = req.body;																	// Хеширует пароль.
  if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });		// пытается сохранить в users.
  try {																										// При успехе создаёт сессию req.session.userId = this.lastID
    const hash = await bcrypt.hash(password, 10);															// и возвращает {success: true, userId}. 
    db.run(`INSERT INTO users (username, password_hash) VALUES (?, ?)`, [username, hash], function(err) {	// Если имя уже занято — возвращает ошибку.
      if (err) {
        if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'User exists' });
        return res.status(500).json({ error: 'DB error' });
      }
      req.session.userId = this.lastID;
      res.json({ success: true, userId: this.lastID });
    });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', (req, res) => {																		// получает {username,password}.
  const { username, password } = req.body;																	// Сначала ищет пользователя в БД.
  db.get(`SELECT id, password_hash FROM users WHERE username = ?`, [username], async (err, row) => {		// Если найден — bcrypt.compare(password, hash) для проверки. 
    if (err) return res.status(500).json({ error: 'DB error' });											// При успехе сохраняет req.session.userId = row.id.
    if (!row) return res.status(400).json({ error: 'Invalid username or password' });
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(400).json({ error: 'Invalid username or password' });
    req.session.userId = row.id;
    res.json({ success: true, userId: row.id });
  });
});

app.post('/api/logout', (req, res) => {																		// удаляет сессию
  req.session.destroy(() => res.json({ success: true }));
});

app.get('/api/me', (req, res) => {																			// если в сессии есть userId, возвращает user: { id, username },
  if (req.session && req.session.userId) {																	// иначе user: null. Клиент использует это, 
    db.get(`SELECT id, username FROM users WHERE id = ?`, [req.session.userId], (err, row) => {				// чтобы понять, залогинен ли пользователь.
      if (err || !row) return res.json({ user: null });
      res.json({ user: row });
    });
  } else res.json({ user: null });
});

// Создание заметок( текст+файл+метки )
app.post('/api/notes', ensureAuth, upload.array('files'), (req, res) => {													// Берём userId и т д из сессии,
  const userId = req.session.userId;																						// вставляем запись в notes  в БД
  const title = req.body.title || '';																						// this.lastID - id новой метки
  const text = req.body.text || '';																							// в функции insertTag проверяем есть ли метка
  let tags = [];																											// если нет то вставляем
  if (req.body.tags) {																										// добавляем всё в files
    if (Array.isArray(req.body.tags)) tags = req.body.tags.flatMap(t => t.split(',').map(x => x.trim()).filter(Boolean));
    else tags = req.body.tags.split(',').map(x => x.trim()).filter(Boolean);
  }

  if (!title) return res.status(400).json({ error: 'Title required' });

  db.run(`INSERT INTO notes (user_id, title, text) VALUES (?, ?, ?)`, [userId, title, text], function(err) {
    if (err) return res.status(500).json({ error: 'DB error while creating note' });
    const noteId = this.lastID;

    const insertTag = (tagName, cb) => {
      tagName = tagName.trim();
      if (!tagName) return cb();
      db.get(`SELECT id FROM tags WHERE name = ?`, [tagName], (err, row) => {
        if (err) return cb(err);
        if (row) return cb(null, row.id);
        db.run(`INSERT INTO tags (name) VALUES (?)`, [tagName], function(err2) {
          if (err2) return cb(err2);
          cb(null, this.lastID);
        });
      });
    };

    (async function handleTags() {
      for (let t of tags) {
        await new Promise((resolve, reject) => {
          insertTag(t, (err, tagId) => {
            if (err) return reject(err);
            if (!tagId) return resolve();
            db.run(`INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)`, [noteId, tagId], (e) => {
              if (e) return reject(e);
              resolve();
            });
          });
        });
      }
    })().then(() => {

      const files = req.files || [];
      const stmt = db.prepare(`INSERT INTO files (note_id, filename, original_name, mime, size, path) VALUES (?, ?, ?, ?, ?, ?)`);
      for (let f of files) {
        stmt.run([noteId, f.filename, f.originalname, f.mimetype, f.size, f.path]);
      }
      stmt.finalize(err => {
        if (err) console.error('file insert err', err);
        res.json({ success: true, noteId });
      });
    }).catch(err => {
      console.error(err);
      res.status(500).json({ error: 'Error handling tags/files' });
    });
  });
});

// Получение заметок и поиск
app.get('/api/notes', ensureAuth, (req, res) => {
  const userId = req.session.userId;
  const tag = req.query.tag;
  const q = req.query.q;
  const type = req.query.type;

  if (tag) {															// Поиск по метке
    const sql = `
      SELECT n.id, n.title, n.text, n.created_at
      FROM notes n
      JOIN note_tags nt ON nt.note_id = n.id
      JOIN tags t ON t.id = nt.tag_id
      WHERE n.user_id = ? AND t.name = ?
      ORDER BY n.created_at DESC
    `;
    db.all(sql, [userId, tag], (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ notes: rows });
    });
    return;
  }

  if (q && (type === 'title' || type === 'text')) {						// поиск по LIKE
    const col = type === 'title' ? 'title' : 'text';
    const sql = `SELECT id, title, text, created_at FROM notes WHERE user_id = ? AND ${col} LIKE ? ORDER BY created_at DESC`;
    db.all(sql, [userId, `%${q}%`], (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ notes: rows });
    });
    return;
  }
																		// поиск по всем
  db.all(`SELECT id, title, text, created_at FROM notes WHERE user_id = ? ORDER BY created_at DESC`, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ notes: rows });
  });
});

// Получение полной заметки
app.get('/api/notes/:id', ensureAuth, (req, res) => {																				//Возвращает саму метку, метку, файлы
  const noteId = req.params.id;																										// по нажатию "Открыть"
  const userId = req.session.userId;
  db.get(`SELECT id, title, text, created_at FROM notes WHERE id = ? AND user_id = ?`, [noteId, userId], (err, note) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!note) return res.status(404).json({ error: 'Not found' });

    db.all(`SELECT t.name FROM tags t JOIN note_tags nt ON nt.tag_id = t.id WHERE nt.note_id = ?`, [noteId], (err2, tags) => {
      if (err2) return res.status(500).json({ error: 'DB error' });
      db.all(`SELECT id, original_name, size, mime FROM files WHERE note_id = ?`, [noteId], (err3, files) => {
        if (err3) return res.status(500).json({ error: 'DB error' });
        res.json({ note, tags: tags.map(r => r.name), files });
      });
    });
  });
});

// Скачка файла
app.get('/api/files/:id/download', ensureAuth, (req, res) => {																				// Проверяет пользователя
  const fileId = req.params.id;																												// Отправляет файл с именем пользователя
  const userId = req.session.userId;
  db.get(`SELECT f.path, f.original_name, n.user_id FROM files f JOIN notes n ON n.id = f.note_id WHERE f.id = ?`, [fileId], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!row) return res.status(404).json({ error: 'File not found' });
    if (row.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });
    res.download(row.path, row.original_name);
  });
});

// Теги для подсказок
app.get('/api/tags', ensureAuth, (req, res) => {										// возвращает все метки в системе, сортированные по имени
  db.all(`SELECT name FROM tags ORDER BY name`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ tags: rows.map(r => r.name) });
  });
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
