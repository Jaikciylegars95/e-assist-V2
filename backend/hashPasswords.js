const mysql = require('mysql2');
const bcrypt = require('bcrypt');

// Créer la connexion à la base de données
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'taskflow'
});

// Fonction pour hacher les mots de passe
async function hashPasswords() {
  // Sélectionner tous les utilisateurs
  const sql = 'SELECT id, email, password FROM users';
  
  connection.query(sql, async (err, users) => {
    if (err) {
      console.error('Erreur lors de la récupération des utilisateurs:', err);
      return;
    }

    // Pour chaque utilisateur, on hache son mot de passe et on met à jour la base de données
    for (const user of users) {
      const { id, email, password } = user;

      // Hacher le mot de passe
      const saltRounds = 10;
      try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Mettre à jour le mot de passe dans la base de données
        const updateSql = 'UPDATE users SET password = ? WHERE id = ?';
        connection.query(updateSql, [hashedPassword, id], (err, result) => {
          if (err) {
            console.error('Erreur lors de la mise à jour du mot de passe de l\'utilisateur', email, err);
          } else {
            console.log(`Mot de passe de l'utilisateur ${email} mis à jour avec succès.`);
          }
        });
      } catch (error) {
        console.error('Erreur lors du hachage du mot de passe de l\'utilisateur', email, error);
      }
    }
  });
}

// Lancer la fonction pour hacher les mots de passe
hashPasswords();
