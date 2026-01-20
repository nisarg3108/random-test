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

      {role === 'EMPLOYEE' && (
        <>
          <a href="/employee" style={{ marginRight: '15px' }}>
            My Dashboard
          </a>
          <a href="/employee/leave-request" style={{ marginRight: '15px' }}>
            Request Leave
          </a>
        </>
      )}

      {role === 'ADMIN' && (
        <>
          <a href="/users" style={{ marginRight: '15px' }}>
            Users
          </a>
          <a href="/hr/employees" style={{ marginRight: '15px' }}>
            Employees
          </a>
          <a href="/hr/leave-requests" style={{ marginRight: '15px' }}>
            Leave Requests
          </a>
        </>
      )}

      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default Navbar;
