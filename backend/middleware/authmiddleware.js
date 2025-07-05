const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  console.log('Headers reçus:', req.headers);
  let authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader && req.handshake && req.handshake.auth && req.handshake.auth.token) {
    authHeader = req.handshake.auth.token;
  }
  console.log('Authorization header:', authHeader);
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Erreur: Token non fourni', { authHeader });
    return res.status(401).json({ error: 'Token non fourni' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token décodé:', decoded);
    if (!decoded.team_id) {
      console.error('Erreur: team_id manquant dans le token', { decoded });
      return res.status(401).json({ error: 'Team ID manquant dans le token' });
    }
    req.user_id = decoded.id;
    req.user_role = decoded.role;
    req.user_team_id = decoded.team_id;
    next();
  } catch (error) {
    console.error('Erreur JWT:', error.message);
    return res.status(401).json({ error: 'Token invalide' });
  }
};

const restrictToTeamLeader = (req, res, next) => {
  console.log('Vérification restrictToTeamLeader, rôle:', req.user_role);
  if (req.user_role !== 'team_leader') {
    console.error('Accès interdit: utilisateur non chef d\'équipe', { role: req.user_role });
    return res.status(403).json({ error: 'Accès réservé aux chefs d\'équipe' });
  }
  next();
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    console.log('Vérification restrictTo, rôle:', req.user_role, 'rôles autorisés:', roles);
    if (!roles.includes(req.user_role)) {
      console.error('Accès interdit: rôle non autorisé', { role: req.user_role, allowedRoles: roles });
      return res.status(403).json({ error: 'Accès interdit' });
    }
    next();
  };
};

module.exports = { authMiddleware, restrictToTeamLeader, restrictTo };