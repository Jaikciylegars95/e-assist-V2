const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');  // Utiliser mysql2 avec promesses
require('dotenv').config();  // Charger les variables d'environnement
const router = express.Router();

// Vérifier que la clé secrète JWT est définie
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('La clé secrète JWT est manquante dans le fichier .env');
  process.exit(1); // Arrêter le serveur si la clé secrète n'est pas définie
}

// Connexion à la base de données avec mysql2 (promesses)
const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'taskflow'
});

// Route de connexion
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Vérifier si l'email existe dans la base de données
    const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }

    const user = rows[0];

    // Comparer le mot de passe avec le hachage stocké dans la base de données
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }

    // Générer un token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    // Répondre avec le token et les informations de l'utilisateur
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Erreur serveur :', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
