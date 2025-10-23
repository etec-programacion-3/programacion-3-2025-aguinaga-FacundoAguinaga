function UserList({ users }) {
    return (
      <div className="user-list">
        <h3>Usuarios</h3>
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              {user.name}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  
  export default UserList;