const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

// POST /api/users - créer un nouvel utilisateur
router.post('/', async (req, res) => {
  const connection = req.app.get('db');
  const { email, password, nom, prenom, dateNaissance, poste, dateEmbauche } = req.body;

  if (!email || !password || !nom || !prenom || !dateNaissance || !poste || !dateEmbauche) {
    return res.status(400).json({ message: 'Tous les champs sont requis' });
  }

  try {
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (email, password, nom, prenom, dateNaissance, poste, dateEmbauche)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    connection.query(
      query,
      [email, hashedPassword, nom, prenom, dateNaissance, poste, dateEmbauche],
      (error, results) => {
        if (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email déjà utilisé' });
          }
          console.error(error);
          return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.status(201).json({ message: 'Utilisateur créé', userId: results.insertId });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


// GET /api/users - récupérer la liste des utilisateurs sans les mots de passe
router.get('/', (req, res) => {
  const connection = req.app.get('db');

  const query = `
    SELECT id, email, nom, prenom, dateNaissance, poste, dateEmbauche 
    FROM users
  `;

  connection.query(query, (error, results) => {
    if (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    res.json(results);
  });
});

// GET /api/users/:id - récupérer un utilisateur par ID (sans mot de passe)
router.get('/:id', (req, res) => {
  const connection = req.app.get('db');
  const userId = req.params.id;

  const query = `
    SELECT id, email, nom, prenom, dateNaissance, poste, dateEmbauche
    FROM users
    WHERE id = ?
  `;

  connection.query(query, [userId], (error, results) => {
    if (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(results[0]);
  });
});

module.exports = router;
