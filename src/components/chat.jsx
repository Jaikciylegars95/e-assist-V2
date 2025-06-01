import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [users, setUsers] = useState({});
  const [socket, setSocket] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserSelect, setShowUserSelect] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const validateMessage = (message) => {
    return message?.id && message.sender_id && message.receiver_id && message.content;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Veuillez vous connecter', { position: 'top-center', autoClose: 2000 });
      navigate('/login');
      return;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentUserId = payload.id;

    const newSocket = io('http://localhost:3001', {
      auth: { token: `Bearer ${token}` },
    });

    newSocket.on('connect', () => {
      console.log('Socket.IO connected');
      newSocket.emit('join');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      toast.error('Erreur de connexion au serveur', { position: 'top-center', autoClose: 2000 });
    });

    newSocket.on('receiveMessage', (message) => {
      console.log('Received message:', message);
      if (validateMessage(message)) {
        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(message.id))) {
            return prev;
          }
          return [
            ...prev.filter((m) => !m.id || !String(m.id).startsWith('temp-')),
            { ...message, created_at: new Date(message.created_at) },
          ];
        });
      } else {
        console.warn('Invalid message received:', message);
      }
    });

    newSocket.on('messageSent', (message) => {
      console.log('Message sent:', message);
      if (validateMessage(message)) {
        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(message.id))) {
            return prev;
          }
          return [
            ...prev.filter((m) => !m.id || !String(m.id).startsWith('temp-')),
            { ...message, created_at: new Date(message.created_at) },
          ];
        });
      } else {
        console.warn('Invalid message sent:', message);
      }
    });

    newSocket.on('error', (error) => {
      console.error('Socket.IO error:', error);
      const errorMessage = error.details ? `${error.message}: ${error.details}` : error.message || 'Erreur de connexion';
      toast.error(errorMessage, { position: 'top-center', autoClose: 3000 });
      setMessages((prev) => prev.filter((m) => !m.id || !String(m.id).startsWith('temp-')));
    });

    setSocket(newSocket);

    const fetchMessages = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:3001/api/users/${currentUserId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          const validMessages = data
            .filter(validateMessage)
            .map((msg) => ({
              ...msg,
              created_at: new Date(msg.created_at),
            }));
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => String(m.id)).filter((id) => id));
            const newMessages = validMessages.filter((msg) => !existingIds.has(String(msg.id)));
            return [...prev.filter((m) => !m.id || !String(m.id).startsWith('temp-')), ...newMessages];
          });
        } else {
          throw new Error(data.message || `Erreur lors du chargement des messages: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Fetch messages error:', error);
        const errorMessage = error.message.includes('404')
          ? 'Service de messagerie non disponible'
          : error.message;
        toast.error(errorMessage, { position: 'top-center', autoClose: 3000 });
      } finally {
        setIsLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          const userMap = data.reduce((acc, user) => {
            if (user.id) {
              const displayName =
                user.prenom && user.nom
                  ? `${user.prenom} ${user.nom}`
                  : user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.name || `Utilisateur #${user.id}`;
              acc[user.id] = displayName;
            }
            return acc;
          }, {});
          setUsers(userMap);
        } else {
          throw new Error(data.message || 'Erreur lors de la récupération des utilisateurs');
        }
      } catch (error) {
        console.error('Fetch users error:', error);
        toast.error('Impossible de charger les utilisateurs', { position: 'top-center', autoClose: 2000 });
      }
    };

    fetchMessages();
    fetchUsers();

    const refreshInterval = setInterval(fetchMessages, 30000);

    return () => {
      newSocket.disconnect();
      clearInterval(refreshInterval);
    };
  }, [navigate]);

  const handleSend = () => {
    if (!content || !selectedUser) {
      toast.error('Destinataire et message requis', { position: 'top-center', autoClose: 2000 });
      return;
    }

    const receiverId = parseInt(selectedUser);
    if (isNaN(receiverId) || receiverId <= 0) {
      toast.error('Destinataire invalide', { position: 'top-center', autoClose: 2000 });
      return;
    }

    if (!socket) {
      toast.error('Connexion au serveur non établie', { position: 'top-center', autoClose: 2000 });
      return;
    }

    const token = localStorage.getItem('token');
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentUserId = payload.id;

    const tempMessage = {
      id: `temp-${currentUserId}-${Date.now()}`,
      sender_id: currentUserId,
      receiver_id: receiverId,
      content,
      created_at: new Date(),
    };
    setMessages((prev) => [...prev, tempMessage]);
    socket.emit('sendMessage', { receiverId, content });
    setContent('');
  };

  const token = localStorage.getItem('token');
  const currentUserId = token ? JSON.parse(atob(token.split('.')[1])).id : null;

  const conversations = Array.from(
    new Set(messages.map((msg) => (msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id)))
  ).map((userId) => ({
    userId,
    lastMessage: messages
      .filter((msg) => msg.sender_id === userId || msg.receiver_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0],
  }));

  const filteredMessages = selectedUser
    ? messages.filter(
        (msg) =>
          (msg.sender_id === currentUserId && msg.receiver_id === parseInt(selectedUser)) ||
          (msg.sender_id === parseInt(selectedUser) && msg.receiver_id === currentUserId)
      )
    : [];

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-800 max-w-full">
      <div className="bg-green-600 dark:bg-green-800 text-white p-4 flex items-center justify-between shadow-md">
        <h2 className="text-xl font-semibold">Messagerie</h2>
        <button
          onClick={() => setShowUserSelect(true)}
          className="bg-green-700 dark:bg-green-900 text-white p-2 rounded-full hover:bg-green-800 dark:hover:bg-green-950 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600"
          aria-label="Nouvelle discussion"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-400">
          Chargement...
        </div>
      ) : showUserSelect ? (
        <div className="flex-1 p-4 flex flex-col items-center justify-center min-h-0">
          <label htmlFor="userSelect" className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">
            Nouvelle discussion
          </label>
          <select
            id="userSelect"
            value={selectedUser || ''}
            onChange={(e) => {
              setSelectedUser(e.target.value);
              setShowUserSelect(false);
            }}
            className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
            aria-label="Sélectionner un utilisateur"
          >
            <option value="">Sélectionner un utilisateur</option>
            {Object.entries(users)
              .filter(([id]) => parseInt(id) !== currentUserId)
              .map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
          </select>
          <button
            onClick={() => setShowUserSelect(false)}
            className="mt-4 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
            aria-label="Annuler"
          >
            Annuler
          </button>
        </div>
      ) : !selectedUser ? (
        <div className="flex-1 p-4 overflow-y-auto min-h-0">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 dark:text-gray-400">
              <p>Aucune discussion pour le moment</p>
              <p>Sélectionnez un utilisateur pour commencer à discuter</p>
              <button
                onClick={() => setShowUserSelect(true)}
                className="mt-4 bg-green-600 dark:bg-green-800 text-white p-2 rounded-full hover:bg-green-700 dark:hover:bg-green-900"
                aria-label="Nouvelle discussion"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.userId}
                onClick={() => setSelectedUser(conv.userId.toString())}
                className="flex items-center p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-white font-semibold mr-3">
                  {users[conv.userId]?.[0] || 'U'}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 dark:text-white">{users[conv.userId]}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {conv.lastMessage?.content || 'Aucun message'}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {conv.lastMessage ? new Date(conv.lastMessage.created_at).toLocaleTimeString() : ''}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          <div className="bg-green-600 dark:bg-green-800 text-white p-4 flex items-center justify-between shadow-md">
            <button
              onClick={() => setSelectedUser(null)}
              className="text-white p-2"
              aria-label="Retour"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-semibold">{users[selectedUser]}</h2>
            <div className="w-6"></div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto min-h-0 bg-gray-100 dark:bg-gray-800">
            {filteredMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-400">
                Aucun message pour le moment. Envoyez un message pour commencer la discussion !
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={String(msg.id)}
                  className={`flex mb-2 ${
                    msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {msg.sender_id !== currentUserId && (
                      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white font-semibold">
                        {users[msg.sender_id]?.[0] || 'U'}
                      </div>
                    )}
                    <div
                      className={`max-w-xs md:max-w-md p-3 rounded-lg shadow-md ${
                        msg.sender_id === currentUserId
                          ? 'bg-green-200 dark:bg-green-700 text-gray-800 dark:text-white'
                          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white'
                      }`}
                    >
                      <div className="text-sm">
                        <span className="font-bold">{users[msg.sender_id]}: </span>
                        {msg.content}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(msg.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 flex items-center border-t border-gray-300 dark:border-gray-700">
            <input
              type="text"
              placeholder="Votre message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 flex-1 mr-2 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
              aria-label="Écrire un message"
            />
            <button
              onClick={handleSend}
              className="bg-green-600 dark:bg-green-800 text-white p-2 rounded-full hover:bg-green-700 dark:hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600"
              aria-label="Envoyer le message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Chat;