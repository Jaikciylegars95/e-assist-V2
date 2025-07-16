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
    return message?.sender_id && message?.receiver_id && message?.content;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Veuillez vous connecter', { position: 'top-center', autoClose: 2000 });
      navigate('/login');
      return;
    }

    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentUserId = String(payload.id);
    const currentUserName = payload.prenom && payload.nom
      ? `${payload.prenom} ${payload.nom}`
      : payload.email || `Utilisateur ${currentUserId}`;

    setUsers({ [currentUserId]: currentUserName });

    const newSocket = io('http://localhost:3001', {
      auth: { token: `Bearer ${token}` },
    });

    newSocket.on('connect', () => {
      newSocket.emit('join', { userId: currentUserId });
    });

    newSocket.on('connect_error', (error) => {
      toast.error('Erreur de connexion', { position: 'top-center', autoClose: 2000 });
    });

    const fetchMissingUser = async (userId) => {
      if (!userId || users[String(userId)] || userId === currentUserId) return;
      try {
        const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = await response.json();
        if (response.ok && user.id) {
          const displayName =
            user.prenom && user.nom
              ? `${user.prenom} ${user.nom}`
              : user.email || `Utilisateur ${userId}`;
          setUsers((prev) => ({
            ...prev,
            [String(user.id)]: displayName,
          }));
        }
      } catch (error) {
        setUsers((prev) => ({
          ...prev,
          [String(userId)]: `Utilisateur ${userId}`,
        }));
      }
    };

    newSocket.on('receiveMessage', async (message) => {
      if (validateMessage(message)) {
        const normalizedMessage = {
          id: String(message.id || `temp-received-${Date.now()}`),
          sender_id: String(message.sender_id),
          receiver_id: String(message.receiver_id),
          content: message.content,
          created_at: new Date(message.created_at || Date.now()),
          unread: String(selectedUser) !== String(message.sender_id),
        };
        setMessages((prev) => {
          if (!prev.some((m) => String(m.id) === String(normalizedMessage.id))) {
            return [...prev, normalizedMessage];
          }
          return prev;
        });
        if (String(selectedUser) !== String(message.sender_id)) {
          setUnreadMessages((prev) => ({
            ...prev,
            [String(message.sender_id)]: (prev[String(message.sender_id)] || 0) + 1,
          }));
        }
        if (!users[String(message.sender_id)]) {
          await fetchMissingUser(String(message.sender_id));
        }
      }
    });

    newSocket.on('messageSent', async (message) => {
      if (validateMessage(message)) {
        const normalizedMessage = {
          id: String(message.id),
          sender_id: String(message.sender_id),
          receiver_id: String(message.receiver_id),
          content: message.content,
          created_at: new Date(message.created_at),
          unread: false,
        };
        const tempId = message.tempId;

        setMessages((prev) => {
          return prev.map((m) =>
            String(m.id) === String(tempId) ? normalizedMessage : m
          );
        });

        if (!users[String(message.receiver_id)]) {
          await fetchMissingUser(String(message.receiver_id));
        }
      }
    });

    newSocket.on('error', (error) => {
      toast.error(error.message || 'Erreur de connexion', { position: 'top-center', autoClose: 2000 });
    });

    setSocket(newSocket);

    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/users/${currentUserId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          const validMessages = data.filter(validateMessage).map((msg) => ({
            id: String(msg.id),
            sender_id: String(msg.sender_id),
            receiver_id: String(msg.receiver_id),
            content: msg.content,
            created_at: new Date(msg.created_at || Date.now()),
            unread: String(selectedUser) !== String(msg.sender_id),
          }));
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => String(m.id)));
            const newMessages = validMessages.filter((msg) => !existingIds.has(String(msg.id)));
            return [...prev, ...newMessages];
          });

          const messageUserIds = Array.from(
            new Set([
              ...validMessages.map((msg) => String(msg.sender_id)),
              ...validMessages.map((msg) => String(msg.receiver_id)),
            ])
          ).filter((id) => id !== String(currentUserId));
          for (const id of messageUserIds) {
            await fetchMissingUser(id);
          }
        }
      } catch (error) {
        toast.error('Erreur chargement messages', { position: 'top-center', autoClose: 2000 });
      }
    };

    fetchMessages().then(() => setIsLoading(false));

    return () => {
      newSocket.disconnect();
    };
  }, [navigate]);

  const handleSend = () => {
    if (!content || !selectedUser || !socket) return;

    const token = localStorage.getItem('token');
    const currentUserId = String(JSON.parse(atob(token.split('.')[1])).id);

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      sender_id: currentUserId,
      receiver_id: String(selectedUser),
      content,
      created_at: new Date(),
      unread: false,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setTimeout(() => {
      chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);

    socket.emit('sendMessage', { receiverId: selectedUser, content, tempId });
    setContent('');
  };

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
          Chargement...
        </div>
      ) : showUserSelect ? (
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl m-2 sm:m-4">
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
            </div>
          ) : (
            filteredUsers.map(([id, name]) => (
              <div
                key={id}
                onClick={() => {
                  console.log('Utilisateur sélectionné:', id, name);
                  setSelectedUser(String(id));
                  setShowUserSelect(false);
                  setSearchQuery('');
                }}
                className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-gray-700 cursor-pointer rounded-lg"
              >
                <div className="w-12 h-12 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center text-white text-lg font-semibold mr-4">
                  {name[0] || '?'}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg text-gray-800 dark:text-white flex items-center">
                    {name}
                    {(unreadMessages[String(id)] || 0) > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                        {unreadMessages[String(id)]}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                    {messages
                      .filter((msg) => String(msg.sender_id) === String(id) || String(msg.receiver_id) === String(id))
                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]?.content || 'Aucun message'}
                  </div>
                </div>
              </div>
            ))
          )}
          <button
            onClick={() => setShowUserSelect(false)}
            className="mt-6 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold"
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
              <p className="text-sm">Cliquez sur + pour commencer.</p>
            </div>
          ) : (
            conversations.map((userId) => (
              <div
                key={userId}
                onClick={() => {
                  console.log('Conversation sélectionnée:', userId, users[String(userId)]);
                  setSelectedUser(String(userId));
                }}
                className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-gray-700 cursor-pointer rounded-lg"
              >
                <div className="w-12 h-12 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center text-white text-lg font-semibold mr-4">
                  {(users[String(userId)] || `Utilisateur ${userId}`)[0] || '?'}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg text-gray-800 dark:text-white flex items-center">
                    {users[String(userId)] || `Utilisateur ${userId}`}
                    {(unreadMessages[String(userId)] || 0) > 0 && (
                      <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                        {unreadMessages[String(userId)]}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                    {messages
                      .filter((msg) => String(msg.sender_id) === String(userId) || String(msg.receiver_id) === String(userId))
                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]?.content || 'Aucun message'}
                  </div>
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
              className="text-white p-2 hover:bg-green-600 dark:hover:bg-green-800 rounded-full"
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
              Discussion avec {users[String(selectedUser)] || `Utilisateur ${selectedUser}`}
            </h2>
            <div className="w-6"></div>
          </div>
          <div
            ref={chatContainerRef}
            className="flex-1 p-4 sm:p-6 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl m-2 sm:m-4"
          >
            {filteredMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-300 text-lg">
                Aucun message. Envoyez un message pour commencer !
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={String(msg.id)}
                  className={`flex mb-4 ${String(msg.sender_id) === String(currentUserId) ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-start space-x-3 max-w-[75%]">
                    {String(msg.sender_id) !== String(currentUserId) && (
                      <div className="w-10 h-10 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center text-white font-semibold">
                        {(users[String(msg.sender_id)] || `Utilisateur ${msg.sender_id}`)[0] || '?'}
                      </div>
                    )}
                    <div
                      className={`p-4 rounded-2xl shadow-md ${
                        String(msg.sender_id) === String(currentUserId)
                          ? 'bg-green-100 dark:bg-green-700 text-gray-800 dark:text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'
                      } ${msg.unread ? 'border-l-4 border-red-500' : ''}`}
                    >
                      <div className="text-sm">
                        <span className="font-bold">{users[String(msg.sender_id)] || `Utilisateur ${msg.sender_id}`}: </span>
                        {msg.content}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(msg.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                        {msg.unread && <span className="ml-2 text-red-500 font-semibold">Non lu</span>}
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
              className="text-gray-600 dark:text-gray-300 p-2 hover:text-green-600 dark:hover:text-green-400 rounded-full"
              aria-label="Émojis"
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
              placeholder={`Envoyer un message à ${users[String(selectedUser)] || `Utilisateur ${selectedUser}`}...`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyPress}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 flex-1 mr-2 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white resize-none h-12"
              aria-label="Écrire un message"
            />
            <button
              onClick={handleSend}
              className="bg-green-600 dark:bg-green-800 text-white p-3 rounded-full hover:bg-green-700 dark:hover:bg-green-900 focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600"
              aria-label="Envoyer"
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