const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const verifyToken = require('../middleware/authMiddleware'); // <-- importe ton middleware d'auth
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Créer le pool de connexions MySQL
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'taskflow',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Route GET /api/tasks avec authentification
app.get('/api/tasks', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, title, created_at, due_date FROM tasks');
    res.json(rows);
  } catch (error) {
    console.error('Erreur SQL:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
