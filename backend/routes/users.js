const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const router = express.Router();
const { authMiddleware, restrictToTeamLeader } = require('../middleware/authmiddleware');

const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'taskflow',
});

// POST /api/users/check-email - vérifier la disponibilité de l'email
router.post('/check-email', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'L\'email est requis' });
  }

  try {
    const [users] = await connection.execute('SELECT id, email FROM users WHERE LOWER(email) = ?', [email.toLowerCase()]);
    if (users.length > 0) {
      console.log('Email trouvé:', users[0].email);
      return res.json({ available: false });
    }
    res.json({ available: true });
  } catch (error) {
    console.error('Erreur POST /users/check-email:', error.message, error.code);
    res.status(500).json({ message: 'Erreur serveur lors de la vérification de l\'email' });
  }
});

// POST /api/users - créer un nouvel utilisateur
router.post('/', async (req, res) => {
  const { email, password, nom, prenom, dateNaissance, poste, dateEmbauche, role, team_id } = req.body;

  if (!email || !password || !nom || !prenom) {
    return res.status(400).json({ message: 'Les champs email, mot de passe, nom et prénom sont requis' });
  }

  try {
    // Validate team_id if provided
    if (team_id) {
      try {
        const [teams] = await connection.execute('SELECT id FROM teams WHERE id = ?', [parseInt(team_id)]);
        if (teams.length === 0) {
          return res.status(400).json({ message: 'L\'ID de l\'équipe est invalide' });
        }
      } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
          return res.status(500).json({ message: 'Tableau teams non trouvé dans la base de données. Veuillez créer la table teams.' });
        }
        throw error;
      }
    }

    // Check for existing email
    const [existingUsers] = await connection.execute('SELECT email FROM users WHERE LOWER(email) = ?', [email.toLowerCase()]);
    if (existingUsers.length > 0) {
      console.log('Tentative d\'inscription avec email existant:', { provided: email, found: existingUsers[0].email });
      return res.status(409).json({ message: 'Email déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await connection.execute(
      'INSERT INTO users (email, password, nom, prenom, dateNaissance, poste, dateEmbauche, role, team_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        email.toLowerCase(),
        hashedPassword,
        nom,
        prenom,
        dateNaissance || null,
        poste || null,
        dateEmbauche || null,
        role || 'user',
        team_id ? parseInt(team_id) : null,
      ]
    );
    console.log('Utilisateur créé:', { id: result.insertId, email: email.toLowerCase(), nom, prenom });
    res.status(201).json({ message: 'Utilisateur créé', userId: result.insertId });
  } catch (error) {
    console.error('Erreur POST /users:', error.message, error.code, error.sqlMessage);
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.sqlMessage.includes('users.PRIMARY')) {
        console.log('ER_DUP_ENTRY détecté pour la clé primaire:', { id: error.sqlMessage.match(/'(\d+)'/)[1] });
        return res.status(500).json({ message: 'Erreur serveur : impossible de générer un nouvel ID utilisateur. Contactez l\'administrateur.' });
      }
      if (error.sqlMessage.includes('users.email')) {
        console.log('ER_DUP_ENTRY détecté pour email:', email);
        return res.status(409).json({ message: 'Email déjà utilisé' });
      }
    }
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ message: 'Tableau users non trouvé dans la base de données' });
    }
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({ message: 'Colonne invalide dans la table users' });
    }
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/users - récupérer la liste des utilisateurs sans les mots de passe (réservé aux chefs d'équipe)
router.get('/', authMiddleware, restrictToTeamLeader, async (req, res) => {
  try {
    const [users] = await connection.execute(
      'SELECT id, email, nom, prenom, profilePicture FROM users WHERE role != "team_leader"'
    );
    console.log('Utilisateurs récupérés:', users);
    res.json(
      users.map((user) => ({
        ...user,
        profilePicture: user.profilePicture || 'https://via.placeholder.com/50',
      }))
    );
  } catch (error) {
    console.error('Erreur GET /users:', error.message, error.code);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ message: 'Tableau users non trouvé dans la base de données' });
    }
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({ message: 'Colonne invalide dans la table users' });
    }
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// GET /api/users/:id - récupérer un utilisateur par ID (sans mot de passe)
router.get('/:id', authMiddleware, async (req, res) => {
  const userId = req.params.id;
  try {
    console.log('Requête GET /users/:id:', { id: userId, userIdFromToken: req.user_id });
    const [users] = await connection.execute(
      'SELECT id, email, nom, prenom, profilePicture FROM users WHERE id = ?',
      [userId]
    );
    if (!users.length) {
      console.error('Utilisateur non trouvé:', { id: userId });
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    console.log('Utilisateur récupéré:', users[0]);
    res.json({
      ...users[0],
      profilePicture: users[0].profilePicture || 'https://via.placeholder.com/50',
    });
  } catch (error) {
    console.error('Erreur GET /users/:id:', error.message, error.code);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ message: 'Tableau users non trouvé dans la base de données' });
    }
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({ message: 'Colonne invalide dans la table users' });
    }
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PATCH /api/users/:userId - mettre à jour le profil de l'utilisateur
router.patch('/:userId', authMiddleware, async (req, res) => {
  const userId = req.params.userId;
  const { email, nom, prenom, profilePicture } = req.body;

  if (req.user_id !== parseInt(userId)) {
    return res.status(403).json({ message: 'Accès non autorisé' });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Email invalide' });
  }

  try {
    const [existingUsers] = await connection.execute('SELECT email FROM users WHERE LOWER(email) = ? AND id != ?', [email.toLowerCase(), userId]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Email déjà utilisé par un autre utilisateur' });
    }

    const [result] = await connection.execute(
      'UPDATE users SET email = ?, nom = ?, prenom = ?, profilePicture = ? WHERE id = ?',
      [email.toLowerCase(), nom || null, prenom || null, profilePicture || null, userId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    console.log('Profil mis à jour:', { id: userId });
    res.json({ message: 'Profil mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur PATCH /users/:userId:', error.message, error.code);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ message: 'Tableau users non trouvé dans la base de données' });
    }
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({ message: 'Colonne invalide dans la table users' });
    }
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST /api/users/change-password - changer le mot de passe de l'utilisateur
router.post('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user_id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' });
  }

  try {
    const [users] = await connection.execute('SELECT password FROM users WHERE id = ?', [userId]);
    if (!users.length) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    const [result] = await connection.execute('UPDATE users SET password = ? WHERE id = ?', [
      hashedNewPassword,
      userId,
    ]);
    if (result.affectedRows === 0) {
      return res.status(500).json({ error: 'Échec de la mise à jour du mot de passe' });
    }
    console.log('Mot de passe mis à jour:', { id: userId });
    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur POST /users/change-password:', error.message, error.code);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ error: 'Tableau users non trouvé dans la base de données' });
    }
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({ error: 'Colonne invalide dans la table users' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/users/tasks - permettre aux utilisateurs de créer des tâches
router.post('/tasks', authMiddleware, async (req, res) => {
  const { user_id, status } = req.body;
  console.log('Requête POST /users/tasks:', { user_id, status, userId: req.user_id });

  if (!user_id || !status) {
    console.error('Erreur: Champs requis manquants', { user_id, status });
    return res.status(400).json({ message: 'User ID et statut sont requis' });
  }
  if (parseInt(user_id) !== req.user_id) {
    console.error('Erreur: user_id non autorisé', { user_id, userId: req.user_id });
    return res.status(403).json({ message: 'Vous ne pouvez créer des tâches que pour vous-même' });
  }

  try {
    const [result] = await connection.execute('INSERT INTO tasks (user_id, status) VALUES (?, ?)', [
      user_id,
      status,
    ]);
    console.log('Tâche ajoutée:', { id: result.insertId, user_id, status });
    req.io.emit('taskAdded', { id: result.insertId, user_id, status });
    res.status(201).json({ message: 'Tâche créée', taskId: result.insertId });
  } catch (error) {
    console.error('Erreur POST /users/tasks:', error.message, error.code);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ message: 'Tableau tasks non trouvé' });
    }
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({ message: 'Colonne invalide dans la table tasks' });
    }
    res.status(500).json({ message: "Erreur serveur lors de l'ajout de la tâche" });
  }
});

module.exports = router;