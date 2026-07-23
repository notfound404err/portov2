import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const SECRET_KEY = "manuk23";
const app = express();

app.use(cors()); 
app.use(express.json()); 

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === 'nyenuk123') {
    const token = jwt.sign({ role: 'admin' }, SECRET_KEY, { expiresIn: '2h' });
    res.json({ success: true, token: token });
  } else {
    res.status(401).json({ success: false, message: 'Sandi salah!' });
  }
});

const autentikasiToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Akses ditolak! Tiket tidak ada.' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Sesi habis atau tiket palsu!' });
    req.user = user;
    next();
  });
};

// Konfigurasi Database yang fleksibel (bisa XAMPP lokal & bisa Online)
const db = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'notfound_db',
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false
});

db.getConnection()
  .then((connection) => {
    console.log('✅ Berhasil terhubung ke database MySQL!');
    connection.release();
  })
  .catch((err) => {
    console.error('❌ Gagal terhubung ke database:', err.message);
  });

app.get('/api/projects', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM projects ORDER BY created_at DESC');
    const projects = rows.map(item => ({
      ...item,
      tools: item.tools ? item.tools.split(',').map(t => t.trim()) : []
    }));
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data project', error: error.message });
  }
});

app.post('/api/projects', autentikasiToken, async (req, res) => {
  try {
    const { title, description, repository_url, tools } = req.body;
    const toolsString = Array.isArray(tools) ? tools.join(', ') : tools;
    const query = 'INSERT INTO projects (title, description, repository_url, tools) VALUES (?, ?, ?, ?)';
    const [result] = await db.query(query, [title, description, repository_url, toolsString]);
    res.status(201).json({ message: 'Project berhasil ditambahkan!', data: { id: result.insertId, title, description, repository_url, tools } });
  } catch (error) {
    res.status(400).json({ message: 'Gagal menyimpan project', error: error.message });
  }
});

app.delete('/api/projects/:id', autentikasiToken, async (req, res) => {
  try {
    const projectId = req.params.id;
    await db.query('DELETE FROM projects WHERE id = ?', [projectId]);
    res.json({ message: '✅ Project berhasil dihapus!' });
  } catch (error) {
    res.status(500).json({ message: '❌ Gagal menghapus project', error: error.message });
  }
});

app.put('/api/projects/:id', autentikasiToken, async (req, res) => {
  try {
    const projectId = req.params.id;
    const { title, description, repository_url, tools } = req.body;
    const toolsString = Array.isArray(tools) ? tools.join(', ') : tools;
    const query = 'UPDATE projects SET title = ?, description = ?, repository_url = ?, tools = ? WHERE id = ?';
    await db.query(query, [title, description, repository_url, toolsString, projectId]);
    res.json({ message: 'Project berhasil diperbarui!' });
  } catch (error) {
    res.status(500).json({ message: '❌ Gagal mengupdate project', error: error.message });
  }
});

app.post('/api/visit', async (req, res) => {
  try {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    await db.query('INSERT INTO page_views (user_agent) VALUES (?)', [userAgent]);
    res.status(200).json({ message: 'Kunjungan tercatat' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const [projects] = await db.query('SELECT COUNT(*) as total_projects FROM projects');
    const [visits] = await db.query('SELECT COUNT(*) as total_visits FROM page_views');
    res.json({ total_projects: projects[0].total_projects, total_visits: visits[0].total_visits });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('Server Backend MySQL untuk Admin Dashboard Aktif!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server berjalan di port ${port}`);
});