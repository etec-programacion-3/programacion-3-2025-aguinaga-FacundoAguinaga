function UserList({ users }) {
    return (
      <div className="user-list">
        <h3>Miembros — {users.length}</h3>
        <ul>
          {users.map((user) => (
            <li key={user.id} className="user-item">
              <span className="status-indicator"></span>
              <span>{user.username}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  
  export default UserList;