// db.js
import mysql from 'mysql2';

// Créer la connexion à la base de données
const db = mysql.createConnection({
  host: 'localhost',     // ou l'adresse de ton serveur
  user: 'root',          // ton utilisateur MySQL
  password: '',          // ton mot de passe MySQL
  database: 'taskflow'    // ton nom de base de données
});

db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
  } else {
    console.log('Connexion à la base de données réussie');
  }
});

export default db;
