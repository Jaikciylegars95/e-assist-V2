// routes/tasks.js
const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/authmiddleware'); // Importer le middleware d'authentification

const router = express.Router();

//récuperation des taches qui arrive a echeances
// Exemple fonction pour récupérer les tâches dues cette semaine
async function fetchTasksDueThisWeek() {
  try {
    const token = localStorage.getItem('token'); // ou autre méthode pour récupérer le JWT

    const response = await fetch('http://ton-backend-url/api/tasks/due-this-week', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,  // Passe le token JWT dans l'en-tête
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des tâches');
    }

    const tasks = await response.json();
    return tasks;
  } catch (error) {
    console.error(error);
    return [];
  }
}

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
router.put('/:task_id', authMiddleware, (req, res) => {
  const connection = req.app.get('db');
  const { task_id } = req.params;
  const { title, description, priority, status, due_date } = req.body;

  const sql = `
    UPDATE tasks
    SET title = ?, description = ?, priority = ?, status = ?, due_date = ?
    WHERE id = ? AND user_id = ?
  `;

  connection.query(sql, [title, description, priority, status, due_date, task_id, req.user_id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Erreur lors de la modification' });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }
    res.status(200).json({ message: 'Tâche modifiée avec succès' });
  });
});

// ✅ Supprimer une tâche
router.delete('/:task_id', authMiddleware, (req, res) => {
  const connection = req.app.get('db');
  const { task_id } = req.params;

  const sql = 'DELETE FROM tasks WHERE id = ? AND user_id = ?';

  connection.query(sql, [task_id, req.user_id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Erreur lors de la suppression' });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Tâche non trouvée' });
    }
    res.status(200).json({ message: 'Tâche supprimée avec succès' });
  });
});

module.exports = router;
