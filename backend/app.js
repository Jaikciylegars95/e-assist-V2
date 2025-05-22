require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const usersRoutes = require('./routes/users');
const notificationsRoutes = require('./routes/notifications');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Connexion à la base de données
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'taskflow',
});

connection.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
    process.exit(1); // Arrêter le serveur en cas d'erreur critique
  } else {
    console.log('Connexion à la base de données réussie');
  }
});

// Rendre la connexion accessible aux routes via app.set
app.set('db', connection);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notifications', notificationsRoutes); // Ajout de la route manquante

// Gestion des erreurs 404
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint non trouvé' });
});

// Gestion des erreurs générales
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveur backend démarré sur le port ${PORT}`);
});