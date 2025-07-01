const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();
const { authMiddleware } = require('../middleware/authmiddleware');
const { v4: uuidv4 } = require('uuid');

const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'taskflow',
});

// Créer une tâche pour l'utilisateur authentifié
router.post('/', authMiddleware, async (req, res) => {
  const { title, description, priority, status, due_date } = req.body;
  const cleanedTitle = title ? title.trim() : null;
  console.log('Requête POST /api/tasks reçue:', {
    body: req.body,
    cleanedTitle,
    userId: req.user_id,
    teamId: req.user_team_id,
    timestamp: new Date().toISOString(),
  });

  if (!cleanedTitle || !priority || !status) {
    console.log('Validation échouée: champs requis manquants', { cleanedTitle, priority, status });
    return res.status(400).json({ error: 'Titre, priorité et statut sont requis' });
  }
  if (!['todo', 'in-progress', 'completed'].includes(status)) {
    console.log('Validation échouée: statut invalide', { status });
    return res.status(400).json({ error: 'Statut invalide (doit être todo, in-progress ou completed)' });
  }
  if (!['low', 'medium', 'high'].includes(priority)) {
    console.log('Validation échouée: priorité invalide', { priority });
    return res.status(400).json({ error: 'Priorité invalide (doit être low, medium ou high)' });
  }
  if (!req.user_team_id) {
    console.log('Validation échouée: team_id manquant', { userId: req.user_id });
    return res.status(400).json({ error: 'Team ID manquant pour l\'utilisateur' });
  }
  if (!req.user_id) {
    console.log('Validation échouée: user_id manquant');
    return res.status(401).json({ error: 'User ID manquant pour l\'utilisateur' });
  }

  try {
    // Vérifier l'utilisateur
    const [users] = await connection.execute('SELECT id, team_id, nom, prenom FROM users WHERE id = ?', [req.user_id]);
    if (!users.length) {
      console.log('Utilisateur non trouvé', { userId: req.user_id });
      return res.status(400).json({ error: 'Utilisateur non trouvé' });
    }
    // Vérifier l'équipe
    const [teams] = await connection.execute('SELECT id FROM teams WHERE id = ?', [req.user_team_id]);
    if (!teams.length) {
      console.log('Équipe non trouvée', { teamId: req.user_team_id });
      return res.status(400).json({ error: 'Équipe non trouvée' });
    }
    // Vérifier assigned_by
    const [assignedByUsers] = await connection.execute('SELECT id FROM users WHERE id = ?', [req.user_id]);
    if (!assignedByUsers.length) {
      console.log('Assigned_by non trouvé', { assignedBy: req.user_id });
      return res.status(400).json({ error: 'Utilisateur assigné non trouvé' });
    }

    // Vérifier si une tâche avec le même titre existe pour cet utilisateur
    const [existingTasks] = await connection.execute(
      'SELECT id, title FROM tasks WHERE user_id = ? AND title = ?',
      [req.user_id, cleanedTitle]
    );
    console.log('Vérification des doublons:', {
      user_id: req.user_id,
      title: cleanedTitle,
      existingTasks: existingTasks.length ? existingTasks : 'Aucune tâche trouvée',
    });

    if (existingTasks.length > 0) {
      return res.status(400).json({ error: 'Une tâche avec ce titre existe déjà pour cet utilisateur.' });
    }

    // Générer un UUID pour l'id de la tâche
    const taskId = uuidv4();
    console.log('Génération UUID pour tâche:', taskId);

    console.log('Tentative d\'insertion avec:', {
      id: taskId,
      user_id: req.user_id,
      assigned_by: req.user_id,
      title: cleanedTitle,
      description: description || null,
      priority,
      status,
      due_date: due_date || null,
      team_id: req.user_team_id,
    });

    const [result] = await connection.execute(
      'INSERT INTO tasks (id, user_id, assigned_by, title, description, priority, status, due_date, team_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [taskId, req.user_id, req.user_id, cleanedTitle, description || null, priority, status, due_date || null, req.user_team_id]
    );
    console.log('Tâche créée avec succès:', {
      id: taskId,
      user_id: req.user_id,
      assigned_by: req.user_id,
      title: cleanedTitle,
      priority,
      status,
      team_id: req.user_team_id,
    });

    res.status(201).json({
      id: taskId,
      user_id: req.user_id,
      assigned_by: req.user_id,
      title: cleanedTitle,
      description: description || null,
      priority,
      status,
      due_date: due_date || null,
      team_id: req.user_team_id,
      user_nom: users[0].nom || '',
      user_prenom: users[0].prenom || '',
      assigned_by_nom: users[0].nom || '',
      assigned_by_prenom: users[0].prenom || '',
    });
  } catch (error) {
    console.error('Erreur POST /api/tasks détaillée:', {
      message: error.message,
      code: error.code,
      sql: error.sql,
      sqlMessage: error.sqlMessage,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    if (error.code === 'ER_DUP_ENTRY') {
      const match = error.sqlMessage.match(/Duplicate entry '.*?' for key '(.*?)'/);
      const constraint = match ? match[1] : 'inconnue';
      return res.status(400).json({
        error: `Violation de contrainte d'unicité (contrainte: ${constraint})`,
        sqlMessage: error.sqlMessage,
      });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Utilisateur ou équipe non valide (violation de clé étrangère)' });
    }
    if (error.code === 'ER_TRUNCATED_WRONG_VALUE') {
      return res.status(400).json({ error: `Format de date invalide: ${error.message}` });
    }
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(500).json({ error: 'Tableau tasks non trouvé dans la base de données' });
    }
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      return res.status(500).json({ error: 'Accès à la base de données refusé' });
    }
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      return res.status(500).json({ error: `Colonne invalide dans la requête: ${error.message}` });
    }
    if (error.code === 'ER_BAD_NULL_ERROR') {
      return res.status(400).json({ error: `Valeur nulle non autorisée: ${error.message}` });
    }

    res.status(500).json({ error: 'Erreur serveur lors de la création de la tâche' });
  }
});

// Récupérer toutes les tâches de l'utilisateur
router.get('/', authMiddleware, async (req, res) => {
  try {
    console.log('Requête GET /api/tasks:', { userId: req.user_id, teamId: req.user_team_id });
    const [tasks] = await connection.execute(
      `SELECT t.id, t.user_id, t.assigned_by, t.title, t.description, t.priority, t.status, t.due_date, t.team_id,
              u.nom AS user_nom, u.prenom AS user_prenom,
              u2.nom AS assigned_by_nom, u2.prenom AS assigned_by_prenom
       FROM tasks t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN users u2 ON t.assigned_by = u2.id
       WHERE t.user_id = ? AND t.team_id = ?`,
      [req.user_id, req.user_team_id]
    );
    res.json(tasks);
  } catch (error) {
    console.error('Erreur GET /api/tasks:', { message: error.message, code: error.code, stack: error.stack });
    res.status(401).json({ error: 'Token invalide ou accès non autorisé' });
  }
});

// Récupérer une tâche par ID
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [tasks] = await connection.execute(
      `SELECT t.id, t.user_id, t.assigned_by, t.title, t.description, t.priority, t.status, t.due_date, t.team_id,
              u.nom AS user_nom, u.prenom AS user_prenom,
              u2.nom AS assigned_by_nom, u2.prenom AS assigned_by_prenom
       FROM tasks t
       LEFT JOIN users u ON t.user_id = u.id
       LEFT JOIN users u2 ON t.assigned_by = u2.id
       WHERE t.id = ? AND t.user_id = ? AND t.team_id = ?`,
      [id, req.user_id, req.user_team_id]
    );
    if (!tasks.length) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }
    res.json(tasks[0]);
  } catch (error) {
    console.error('Erreur GET /api/tasks/:id:', { message: error.message, code: error.code, stack: error.stack });
    res.status(500).json({ error: 'Erreur serveur lors de la récupération de la tâche' });
  }
});

// Mettre à jour une tâche
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, status, due_date } = req.body;
  const cleanedTitle = title ? title.trim() : null;
  console.log('Requête PUT /api/tasks:', { id, cleanedTitle, description, priority, status, due_date });

  if (!cleanedTitle && !description && !priority && !status && !due_date) {
    return res.status(400).json({ error: 'Au moins un champ à mettre à jour est requis' });
  }
  try {
    // Vérifier les doublons pour le titre si modifié
    if (cleanedTitle) {
      const [existingTasks] = await connection.execute(
        'SELECT id FROM tasks WHERE user_id = ? AND title = ? AND id != ?',
        [req.user_id, cleanedTitle, id]
      );
      if (existingTasks.length > 0) {
        return res.status(400).json({ error: 'Une tâche avec ce titre existe déjà pour cet utilisateur.' });
      }
    }

    const updates = [];
    const values = [];
    if (cleanedTitle) {
      updates.push('title = ?');
      values.push(cleanedTitle);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description || null);
    }
    if (priority) {
      if (!['low', 'medium', 'high'].includes(priority)) {
        return res.status(400).json({ error: 'Priorité invalide' });
      }
      updates.push('priority = ?');
      values.push(priority);
    }
    if (status) {
      if (!['todo', 'in-progress', 'completed'].includes(status)) {
        return res.status(400).json({ error: 'Statut invalide' });
      }
      updates.push('status = ?');
      values.push(status);
    }
    if (due_date !== undefined) {
      updates.push('due_date = ?');
      values.push(due_date || null);
    }
    values.push(id, req.user_id, req.user_team_id);
    const query = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ? AND user_id = ? AND team_id = ?`;
    const [result] = await connection.execute(query, values);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }
    res.status(200).json({ message: 'Tâche mise à jour' });
  } catch (error) {
    console.error('Erreur PUT /api/tasks:', { message: error.message, code: error.code, stack: error.stack });
    if (error.code === 'ER_DUP_ENTRY') {
      const match = error.sqlMessage.match(/Duplicate entry '.*?' for key '(.*?)'/);
      const constraint = match ? match[1] : 'inconnue';
      return res.status(400).json({
        error: `Violation de contrainte d'unicité (contrainte: ${constraint})`,
        sqlMessage: error.sqlMessage,
      });
    }
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour de la tâche' });
  }
});

// Supprimer une tâche
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await connection.execute(
      'DELETE FROM tasks WHERE id = ? AND user_id = ? AND team_id = ?',
      [id, req.user_id, req.user_team_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Erreur DELETE /api/tasks:', { message: error.message, code: error.code, stack: error.stack });
    res.status(500).json({ error: 'Erreur serveur lors de la suppression de la tâche' });
  }
});

module.exports = router;