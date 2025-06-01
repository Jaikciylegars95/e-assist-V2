require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const usersRoutes = require('./routes/users');
const notificationsRoutes = require('./routes/notifications');
const messagesRoutes = require('./routes/messages');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'taskflow',
});

connection.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données:', err);
    process.exit(1);
  } else {
    console.log('Connexion à la base de données réussie');
  }
});

app.set('db', connection);
app.set('io', io);

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token || !token.startsWith('Bearer ')) {
    return next(new Error('Authentication error: Invalid token'));
  }
  try {
    const jwt = require('jsonwebtoken');
    const payload = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET || 'your_jwt_secret');
    socket.userId = payload.id;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log('Utilisateur connecté:', socket.id, 'UserID:', socket.userId);

  socket.on('join', () => {
    socket.join(socket.userId.toString());
    console.log(`Utilisateur ${socket.userId} a rejoint sa room`);
  });

  socket.on('sendMessage', ({ receiverId, content }) => {
    if (!receiverId || !content) {
      socket.emit('error', { message: 'Destinataire ou contenu manquant' });
      return;
    }

    const query = `
      INSERT INTO messages (sender_id, receiver_id, content, created_at)
      VALUES (?, ?, ?, NOW())
    `;
    connection.query(query, [socket.userId, receiverId, content], (err, result) => {
      if (err) {
        console.error('Erreur lors de l\'enregistrement du message:', err);
        socket.emit('error', { message: 'Erreur serveur' });
        return;
      }

      const message = {
        id: result.insertId,
        sender_id: socket.userId,
        receiver_id: receiverId,
        content,
        created_at: new Date(),
      };

      io.to(receiverId.toString()).emit('receiveMessage', message);
      socket.emit('messageSent', message);
    });
  });

  socket.on('disconnect', () => {
    console.log('Utilisateur déconnecté:', socket.id);
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err);
    socket.emit('error', { message: 'Erreur de connexion', details: err.message });
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/users', messagesRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Serveur backend fonctionne' });
});

app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint non trouvé' });
});

app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Serveur backend démarré sur le port ${PORT}`);
});