const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'SuperClé123!';

const authMiddleware = (req, res, next) => {
  console.log('Headers reçus:', req.headers); // Débogage
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  console.log('Authorization header:', authHeader); // Débogage
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Erreur: Token non fourni, authHeader:', authHeader);
    return res.status(401).json({ error: 'Token non fourni' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token décodé:', decoded);
    req.user_id = decoded.id;
    next();
  } catch (error) {
    console.error('Erreur JWT:', error);
    return res.status(401).json({ error: 'Token invalide' });
  }
};

module.exports = authMiddleware;