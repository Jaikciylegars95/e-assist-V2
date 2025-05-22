const express = require('express');
const authMiddleware = require('../middleware/authmiddleware');
const router = express.Router();

// Endpoint pour les notifications
router.get('/', authMiddleware, (req, res) => {
  console.log('Endpoint /api/notifications atteint, user_id:', req.user_id);
  const connection = req.app.get('db');
  const user_id = req.user_id;
  const today = new Date().toISOString().slice(0, 10);
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 3);
  const future = futureDate.toISOString().slice(0, 10);

  const dueSql = `
    SELECT id, title, due_date
    FROM tasks
    WHERE user_id = ? 
      AND due_date BETWEEN ? AND ?
      AND status != 'completed'
    ORDER BY due_date ASC
  `;
  const completedSql = `
    SELECT id, title, due_date, status
    FROM tasks
    WHERE user_id = ? AND status = 'completed'
    ORDER BY due_date DESC
    LIMIT 10
  `;

  connection.query(dueSql, [user_id, today, future], (err, dueResults) => {
    if (err) {
      console.error('Erreur SQL dueTasks:', err);
      return res.status(500).json({ error: 'Erreur lors de la récupération des tâches à échéance' });
    }
    console.log('dueTasks:', dueResults);
    connection.query(completedSql, [user_id], (err, completedResults) => {
      if (err) {
        console.error('Erreur SQL completedTasks:', err);
        return res.status(500).json({ error: 'Erreur lors de la récupération des tâches complétées' });
      }
      console.log('completedTasks:', completedResults);
      res.json({
        dueTasks: dueResults,
        completedTasks: completedResults,
      });
    });
  });
});

module.exports = router;