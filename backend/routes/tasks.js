// routes/Tasks.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/authmiddleware'); // Importer le middleware d'authentification

const router = express.Router();

// ✅ Ajouter une tâche
router.post('/', authMiddleware, (req, res) => {
  const { title, description, priority, status, due_date } = req.body;
  const user_id = req.user_id; // Utiliser l'ID utilisateur provenant du middleware

  if (!title) {
    return res.status(400).json({ error: 'Le titre est requis' });
  }

  const connection = req.app.get('db');
  const checkUserSql = 'SELECT * FROM users WHERE id = ?';

  connection.query(checkUserSql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Erreur serveur' });
    if (results.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const id = uuidv4();
    const insertSql = `
      INSERT INTO tasks (id, user_id, title, description, priority, status, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    connection.query(
      insertSql,
      [id, user_id, title, description || '', priority || 'medium', status || 'todo', due_date || null],
      (err) => {
        if (err) return res.status(500).json({ error: 'Erreur lors de l’ajout de la tâche' });
        res.status(201).json({ message: 'Tâche ajoutée avec succès', taskId: id });
      }
    );
  });
});

// ✅ Récupérer toutes les tâches de l'utilisateur connecté
router.get('/', authMiddleware, (req, res) => {
  const user_id = req.user_id; // Utiliser l'ID utilisateur provenant du middleware

  const connection = req.app.get('db');
  const sql = 'SELECT * FROM tasks WHERE user_id = ?';

  connection.query(sql, [user_id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Erreur lors de la récupération des tâches' });
    res.status(200).json(results);
  });
});

// ✅ Récupérer une tâche par ID
router.get('/:id', authMiddleware, (req, res) => {
  const connection = req.app.get('db');
  const taskId = req.params.id;
  const sql = 'SELECT * FROM tasks WHERE id = ? AND user_id = ?';

  connection.query(sql, [taskId, req.user_id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Erreur serveur' });
    if (results.length === 0) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }
    res.status(200).json(results[0]);
  });
});

// ✅ Modifier une tâche
router.put('/:id', authMiddleware, (req, res) => {
  const connection = req.app.get('db');
  const taskId = req.params.id;
  const { title, description, priority, status, due_date } = req.body;

  const sql = `
    UPDATE tasks
    SET title = ?, description = ?, priority = ?, status = ?, due_date = ?
    WHERE id = ? AND user_id = ?
  `;

  connection.query(sql, [title, description, priority, status, due_date, taskId, req.user_id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Erreur lors de la modification' });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }
    res.status(200).json({ message: 'Tâche modifiée avec succès' });
  });
});

// ✅ Supprimer une tâche
router.delete('/:id', authMiddleware, (req, res) => {
  const connection = req.app.get('db');
  const taskId = req.params.id;

  const sql = 'DELETE FROM tasks WHERE id = ? AND user_id = ?';

  connection.query(sql, [taskId, req.user_id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Erreur lors de la suppression' });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }
    res.status(200).json({ message: 'Tâche supprimée avec succès' });
  });
});

/*// ✅ Route notifications corrigée, protégée par authMiddleware
router.get('/notifications', authMiddleware, (req, res) => {
  const connection = req.app.get('db');
  const user_id = req.user_id;
  // Aujourd’hui en format YYYY-MM-DD
  const today = new Date().toISOString().slice(0, 10);

  // Intervalle de 3 jours après aujourd'hui
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 3);
  const future = futureDate.toISOString().slice(0, 10);

  // Requête tâches à échéance (dans les 3 jours)
  const dueSql = `
    SELECT id, title, due_date
    FROM tasks
    WHERE user_id = ? 
      AND due_date BETWEEN ? AND ?
      AND status != 'completed'
    ORDER BY due_date ASC
  `;

  // Requête tâches complétées récemment (10 dernières)
  const completedSql = `
    SELECT id, title, due_date, status
    FROM tasks
    WHERE user_id = ? AND status = 'completed'
    ORDER BY due_date DESC
    LIMIT 10
  `;

  connection.query(dueSql, [user_id, today, future], (err, dueResults) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erreur lors de la récupération des notifications' });
    }

    connection.query(completedSql, [user_id], (err, completedResults) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Erreur lors de la récupération des notifications' });
      }

      res.json({
        dueTasks: dueResults,
        completedTasks: completedResults,
      });
    });
  });
});*/

module.exports = router;
