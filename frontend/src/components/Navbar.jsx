import { getUserRole, removeToken } from '../store/auth.store';

const Navbar = () => {
  const role = getUserRole();

  const handleLogout = () => {
    removeToken();
    window.location.href = '/';
  };

  return (
    <div style={{ padding: '10px', background: '#eee' }}>
      <a href="/dashboard" style={{ marginRight: '15px' }}>
        Dashboard
      </a>

      {role === 'ADMIN' && (
        <a href="/users" style={{ marginRight: '15px' }}>
          Users
        </a>
      )}

      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Navbar;
