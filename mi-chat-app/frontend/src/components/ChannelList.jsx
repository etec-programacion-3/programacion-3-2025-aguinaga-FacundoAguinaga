// src/components/ChannelList.jsx
import { FaHashtag } from 'react-icons/fa';

// Recibe la nueva prop unreadChannels
function ChannelList({ channels, selectedChannelId, onChannelSelect, unreadChannels }) {
  return (
    <div className="channel-list">
      <h3>Canales de texto</h3>
      <ul>
        {channels.map((channel) => {
          const isUnread = unreadChannels.has(channel.id);
          const isActive = channel.id === selectedChannelId;
          
          // Construye las clases dinámicamente
          const channelClasses = `channel-item ${isActive ? 'active' : ''} ${isUnread ? 'unread' : ''}`;

          return (
            <li
              key={channel.id}
              className={channelClasses}
              onClick={() => onChannelSelect(channel)}
            >
              <FaHashtag />
              <span>{channel.name}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default ChannelList;