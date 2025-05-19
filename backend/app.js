require('dotenv').config();
const express = require('express');
const mysql = require('mysql2'); // si tu veux utiliser les promesses : mysql2/promise
const cors = require('cors');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/Tasks');
const usersRoutes = require('./routes/users');


const app = express();

// Middleware
app.use(cors());
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


// Démarrage du serveur
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveur backend démarré sur le port ${PORT}`);
});