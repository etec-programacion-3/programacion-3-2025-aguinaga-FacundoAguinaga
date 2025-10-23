function ChannelList({ channels, selectedChannelId, onChannelSelect }) {
    return (
      <div className="channel-list">
        <h3>Canales</h3>
        <ul>
          {channels.map((channel) => (
            <li
              key={channel.id}
              className={channel.id === selectedChannelId ? 'active' : ''}
              onClick={() => onChannelSelect(channel)}
            >
              # {channel.name}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  
  export default ChannelList;