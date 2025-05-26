const express = require('express');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/authmiddleware');

const router = express.Router();

// Ajouter une tâche
router.post('/', authMiddleware, (req, res) => {
  const { title, description, priority, status, due_date, user_id } = req.body;
  console.log('Données reçues:', req.body, 'user_id from token:', req.user_id);

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Le titre est requis et ne peut pas être vide' });
  }

  if (user_id !== req.user_id) {
    return res.status(403).json({ error: 'ID utilisateur non autorisé' });
  }

  const connection = req.app.get('db');
  const checkUserSql = 'SELECT * FROM users WHERE id = ?';

  connection.query(checkUserSql, [req.user_id], (err, results) => {
    if (err) {
      console.error('Erreur SQL utilisateur:', err);
      return res.status(500).json({ error: 'Erreur serveur lors de la vérification de l’utilisateur' });
    }
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
      [id, req.user_id, title, description || '', priority || 'medium', status || 'todo', due_date || null],
      (err, result) => {
        if (err) {
          console.error('Erreur insertion tâche:', err);
          return res.status(500).json({ error: 'Erreur lors de l’ajout de la tâche' });
        }
        res.status(201).json({
          message: 'Tâche ajoutée avec succès',
          task: { id, user_id: req.user_id, title, description, priority, status, due_date },
        });
      }
    );
  });
});

// Récupérer toutes les tâches de l'utilisateur
router.get('/', authMiddleware, (req, res) => {
  const user_id = req.user_id;
  const connection = req.app.get('db');
  const sql = 'SELECT * FROM tasks WHERE user_id = ?';

  connection.query(sql, [user_id], (err, results) => {
    if (err) {
      console.error('Erreur récupération tâches:', err);
      return res.status(500).json({ error: 'Erreur lors de la récupération des tâches' });
    }
    res.status(200).json(results);
  });
});

// Récupérer une tâche par ID
router.get('/:id', authMiddleware, (req, res) => {
  const connection = req.app.get('db');
  const taskId = req.params.id;
  const sql = 'SELECT * FROM tasks WHERE id = ? AND user_id = ?';

  connection.query(sql, [taskId, req.user_id], (err, results) => {
    if (err) {
      console.error('Erreur récupération tâche:', err);
      return res.status(500).json({ error: 'Erreur serveur' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }
    res.status(200).json(results[0]);
  });
});

// Modifier une tâche
router.put('/:id', authMiddleware, (req, res) => {
  const connection = req.app.get('db');
  const taskId = req.params.id;
  const { title, description, priority, status, due_date } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'Le titre est requis et ne peut pas être vide' });
  }

  const sql = `
    UPDATE tasks
    SET title = ?, description = ?, priority = ?, status = ?, due_date = ?
    WHERE id = ? AND user_id = ?
  `;

  connection.query(
    sql,
    [title, description || '', priority || 'medium', status || 'todo', due_date || null, taskId, req.user_id],
    (err, result) => {
      if (err) {
        console.error('Erreur mise à jour tâche:', err);
        return res.status(500).json({ error: 'Erreur lors de la modification' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Tâche non trouvée' });
      }
      res.status(200).json({
        message: 'Tâche modifiée avec succès',
        task: { id: taskId, title, description, priority, status, due_date },
      });
    }
  );
});

// Supprimer une tâche
router.delete('/:id', authMiddleware, (req, res) => {
  const connection = req.app.get('db');
  const taskId = req.params.id;

  const sql = 'DELETE FROM tasks WHERE id = ? AND user_id = ?';

  connection.query(sql, [taskId, req.user_id], (err, result) => {
    if (err) {
      console.error('Erreur suppression tâche:', err);
      return res.status(500).json({ error: 'Erreur lors de la suppression' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }
    res.status(200).json({ message: 'Tâche supprimée avec succès' });
  });
});

module.exports = router;