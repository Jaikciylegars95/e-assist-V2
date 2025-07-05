import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [users, setUsers] = useState({});
  const [socket, setSocket] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserSelect, setShowUserSelect] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const textareaRef = useRef(null);
  const chatContainerRef = useRef(null);

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
      console.log('Socket.IO connecté');
      newSocket.emit('join');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Erreur de connexion Socket.IO:', error);
      toast.error('Erreur de connexion au serveur', { position: 'top-center', autoClose: 2000 });
    });

    newSocket.on('receiveMessage', (message) => {
      console.log('Message reçu:', message);
      if (validateMessage(message)) {
        const isCurrentConversation = String(selectedUser) === String(message.sender_id);
        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(message.id))) {
            return prev;
          }
          return [
            ...prev.filter((m) => !m.id || !String(m.id).startsWith('temp-')),
            { ...message, created_at: new Date(message.created_at), unread: !isCurrentConversation },
          ];
        });
        if (!isCurrentConversation) {
          setUnreadMessages((prev) => ({
            ...prev,
            [message.sender_id]: (prev[message.sender_id] || 0) + 1,
          }));
        }
        // Récupérer les utilisateurs manquants
        if (!users[String(message.sender_id)] || !users[String(message.receiver_id)]) {
          fetchMissingUser(String(message.sender_id));
          fetchMissingUser(String(message.receiver_id));
        }
      } else {
        console.warn('Message invalide reçu:', message);
      }
    });

    newSocket.on('messageSent', (message) => {
      console.log('Message envoyé:', message);
      if (validateMessage(message)) {
        setMessages((prev) => {
          if (prev.some((m) => String(m.id) === String(message.id))) {
            return prev;
          }
          return [
            ...prev.filter((m) => !m.id || !String(m.id).startsWith('temp-')),
            { ...message, created_at: new Date(message.created_at), unread: false },
          ];
        });
        if (!users[String(message.sender_id)] || !users[String(message.receiver_id)]) {
          fetchMissingUser(String(message.sender_id));
          fetchMissingUser(String(message.receiver_id));
        }
      } else {
        console.warn('Message invalide envoyé:', message);
      }
    });

    newSocket.on('error', (error) => {
      console.error('Erreur Socket.IO:', error);
      const errorMessage = error.details ? `${error.message}: ${error.details}` : error.message || 'Erreur de connexion';
      toast.error(errorMessage, { position: 'top-center', autoClose: 3000 });
      setMessages((prev) => prev.filter((m) => !m.id || !String(m.id).startsWith('temp-')));
    });

    setSocket(newSocket);

    const fetchUsers = async (messageUserIds = []) => {
      try {
        const query = messageUserIds.length > 0 ? `?ids=${messageUserIds.join(',')}` : '';
        const response = await fetch(`http://localhost:3001/api/users${query}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        console.log('Utilisateurs récupérés:', data);
        if (response.ok) {
          const userMap = data.reduce((acc, user) => {
            if (user.id) {
              const displayName =
                user.prenom && user.nom
                  ? `${user.prenom} ${user.nom}`
                  : user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.prenom || user.nom || user.name || null;
              if (displayName) {
                acc[String(user.id)] = displayName;
              }
            }
            return acc;
          }, {});
          console.log('User map:', userMap);
          setUsers((prev) => ({ ...prev, ...userMap }));
          // Vérifier les utilisateurs manquants
          messageUserIds.forEach((id) => {
            if (!userMap[id]) {
              console.warn(`Utilisateur manquant dans userMap pour id: ${id}`);
              fetchMissingUser(id);
            }
          });
          return userMap;
        } else {
          throw new Error(data.message || 'Erreur lors de la récupération des utilisateurs');
        }
      } catch (error) {
        console.error('Erreur fetch utilisateurs:', error);
        toast.error('Impossible de charger les utilisateurs', { position: 'top-center', autoClose: 2000 });
        return {};
      }
    };

    const fetchMissingUser = async (userId, retryCount = 0) => {
      if (!userId || users[userId]) return;
      const maxRetries = 3;
      try {
        const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = await response.json();
        if (response.ok && user.id) {
          const displayName =
            user.prenom && user.nom
              ? `${user.prenom} ${user.nom}`
              : user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.prenom || user.nom || user.name || null;
          if (displayName) {
            setUsers((prev) => ({
              ...prev,
              [String(user.id)]: displayName,
            }));
            console.log(`Utilisateur ajouté pour id: ${userId}`, displayName);
          } else {
            throw new Error(`Nom complet non disponible pour l'utilisateur ${userId}`);
          }
        } else {
          throw new Error(`Utilisateur non trouvé: ${userId}`);
        }
      } catch (error) {
        console.error(`Erreur fetch utilisateur ${userId}:`, error);
        if (retryCount < maxRetries) {
          console.log(`Réessai ${retryCount + 1}/${maxRetries} pour utilisateur ${userId}`);
          setTimeout(() => fetchMissingUser(userId, retryCount + 1), 1000);
        } else {
          console.warn(`Échec définitif pour récupérer l'utilisateur ${userId}`);
          toast.error(`Impossible de charger l'utilisateur ${userId}`, { position: 'top-center', autoClose: 3000 });
          setUsers((prev) => ({
            ...prev,
            [userId]: 'Utilisateur Non Trouvé',
          }));
        }
      }
    };

    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/users/${currentUserId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          const validMessages = data
            .filter(validateMessage)
            .map((msg) => ({
              ...msg,
              sender_id: String(msg.sender_id),
              receiver_id: String(msg.receiver_id),
              created_at: new Date(msg.created_at),
              unread: false,
            }));
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => String(m.id)).filter((id) => id));
            const newMessages = validMessages.filter((msg) => !existingIds.has(String(msg.id)));
            return [...prev.filter((m) => !m.id || !String(m.id).startsWith('temp-')), ...newMessages];
          });
          // Extraire les user_id uniques des messages
          const messageUserIds = Array.from(
            new Set([
              ...validMessages.map((msg) => String(msg.sender_id)),
              ...validMessages.map((msg) => String(msg.receiver_id)),
            ])
          ).filter((id) => id !== String(currentUserId));
          await fetchUsers(messageUserIds);
        } else {
          throw new Error(data.message || `Erreur lors du chargement des messages: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Erreur fetch messages:', error);
        const errorMessage = error.message.includes('404')
          ? 'Service de messagerie indisponible'
          : error.message;
        toast.error(errorMessage, { position: 'top-center', autoClose: 3000 });
      }
    };

    const fetchData = async () => {
      setIsLoading(true);
      await fetchMessages();
      setIsLoading(false);
    };

    fetchData();

    const refreshInterval = setInterval(fetchMessages, 30000);

    return () => {
      newSocket.disconnect();
      clearInterval(refreshInterval);
    };
  }, [navigate]);

  useEffect(() => {
    if (selectedUser) {
      console.log('Selected user:', selectedUser, 'Name:', users[selectedUser]);
      if (!users[selectedUser]) {
        fetchMissingUser(selectedUser);
      }
      setMessages((prev) =>
        prev.map((msg) =>
          (msg.sender_id === String(selectedUser) && msg.receiver_id === String(currentUserId)) ||
          (msg.receiver_id === String(selectedUser) && msg.sender_id === String(currentUserId))
            ? { ...msg, unread: false }
            : msg
        )
      );
      setUnreadMessages((prev) => ({
        ...prev,
        [selectedUser]: 0,
      }));
    }
  }, [selectedUser, users]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

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
      sender_id: String(currentUserId),
      receiver_id: String(receiverId),
      content,
      created_at: new Date(),
      unread: false,
    };
    setMessages((prev) => [...prev, tempMessage]);
    socket.emit('sendMessage', { receiverId, content });
    setContent('');
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'e' && e.ctrlKey) {
      e.preventDefault();
      setShowEmojiPicker(!showEmojiPicker);
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setContent((prev) => prev + emojiObject.emoji);
    textareaRef.current.focus();
  };

  const token = localStorage.getItem('token');
  const currentUserId = token ? JSON.parse(atob(token.split('.')[1])).id : null;

  const filteredMessages = selectedUser
    ? messages.filter(
        (msg) =>
          (msg.sender_id === String(selectedUser) && msg.receiver_id === String(currentUserId)) ||
          (msg.receiver_id === String(selectedUser) && msg.sender_id === String(currentUserId))
      )
    : [];

  const filteredUsers = Object.entries(users).filter(([_, name]) =>
    name && name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const conversations = Array.from(
    new Set(
      messages.map((msg) =>
        msg.sender_id === String(currentUserId) ? msg.receiver_id : msg.sender_id
      )
    )
  ).filter((id) => id !== String(currentUserId));

  const hasUnreadMessages = Object.values(unreadMessages).some((count) => count > 0);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 font-sans">
      <div className="bg-green-700 dark:bg-green-900 text-white p-4 flex items-center justify-between shadow-lg sticky top-0 z-10">
        <h2 className="text-xl font-bold flex items-center">
          Messagerie
          {hasUnreadMessages && (
            <span className="ml-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" aria-label="Nouveau message"></span>
          )}
        </h2>
        <button
          onClick={() => {
            setShowUserSelect(true);
            setSearchQuery('');
          }}
          className="bg-green-600 dark:bg-green-800 text-white p-2 rounded-full hover:bg-green-500 dark:hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition duration-300"
          aria-label="Nouvelle conversation"
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
        <div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-300 animate-pulse text-lg">
          Chargement des conversations...
        </div>
      ) : showUserSelect ? (
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl m-2 sm:m-4 transition-all duration-300">
          <h3 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">Nouvelle conversation</h3>
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 mb-4 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
            aria-label="Rechercher un utilisateur"
          />
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 dark:text-gray-300">
              <p className="text-lg mb-2">Aucun utilisateur trouvé</p>
              <p className="text-sm">Vérifiez votre recherche ou ajoutez de nouveaux utilisateurs.</p>
            </div>
          ) : (
            filteredUsers.map(([id, name]) => (
              <div
                key={id}
                onClick={() => {
                  console.log('Utilisateur sélectionné:', id, 'Nom:', name);
                  setSelectedUser(id);
                  setShowUserSelect(false);
                  setSearchQuery('');
                }}
                className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-gray-700 cursor-pointer rounded-lg transition duration-200"
              >
                <div className="w-12 h-12 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center text-white text-lg font-semibold mr-4">
                  {name[0] || '?'}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg text-gray-800 dark:text-white flex items-center">
                    {name}
                    {(unreadMessages[id] || 0) > 0 && (
                      <span className="ml-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" aria-label="Nouveau message"></span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                    {messages
                      .filter((msg) => msg.sender_id === id || msg.receiver_id === id)
                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]?.content || 'Aucun message'}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {messages
                    .filter((msg) => msg.sender_id === id || msg.receiver_id === id)
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
                    ?.created_at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                </div>
              </div>
            ))
          )}
          <button
            onClick={() => {
              setShowUserSelect(false);
              setSearchQuery('');
            }}
            className="mt-6 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold transition duration-200"
            aria-label="Annuler"
          >
            Annuler
          </button>
        </div>
      ) : !selectedUser ? (
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl m-2 sm:m-4">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 dark:text-gray-300">
              <p className="text-lg mb-2">Aucune conversation</p>
              <p className="text-sm">Commencez une nouvelle conversation en cliquant sur le bouton +.</p>
            </div>
          ) : (
            conversations.map((userId) => (
              <div
                key={userId}
                onClick={() => {
                  console.log('Conversation sélectionnée:', userId, 'Nom:', users[userId]);
                  setSelectedUser(String(userId));
                }}
                className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-gray-700 cursor-pointer rounded-lg transition duration-200"
              >
                <div className="w-12 h-12 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center text-white text-lg font-semibold mr-4">
                  {(users[userId] || 'Chargement...')[0] || '?'}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg text-gray-800 dark:text-white flex items-center">
                    {users[userId] || 'Chargement...'}
                    {(unreadMessages[userId] || 0) > 0 && (
                      <span className="ml-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" aria-label="Nouveau message"></span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                    {messages
                      .filter((msg) => msg.sender_id === userId || msg.receiver_id === userId)
                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]?.content || 'Aucun message'}
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {messages
                    .filter((msg) => msg.sender_id === userId || msg.receiver_id === userId)
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
                    ?.created_at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          <div className="bg-green-700 dark:bg-green-900 text-white p-4 flex items-center justify-between shadow-lg sticky top-0 z-10">
            <button
              onClick={() => setSelectedUser(null)}
              className="text-white p-2 hover:bg-green-600 dark:hover:bg-green-800 rounded-full transition duration-200"
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
            <h2 className="text-xl font-semibold truncate">
              Discussion avec {users[selectedUser] || 'Chargement...'}
            </h2>
            <div className="w-6"></div>
          </div>
          <div
            ref={chatContainerRef}
            className="flex-1 p-4 sm:p-6 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl m-2 sm:m-4"
          >
            {filteredMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-300 text-lg">
                Aucun message pour le moment. Envoyez un message pour commencer la discussion !
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={String(msg.id)}
                  className={`flex mb-4 ${msg.sender_id === String(currentUserId) ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-start space-x-3 max-w-[75%]">
                    {msg.sender_id !== String(currentUserId) && (
                      <div className="w-10 h-10 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center text-white font-semibold">
                        {(users[msg.sender_id] || 'Chargement...')[0] || '?'}
                      </div>
                    )}
                    <div
                      className={`p-4 rounded-2xl shadow-md ${
                        msg.sender_id === String(currentUserId)
                          ? 'bg-green-100 dark:bg-green-700 text-gray-800 dark:text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'
                      }`}
                    >
                      <div className={`text-sm ${msg.unread ? 'font-bold' : ''}`}>
                        <span className="font-bold">{users[msg.sender_id] || 'Chargement...'}: </span>
                        {msg.content}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(msg.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="bg-white dark:bg-gray-900 p-4 flex items-center border-t border-gray-200 dark:border-gray-700 shadow-inner sticky bottom-0">
            {showEmojiPicker && (
              <div className="absolute bottom-20 left-4 z-20">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            )}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-gray-600 dark:text-gray-300 p-2 hover:text-green-600 dark:hover:text-green-400 rounded-full transition duration-200"
              aria-label="Afficher/masquer le sélecteur d'émojis"
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
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
            <textarea
              ref={textareaRef}
              placeholder={`Envoyer un message à ${users[selectedUser] || 'Chargement...'}...`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyPress}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex-1 mr-2 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white resize-none h-12"
              aria-label="Écrire un message"
            />
            <button
              onClick={handleSend}
              className="bg-green-600 dark:bg-green-800 text-white p-3 rounded-full hover:bg-green-700 dark:hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 transition duration-200"
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