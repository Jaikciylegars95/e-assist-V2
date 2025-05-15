// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'SuperClé123!'; // Utiliser une variable d'environnement pour la clé secrète

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"
  if (!token) {
    return res.status(401).json({ error: 'Token non fourni' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user_id = decoded.id; // Ajouter l'ID utilisateur à la requête
    next(); // Passer à la route suivante
  } catch (error) {
    return res.status(401).json({ error: 'Token invalide' });
  }
};

module.exports = authMiddleware;
