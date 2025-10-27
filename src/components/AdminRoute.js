import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminRoute = ({ children, roles = ['admin', 'editor'] }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!roles.includes(user?.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

export default AdminRoute;
