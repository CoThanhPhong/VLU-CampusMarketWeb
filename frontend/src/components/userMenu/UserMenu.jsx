import { useNavigate } from 'react-router-dom';

const UserMenu = () => {
  const navigate = useNavigate()
  const logOut = () => {
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')

    navigate('/login', {replace: true})
  };
  return (
    <div className="user-dropdown">
      <div className="user-dropdown-header">
        <p className="user-name">John Doe</p>
        <p className="user-email">admin@example.com</p>
      </div>
      <hr className="dropdown-divider" />
      <ul className="user-dropdown-list">
        <li className="user-dropdown-item">Hồ sơ cá nhân</li>
        <li className="user-dropdown-item">Cài đặt tài khoản</li>
        <li className="user-dropdown-item text-danger" onClick={logOut}>Đăng xuất</li>
      </ul>
    </div>
  );
};

export default UserMenu;