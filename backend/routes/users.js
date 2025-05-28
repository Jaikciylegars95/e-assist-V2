const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const verifyToken = require('../middleware/authmiddleware');

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

// PATCH /api/users/:userId - mettre à jour le profil de l'utilisateur
router.patch('/:userId', verifyToken, async (req, res) => {
  const connection = req.app.get('db');
  const { userId } = req.params;
  const { email, profilePicture, dateNaissance, dateEmbauche } = req.body;

  if (req.user_id !== parseInt(userId)) { // Changement : user_id au lieu de userId
    return res.status(403).json({ message: 'Accès non autorisé' });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Email invalide' });
  }
  if (profilePicture && !/^https?:\/\/.+$/.test(profilePicture)) {
    return res.status(400).json({ message: 'URL de la photo invalide' });
  }

  try {
    const [result] = await connection.promise().query(
      'UPDATE users SET email = ?, profilePicture = ?, dateNaissance = ?, dateEmbauche = ? WHERE id = ?',
      [email, profilePicture || null, dateNaissance || null, dateEmbauche || null, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({ message: 'Profil mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/users/change-password - changer le mot de passe de l'utilisateur
router.post('/change-password', verifyToken, async (req, res) => {
  const connection = req.app.get('db');
  const { currentPassword, newPassword } = req.body;
  const userId = req.user_id; // Récupéré du middleware (decoded.id)

  // Valider les entrées
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' });
  }

  try {
    // Récupérer l’utilisateur
    const query = 'SELECT password FROM users WHERE id = ?';
    const [results] = await connection.promise().query(query, [userId]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = results[0];

    // Vérifier le mot de passe actuel
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    // Hasher le nouveau mot de passe
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';
    const [updateResult] = await connection.promise().query(updateQuery, [hashedNewPassword, userId]);

    if (updateResult.affectedRows === 0) {
      return res.status(500).json({ error: 'Échec de la mise à jour du mot de passe' });
    }

    return res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
