import { useEffect, useRef, useState } from 'react';
import { getColorForUsername } from '../utils/colorUtils';
import { getSocket } from '../services/socketService';
import { FaSmile } from 'react-icons/fa';
import EmojiPicker from 'emoji-picker-react';

// Componente para manejar y mostrar las reacciones de un mensaje
const MessageReactions = ({ message, reactions }) => {
  const socket = getSocket();

  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = { count: 0, users: [] };
    }
    acc[reaction.emoji].count++;
    acc[reaction.emoji].users.push(reaction.user.username);
    return acc;
  }, {});

  const handleReactionClick = (emoji) => {
    socket.emit('react-to-message', { messageId: message.id, emoji });
  };

  return (
    <div className="reaction-list">
      {Object.entries(groupedReactions).map(([emoji, data]) => (
        <div
          key={emoji}
          className="reaction-chip"
          onClick={() => handleReactionClick(emoji)}
          title={`Reaccionado por: ${data.users.join(', ')}`}
        >
          {emoji} {data.count}
        </div>
      ))}
    </div>
  );
};

// Componente principal que renderiza la lista de mensajes
function MessageList({ messages, channelId }) { // 👈 1. Recibe channelId
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [pickerMessageId, setPickerMessageId] = useState(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const listRef = useRef(null);
  const scrollHeightBeforeLoad = useRef(0);
  const endOfMessagesRef = useRef(null);
  const socket = getSocket();

  // Scroll automático para nuevos mensajes al final
  useEffect(() => {
    // Solo hace scroll si no se están cargando mensajes antiguos
    if (!isLoadingMore) {
      endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isLoadingMore]);

  // Mantiene la posición del scroll al cargar mensajes antiguos
  useEffect(() => {
    if (listRef.current && scrollHeightBeforeLoad.current > 0) {
      listRef.current.scrollTop = listRef.current.scrollHeight - scrollHeightBeforeLoad.current;
      scrollHeightBeforeLoad.current = 0;
    }
    setIsLoadingMore(false);
  }, [messages]);

  // 👈 2. Función para manejar el scroll
  const handleScroll = () => {
    if (listRef.current?.scrollTop === 0 && !isLoadingMore && hasMoreMessages) {
      setIsLoadingMore(true);
      scrollHeightBeforeLoad.current = listRef.current.scrollHeight;
      
      const oldestMessage = messages[0];
      if (oldestMessage) {
        socket.emit('get-older-messages', {
          channelId,
          cursor: oldestMessage.id,
        });
      }
    }
  };

  // 👈 3. Listener para saber si hay más mensajes o no
  useEffect(() => {
    const handleOlderMessages = (olderMessages) => {
      if (olderMessages.length === 0) {
        setHasMoreMessages(false);
      }
    };
    socket.on('older-messages-loaded', handleOlderMessages);
    return () => socket.off('older-messages-loaded', handleOlderMessages);
  }, [socket]);

  const handleAddReaction = (emojiObject) => {
    if (pickerMessageId) {
      socket.emit('react-to-message', { messageId: pickerMessageId, emoji: emojiObject.emoji });
    }
    setPickerMessageId(null);
  };

  return (
    // 👇 4. Añade la ref y el evento onScroll
    <div className="message-list" ref={listRef} onScroll={handleScroll}>
      {hasMoreMessages ? 
        (isLoadingMore && <div className="loading-spinner">Cargando...</div>) 
       : 
        (<div className="history-end">Fin del historial</div>)
      }

      {messages.map((msg) => (
        <div
          key={msg.id}
          className="message-container"
          onMouseEnter={() => setHoveredMessageId(msg.id)}
          onMouseLeave={() => setHoveredMessageId(null)}
        >
          <div className="message">
            <div className="avatar-placeholder" style={{ backgroundColor: getColorForUsername(msg.author.username) }}>
              {msg.author.username.charAt(0).toUpperCase()}
            </div>
            <div className="message-body">
              <span
                className="message-author"
                style={{ color: getColorForUsername(msg.author.username) }}
              >
                {msg.author.username}
              </span>
              <p className="message-content">{msg.content}</p>
            </div>
            {hoveredMessageId === msg.id && (
              <button className="add-reaction-button" onClick={() => setPickerMessageId(currentId => currentId === msg.id ? null : msg.id)}>
                <FaSmile />
              </button>
            )}
          </div>
          {msg.reactions && msg.reactions.length > 0 && (
            <MessageReactions message={msg} reactions={msg.reactions} />
          )}
          {pickerMessageId === msg.id && (
            <div className="emoji-picker-reactions">
              <EmojiPicker
                onEmojiClick={handleAddReaction}
                lazyLoadEmojis={true}
              />
            </div>
          )}
        </div>
      ))}
      <div ref={endOfMessagesRef} />
    </div>
  );
}

export default MessageList;