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
  // New state to track unread messages count per user
  const [unreadMessages, setUnreadMessages] = useState({});
  const navigate = useNavigate();
  const textareaRef = useRef(null);

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
        // Update unread messages count if not in the current conversation
        if (!isCurrentConversation) {
          setUnreadMessages((prev) => ({
            ...prev,
            [message.sender_id]: (prev[message.sender_id] || 0) + 1,
          }));
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
              unread: false, // Assume fetched messages are read
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
        console.error('Erreur fetch messages:', error);
        const errorMessage = error.message.includes('404')
          ? 'Service de messagerie indisponible'
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
        console.error('Erreur fetch utilisateurs:', error);
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

  // Mark messages as read when selecting a user
  useEffect(() => {
    if (selectedUser) {
      setMessages((prev) =>
        prev.map((msg) =>
          (msg.sender_id === parseInt(selectedUser) && msg.receiver_id === currentUserId) ||
          (msg.receiver_id === parseInt(selectedUser) && msg.sender_id === currentUserId)
            ? { ...msg, unread: false }
            : msg
        )
      );
      setUnreadMessages((prev) => ({
        ...prev,
        [selectedUser]: 0,
      }));
    }
  }, [selectedUser]);

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

  // Check if there are any unread messages
  const hasUnreadMessages = Object.values(unreadMessages).some((count) => count > 0);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 max-w-full font-sans">
      <div className="bg-green-600 dark:bg-green-800 text-white p-3 flex items-center justify-between shadow-lg">
        <h2 className="text-lg font-semibold flex items-center">
          Messagerie
          {hasUnreadMessages && (
            <span className="ml-2 w-2 h-2 bg-orange-500 rounded-full" aria-label="Nouveau message"></span>
          )}
        </h2>
        <button
          onClick={() => setShowUserSelect(true)}
          className="bg-green-700 dark:bg-green-900 text-white p-2 rounded-full hover:bg-green-800 dark:hover:bg-green-950 focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200"
          aria-label="Nouvelle conversation"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-300 animate-pulse">
          Chargement...
        </div>
      ) : showUserSelect ? (
        <div className="flex-1 p-6 overflow-y-auto min-h-0 bg-white dark:bg-gray-800 rounded-lg shadow-md m-4">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Sélectionner un utilisateur</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(users)
              .filter(([id]) => parseInt(id) !== currentUserId)
              .map(([id, name]) => (
                <button
                  key={id}
                  onClick={() => {
                    setSelectedUser(id);
                    setShowUserSelect(false);
                  }}
                  className="flex items-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition duration-200"
                >
                  <div className="w-10 h-10 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center text-white font-semibold mr-3">
                    {name[0]}
                  </div>
                  <span className="text-gray-800 dark:text-white font-medium">{name}</span>
                </button>
              ))}
          </div>
          <button
            onClick={() => setShowUserSelect(false)}
            className="mt-6 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-semibold"
            aria-label="Annuler"
          >
            Annuler
          </button>
        </div>
      ) : !selectedUser ? (
        <div className="flex-1 p-6 overflow-y-auto min-h-0 bg-white dark:bg-gray-800 rounded-lg shadow-md m-4">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 dark:text-gray-300">
              <p className="text-lg mb-2">Aucune conversation pour le moment</p>
              <p className="mb-4">Sélectionnez un utilisateur pour commencer à discuter</p>
              <button
                onClick={() => setShowUserSelect(true)}
                className="bg-green-600 dark:bg-green-800 text-white px-4 py-2 rounded-full hover:bg-green-700 dark:hover:bg-green-900 transition duration-200"
                aria-label="Nouvelle conversation"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 inline-block mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouvelle conversation
              </button>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.userId}
                onClick={() => setSelectedUser(conv.userId.toString())}
                className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-lg transition duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center text-white font-semibold mr-3">
                  {users[conv.userId]?.[0] || 'U'}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 dark:text-white flex items-center">
                    {users[conv.userId]}
                    {(unreadMessages[conv.userId] || 0) > 0 && (
                      <span className="ml-2 w-2 h-2 bg-orange-500 rounded-full" aria-label="Nouveau message"></span>
                    )}
                  </div>
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
          <div className="bg-green-600 dark:bg-green-800 text-white p-2 flex items-center justify-between shadow-md">
            <button
              onClick={() => setSelectedUser(null)}
              className="text-white p-2 hover:bg-green-700 rounded-full transition duration-200"
              aria-label="Retour"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold truncate">{users[selectedUser]}</h2>
            <div className="w-6"></div>
          </div>
          <div className="flex-1 p-6 overflow-y-auto min-h-0 bg-white dark:bg-gray-800 rounded-lg shadow-md m-4">
            {filteredMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-300">
                Aucun message pour le moment. Envoyez un message pour commencer la discussion !
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={String(msg.id)}
                  className={`flex mb-4 ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-start space-x-3">
                    {msg.sender_id !== currentUserId && (
                      <div className="w-10 h-10 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center text-white font-semibold">
                        {users[msg.sender_id]?.[0] || 'U'}
                      </div>
                    )}
                    <div
                      className={`max-w-xs md:max-w-md p-4 rounded-2xl shadow-lg ${
                        msg.sender_id === currentUserId
                          ? 'bg-green-100 dark:bg-green-700 text-gray-800 dark:text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'
                      }`}
                    >
                      <div className={`text-sm ${msg.unread ? 'font-bold' : ''}`}>
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
          <div className="bg-white dark:bg-gray-900 p-4 flex items-center border-t border-gray-200 dark:border-gray-700 shadow-inner">
            {showEmojiPicker && (
              <div className="absolute bottom-20 left-4 z-10">
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
              placeholder="Votre message..."
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
                className="h-5 w-5"
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