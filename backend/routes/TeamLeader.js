const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { authMiddleware, restrictToTeamLeader } = require('../middleware/authmiddleware');
const { v4: uuidv4 } = require('uuid');

const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'taskflow',
});

// GET /api/TeamLeader/members
router.get('/members', authMiddleware, restrictToTeamLeader, async (req, res) => {
  try {
    console.log('Requête GET /api/TeamLeader/members reçue:', { user_team_id: req.user_team_id });
    if (!req.user_team_id) {
      console.error('Erreur: user_team_id est undefined');
      return res.status(400).json({ error: 'Team ID manquant pour l’utilisateur' });
    }

    const [tables] = await connection.execute("SHOW TABLES LIKE 'users'");
    if (tables.length === 0) {
      console.error('Table users introuvable');
      return res.status(500).json({ error: 'Tableau users non trouvé dans la base de données' });
    }

    const [members] = await connection.execute(
      `SELECT id, nom, prenom, email, role, profilePicture, team_id
       FROM users WHERE team_id = ? AND role != 'team_leader'`,
      [req.user_team_id]
    );
    console.log('Membres récupérés:', members);
    res.status(200).json(members);
  } catch (error) {
    console.error('Erreur GET /api/TeamLeader/members:', {
      message: error.message,
      code: error.code,
      sql: error.sql,
      sqlMessage: error.sqlMessage,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des membres' });
  }
});

// POST /api/TeamLeader/members
router.post('/members', authMiddleware, restrictToTeamLeader, async (req, res) => {
  const { nom, prenom, email, password } = req.body;
  console.log('Requête POST /api/TeamLeader/members reçue:', { nom, prenom, email });

  if (!nom || !email || !password) {
    console.error('Champs requis manquants:', { nom, email, password });
    return res.status(400).json({ error: 'Nom, email et mot de passe sont requis' });
  }

  if (email.trim() === '') {
    console.error('Email vide:', { email });
    return res.status(400).json({ error: 'Email ne peut pas être vide' });
  }

  try {
    await connection.getConnection();
    console.log('Connexion à la base de données réussie');

    if (!req.user_team_id) {
      console.error('Erreur: user_team_id est undefined');
      return res.status(400).json({ error: 'Team ID manquant pour l’utilisateur' });
    }

    const [tables] = await connection.execute("SHOW TABLES LIKE 'users'");
    if (tables.length === 0) {
      console.error('Table users introuvable');
      return res.status(500).json({ error: 'Tableau users non trouvé dans la base de données' });
    }

    const [teamCheck] = await connection.execute('SELECT id FROM teams WHERE id = ?', [req.user_team_id]);
    if (teamCheck.length === 0) {
      console.error('Équipe non trouvée:', { team_id: req.user_team_id });
      return res.status(400).json({ error: 'Équipe non trouvée pour cet utilisateur' });
    }

    console.log('Vérification email:', { email });
    const [existingUser] = await connection.execute('SELECT id, email FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    console.log('Résultat vérification email:', existingUser);
    if (existingUser.length > 0) {
      console.error('Email déjà utilisé:', { email, existing: existingUser[0] });
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }

    console.log('Hachage du mot de passe...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Mot de passe haché avec succès');
    const userId = uuidv4();
    console.log('UUID généré:', userId);

    console.log('Insertion du nouvel utilisateur...');
    await connection.execute(
      `INSERT INTO users (id, nom, prenom, email, password, role, team_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, nom, prenom || null, email.trim().toLowerCase(), hashedPassword, 'user', req.user_team_id]
    );
    console.log('Utilisateur inséré avec succès');

    const [newUser] = await connection.execute(
      `SELECT id, nom, prenom, email, role, profilePicture, team_id
       FROM users WHERE id = ?`,
      [userId]
    );

    console.log('Membre ajouté:', newUser[0]);
    res.status(201).json(newUser[0]);
  } catch (error) {
    console.error('Erreur POST /api/TeamLeader/members:', {
      message: error.message,
      code: error.code,
      sql: error.sql,
      sqlMessage: error.sqlMessage,
      stack: error.stack,
    });
    let errorMessage = 'Erreur serveur lors de l’ajout du membre';
    if (error.code === 'ER_NO_SUCH_TABLE') {
      errorMessage = 'Tableau users ou teams non trouvé dans la base de données';
    } else if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      errorMessage = 'Équipe non valide (team_id incorrect)';
    } else if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'Cet email est déjà utilisé (contrainte base de données)';
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      errorMessage = 'Accès à la base de données refusé';
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      errorMessage = `Colonne invalide dans la requête: ${error.sqlMessage}`;
    }
    res.status(500).json({ error: errorMessage });
  }
});

// DELETE /api/TeamLeader/members/:id
router.delete('/members/:id', authMiddleware, restrictToTeamLeader, async (req, res) => {
  const { id } = req.params;
  console.log('Requête DELETE /api/TeamLeader/members reçue:', { id, user_team_id: req.user_team_id });

  try {
    const [user] = await connection.execute(
      `SELECT id, role FROM users WHERE id = ? AND team_id = ? AND role != 'team_leader'`,
      [id, req.user_team_id]
    );
    if (user.length === 0) {
      console.error('Utilisateur non trouvé ou non autorisé:', { id, team_id: req.user_team_id });
      return res.status(404).json({ error: 'Utilisateur non trouvé ou non autorisé' });
    }

    await connection.execute('DELETE FROM tasks WHERE user_id = ?', [id]);

    const [result] = await connection.execute('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      console.error('Échec de la suppression:', { id });
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    console.log('Membre supprimé:', { id });
    res.status(200).json({ message: 'Membre supprimé avec succès' });
  } catch (error) {
    console.error('Erreur DELETE /api/TeamLeader/members:', {
      message: error.message,
      code: error.code,
      sql: error.sql,
      sqlMessage: error.sqlMessage,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Erreur serveur lors de la suppression du membre' });
  }
});

// GET /api/TeamLeader/tasks
router.get('/tasks', authMiddleware, restrictToTeamLeader, async (req, res) => {
  try {
    console.log('Requête GET /api/TeamLeader/tasks reçue:', { user_team_id: req.user_team_id });
    const [tasks] = await connection.execute(
      `SELECT t.id, t.user_id, t.assigned_by, t.title, t.description, t.priority, t.status, t.due_date, t.team_id,
              u.nom AS user_nom, u.prenom AS user_prenom,
              a.nom AS assigned_by_nom, a.prenom AS assigned_by_prenom
       FROM tasks t
       JOIN users u ON t.user_id = u.id
       LEFT JOIN users a ON t.assigned_by = a.id
       WHERE t.team_id = ?`,
      [req.user_team_id]
    );
    console.log('Tâches récupérées:', tasks);
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Erreur GET /api/TeamLeader/tasks:', {
      message: error.message,
      code: error.code,
      sql: error.sql,
      sqlMessage: error.sqlMessage,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des tâches' });
  }
});

// POST /api/TeamLeader/tasks
router.post('/tasks', authMiddleware, restrictToTeamLeader, async (req, res) => {
  const { user_id, title, description, priority, status, due_date, assigned_by } = req.body;
  const cleanedTitle = title ? title.trim() : null;
  console.log('Requête POST /api/TeamLeader/tasks reçue:', {
    user_id,
    title: cleanedTitle,
    description,
    priority,
    status,
    due_date,
    assigned_by,
    team_id: req.user_team_id,
    timestamp: new Date().toISOString(),
  });

  if (!user_id || !cleanedTitle) {
    console.error('Champs requis manquants:', { user_id, title: cleanedTitle });
    return res.status(400).json({ error: 'Les champs user_id et titre sont requis.' });
  }

  if (priority && !['low', 'medium', 'high'].includes(priority)) {
    console.error('Priorité invalide:', { priority });
    return res.status(400).json({ error: 'Priorité invalide (doit être low, medium ou high).' });
  }

  if (status && !['todo', 'in-progress', 'completed'].includes(status)) {
    console.error('Statut invalide:', { status });
    return res.status(400).json({ error: 'Statut invalide (doit être todo, in-progress ou completed).' });
  }

  if (due_date && isNaN(Date.parse(due_date))) {
    console.error('Date d’échéance invalide:', { due_date });
    return res.status(400).json({ error: 'Date d’échéance invalide.' });
  }

  try {
    // Vérifier si une tâche avec le même titre existe pour cet utilisateur
    const [existingTasks] = await connection.execute(
      'SELECT id, title FROM tasks WHERE user_id = ? AND title = ?',
      [user_id, cleanedTitle]
    );
    console.log('Vérification des doublons:', {
      user_id,
      title: cleanedTitle,
      existingTasks: existingTasks.length ? existingTasks : 'Aucune tâche trouvée',
    });

    if (existingTasks.length > 0) {
      return res.status(400).json({ error: 'Une tâche avec ce titre existe déjà pour cet utilisateur.' });
    }

    // Vérifier que l'utilisateur assigné existe et appartient à l'équipe
    const [userCheck] = await connection.execute(
      'SELECT id FROM users WHERE id = ? AND team_id = ?',
      [user_id, req.user_team_id]
    );
    if (userCheck.length === 0) {
      console.error('Utilisateur non autorisé:', { user_id, team_id: req.user_team_id });
      return res.status(403).json({ error: 'Utilisateur non autorisé ou non trouvé dans votre équipe.' });
    }

    // Vérifier que l'assignateur est un Team Leader
    const [assignerCheck] = await connection.execute(
      'SELECT id FROM users WHERE id = ? AND team_id = ? AND role = ?',
      [assigned_by || req.user_id, req.user_team_id, 'team_leader']
    );
    if (assignerCheck.length === 0) {
      console.error('Assignateur non autorisé:', { assigned_by: assigned_by || req.user_id, team_id: req.user_team_id });
      return res.status(403).json({ error: 'Assignateur non autorisé ou non trouvé dans votre équipe.' });
    }

    const taskId = uuidv4();
    console.log('Génération UUID pour tâche:', taskId);

    const [result] = await connection.execute(
      `INSERT INTO tasks (id, user_id, title, description, priority, status, due_date, team_id, created_at, assigned_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        taskId,
        user_id,
        cleanedTitle,
        description || null,
        priority || 'medium',
        status || 'todo',
        due_date ? new Date(due_date).toISOString().slice(0, 10) : null,
        req.user_team_id,
        new Date().toISOString().slice(0, 19).replace('T', ' '),
        assigned_by || req.user_id,
      ]
    );

    const [newTask] = await connection.execute(
      `SELECT t.id, t.user_id, t.assigned_by, t.title, t.description, t.priority, t.status, t.due_date, t.team_id,
              u.nom AS user_nom, u.prenom AS user_prenom,
              a.nom AS assigned_by_nom, a.prenom AS assigned_by_prenom
       FROM tasks t
       JOIN users u ON t.user_id = u.id
       LEFT JOIN users a ON t.assigned_by = a.id
       WHERE t.id = ?`,
      [taskId]
    );

    console.log('Tâche créée:', newTask[0]);
    res.status(201).json(newTask[0]);
  } catch (error) {
    console.error('Erreur POST /api/TeamLeader/tasks:', {
      message: error.message,
      code: error.code,
      sql: error.sql,
      sqlMessage: error.sqlMessage,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Violation de contrainte d\'unicité' });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Utilisateur ou équipe non valide' });
    }
    res.status(500).json({ error: 'Erreur serveur lors de la création de la tâche.' });
  }
});

// GET /api/TeamLeader/team-leaders
router.get('/team-leaders', authMiddleware, restrictToTeamLeader, async (req, res) => {
  try {
    console.log('Requête GET /api/TeamLeader/team-leaders reçue:', { user_team_id: req.user_team_id });
    const [teamLeaders] = await connection.execute(
      `SELECT id, nom, prenom, email, role, profilePicture, team_id
       FROM users WHERE team_id = ? AND role = 'team_leader'`,
      [req.user_team_id]
    );
    console.log('Team leaders récupérés:', teamLeaders);
    res.status(200).json(teamLeaders);
  } catch (error) {
    console.error('Erreur GET /api/TeamLeader/team-leaders:', {
      message: error.message,
      code: error.code,
      sql: error.sql,
      sqlMessage: error.sqlMessage,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des team leaders' });
  }
});

module.exports = router;