const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/Tasks');
const usersRoutes = require('./routes/users');  // <-- ajout

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connexion à la base de données
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'taskflow',
});

connection.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
  } else {
    console.log('Connexion à la base de données réussie');
  }
});

// Rendre la connexion accessible aux routes
app.set('db', connection);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', usersRoutes);   // <-- ajout

// Démarrage du serveur
app.listen(3001, () => {
  console.log('Serveur backend démarré sur le port 3001');
});
