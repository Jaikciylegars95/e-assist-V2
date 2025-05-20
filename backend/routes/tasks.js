// routes/tasks.js
const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/authMiddleware'); // Importer le middleware d'authentification

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

// PUT /api/tasks/:id
router.put("/tasks/:id", authenticate, async (req, res) => {
  const taskId = req.params.id;
  
  console.log("Corps reçu pour mise à jour :", req.body);

  const { title, description, due_date, status, priority } = req.body;

  try {
    const task = await Task.findByPk(taskId);

    if (!task) return res.status(404).json({ error: "Tâche non trouvée" });

    // Mise à jour
    task.title = title;
    task.description = description;
    task.due_date = due_date;
    task.status = status;
    task.priority = priority; // Ajouté ici

    await task.save();

    return res.json(task);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
});


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

// Exemple d'Express pour l'API notifications
app.get('/api/tasks/notifications', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Requête pour les tâches arrivant à échéance (par ex. dans les 3 prochains jours)
    const dueTasks = await db.query(`
      SELECT id, title FROM tasks
      WHERE due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '3 days'
      AND completed = false
      ORDER BY due_date ASC
    `);

    // Requête pour les tâches complétées
    const completedTasks = await db.query(`
      SELECT id, title FROM tasks
      WHERE completed = true
      ORDER BY updated_at DESC
      LIMIT 10
    `);

    res.json({
      dueTasks: dueTasks.rows,
      completedTasks: completedTasks.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
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
