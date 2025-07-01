const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
require('dotenv').config();
const router = express.Router();
const { authMiddleware } = require('../middleware/authmiddleware');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('La clé secrète JWT est manquante dans le fichier .env');
  process.exit(1);
}

const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'taskflow'
});

router.post('/login', async (req, res) => {
  const { email, password, stayConnected } = req.body;
  console.log('Requête login reçue:', { email, stayConnected });
  if (!email || !password) {
    console.error('Erreur: Email ou mot de passe manquant');
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  try {
    const [users] = await connection.execute('SELECT id, email, password, role, team_id FROM users WHERE email = ?', [email]);
    console.log('Résultat de la requête users:', users);
    if (!users.length) {
      console.error('Erreur login: Identifiants incorrects pour', email);
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.error('Erreur login: Mot de passe incorrect pour', email);
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, team_id: user.team_id },
      JWT_SECRET,
      { expiresIn: stayConnected ? '7d' : '2h' }
    );
    console.log('Token généré:', { id: user.id, email: user.email, role: user.role, team_id: user.team_id, expiresIn: stayConnected ? '7d' : '2h' });

    res.json({
      token,
      role: user.role,
      team_id: user.team_id,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Erreur login:', error.message);
    res.status(500).json({ error: 'Erreur serveur lors de la connexion' });
  }
});

router.get('/verify', authMiddleware, (req, res) => {
  console.log('Requête verify:', { role: req.user_role, userId: req.user_id, team_id: req.user_team_id });
  res.json({ role: req.user_role, userId: req.user_id, team_id: req.user_team_id });
});

module.exports = router;