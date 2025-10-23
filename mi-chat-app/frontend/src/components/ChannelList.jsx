import { FaHashtag } from 'react-icons/fa'; // Importar el icono

function ChannelList({ channels, selectedChannelId, onChannelSelect }) {
  return (
    <div className="channel-list">
      <h3>Canales de texto</h3>
      <ul>
        {channels.map((channel) => (
          <li
            key={channel.id}
            className={`channel-item ${channel.id === selectedChannelId ? 'active' : ''}`}
            onClick={() => onChannelSelect(channel)}
          >
            <FaHashtag />
            <span>{channel.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ChannelList;