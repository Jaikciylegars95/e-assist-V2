const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const verifyToken = require('../middleware/authmiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../Uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalName));
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf|doc|docx|mp3|wav/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalName).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Fichier non supporté'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Requête reçue pour /api/groups: ${req.method} ${req.url}`);
  next();
});

router.post('/', verifyToken, async (req, res) => {
  const { name, memberIds } = req.body;
  console.log('POST /groups request:', { name, memberIds });
  const db = req.app.get('db');
  if (!db) return res.status(500).json({ message: 'Base de données non configurée' });

  if (!name || !memberIds || !Array.isArray(memberIds)) {
    return res.status(400).json({ message: 'Nom du groupe et membres requis' });
  }

  try {
    const [result] = await db.promise().query(
      'INSERT INTO groups (name, creator_id, created_at) VALUES (?, ?, NOW())',
      [name, req.user.id]
    );
    const groupId = result.insertId;

    await db.promise().query(
      'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
      [groupId, req.user.id]
    );

    for (const memberId of memberIds) {
      await db.promise().query(
        'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
        [groupId, memberId]
      );
    }

    console.log('Groupe créé:', groupId);
    res.json({ id: groupId, name, creator_id: req.user.id, created_at: new Date() });
  } catch (error) {
    console.error('Erreur création groupe:', error);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

router.get('/', verifyToken, async (req, res) => {
  console.log('Requête GET /groups reçue pour user_id:', req.user.id);
  const db = req.app.get('db');
  if (!db) return res.status(500).json({ message: 'Base de données non configurée' });

  try {
    const [groups] = await db.promise().query(
      'SELECT g.id, g.name, g.creator_id, g.created_at FROM groups g JOIN group_members gm ON g.id = gm.group_id WHERE gm.user_id = ?',
      [req.user.id]
    );
    console.log('Groupes récupérés:', groups);
    res.json(groups);
  } catch (error) {
    console.error('Erreur récupération groupes:', error);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

router.get('/notifications', verifyToken, async (req, res) => {
  console.log('Requête GET /groups/notifications reçue pour user_id:', req.user.id);
  const db = req.app.get('db');
  if (!db) return res.status(500).json({ message: 'Base de données non configurée' });

  try {
    const [notifications] = await db.promise().query(
      'SELECT n.*, m.content, m.sender_id, g.name as group_name FROM notifications n LEFT JOIN group_messages m ON n.group_message_id = m.id LEFT JOIN groups g ON n.group_id = g.id WHERE n.user_id = ? AND n.is_read = FALSE',
      [req.user.id]
    );
    console.log('Notifications récupérées:', notifications);
    res.json(notifications);
  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

router.get('/:groupId/messages', verifyToken, async (req, res) => {
  const { groupId } = req.params;
  console.log('Requête GET /groups/:groupId/messages pour groupId:', groupId);
  const db = req.app.get('db');
  if (!db) return res.status(500).json({ message: 'Base de données non configurée' });
  if (isNaN(parseInt(groupId))) {
    return res.status(400).json({ message: 'ID de groupe invalide' });
  }

  try {
    const [messages] = await db.promise().query(
      'SELECT m.*, u.nom, u.prenom FROM group_messages m JOIN users u ON m.sender_id = u.id WHERE m.group_id = ? ORDER BY m.created_at ASC',
      [groupId]
    );
    console.log('Messages de groupe récupérés:', messages);
    res.json(messages);
  } catch (error) {
    console.error('Erreur récupération messages groupe:', error);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  console.log('Requête POST /groups/upload reçue');
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier téléchargé' });
    }
    const filePath = `/Uploads/${req.file.filename}`;
    const fileType = req.file.mimetype.split('/')[1];
    console.log('Fichier téléchargé:', { filePath, fileType });
    res.json({ filePath, fileType });
  } catch (error) {
    console.error('Erreur upload fichier:', error);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

router.post('/notifications/group/:groupId/read', verifyToken, async (req, res) => {
  const { groupId } = req.params;
  console.log('Requête POST /notifications/group/:groupId/read pour groupId:', groupId);
  const db = req.app.get('db');
  if (!db) return res.status(500).json({ message: 'Base de données non configurée' });

  try {
    await db.promise().query(
      'UPDATE notifications SET is_read = TRUE WHERE group_id = ? AND user_id = ?',
      [groupId, req.user.id]
    );
    console.log('Notifications marquées comme lues pour groupId:', groupId);
    res.json({ message: 'Notifications marquées comme lues' });
  } catch (error) {
    console.error('Erreur mise à jour notifications:', error);
    res.status(500).json({ message: 'Erreur serveur', details: error.message });
  }
});

module.exports = router;