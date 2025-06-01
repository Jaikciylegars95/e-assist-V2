const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalide' });
  }
};

router.get('/:userId/messages', authenticateToken, (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  if (parseInt(userId) !== currentUserId) {
    return res.status(403).json({ message: 'Accès non autorisé' });
  }

  const db = req.app.get('db');
  const query = `
    SELECT id, sender_id, receiver_id, content, created_at
    FROM messages
    WHERE sender_id = ? OR receiver_id = ?
    ORDER BY created_at ASC
  `;

  db.query(query, [currentUserId, currentUserId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des messages:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    res.json(results);
  });
});

module.exports = router;